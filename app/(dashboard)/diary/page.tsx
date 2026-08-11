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

  const allClasses = await db.query.classes.findMany();

  // students are locked to their own class — no dropdown, no param override
  let activeClassId: string;
  if (role === "student") {
    const [studentRow] = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
    if (!studentRow?.classId) {
      return <div className="page-shell">You are not assigned to a class yet.</div>;
    }
    activeClassId = String(studentRow.classId);
  } else {
    activeClassId = classIdParam ?? (allClasses[0] ? String(allClasses[0].id) : "");
  }

  const entriesRaw = activeClassId
    ? await db.query.diaryEntries.findMany({
        where: eq(diaryEntries.classId, Number(activeClassId)),
        with: { sender: true },
        orderBy: (entry, { asc }) => [asc(entry.createdAt)],
      })
    : [];

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
