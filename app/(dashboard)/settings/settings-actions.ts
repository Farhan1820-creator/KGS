"use server";

import { db } from "@/db";
import { subjects, classes } from "@/db/schema";
import { subjectSchema } from "./subject-validation";
import { classSchema } from "./class-validation";
import { revalidatePath } from "next/cache";

export async function createSubject(formData: unknown) {
  const parsed = subjectSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db.insert(subjects).values(parsed.data);
    revalidatePath("/settings");
    return { success: true };
  } catch (err: any) {
    if (err?.code === "23505") {
      return { success: false, errors: { code: ["Subject code already exists"] } };
    }
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}

export async function createClass(formData: unknown) {
  const parsed = classSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db.insert(classes).values(parsed.data);
    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}
