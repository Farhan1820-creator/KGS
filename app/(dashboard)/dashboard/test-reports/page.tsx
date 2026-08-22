import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { testMarks, classes, students, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { TestReportsClient } from "./test-reports-client";
import type { TestMarkRow } from "./test-reports-actions";

export const dynamic = "force-dynamic";

export default async function TestReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = session.user.role;
  if (!["admin", "teacher"].includes(role)) redirect("/dashboard");

  // Fetch classes
  const allClasses = await db
    .select({ id: classes.id, name: classes.name, section: classes.section })
    .from(classes)
    .orderBy(classes.name);

  // Fetch active students
  const activeStudents = await db
    .select({ id: students.id, name: users.name, classId: students.classId })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(students.status, "active"))
    .orderBy(users.name);

  const creatorAlias = alias(users, "creator");

  // Fetch test marks
  const rows = await db
    .select({
      id: testMarks.id,
      studentId: testMarks.studentId,
      studentName: users.name,
      classId: testMarks.classId,
      className: classes.name,
      classSection: classes.section,
      title: testMarks.title,
      month: testMarks.month,
      totalMarks: testMarks.totalMarks,
      achievedMarks: testMarks.achievedMarks,
      percentage: testMarks.percentage,
      createdAt: testMarks.createdAt,
      creatorName: creatorAlias.name,
    })
    .from(testMarks)
    .innerJoin(students, eq(testMarks.studentId, students.id))
    .innerJoin(users, eq(students.userId, users.id))
    .innerJoin(classes, eq(testMarks.classId, classes.id))
    .leftJoin(creatorAlias, eq(testMarks.createdBy, creatorAlias.id))
    .where(eq(students.status, "active"))
    .orderBy(testMarks.createdAt);

  const initialMarks: TestMarkRow[] = rows.map((r) => ({
    id: r.id,
    studentId: r.studentId,
    studentName: r.studentName,
    classId: r.classId,
    className: r.className,
    classSection: r.classSection,
    title: r.title,
    month: r.month,
    totalMarks: r.totalMarks,
    achievedMarks: r.achievedMarks,
    percentage: r.percentage,
    createdAt: r.createdAt,
    creatorName: r.creatorName ?? "Unknown",
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Test Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage and view test marks for students.
        </p>
      </div>

      <TestReportsClient
        initialMarks={initialMarks}
        classes={allClasses}
        students={activeStudents}
        role={role}
      />
    </div>
  );
}
