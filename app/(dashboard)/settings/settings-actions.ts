"use server";

import { db } from "@/db";
import { subjects, classes } from "@/db/schema";
import { subjectSchema } from "./subject-validation";
import { classSchema } from "./class-validation";
import { revalidatePath } from "next/cache";
import { isPgUniqueViolation } from "@/lib/db-errors";

type SubjectFieldErrors = {
  name?: string[];
  code?: string[];
  root?: string[];
};

type ClassFieldErrors = {
  name?: string[];
  section?: string[];
  root?: string[];
};

export async function createSubject(formData: unknown) {
  const parsed = subjectSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false as const, errors: parsed.error.flatten().fieldErrors as SubjectFieldErrors };
  }

  try {
    await db.insert(subjects).values(parsed.data);
    revalidatePath("/settings");
    return { success: true as const };
  } catch (err: unknown) {
    if (isPgUniqueViolation(err)) {
      return { success: false as const, errors: { code: ["Subject code already exists"] } as SubjectFieldErrors };
    }
    return { success: false as const, errors: { root: ["Something went wrong. Try again."] } as SubjectFieldErrors };
  }
}

export async function createClass(formData: unknown) {
  const parsed = classSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false as const, errors: parsed.error.flatten().fieldErrors as ClassFieldErrors };
  }

  try {
    await db.insert(classes).values(parsed.data);
    revalidatePath("/settings");
    return { success: true as const };
  } catch {
    return { success: false as const, errors: { root: ["Something went wrong. Try again."] } as ClassFieldErrors };
  }
}