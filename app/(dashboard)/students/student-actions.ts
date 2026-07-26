"use server";

import { db } from "@/db";
import { users, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { studentSchema } from "./student-validation";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { isPgUniqueViolation } from "@/lib/db-errors";

export async function createStudent(formData: unknown) {
  const parsed = studentSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password, contactNumber, classId, rollNumber } = parsed.data;

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
