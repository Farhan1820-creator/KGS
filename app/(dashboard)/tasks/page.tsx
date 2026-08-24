import { auth } from "@/auth";
import { db } from "@/db";
import { tasks, taskAssignments, students, subjects, classes, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { TeacherTasksView, TaskRecord } from "./teacher-tasks-view";
import { StudentTasksView, StudentTaskItem } from "./student-tasks-view";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = session.user.role;

  // ── 1. STUDENT VIEW ────────────────────────────────────────────────────────
  if (role === "student") {
    const student = await db.query.students.findFirst({
      where: eq(students.userId, Number(session.user.id)),
      with: { user: true, class: true },
    });

    if (!student) {
      return (
        <div className="page-shell">
          <div className="rounded-xl border p-8 text-center bg-card">
            <h3 className="font-bold text-lg">Student Profile Not Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Please contact your school administrator.
            </p>
          </div>
        </div>
      );
    }

    const assignments = await db.query.taskAssignments.findMany({
      where: eq(taskAssignments.studentId, student.id),
      with: {
        task: {
          with: {
            subject: true,
            teacher: true,
          },
        },
      },
      orderBy: [desc(taskAssignments.createdAt)],
    });

    const tasks: StudentTaskItem[] = assignments.map((a) => ({
      assignmentId: a.id,
      taskId: a.taskId,
      title: a.task.title,
      description: a.task.description,
      imageUrl: a.task.imageUrl,
      subjectName: a.task.subject?.name ?? null,
      dueDate: a.task.dueDate ?? null,
      totalPoints: a.task.totalPoints || 100,
      status: a.status,
      submissionText: a.submissionText,
      submissionImageUrl: a.submissionImageUrl,
      submittedAt: a.submittedAt,
      achievedPoints: a.achievedPoints,
      percentage: a.percentage,
      feedback: a.feedback,
      teacherName: a.task.teacher?.name ?? null,
    }));

    return (
      <StudentTasksView
        studentName={student.user?.name || session.user.name || "Student"}
        tasks={tasks}
      />
    );
  }

  // ── 2. TEACHER & ADMIN VIEW ───────────────────────────────────────────────
  const [taskList, subjectList, classList, studentList] = await Promise.all([
    db.query.tasks.findMany({
      with: {
        subject: true,
        class: true,
        teacher: true,
        assignments: {
          with: {
            student: {
              with: {
                user: true,
                class: true,
              },
            },
          },
        },
      },
      orderBy: [desc(tasks.createdAt)],
    }),
    db.query.subjects.findMany({
      columns: { id: true, name: true },
    }),
    db.query.classes.findMany({
      columns: { id: true, name: true, section: true },
    }),
    db.query.students.findMany({
      with: {
        user: true,
        class: true,
      },
      columns: {
        id: true,
        classId: true,
      },
    }),
  ]);

  const mappedTasks: TaskRecord[] = taskList.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    imageUrl: t.imageUrl,
    subjectId: t.subjectId,
    subjectName: t.subject?.name ?? null,
    classId: t.classId,
    className: t.class ? `${t.class.name}${t.class.section ? ` (${t.class.section})` : ""}` : null,
    dueDate: t.dueDate,
    totalPoints: t.totalPoints,
    createdAt: t.createdAt,
    teacherName: t.teacher?.name ?? null,
    assignments: t.assignments.map((a) => ({
      id: a.id,
      studentId: a.studentId,
      studentName: a.student?.user?.name || `Student #${a.studentId}`,
      rollNumber: a.student?.user?.name ? null : null,
      className: a.student?.class ? `${a.student.class.name}` : undefined,
      status: a.status,
      submissionText: a.submissionText,
      submissionImageUrl: a.submissionImageUrl,
      submittedAt: a.submittedAt,
      achievedPoints: a.achievedPoints,
      percentage: a.percentage,
      feedback: a.feedback,
    })),
  }));

  const mappedStudents = studentList.map((s) => ({
    id: s.id,
    name: s.user?.name || `Student #${s.id}`,
    classId: s.classId,
    className: s.class?.name || undefined,
  }));

  return (
    <TeacherTasksView
      tasks={mappedTasks}
      subjects={subjectList}
      classes={classList}
      students={mappedStudents}
    />
  );
}
