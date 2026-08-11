import { db } from "@/db";
import { fees } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { FeesClient } from "./fees-client";
import type { FeeRow } from "./fee-columns";
import { isFeeRange, monthsForRange, FeeRange } from "./fee-range";

export const dynamic = "force-dynamic";

interface FeesPageProps {
  searchParams: Promise<{
    range?: string;
    month?: string;
    studentId?: string;
    classId?: string;
  }>;
}

export default async function FeesPage({ searchParams }: FeesPageProps) {
  const params = await searchParams;
  const range: FeeRange = isFeeRange(params.range) ? params.range : "this_month";
  const month = params.month; // specific month overrides the range when set
  const monthsToQuery = month ? [month] : monthsForRange(range);

  const [feeRows, classList, studentList, structures] = await Promise.all([
    db.query.fees.findMany({
      where: inArray(fees.month, monthsToQuery),
      with: { student: { with: { user: true, class: true } } },
    }),
    db.query.classes.findMany(),
    db.query.students.findMany({ with: { user: true } }),
    db.query.feeStructures.findMany(),
  ]);

  let data: FeeRow[] = feeRows.map((f) => ({
    id: f.id,
    studentId: f.studentId,
    studentName: f.student.user.name,
    rollNumber: f.student.rollNumber,
    classId: f.student.classId,
    className: f.student.class?.name ?? "—",
    month: f.month,
    amount: f.amount,
    status: f.status,
    paidDate: f.paidDate ? new Date(f.paidDate).toLocaleDateString() : null,
  }));

  if (params.studentId) {
    data = data.filter((f) => f.studentId === Number(params.studentId));
  }
  if (params.classId) {
    data = data.filter((f) => f.classId === Number(params.classId));
  }

  return (
    <FeesClient
      initialData={data}
      classes={classList}
      students={studentList.map((s) => ({ id: s.id, name: s.user.name }))}
      structures={structures.map((s) => ({ classId: s.classId, amount: s.amount }))}
      range={range}
      month={month}
      studentId={params.studentId}
      classId={params.classId}
    />
  );
}
