import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getNoteDetail, getNoteComments } from "../notes-actions";
import { NoteDetailView } from "@/components/notes/note-detail-view";
import { db } from "@/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DashboardNoteDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const noteId = parseInt(id);
  if (isNaN(noteId)) notFound();

  const [note, initialComments] = await Promise.all([
    getNoteDetail(noteId),
    getNoteComments(noteId),
  ]);

  if (!note) notFound();

  const role = session.user.role;
  const userId = parseInt(session.user.id);

  // If student, check class access
  if (role === "student") {
    if (session.user.studentStatus === "website") {
      redirect(`/notes/${noteId}`);
    }

    const [student] = await db
      .select({ classId: students.classId })
      .from(students)
      .where(eq(students.userId, userId))
      .limit(1);

    if (!student || student.classId !== note.classId) {
      redirect("/dashboard/notes");
    }
  }


  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <NoteDetailView
        note={note}
        initialComments={initialComments}
        currentUser={{
          id: userId,
          name: session.user.name ?? "User",
          role: session.user.role ?? "student",
          image: session.user.image,
        }}
        backHref="/dashboard/notes"
      />
    </div>
  );
}
