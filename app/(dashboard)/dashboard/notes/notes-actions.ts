"use server";

import { db } from "@/db";
import { notes, noteComments, classes, subjects, users, students } from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { sendNotification, sendNotificationToMultiple } from "@/lib/notifications";
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
  youtubeUrl: string | null;
  createdAt: Date;
  classId: number;
  className: string;
  classSection: string | null;
  subjectId: number | null;
  subjectName: string | null;
  uploaderId: number;
  uploaderName: string;
  uploaderRole: string;
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
  youtubeUrl?: string;
}

export interface NoteCommentItem {
  id: number;
  noteId: number;
  userId: number;
  userName: string;
  userRole: string;
  userImage: string | null;
  message: string;
  imageUrl: string | null;
  createdAt: string;
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

  const [inserted] = await db.insert(notes).values({
    uploadedBy: parseInt(session.user.id),
    classId: data.classId,
    subjectId: data.subjectId ?? null,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    fileType: data.fileType,
    fileSize: data.fileSize ?? null,
    youtubeUrl: data.youtubeUrl?.trim() || null,
  }).returning({ id: notes.id });

  const studentsInClass = await db.select({ userId: students.userId })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(and(eq(students.classId, data.classId), eq(students.status, "active"), eq(users.isActive, true)));
  
  if (studentsInClass.length > 0) {
    const userIds = studentsInClass.map(s => s.userId).filter(Boolean) as number[];
    await sendNotificationToMultiple(userIds, "New Note Added", `A new note "${data.title}" has been added.`, `/dashboard/notes/${inserted.id}`);
  }

  revalidatePath("/dashboard/notes");
  revalidatePath("/notes");
  return { success: true };
}

export async function updateNoteVideoUrl(noteId: number, youtubeUrl: string): Promise<{ success: boolean; error?: string }> {
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

  if (role !== "admin" && existing.uploadedBy !== userId) {
    return { success: false, error: "You can only update your own notes." };
  }

  await db
    .update(notes)
    .set({ youtubeUrl: youtubeUrl.trim() || null })
    .where(eq(notes.id, noteId));

  revalidatePath(`/dashboard/notes/${noteId}`);
  revalidatePath(`/notes/${noteId}`);
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

export async function getNoteDetail(noteId: number): Promise<NoteRow | null> {
  const [row] = await db
    .select({
      id: notes.id,
      title: notes.title,
      description: notes.description,
      fileUrl: notes.fileUrl,
      fileName: notes.fileName,
      fileType: notes.fileType,
      fileSize: notes.fileSize,
      youtubeUrl: notes.youtubeUrl,
      createdAt: notes.createdAt,
      classId: notes.classId,
      className: classes.name,
      classSection: classes.section,
      subjectId: notes.subjectId,
      subjectName: subjects.name,
      uploaderId: users.id,
      uploaderName: users.name,
      uploaderRole: users.role,
    })
    .from(notes)
    .leftJoin(classes, eq(notes.classId, classes.id))
    .leftJoin(subjects, eq(notes.subjectId, subjects.id))
    .leftJoin(users, eq(notes.uploadedBy, users.id))
    .where(eq(notes.id, noteId))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    fileUrl: row.fileUrl,
    fileName: row.fileName,
    fileType: row.fileType,
    fileSize: row.fileSize,
    youtubeUrl: row.youtubeUrl,
    createdAt: row.createdAt,
    classId: row.classId,
    className: row.className ?? "Unknown Class",
    classSection: row.classSection ?? null,
    subjectId: row.subjectId ?? null,
    subjectName: row.subjectName ?? null,
    uploaderId: row.uploaderId ?? 0,
    uploaderName: row.uploaderName ?? "Teacher",
    uploaderRole: row.uploaderRole ?? "teacher",
  };
}

export async function getNoteComments(noteId: number): Promise<NoteCommentItem[]> {
  const rows = await db
    .select({
      id: noteComments.id,
      noteId: noteComments.noteId,
      userId: noteComments.userId,
      message: noteComments.message,
      imageUrl: noteComments.imageUrl,
      createdAt: noteComments.createdAt,
      userName: users.name,
      userRole: users.role,
      userImage: users.image,
    })
    .from(noteComments)
    .innerJoin(users, eq(noteComments.userId, users.id))
    .where(eq(noteComments.noteId, noteId))
    .orderBy(asc(noteComments.createdAt));

  return rows.map((r) => ({
    id: r.id,
    noteId: r.noteId,
    userId: r.userId,
    userName: r.userName,
    userRole: r.userRole,
    userImage: r.userImage,
    message: r.message,
    imageUrl: r.imageUrl,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function sendNoteComment(params: {
  noteId: number;
  message: string;
  imageUrl?: string | null;
}): Promise<{ success: boolean; comment?: NoteCommentItem; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated." };

  const userId = parseInt(session.user.id);
  const trimmedMsg = params.message?.trim() || "";
  const imageUrl = params.imageUrl?.trim() || null;

  if (!trimmedMsg && !imageUrl) {
    return { success: false, error: "Message or image is required." };
  }

  const [note] = await db
    .select({
      id: notes.id,
      title: notes.title,
      uploadedBy: notes.uploadedBy,
    })
    .from(notes)
    .where(eq(notes.id, params.noteId))
    .limit(1);

  if (!note) return { success: false, error: "Note not found." };

  const [inserted] = await db
    .insert(noteComments)
    .values({
      noteId: params.noteId,
      userId,
      message: trimmedMsg,
      imageUrl: imageUrl,
    })
    .returning();

  const [user] = await db
    .select({ name: users.name, role: users.role, image: users.image })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Notify note creator if sender is not the creator
  if (note.uploadedBy !== userId) {
    await sendNotification(
      note.uploadedBy,
      "New Question on Note",
      `${user?.name || "A student"} commented on "${note.title}".`,
      `/dashboard/notes/${note.id}`
    );
  }

  return {
    success: true,
    comment: {
      id: inserted.id,
      noteId: inserted.noteId,
      userId: inserted.userId,
      userName: user?.name ?? session.user.name ?? "User",
      userRole: user?.role ?? session.user.role ?? "student",
      userImage: user?.image ?? null,
      message: inserted.message,
      imageUrl: inserted.imageUrl,
      createdAt: inserted.createdAt.toISOString(),
    },
  };
}

export async function deleteNoteComment(commentId: number): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated." };

  const role = session.user.role;
  const userId = parseInt(session.user.id);

  const [existing] = await db
    .select({ userId: noteComments.userId })
    .from(noteComments)
    .where(eq(noteComments.id, commentId))
    .limit(1);

  if (!existing) return { success: false, error: "Comment not found." };

  if (role !== "admin" && existing.userId !== userId) {
    return { success: false, error: "Not authorised to delete this comment." };
  }

  await db.delete(noteComments).where(eq(noteComments.id, commentId));
  return { success: true };
}

