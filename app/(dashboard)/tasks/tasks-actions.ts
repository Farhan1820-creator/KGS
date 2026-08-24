"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { tasks, taskAssignments, students, users, subjects, classes } from "@/db/schema";
import { eq, inArray, sql, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendNotification, sendNotificationToMultiple } from "@/lib/notifications";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional().nullable(),
  subjectId: z.coerce.number().optional().nullable(),
  classId: z.coerce.number().optional().nullable(),
  studentIds: z.array(z.coerce.number()).min(1, "Select at least one student"),
  imageUrl: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  totalPoints: z.coerce.number().min(1, "Points must be at least 1").default(100),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export async function createTask(input: CreateTaskInput) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "teacher" && session.user.role !== "admin")) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid form input" };
  }

  const { title, description, subjectId, classId, studentIds, imageUrl, dueDate, totalPoints } = parsed.data;

  try {
    const teacherUserId = Number(session.user.id);

    // 1. Create Task Record
    const [newTask] = await db
      .insert(tasks)
      .values({
        teacherId: teacherUserId,
        subjectId: subjectId || null,
        classId: classId || null,
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        dueDate: dueDate || null,
        totalPoints,
      })
      .returning({ id: tasks.id });

    // 2. Create Task Assignments for each student
    await db.insert(taskAssignments).values(
      studentIds.map((sId) => ({
        taskId: newTask.id,
        studentId: sId,
        status: "pending" as const,
      }))
    );

    // 3. Query student user IDs for push & in-app notifications
    const assignedStudents = await db.query.students.findMany({
      where: inArray(students.id, studentIds),
      columns: { userId: true },
    });

    const userIds = assignedStudents.map((s) => s.userId).filter(Boolean);

    // Get subject name if available
    let subjectName = "";
    if (subjectId) {
      const sub = await db.query.subjects.findFirst({
        where: eq(subjects.id, subjectId),
        columns: { name: true },
      });
      if (sub) subjectName = sub.name;
    }

    if (userIds.length > 0) {
      const msg = subjectName
        ? `New assignment in ${subjectName}: "${title}". Total Marks: ${totalPoints}`
        : `New assignment assigned: "${title}". Total Marks: ${totalPoints}`;

      await sendNotificationToMultiple(userIds, `📚 New Assignment: ${title}`, msg, "/tasks");
    }

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    return { success: true, taskId: newTask.id };
  } catch (err) {
    console.error("createTask error:", err);
    return { success: false, error: "Failed to create task." };
  }
}

export async function submitTask(
  assignmentId: number,
  payload: { submissionText?: string | null; submissionImageUrl?: string | null }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "student") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const assignment = await db.query.taskAssignments.findFirst({
      where: eq(taskAssignments.id, assignmentId),
      with: {
        task: true,
        student: { with: { user: true } },
      },
    });

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    await db
      .update(taskAssignments)
      .set({
        status: "submitted",
        submissionText: payload.submissionText || null,
        submissionImageUrl: payload.submissionImageUrl || null,
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(taskAssignments.id, assignmentId));

    // Notify teacher
    if (assignment.task?.teacherId) {
      const studentName = assignment.student?.user?.name ?? "A student";
      await sendNotification(
        assignment.task.teacherId,
        `📩 Assignment Submitted: ${assignment.task.title}`,
        `${studentName} completed and submitted homework for "${assignment.task.title}".`,
        "/tasks"
      );
    }

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("submitTask error:", err);
    return { success: false, error: "Failed to submit task." };
  }
}

export async function gradeTask(
  assignmentId: number,
  payload: { achievedPoints: number; feedback?: string | null }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "teacher" && session.user.role !== "admin")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const assignment = await db.query.taskAssignments.findFirst({
      where: eq(taskAssignments.id, assignmentId),
      with: {
        task: true,
        student: { with: { user: true } },
      },
    });

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    const totalPoints = assignment.task.totalPoints || 100;
    const achieved = Math.max(0, Math.min(totalPoints, payload.achievedPoints));
    const percentage = Number(((achieved / totalPoints) * 100).toFixed(2));

    await db
      .update(taskAssignments)
      .set({
        status: "graded",
        achievedPoints: achieved,
        percentage: String(percentage),
        feedback: payload.feedback || null,
        gradedBy: Number(session.user.id),
        gradedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(taskAssignments.id, assignmentId));

    // Notify student
    if (assignment.student?.userId) {
      const feedbackMsg = payload.feedback ? ` | Feedback: "${payload.feedback}"` : "";
      await sendNotification(
        assignment.student.userId,
        `📝 Task Graded: ${assignment.task.title}`,
        `You scored ${achieved}/${totalPoints} marks (${percentage}%)${feedbackMsg}`,
        "/tasks"
      );
    }

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("gradeTask error:", err);
    return { success: false, error: "Failed to grade task." };
  }
}

export async function deleteTask(taskId: number) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "teacher" && session.user.role !== "admin")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db.delete(tasks).where(eq(tasks.id, taskId));
    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("deleteTask error:", err);
    return { success: false, error: "Failed to delete task." };
  }
}
