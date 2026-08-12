"use server";

import { db } from "@/db";
import { users, teachers } from "@/db/schema";
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

  const { name, email, password, contactNumber, subjectId } = parsed.data;

  try {
    const hashed = await hash(password, 10);

    // neon-http driver doesn't support db.transaction() — insert user first,
    // then compensate by deleting it if the dependent insert fails
    const [user] = await db
      .insert(users)
      .values({ name, email, password: hashed, contactNumber, role: "teacher" })
      .returning({ id: users.id });

    try {
      const year = new Date().getFullYear();
      await withSequentialCode(
        async () => {
          const existing = await db.query.teachers.findMany({
            where: like(teachers.teacherId, `${year}-TCH-%`),
            columns: { teacherId: true },
          });
          const seq = nextSequenceNumber(existing.map((t) => t.teacherId), year, "TCH");
          return formatSequentialCode(year, "TCH", seq);
        },
        (teacherId) =>
          db.insert(teachers).values({
            userId: user.id,
            subjectId: Number(subjectId),
            teacherId,
          })
      );
    } catch (innerErr) {
      await db.delete(users).where(eq(users.id, user.id));
      throw innerErr;
    }

    revalidatePath("/teachers");
    return { success: true };
  } catch (err: unknown) {
    console.error("createTeacher failed:", err);
    if (isPgUniqueViolation(err)) {
      return { success: false, errors: { email: ["Email already in use"] } };
    }
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}

// Updates a teacher's editable fields — name, contact, subject, and teacher ID.
// Email/password are left alone here.
export async function updateTeacher(teacherId: number, formData: unknown): Promise<TeacherUpdateActionResult> {
  const parsed = teacherUpdateSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { name, contactNumber, subjectId, teacherId: teacherCode } = parsed.data;

  try {
    const teacher = await db.query.teachers.findFirst({
      where: eq(teachers.id, teacherId),
      columns: { userId: true },
    });
    if (!teacher) {
      return { success: false, errors: { root: ["Teacher not found."] } };
    }

    await db.update(users).set({ name, contactNumber }).where(eq(users.id, teacher.userId));
    await db
      .update(teachers)
      .set({ subjectId: Number(subjectId), teacherId: teacherCode })
      .where(eq(teachers.id, teacherId));

    revalidatePath("/teachers");
    return { success: true };
  } catch (err: unknown) {
    if (isPgUniqueViolation(err)) {
      return { success: false, errors: { teacherId: ["This teacher ID is already in use"] } };
    }
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}
