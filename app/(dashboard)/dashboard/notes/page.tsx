import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { notes, classes, subjects, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NotesClient } from "./notes-client";
import type { NoteRow } from "./notes-actions";

export const dynamic = "force-dynamic";

export default async function DashboardNotesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = session.user.role;
  if (!["admin", "teacher", "staff"].includes(role)) redirect("/dashboard");

  const userId = parseInt(session.user.id);

  // Fetch all notes with class + subject + uploader
  const rows = await db
    .select({
      id: notes.id,
      title: notes.title,
      description: notes.description,
      fileUrl: notes.fileUrl,
      fileName: notes.fileName,
      fileType: notes.fileType,
      fileSize: notes.fileSize,
      createdAt: notes.createdAt,
      classId: notes.classId,
      className: classes.name,
      classSection: classes.section,
      subjectId: notes.subjectId,
      subjectName: subjects.name,
      uploaderName: users.name,
    })
    .from(notes)
    .leftJoin(classes, eq(notes.classId, classes.id))
    .leftJoin(subjects, eq(notes.subjectId, subjects.id))
    .leftJoin(users, eq(notes.uploadedBy, users.id))
    .orderBy(notes.createdAt);

  const noteRows: NoteRow[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    fileUrl: r.fileUrl,
    fileName: r.fileName,
    fileType: r.fileType,
    fileSize: r.fileSize,
    createdAt: r.createdAt,
    classId: r.classId!,
    className: r.className ?? "Unknown",
    classSection: r.classSection ?? null,
    subjectId: r.subjectId ?? null,
    subjectName: r.subjectName ?? null,
    uploaderName: r.uploaderName ?? "Unknown",
  }));

  // For filters
  const allClasses = await db
    .select({ id: classes.id, name: classes.name, section: classes.section })
    .from(classes)
    .orderBy(classes.name);

  const allSubjects = await db
    .select({ id: subjects.id, name: subjects.name })
    .from(subjects)
    .orderBy(subjects.name);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Notes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload and manage study notes for students. Notes are visible to students filtered by their class.
        </p>
      </div>

      <NotesClient
        initialNotes={noteRows}
        classes={allClasses}
        subjects={allSubjects}
        role={role}
        userId={userId}
      />
    </div>
  );
}
