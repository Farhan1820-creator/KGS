"use server";

import { db } from "@/db";
import { users, students } from "@/db/schema";
import { eq, like } from "drizzle-orm";
import { studentSchema, studentUpdateSchema } from "./student-validation";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { isPgUniqueViolation } from "@/lib/db-errors";
import { withSequentialCode, nextSequenceNumber, formatSequentialCode } from "@/lib/sequential-code";
import type { StudentFormValues, StudentUpdateFormValues } from "./student-validation";

type StudentActionErrors = Partial<Record<keyof StudentFormValues | "root", string[]>>;
type StudentActionResult = { success: true } | { success: false; errors: StudentActionErrors };

type StudentUpdateActionErrors = Partial<Record<keyof StudentUpdateFormValues | "root", string[]>>;
type StudentUpdateActionResult = { success: true } | { success: false; errors: StudentUpdateActionErrors };

// Read-only preview of the roll number a new student would get right now —
// shown in the form so admins aren't left guessing. The real number is only
// actually reserved at submit time (see createStudent), so if two admins
// have this dialog open at once, whoever submits first gets this number and
// the other's preview will just bump up by one on their next render.
export async function previewNextRollNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const existing = await db.query.students.findMany({
    where: like(students.rollNumber, `${year}-STD-%`),
    columns: { rollNumber: true },
  });
  const seq = nextSequenceNumber(existing.map((s) => s.rollNumber), year, "STD");
  return formatSequentialCode(year, "STD", seq);
}

export async function createStudent(formData: unknown): Promise<StudentActionResult> {
  const parsed = studentSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password, contactNumber, classId, fee } = parsed.data;

  try {
    const hashed = await hash(password, 10);

    // neon-http driver doesn't support db.transaction() — insert user first,
    // then compensate by deleting it if the dependent insert fails
    const [user] = await db
      .insert(users)
      .values({ name, email, password: hashed, contactNumber, role: "student" })
      .returning({ id: users.id });

    try {
      const year = new Date().getFullYear();
      await withSequentialCode(
        async () => {
          const existing = await db.query.students.findMany({
            where: like(students.rollNumber, `${year}-STD-%`),
            columns: { rollNumber: true },
          });
          const seq = nextSequenceNumber(existing.map((s) => s.rollNumber), year, "STD");
          return formatSequentialCode(year, "STD", seq);
        },
        (rollNumber) =>
          db.insert(students).values({
            userId: user.id,
            classId: Number(classId),
            rollNumber,
            fee: fee ? Number(fee) : null,
          })
      );
    } catch (innerErr) {
      await db.delete(users).where(eq(users.id, user.id));
      throw innerErr;
    }

    revalidatePath("/students");
    return { success: true };
  } catch (err: unknown) {
    if (isPgUniqueViolation(err)) {
      return { success: false, errors: { email: ["Email already in use"] } };
    }
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}

// Updates a student's editable fields — name, contact, class, roll number,
// and their individual fee. Email/password are left alone here.
export async function updateStudent(studentId: number, formData: unknown): Promise<StudentUpdateActionResult> {
  const parsed = studentUpdateSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { name, contactNumber, classId, rollNumber, fee } = parsed.data;

  try {
    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      columns: { userId: true },
    });
    if (!student) {
      return { success: false, errors: { root: ["Student not found."] } };
    }

    await db.update(users).set({ name, contactNumber }).where(eq(users.id, student.userId));
    await db
      .update(students)
      .set({ classId: Number(classId), rollNumber, fee: fee ? Number(fee) : null })
      .where(eq(students.id, studentId));

    revalidatePath("/students");
    revalidatePath("/accounts/fees");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}
