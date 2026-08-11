"use server";

import { db } from "@/db";
import { users, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { studentSchema, studentUpdateSchema } from "./student-validation";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { isPgUniqueViolation } from "@/lib/db-errors";
import type { StudentFormValues, StudentUpdateFormValues } from "./student-validation";

type StudentActionErrors = Partial<Record<keyof StudentFormValues | "root", string[]>>;
type StudentActionResult = { success: true } | { success: false; errors: StudentActionErrors };

type StudentUpdateActionErrors = Partial<Record<keyof StudentUpdateFormValues | "root", string[]>>;
type StudentUpdateActionResult = { success: true } | { success: false; errors: StudentUpdateActionErrors };

export async function createStudent(formData: unknown): Promise<StudentActionResult> {
  const parsed = studentSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password, contactNumber, classId, rollNumber, fee } = parsed.data;

  try {
    const hashed = await hash(password, 10);

    // neon-http driver doesn't support db.transaction() — insert user first,
    // then compensate by deleting it if the dependent insert fails
    const [user] = await db
      .insert(users)
      .values({ name, email, password: hashed, contactNumber, role: "student" })
      .returning({ id: users.id });

    try {
      await db.insert(students).values({
        userId: user.id,
        classId: Number(classId),
        rollNumber,
        fee: fee ? Number(fee) : null,
      });
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
