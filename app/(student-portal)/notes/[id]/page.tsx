import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getNoteDetail, getNoteComments } from "@/app/(dashboard)/dashboard/notes/notes-actions";
import { NoteDetailView } from "@/components/notes/note-detail-view";
import { db } from "@/db";
import { students, classes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signOut } from "@/auth";
import Image from "next/image";
import Link from "next/link";
import { LogOut, LayoutDashboard } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StudentPortalNoteDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const noteId = parseInt(id);
  if (isNaN(noteId)) notFound();

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  // Fetch note, comments, and student in parallel
  const [note, initialComments, [student]] = await Promise.all([
    getNoteDetail(noteId),
    getNoteComments(noteId),
    db
      .select({
        classId: students.classId,
        status: students.status,
      })
      .from(students)
      .where(eq(students.userId, userId))
      .limit(1),
  ]);

  if (!note) notFound();

  if (role === "student" && student && student.classId !== note.classId) {
    redirect("/notes");
  }

  const className = `${note.className}${note.classSection ? ` – ${note.classSection}` : ""}`;

  return (

    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-muted/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <Image
              src="https://res.cloudinary.com/dggey8rb6/image/upload/v1787375492/logo.png"
              alt="The Learnex Academy"
              width={32}
              height={32}
              className="rounded-full"
            />
            <div>
              <p className="font-display text-sm font-bold text-foreground">The Learnex Academy</p>
              <p className="text-xs text-muted-foreground">{className}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {student?.status !== "website" && role !== "student" && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition shadow-xs"
              >
                <LayoutDashboard size={14} />
                Dashboard
              </Link>
            )}
            <span className="hidden text-sm text-muted-foreground sm:block">{session.user.name}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <LogOut size={14} />
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <NoteDetailView
          note={note}
          initialComments={initialComments}
          currentUser={{
            id: userId,
            name: session.user.name ?? "Student",
            role: role ?? "student",
            image: session.user.image,
          }}
          backHref="/notes"
        />
      </main>
    </div>
  );
}
