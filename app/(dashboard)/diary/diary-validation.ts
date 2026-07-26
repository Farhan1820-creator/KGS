import { z } from "zod";

export const diaryEntrySchema = z
  .object({
    classId: z.string().min(1, "Select a class"),
    message: z.string().optional(),
    fileUrl: z.string().optional(),
    fileName: z.string().optional(),
    fileType: z.string().optional(),
  })
  .refine((data) => (data.message && data.message.trim().length > 0) || !!data.fileUrl, {
    message: "Write a message or attach a file",
    path: ["message"],
  });

export type DiaryEntryFormValues = z.infer<typeof diaryEntrySchema>;
