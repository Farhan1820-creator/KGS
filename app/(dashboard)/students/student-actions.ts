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

  const { name, email, password, contactNumber, classId, fee, admissionDate, photoUrl, schoolName } = parsed.data;
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
        role: "student",
      })
      .returning({ id: users.id });

    try {
      const year = new Date().getFullYear();
      await withSequentialCode(
        async () => {
          const existingStudents = await db.query.students.findMany({
            where: like(students.rollNumber, `${year}-STD-%`),
            columns: { rollNumber: true },
          });
          const seq = nextSequenceNumber(existingStudents.map((s) => s.rollNumber), year, "STD");
          return formatSequentialCode(year, "STD", seq);
        },
        (rollNumber) =>
          db.insert(students).values({
            userId: user.id,
            classId: Number(classId),
            rollNumber,
            fee: fee ? Number(fee) : null,
            admissionDate,
            photoUrl: photoUrl || null,
            schoolName: schoolName || null,
          })
      );
    } catch (innerErr) {
      await db.delete(users).where(eq(users.id, user.id));
      throw innerErr;
    }

    revalidatePath("/students");
    return { success: true };
  } catch (err: unknown) {
    if (isPgUniqueViolation(err) || (err instanceof Error && err.message.toLowerCase().includes("unique constraint"))) {
      return { success: false, errors: { email: ["Email already exists"] } };
    }
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}

// Updates a student's editable fields — name, contact, class, roll number,
// individual fee, and email/password.
export async function updateStudent(studentId: number, formData: unknown): Promise<StudentUpdateActionResult> {
  const parsed = studentUpdateSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { email, password, name, contactNumber, classId, rollNumber, fee, admissionDate, photoUrl, schoolName } = parsed.data;
  const cleanEmail = email.toLowerCase().trim();

  try {
    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
    });
    if (!student) return { success: false, errors: { root: ["Student not found."] } };

    // Check if another user has this email
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existing && existing.id !== student.userId) {
      return { success: false, errors: { email: ["Email already exists"] } };
    }

    const userUpdate: Record<string, any> = { name, email: cleanEmail, contactNumber };
    if (password && password.trim() !== "") {
      userUpdate.password = await hash(password, 10);
      userUpdate.rawPassword = password;
    }

    await db.update(users).set(userUpdate).where(eq(users.id, student.userId));
    await db
      .update(students)
      .set({
        classId: Number(classId),
        rollNumber,
        fee: fee ? Number(fee) : null,
        admissionDate,
        photoUrl: photoUrl || null,
        schoolName: schoolName || null,
      })
      .where(eq(students.id, studentId));

    revalidatePath("/students");
    revalidatePath("/accounts/fees");
    return { success: true };
  } catch (err: unknown) {
    if (isPgUniqueViolation(err) || (err instanceof Error && err.message.toLowerCase().includes("unique constraint"))) {
      return { success: false, errors: { email: ["Email already exists"] } };
    }
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}

// Soft-deactivates or changes student to website/academy student. All their fee records, diary
// entries, and history are preserved — only the isActive/isAcademyStudent flags change.
export async function updateStudentStatus(
  studentId: number,
  status: "Active" | "Website" | "Inactive"
): Promise<{ success: true; status: "Active" | "Website" | "Inactive" } | { success: false; error: string }> {
  try {
    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      columns: { userId: true },
    });
    if (!student) return { success: false, error: "Student not found." };

    const user = await db.query.users.findFirst({
      where: eq(users.id, student.userId),
      columns: { id: true },
    });
    if (!user) return { success: false, error: "User record not found." };

    const isActive = status !== "Inactive";
    const studentStatus = status === "Website" ? "website" : "active";

    await db.update(users).set({ isActive }).where(eq(users.id, user.id));
    await db.update(students).set({ status: studentStatus }).where(eq(students.id, studentId));

    revalidatePath("/students");
    return { success: true, status };
  } catch {
    return { success: false, error: "Something went wrong. Try again." };
  }
}
