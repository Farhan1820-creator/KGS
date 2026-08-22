"use server";

import { db } from "@/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function saveStudentClass(classId: number, formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");

  const userId = parseInt(session.user.id);

  await db
    .update(students)
    .set({ classId })
    .where(eq(students.userId, userId));

  redirect("/notes");
}
