import { z } from "zod";

export const classSchema = z.object({
  name: z.string().min(1, "Name is required"),
  section: z.string().optional(),
});

export type ClassFormValues = z.infer<typeof classSchema>;
