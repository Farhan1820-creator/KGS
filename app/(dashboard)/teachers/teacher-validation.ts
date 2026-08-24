import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const teacherSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  contactNumber: z
    .string()
    .regex(/^[0-9+\-\s]{7,20}$/, "Enter a valid contact number"),
  subjectIds: z.array(z.coerce.number()).default([]),
  joinDate: z.string().regex(dateRegex, "Select a valid date"),
  photoUrl: z.string().optional(),
});

export type TeacherFormValues = z.infer<typeof teacherSchema>;

// Editing a teacher doesn't touch email/password here. teacherId stays
// editable in edit mode in case an admin ever needs to correct it manually.
export const teacherUpdateSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
  name: z.string().min(2, "Name must be at least 2 characters"),
  contactNumber: z
    .string()
    .regex(/^[0-9+\-\s]{7,20}$/, "Enter a valid contact number"),
  subjectIds: z.array(z.coerce.number()).default([]),
  teacherId: z.string().min(1, "Teacher ID is required"),
  joinDate: z.string().regex(dateRegex, "Select a valid date"),
  photoUrl: z.string().optional(),
});

export type TeacherUpdateFormValues = z.infer<typeof teacherUpdateSchema>;
