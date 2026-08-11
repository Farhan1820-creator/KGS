"use server";

import { db } from "@/db";
import { expenses, expenseCategories, expenseSubCategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { isPgUniqueViolation } from "@/lib/db-errors";
import {
  expenseSchema,
  categorySchema,
  subCategorySchema,
  type ExpenseFormValues,
  type CategoryFormValues,
  type SubCategoryFormValues,
} from "./expense-validation";

type ActionErrors<T extends Record<string, unknown>> = Partial<Record<keyof T | "root", string[]>>;
type ActionResult<T extends Record<string, unknown>> =
  | { success: true }
  | { success: false; errors: ActionErrors<T> };

// ---- Expenses -----------------------------------------------------------

export async function createExpense(formData: unknown): Promise<ActionResult<ExpenseFormValues>> {
  const parsed = expenseSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }
  const { categoryId, subCategoryId, title, amount, date, notes } = parsed.data;

  try {
    await db.insert(expenses).values({
      categoryId: Number(categoryId),
      subCategoryId: subCategoryId ? Number(subCategoryId) : null,
      title,
      amount,
      date,
      notes: notes || null,
    });
    revalidatePath("/accounts/expenses");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}

export async function updateExpense(expenseId: number, formData: unknown): Promise<ActionResult<ExpenseFormValues>> {
  const parsed = expenseSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }
  const { categoryId, subCategoryId, title, amount, date, notes } = parsed.data;

  try {
    await db
      .update(expenses)
      .set({
        categoryId: Number(categoryId),
        subCategoryId: subCategoryId ? Number(subCategoryId) : null,
        title,
        amount,
        date,
        notes: notes || null,
      })
      .where(eq(expenses.id, expenseId));
    revalidatePath("/accounts/expenses");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}

export async function deleteExpense(expenseId: number): Promise<ActionResult<Record<string, never>>> {
  try {
    await db.delete(expenses).where(eq(expenses.id, expenseId));
    revalidatePath("/accounts/expenses");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not delete expense."] } };
  }
}

// ---- Categories -----------------------------------------------------------

export async function createCategory(formData: unknown): Promise<ActionResult<CategoryFormValues>> {
  const parsed = categorySchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db.insert(expenseCategories).values({ name: parsed.data.name });
    revalidatePath("/accounts/expenses");
    return { success: true };
  } catch (err) {
    if (isPgUniqueViolation(err)) {
      return { success: false, errors: { name: ["This category already exists"] } };
    }
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}

export async function deleteCategory(categoryId: number): Promise<ActionResult<Record<string, never>>> {
  try {
    // categories are referenced with onDelete: "restrict" — deletion fails
    // (caught below) while expenses still reference this category
    await db.delete(expenseCategories).where(eq(expenseCategories.id, categoryId));
    revalidatePath("/accounts/expenses");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Can't delete — this category has expenses recorded against it."] } };
  }
}

// ---- Sub-categories ---------------------------------------------------------

export async function createSubCategory(formData: unknown): Promise<ActionResult<SubCategoryFormValues>> {
  const parsed = subCategorySchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }
  const { categoryId, name } = parsed.data;

  try {
    await db.insert(expenseSubCategories).values({ categoryId: Number(categoryId), name });
    revalidatePath("/accounts/expenses");
    return { success: true };
  } catch (err) {
    if (isPgUniqueViolation(err)) {
      return { success: false, errors: { name: ["This sub-category already exists for the category"] } };
    }
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}

export async function deleteSubCategory(subCategoryId: number): Promise<ActionResult<Record<string, never>>> {
  try {
    await db.delete(expenseSubCategories).where(eq(expenseSubCategories.id, subCategoryId));
    revalidatePath("/accounts/expenses");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not delete sub-category."] } };
  }
}
