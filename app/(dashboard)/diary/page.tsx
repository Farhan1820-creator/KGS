import { auth } from "@/auth";
import { db } from "@/db";
import { diaryEntries, classes, students, users } from "@/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DiaryFilters } from "./diary-filters";
import { DiaryMessageList } from "./diary-message-list";
import { DiaryComposer } from "./diary-composer";
import type { DiaryEntryRow } from "./diary-message-bubble";
import { BookOpen } from "lucide-react";

interface DiaryPageProps {
  searchParams: Promise<{ classId?: string; studentId?: string }>;
}

export default async function DiaryPage({ searchParams }: DiaryPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "staff") redirect("/");

  const { classId: classIdParam, studentId: studentIdParam } = await searchParams;
  const role = session.user.role as "student" | "teacher" | "admin";
  const userId = Number(session.user.id);

  let activeClassId = classIdParam ?? "";
  let activeStudentId = studentIdParam ?? "";
  let allClasses: { id: number; name: string; section: string | null }[] = [];
  let classStudents: { id: number; name: string; rollNumber: string | null }[] = [];
  let entriesRaw: any[] = [];

  if (role === "student") {
    const [classesData, [studentRow]] = await Promise.all([
      db.query.classes.findMany(),
      db.select({ classId: students.classId, studentId: students.id }).from(students).where(eq(students.userId, userId)).limit(1),
    ]);
    allClasses = classesData;

    if (!studentRow?.classId) {
      return (
        <div className="flex flex-col h-[calc(100vh-3.5rem)] items-center justify-center">
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">You are not assigned to a class yet.</p>
          </div>
        </div>
      );
    }
    activeClassId = String(studentRow.classId);

    // Students see: class-wide entries (studentId IS NULL) + entries targeted to them
    entriesRaw = await db.query.diaryEntries.findMany({
      where: and(
        eq(diaryEntries.classId, Number(activeClassId)),
        or(isNull(diaryEntries.studentId), eq(diaryEntries.studentId, studentRow.studentId))
      ),
      with: { sender: true, student: { with: { user: true } } },
      orderBy: (entry, { asc }) => [asc(entry.createdAt)],
    });
  } else {
    // Teacher / Admin flow
    const classesData = await db.query.classes.findMany();
    allClasses = classesData;
    activeClassId = classIdParam ?? (allClasses[0] ? String(allClasses[0].id) : "");

    if (activeClassId) {
      // Fetch students for the selected class (for the student filter dropdown)
      const studentsData = await db
        .select({
          id: students.id,
          name: users.name,
          rollNumber: students.rollNumber,
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .where(and(eq(students.classId, Number(activeClassId)), eq(users.isActive, true)))
        .orderBy(users.name);
      classStudents = studentsData;

      // Build query conditions
      const conditions = [eq(diaryEntries.classId, Number(activeClassId))];

      if (activeStudentId) {
        // Show entries targeted to this student + class-wide entries
        conditions.push(
          or(isNull(diaryEntries.studentId), eq(diaryEntries.studentId, Number(activeStudentId)))!
        );
      }

      entriesRaw = await db.query.diaryEntries.findMany({
        where: and(...conditions),
        with: { sender: true, student: { with: { user: true } } },
        orderBy: (entry, { asc }) => [asc(entry.createdAt)],
      });
    }
  }

  const entries: DiaryEntryRow[] = entriesRaw.map((e) => ({
    id: e.id,
    senderId: e.senderId,
    senderName: e.sender.name,
    message: e.message,
    fileUrl: e.fileUrl,
    fileName: e.fileName,
    createdAt: e.createdAt.toISOString(),
    studentName: e.student?.user?.name ?? null,
  }));

  const canWrite = role === "teacher" || role === "admin";
  const activeClassName = allClasses.find((c) => String(c.id) === activeClassId)?.name;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-primary/5 via-accent/5 to-transparent">
        <div className="page-shell !py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none">Diary</h1>
              {activeClassName && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeClassName}
                  {activeStudentId
                    ? ` • ${classStudents.find((s) => String(s.id) === activeStudentId)?.name ?? "Student"}`
                    : " • All Students"}
                </p>
              )}
            </div>
          </div>

          {role !== "student" && (
            <DiaryFilters
              classes={allClasses}
              students={classStudents}
              selectedClassId={activeClassId}
              selectedStudentId={activeStudentId}
            />
          )}

          {role === "student" && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              {activeClassName ?? "Your class"}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 w-full max-w-[96rem] mx-auto">
        <DiaryMessageList entries={entries} currentUserId={userId} currentRole={role} />

        {canWrite && (
          <DiaryComposer
            classId={activeClassId}
            students={classStudents}
          />
        )}
      </div>
    </div>
  );
}
