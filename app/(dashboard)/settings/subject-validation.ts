import { z } from "zod";

export const subjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(1, "Code is required"),
});

export type SubjectFormValues = z.infer<typeof subjectSchema>;
