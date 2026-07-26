import { z } from "zod";

export const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  contactNumber: z
    .string()
    .regex(/^[0-9+\-\s]{7,20}$/, "Enter a valid contact number"),
  classId: z.string().min(1, "Select a class"),
  rollNumber: z.string().min(1, "Roll number is required"),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
