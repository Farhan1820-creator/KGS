"use server";

import { db } from "@/db";
import { users, teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { teacherSchema } from "./teacher-validation";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { isPgUniqueViolation } from "@/lib/db-errors";
import type { TeacherFormValues } from "./teacher-validation";

type TeacherActionErrors = Partial<Record<keyof TeacherFormValues | "root", string[]>>;
type TeacherActionResult = { success: true } | { success: false; errors: TeacherActionErrors };

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
      await db.insert(teachers).values({
        userId: user.id,
        subjectId: Number(subjectId),
      });
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
