import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Fee is optional on the form — if left blank, the student's fee falls back
// to their class's fee structure amount when fees are generated.
const feeField = z
  .string()
  .optional()
  .refine((v) => !v || (Number.isFinite(Number(v)) && Number(v) > 0), {
    message: "Enter a valid amount",
  });

export const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  contactNumber: z
    .string()
    .regex(/^[0-9+\-\s]{7,20}$/, "Enter a valid contact number"),
  classId: z.string().min(1, "Select a class"),
  fee: feeField,
  admissionDate: z.string().regex(dateRegex, "Select a valid date"),
  photoUrl: z.string().optional(),
  schoolName: z.string().optional(),
});

export type StudentFormValues = z.infer<typeof studentSchema>;

// Editing a student doesn't allow changing password/email here — keep it
// scoped to the fields that make sense to update post-creation.
export const studentUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contactNumber: z
    .string()
    .regex(/^[0-9+\-\s]{7,20}$/, "Enter a valid contact number"),
  classId: z.string().min(1, "Select a class"),
  rollNumber: z.string().min(1, "Roll number is required"),
  fee: feeField,
  admissionDate: z.string().regex(dateRegex, "Select a valid date"),
  photoUrl: z.string().optional(),
  schoolName: z.string().optional(),
});

export type StudentUpdateFormValues = z.infer<typeof studentUpdateSchema>;
