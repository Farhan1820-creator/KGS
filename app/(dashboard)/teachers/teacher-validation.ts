import { z } from "zod";

export const teacherSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  contactNumber: z
    .string()
    .regex(/^[0-9+\-\s]{7,20}$/, "Enter a valid contact number"),
  subjectId: z.string().min(1, "Select a subject"),
});

export type TeacherFormValues = z.infer<typeof teacherSchema>;

// Editing a teacher doesn't touch email/password here. teacherId stays
// editable in edit mode in case an admin ever needs to correct it manually.
export const teacherUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contactNumber: z
    .string()
    .regex(/^[0-9+\-\s]{7,20}$/, "Enter a valid contact number"),
  subjectId: z.string().min(1, "Select a subject"),
  teacherId: z.string().min(1, "Teacher ID is required"),
});

export type TeacherUpdateFormValues = z.infer<typeof teacherUpdateSchema>;
