"use server";

import { db } from "@/db";
import { diaryEntries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { diaryEntrySchema } from "./diary-validation";

// Students never reach these actions from the UI, but server actions are
// public endpoints — re-check role here regardless of what the client sends.
async function requireWriter() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "teacher" && session.user.role !== "admin")) {
    throw new Error("Not authorized to post diary entries");
  }
  return session.user;
}

type DiaryFieldErrors = {
  classId?: string[];
  message?: string[];
  fileUrl?: string[];
  fileName?: string[];
  fileType?: string[];
  root?: string[];
};

export async function createDiaryEntry(formData: unknown) {
  const user = await requireWriter();

  const parsed = diaryEntrySchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false as const, errors: parsed.error.flatten().fieldErrors as DiaryFieldErrors };
  }

  const { classId, message, fileUrl, fileName, fileType } = parsed.data;

  try {
    await db.insert(diaryEntries).values({
      senderId: Number(user.id),
      classId: Number(classId),
      message: message?.trim() || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileType: fileType || null,
    });

    revalidatePath("/diary");
    return { success: true as const };
  } catch (err) {
    console.error("createDiaryEntry failed:", err);
    return { success: false as const, errors: { root: ["Something went wrong. Try again."] } as DiaryFieldErrors };
  }
}

export async function updateDiaryEntry(entryId: number, message: string) {
  const user = await requireWriter();

  if (!message.trim()) {
    return { success: false as const, errors: { message: ["Message cannot be empty"] } as DiaryFieldErrors };
  }

  try {
    const condition =
      user.role === "admin"
        ? eq(diaryEntries.id, entryId)
        : and(eq(diaryEntries.id, entryId), eq(diaryEntries.senderId, Number(user.id)));

    await db.update(diaryEntries).set({ message: message.trim(), updatedAt: new Date() }).where(condition);
    revalidatePath("/diary");
    return { success: true as const };
  } catch (err) {
    console.error("updateDiaryEntry failed:", err);
    return { success: false as const, errors: { root: ["Something went wrong. Try again."] } as DiaryFieldErrors };
  }
}

export async function deleteDiaryEntry(entryId: number) {
  const user = await requireWriter();

  try {
    const condition =
      user.role === "admin"
        ? eq(diaryEntries.id, entryId)
        : and(eq(diaryEntries.id, entryId), eq(diaryEntries.senderId, Number(user.id)));

    await db.delete(diaryEntries).where(condition);
    revalidatePath("/diary");
    return { success: true as const };
  } catch (err) {
    console.error("deleteDiaryEntry failed:", err);
    return { success: false as const, errors: { root: ["Something went wrong. Try again."] } as DiaryFieldErrors };
  }
}