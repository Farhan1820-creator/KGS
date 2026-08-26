import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { notes, classes, subjects, users, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NotesClient } from "./notes-client";
import { StudentNotesClient } from "./student-notes-client";
import type { NoteRow } from "./notes-actions";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardNotesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = session.user.role;
  if (!["admin", "teacher", "staff", "student"].includes(role)) redirect("/dashboard");

  const userId = parseInt(session.user.id);

  // ── Student View ──────────────────────────────────────────────
  if (role === "student") {
    // Website-registered students belong in the standalone /notes portal
    if (session.user.studentStatus === "website") {
      redirect("/notes");
    }

    const [student] = await db
      .select({
        id: students.id,
        classId: students.classId,
        status: students.status,
      })
      .from(students)
      .where(eq(students.userId, userId))
      .limit(1);

    if (!student || !student.classId) {
      return (
        <div className="p-6 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-foreground">No Class Assigned</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Your account is not assigned to any class yet. Please contact the academy administration to assign your class so you can access your study notes.
            </p>
          </div>
        </div>
      );
    }

    const [[classInfo], studentNotesRows] = await Promise.all([
      db
        .select({ name: classes.name, section: classes.section })
        .from(classes)
        .where(eq(classes.id, student.classId))
        .limit(1),
      db
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
          subjectId: notes.subjectId,
          subjectName: subjects.name,
          uploaderName: users.name,
        })
        .from(notes)
        .leftJoin(subjects, eq(notes.subjectId, subjects.id))
        .leftJoin(users, eq(notes.uploadedBy, users.id))
        .where(eq(notes.classId, student.classId))
        .orderBy(notes.createdAt),
    ]);

    const studentSubjects = Array.from(
      new Map(
        studentNotesRows
          .filter((n) => n.subjectId && n.subjectName)
          .map((n) => [n.subjectId!, n.subjectName!])
      ).entries()
    ).map(([id, name]) => ({ id, name }));

    const classNameStr = classInfo
      ? `${classInfo.name}${classInfo.section ? ` – ${classInfo.section}` : ""}`
      : "Your Class";

    return (
      <div className="p-6">
        <StudentNotesClient
          notes={studentNotesRows.map((n) => ({
            id: n.id,
            title: n.title,
            description: n.description,
            fileUrl: n.fileUrl,
            fileName: n.fileName,
            fileType: n.fileType,
            fileSize: n.fileSize,
            youtubeUrl: n.youtubeUrl,
            createdAt: n.createdAt.toISOString(),
            subjectId: n.subjectId,
            subjectName: n.subjectName,
            uploaderName: n.uploaderName ?? "Teacher",
          }))}
          subjects={studentSubjects}
          className={classNameStr}
          studentName={session.user.name ?? "Student"}
        />
      </div>
    );
  }

  // ── Admin / Teacher / Staff View ──────────────────────────────
  // Fetch all notes with class + subject + uploader and filters in parallel
  const [rows, allClasses, allSubjects] = await Promise.all([
    db
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
      .orderBy(notes.createdAt),
    db
      .select({ id: classes.id, name: classes.name, section: classes.section })
      .from(classes)
      .orderBy(classes.name),
    db
      .select({ id: subjects.id, name: subjects.name })
      .from(subjects)
      .orderBy(subjects.name),
  ]);

  const noteRows: NoteRow[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    fileUrl: r.fileUrl,
    fileName: r.fileName,
    fileType: r.fileType,
    fileSize: r.fileSize,
    youtubeUrl: r.youtubeUrl ?? null,
    createdAt: r.createdAt,
    classId: r.classId!,
    className: r.className ?? "Unknown",
    classSection: r.classSection ?? null,
    subjectId: r.subjectId ?? null,
    subjectName: r.subjectName ?? null,
    uploaderId: r.uploaderId ?? 0,
    uploaderName: r.uploaderName ?? "Unknown",
    uploaderRole: r.uploaderRole ?? "teacher",
  }));


  return (
    <div className="p-6">
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
