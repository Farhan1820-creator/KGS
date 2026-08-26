import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { students, notes, classes, subjects, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NotesGrid } from "./notes-grid";
import { signOut } from "@/auth";
import Image from "next/image";
import Link from "next/link";
import { LogOut, LayoutDashboard } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NotesPortalPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = parseInt(session.user.id);

  // Get student record
  const [student] = await db
    .select({
      classId: students.classId,
      status: students.status,
    })
    .from(students)
    .where(eq(students.userId, userId))
    .limit(1);

  // Non-website students (academy students) belong in the dashboard management layout
  if (student && student.status !== "website") {
    redirect("/dashboard/notes");
  }

  // No student record at all → send to onboarding
  if (!student) redirect("/onboarding");

  // No class selected yet → send to onboarding
  if (!student.classId) redirect("/onboarding");

  const classId = student.classId;

  // Fetch class info and notes in parallel
  const [[classInfo], notesRows] = await Promise.all([
    db
      .select({ name: classes.name, section: classes.section })
      .from(classes)
      .where(eq(classes.id, classId))
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
      .where(eq(notes.classId, classId))
      .orderBy(notes.createdAt),
  ]);


  // Unique subjects for filter pills
  const subjectOptions = Array.from(
    new Map(
      notesRows
        .filter((n) => n.subjectId && n.subjectName)
        .map((n) => [n.subjectId, n.subjectName!])
    ).entries()
  ).map(([id, name]) => ({ id: id!, name }));

  const className = classInfo
    ? `${classInfo.name}${classInfo.section ? ` – ${classInfo.section}` : ""}`
    : "Your Class";

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <Image
              src="https://res.cloudinary.com/dggey8rb6/image/upload/v1787375492/logo.png"
              alt="The Learnex Academy"
              width={32}
              height={32}
              className="rounded-full"
            />
            <div>
              <p className="font-display text-sm font-bold text-gray-900">The Learnex Academy</p>
              <p className="text-xs text-gray-400">{className}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {student.status !== "website" && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition shadow-xs"
              >
                <LayoutDashboard size={14} />
                Dashboard
              </Link>
            )}
            <span className="hidden text-sm text-gray-500 sm:block">{session.user.name}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              >
                <LogOut size={14} />
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-5 py-8">
        <NotesGrid
          notes={notesRows.map((n) => ({
            id: n.id,
            title: n.title,
            description: n.description ?? undefined,
            fileUrl: n.fileUrl,
            fileName: n.fileName,
            fileType: n.fileType,
            fileSize: n.fileSize ?? undefined,
            youtubeUrl: n.youtubeUrl ?? undefined,
            createdAt: n.createdAt.toISOString(),
            subjectId: n.subjectId ?? undefined,
            subjectName: n.subjectName ?? undefined,
            uploaderName: n.uploaderName ?? "Teacher",
          }))}
          subjects={subjectOptions}
          className={className}
          isWebsiteStudent={student.status === "website"}
          studentName={session.user.name ?? "Student"}
        />
      </main>
    </div>
  );
}

