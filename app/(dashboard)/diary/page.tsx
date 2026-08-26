import { auth } from "@/auth";
import { db } from "@/db";
import { diaryEntries, classes, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DiaryClassSelector } from "./diary-class-selector";
import { DiaryMessageList } from "./diary-message-list";
import { DiaryComposer } from "./diary-composer";
import type { DiaryEntryRow } from "./diary-message-bubble";

interface DiaryPageProps {
  searchParams: Promise<{ classId?: string }>;
}

export default async function DiaryPage({ searchParams }: DiaryPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "staff") redirect("/");

  const { classId: classIdParam } = await searchParams;
  const role = session.user.role as "student" | "teacher" | "admin";
  const userId = Number(session.user.id);

  let activeClassId = classIdParam ?? "";
  let allClasses: { id: number; name: string; section: string | null }[] = [];
  let entriesRaw: any[] = [];

  if (role === "student") {
    const [classesData, [studentRow]] = await Promise.all([
      db.query.classes.findMany(),
      db.select({ classId: students.classId }).from(students).where(eq(students.userId, userId)).limit(1),
    ]);
    allClasses = classesData;

    if (!studentRow?.classId) {
      return <div className="page-shell">You are not assigned to a class yet.</div>;
    }
    activeClassId = String(studentRow.classId);

    entriesRaw = await db.query.diaryEntries.findMany({
      where: eq(diaryEntries.classId, Number(activeClassId)),
      with: { sender: true },
      orderBy: (entry, { asc }) => [asc(entry.createdAt)],
    });
  } else {
    const defaultQueryId = classIdParam ? Number(classIdParam) : null;
    const [classesData, initialEntries] = await Promise.all([
      db.query.classes.findMany(),
      defaultQueryId
        ? db.query.diaryEntries.findMany({
            where: eq(diaryEntries.classId, defaultQueryId),
            with: { sender: true },
            orderBy: (entry, { asc }) => [asc(entry.createdAt)],
          })
        : Promise.resolve([]),
    ]);
    allClasses = classesData;
    activeClassId = classIdParam ?? (allClasses[0] ? String(allClasses[0].id) : "");

    if (!classIdParam && activeClassId) {
      entriesRaw = await db.query.diaryEntries.findMany({
        where: eq(diaryEntries.classId, Number(activeClassId)),
        with: { sender: true },
        orderBy: (entry, { asc }) => [asc(entry.createdAt)],
      });
    } else {
      entriesRaw = initialEntries;
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
  }));

  const canWrite = role === "teacher" || role === "admin";
  const activeClassName = allClasses.find((c) => String(c.id) === activeClassId)?.name;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="border-b p-3 flex items-center justify-between">
        {role === "student" ? (
          <span className="text-sm font-medium">{activeClassName ?? "Your class"}</span>
        ) : (
          <DiaryClassSelector classes={allClasses} selectedClassId={activeClassId} />
        )}
      </div>

      <DiaryMessageList entries={entries} currentUserId={userId} currentRole={role} />

      {canWrite && <DiaryComposer classId={activeClassId} />}
    </div>
  );
}
