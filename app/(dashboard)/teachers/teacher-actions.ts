"use server";

import { db } from "@/db";
import { users, teachers, teacherSubjects } from "@/db/schema";
import { eq, like } from "drizzle-orm";
import { teacherSchema, teacherUpdateSchema } from "./teacher-validation";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { isPgUniqueViolation } from "@/lib/db-errors";
import { withSequentialCode, nextSequenceNumber, formatSequentialCode } from "@/lib/sequential-code";
import type { TeacherFormValues, TeacherUpdateFormValues } from "./teacher-validation";

type TeacherActionErrors = Partial<Record<keyof TeacherFormValues | "root", string[]>>;
type TeacherActionResult = { success: true } | { success: false; errors: TeacherActionErrors };

type TeacherUpdateActionErrors = Partial<Record<keyof TeacherUpdateFormValues | "root", string[]>>;
type TeacherUpdateActionResult = { success: true } | { success: false; errors: TeacherUpdateActionErrors };

// Read-only preview of the teacher ID a new teacher would get right now —
// same idea as previewNextRollNumber for students. The real ID is only
// actually reserved at submit time (see createTeacher).
export async function previewNextTeacherId(): Promise<string> {
  const year = new Date().getFullYear();
  const existing = await db.query.teachers.findMany({
    where: like(teachers.teacherId, `${year}-TCH-%`),
    columns: { teacherId: true },
  });
  const seq = nextSequenceNumber(existing.map((t) => t.teacherId), year, "TCH");
  return formatSequentialCode(year, "TCH", seq);
}

export async function createTeacher(formData: unknown): Promise<TeacherActionResult> {
  const parsed = teacherSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password, contactNumber, subjectIds = [], joinDate, photoUrl } = parsed.data;
  const cleanEmail = email.toLowerCase().trim();

  try {
    // Check if email already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existing) {
      return { success: false, errors: { email: ["Email already exists"] } };
    }

    const hashed = await hash(password, 10);

    // neon-http driver doesn't support db.transaction() — insert user first,
    // then compensate by deleting it if the dependent insert fails
    const [user] = await db
      .insert(users)
      .values({
        name,
        email: cleanEmail,
        password: hashed,
        rawPassword: password,
        contactNumber,
        role: "teacher",
        image: photoUrl || null,
      })
      .returning({ id: users.id });

    try {
      const year = new Date().getFullYear();
      await withSequentialCode(
        async () => {
          const existingTeachers = await db.query.teachers.findMany({
            where: like(teachers.teacherId, `${year}-TCH-%`),
            columns: { teacherId: true },
          });
          const seq = nextSequenceNumber(existingTeachers.map((t) => t.teacherId), year, "TCH");
          return formatSequentialCode(year, "TCH", seq);
        },
        async (teacherId) => {
          const [newTeacher] = await db
            .insert(teachers)
            .values({
              userId: user.id,
              subjectId: subjectIds[0] ?? null,
              teacherId,
              joinDate,
              photoUrl: photoUrl || null,
            })
            .returning({ id: teachers.id });

          if (subjectIds.length > 0) {
            await db.insert(teacherSubjects).values(
              subjectIds.map((sId) => ({
                teacherId: newTeacher.id,
                subjectId: sId,
              }))
            );
          }
        }
      );
    } catch (innerErr) {
      await db.delete(users).where(eq(users.id, user.id));
      throw innerErr;
    }

    revalidatePath("/teachers");
    return { success: true };
  } catch (err: unknown) {
    console.error("createTeacher failed:", err);
    if (isPgUniqueViolation(err) || (err instanceof Error && err.message.toLowerCase().includes("unique constraint"))) {
      return { success: false, errors: { email: ["Email already exists"] } };
    }
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}

// Updates a teacher's editable fields — name, contact, subjects, teacher ID, and credentials.
export async function updateTeacher(teacherId: number, formData: unknown): Promise<TeacherUpdateActionResult> {
  const parsed = teacherUpdateSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { name, contactNumber, subjectIds = [], teacherId: teacherCode, joinDate, photoUrl, email, password } = parsed.data;
  const cleanEmail = email.toLowerCase().trim();

  try {
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.id, teacherId),
      columns: { userId: true },
    });
    if (!teacher) {
      return { success: false, errors: { root: ["Teacher not found."] } };
    }

    // Check if another user has this email
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existing && existing.id !== teacher.userId) {
      return { success: false, errors: { email: ["Email already exists"] } };
    }

    const userUpdates: Record<string, any> = { name, contactNumber, email: cleanEmail };
    if (photoUrl !== undefined) {
      userUpdates.image = photoUrl || null;
    }
    if (password && password.trim() !== "") {
      userUpdates.password = await hash(password, 10);
      userUpdates.rawPassword = password;
    }

    await db.update(users).set(userUpdates).where(eq(users.id, teacher.userId));
    await db
      .update(teachers)
      .set({
        subjectId: subjectIds[0] ?? null,
        teacherId: teacherCode,
        joinDate,
        photoUrl: photoUrl || null,
      })
      .where(eq(teachers.id, teacherId));

    // Update teacher_subjects table
    await db.delete(teacherSubjects).where(eq(teacherSubjects.teacherId, teacherId));
    if (subjectIds.length > 0) {
      await db.insert(teacherSubjects).values(
        subjectIds.map((sId) => ({
          teacherId,
          subjectId: sId,
        }))
      );
    }

    revalidatePath("/teachers");
    return { success: true };
  } catch (err: unknown) {
    if (isPgUniqueViolation(err) || (err instanceof Error && err.message.toLowerCase().includes("unique constraint"))) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("users_email_unique") || message.includes("email")) {
        return { success: false, errors: { email: ["Email already exists"] } };
      }
      return { success: false, errors: { teacherId: ["This teacher ID or email is already in use"] } };
    }
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}

// Soft-deactivates or reactivates a teacher. All payroll, attendance, diary,
// and leave history is preserved — only the isActive flag on users changes.
// Use this instead of deleting when a teacher leaves.
export async function toggleTeacherActive(
  teacherId: number
): Promise<{ success: true; isActive: boolean } | { success: false; error: string }> {
  try {
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.id, teacherId),
      columns: { userId: true },
    });
    if (!teacher) return { success: false, error: "Teacher not found." };

    const user = await db.query.users.findFirst({
      where: eq(users.id, teacher.userId),
      columns: { id: true, isActive: true },
    });
    if (!user) return { success: false, error: "User record not found." };

    const next = !user.isActive;
    await db.update(users).set({ isActive: next }).where(eq(users.id, user.id));

    revalidatePath("/teachers");
    return { success: true, isActive: next };
  } catch {
    return { success: false, error: "Something went wrong. Try again." };
  }
}
