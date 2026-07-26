"use server";

import { db } from "@/db";
import { users, students } from "@/db/schema";
import { studentSchema } from "@/lib/validations/student";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createStudent(formData: unknown) {
  const parsed = studentSchema.safeParse(formData);
  if (!parsed.success) {
    // field-level errors returned to the client, mapped under each input
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password, contactNumber, classId, rollNumber } = parsed.data;

  try {
    const hashed = await hash(password, 10);

    // single transaction: avoids orphaned user row if student insert fails
    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ name, email, password: hashed, contactNumber, role: "student" })
        .returning({ id: users.id });

      await tx.insert(students).values({
        userId: user.id,
        classId: Number(classId),
        rollNumber,
      });
    });

    revalidatePath("/students");
    return { success: true };
  } catch (err: any) {
    // unique constraint on email
    if (err?.code === "23505") {
      return { success: false, errors: { email: ["Email already in use"] } };
    }
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}
