"use server";

import { db } from "@/db";
import { fees, students, feeStructures } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { isPgUniqueViolation } from "@/lib/db-errors";
import {
  generateFeesSchema,
  feeEntrySchema,
  feeStructureSchema,
  type FeeEntryFormValues,
  type FeeStructureFormValues,
} from "./fee-validation";

type ActionErrors<T extends Record<string, unknown>> = Partial<Record<keyof T | "root", string[]>>;
type ActionResult<T extends Record<string, unknown>> =
  | { success: true }
  | { success: false; errors: ActionErrors<T> };

// Creates a `fees` row for every student for the given month, using their
// class's fee structure amount as the default. Students that already have a
// row for that month are skipped (safe to click "Generate" again).
export async function generateFeesForMonth(formData: unknown): Promise<ActionResult<{ month: string }>> {
  const parsed = generateFeesSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }
  const { month } = parsed.data;

  try {
    const [allStudents, structures, existing] = await Promise.all([
      db.query.students.findMany({ columns: { id: true, classId: true, fee: true } }),
      db.query.feeStructures.findMany(),
      db.query.fees.findMany({ where: eq(fees.month, month), columns: { studentId: true } }),
    ]);

    const structureByClass = new Map(structures.map((s) => [s.classId, s.amount]));
    const existingStudentIds = new Set(existing.map((f) => f.studentId));

    const toInsert = allStudents
      .filter((s) => !existingStudentIds.has(s.id))
      .map((s) => ({
        studentId: s.id,
        month,
        // A student's own fee overrides the class fee structure amount.
        amount: s.fee ?? (s.classId && structureByClass.get(s.classId)) ?? 0,
        status: "unpaid" as const,
      }));

    if (toInsert.length > 0) {
      await db.insert(fees).values(toInsert);
    }

    revalidatePath("/accounts/fees");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Something went wrong generating fees."] } };
  }
}

export async function markFeePaid(feeId: number): Promise<ActionResult<Record<string, never>>> {
  try {
    await db.update(fees).set({ status: "paid", paidDate: new Date() }).where(eq(fees.id, feeId));
    revalidatePath("/accounts/fees");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not update fee status."] } };
  }
}

export async function markFeeUnpaid(feeId: number): Promise<ActionResult<Record<string, never>>> {
  try {
    await db.update(fees).set({ status: "unpaid", paidDate: null }).where(eq(fees.id, feeId));
    revalidatePath("/accounts/fees");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not update fee status."] } };
  }
}

export async function updateFeeAmount(feeId: number, amount: number): Promise<ActionResult<Record<string, never>>> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, errors: { root: ["Enter a valid amount."] } };
  }
  try {
    await db.update(fees).set({ amount }).where(eq(fees.id, feeId));
    revalidatePath("/accounts/fees");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not update amount."] } };
  }
}

// Adds a single fee record manually — e.g. a student who joined mid-month
// and was missed by "Generate fees".
export async function createFeeEntry(formData: unknown): Promise<ActionResult<FeeEntryFormValues>> {
  const parsed = feeEntrySchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }
  const { studentId, month, amount } = parsed.data;

  try {
    await db.insert(fees).values({ studentId: Number(studentId), month, amount, status: "unpaid" });
    revalidatePath("/accounts/fees");
    return { success: true };
  } catch (err) {
    if (isPgUniqueViolation(err)) {
      return { success: false, errors: { root: ["A fee record already exists for this student and month."] } };
    }
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}

// Upserts the default monthly fee amount for a class.
export async function upsertFeeStructure(formData: unknown): Promise<ActionResult<FeeStructureFormValues>> {
  const parsed = feeStructureSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }
  const { classId, amount } = parsed.data;

  try {
    const existing = await db.query.feeStructures.findFirst({
      where: eq(feeStructures.classId, Number(classId)),
    });

    if (existing) {
      await db.update(feeStructures).set({ amount }).where(eq(feeStructures.id, existing.id));
    } else {
      await db.insert(feeStructures).values({ classId: Number(classId), amount });
    }

    revalidatePath("/accounts/fees");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}
