"use server";

import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendNotificationToMultiple } from "@/lib/notifications";
import { students, users } from "@/db/schema";
import { and } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export interface NoteRow {
  id: number;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number | null;
  createdAt: Date;
  classId: number;
  className: string;
  classSection: string | null;
  subjectId: number | null;
  subjectName: string | null;
  uploaderName: string;
}

export interface UploadNoteData {
  title: string;
  description?: string;
  classId: number;
  subjectId?: number;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
}

export async function uploadNote(data: UploadNoteData): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated." };

  const role = session.user.role;
  if (!["admin", "teacher", "staff"].includes(role)) {
    return { success: false, error: "Not authorised." };
  }

  if (!data.title.trim()) return { success: false, error: "Title is required." };
  if (!data.fileUrl) return { success: false, error: "File is required." };


  await db.insert(notes).values({
    uploadedBy: parseInt(session.user.id),
    classId: data.classId,
    subjectId: data.subjectId ?? null,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    fileType: data.fileType,
    fileSize: data.fileSize ?? null,
  });

  const studentsInClass = await db.select({ userId: students.userId })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(and(eq(students.classId, data.classId), eq(students.status, "active"), eq(users.isActive, true)));
  
  if (studentsInClass.length > 0) {
    const userIds = studentsInClass.map(s => s.userId).filter(Boolean) as number[];
    await sendNotificationToMultiple(userIds, "New Note Added", `A new note "${data.title}" has been added.`, "/notes");
  }


  revalidatePath("/dashboard/notes");
  revalidatePath("/notes");
  return { success: true };
}

export async function deleteNote(noteId: number): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated." };

  const role = session.user.role;
  const userId = parseInt(session.user.id);

  const [existing] = await db
    .select({ uploadedBy: notes.uploadedBy })
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);

  if (!existing) return { success: false, error: "Note not found." };

  // Admins can delete any note; teachers/staff can only delete their own
  if (role !== "admin" && existing.uploadedBy !== userId) {
    return { success: false, error: "You can only delete your own notes." };
  }

  await db.delete(notes).where(eq(notes.id, noteId));
  revalidatePath("/dashboard/notes");
  revalidatePath("/notes");
  return { success: true };
}
