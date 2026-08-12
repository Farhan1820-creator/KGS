"use server";

import { db } from "@/db";
import { subjects, classes } from "@/db/schema";
import { eq } from "drizzle-orm";
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
export async function updateSubject(id: number, formData: unknown) {
  const parsed = subjectSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false as const, errors: parsed.error.flatten().fieldErrors as SubjectFieldErrors };
  }

  try {
    await db.update(subjects).set(parsed.data).where(eq(subjects.id, id));
    revalidatePath("/settings");
    return { success: true as const };
  } catch (err: unknown) {
    if (isPgUniqueViolation(err)) {
      return { success: false as const, errors: { code: ["Subject code already exists"] } as SubjectFieldErrors };
    }
    return { success: false as const, errors: { root: ["Something went wrong. Try again."] } as SubjectFieldErrors };
  }
}

export async function deleteSubject(id: number) {
  try {
    await db.delete(subjects).where(eq(subjects.id, id));
    revalidatePath("/settings");
    return { success: true as const };
  } catch {
    return {
      success: false as const,
      errors: { root: ["Could not delete — it may still be assigned to a teacher or class."] } as SubjectFieldErrors,
    };
  }
}

export async function updateClass(id: number, formData: unknown) {
  const parsed = classSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false as const, errors: parsed.error.flatten().fieldErrors as ClassFieldErrors };
  }

  try {
    await db.update(classes).set(parsed.data).where(eq(classes.id, id));
    revalidatePath("/settings");
    return { success: true as const };
  } catch {
    return { success: false as const, errors: { root: ["Something went wrong. Try again."] } as ClassFieldErrors };
  }
}

export async function deleteClass(id: number) {
  try {
    await db.delete(classes).where(eq(classes.id, id));
    revalidatePath("/settings");
    return { success: true as const };
  } catch {
    return {
      success: false as const,
      errors: { root: ["Could not delete — it may still have students assigned to it."] } as ClassFieldErrors,
    };
  }
}
