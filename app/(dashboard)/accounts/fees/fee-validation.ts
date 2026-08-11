import { z } from "zod";

// "YYYY-MM"
const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const generateFeesSchema = z.object({
  month: z.string().regex(monthRegex, "Select a valid month"),
});
export type GenerateFeesValues = z.infer<typeof generateFeesSchema>;

export const feeEntrySchema = z.object({
  studentId: z.string().min(1, "Select a student"),
  month: z.string().regex(monthRegex, "Select a valid month"),
  amount: z.coerce.number().int().positive("Amount must be greater than 0"),
});
export type FeeEntryFormValues = z.infer<typeof feeEntrySchema>;

export const feeStructureSchema = z.object({
  classId: z.string().min(1, "Select a class"),
  amount: z.coerce.number().int().positive("Amount must be greater than 0"),
});
export type FeeStructureFormValues = z.infer<typeof feeStructureSchema>;
