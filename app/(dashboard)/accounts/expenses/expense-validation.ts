import { z } from "zod";

// "YYYY-MM-DD"
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const expenseSchema = z.object({
  categoryId: z.string().min(1, "Select a category"),
  subCategoryId: z.string().optional(), // sub-category is optional
  title: z.string().min(2, "Title must be at least 2 characters"),
  amount: z.coerce.number().int().positive("Amount must be greater than 0"),
  date: z.string().regex(dateRegex, "Select a valid date"),
  notes: z.string().optional(),
});
export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;

export const subCategorySchema = z.object({
  categoryId: z.string().min(1, "Select a category"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});
export type SubCategoryFormValues = z.infer<typeof subCategorySchema>;
