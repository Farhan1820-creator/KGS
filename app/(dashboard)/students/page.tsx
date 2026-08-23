import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { classes } from "@/db/schema";
import { StudentsClient } from "./students-client";
import { currentMonth, computeOverallFeeStatus } from "../accounts/fees/fee-range";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  const month = currentMonth();

  // one query with relations instead of separate user/class round-trips (see db/queries/students.ts)
  const [studentRows, classList, allFees, structures] = await Promise.all([
    db.query.students.findMany({
        with: { user: true, class: true },
        orderBy: (t, { desc }) => [desc(t.id)]
      }),
    db.query.classes.findMany({ orderBy: (t, { desc }) => [desc(t.id)] }),
    // fetch every fee record (not just this month) — overall status needs the
    // full paid/unpaid history from each student's admission date onward
    db.query.fees.findMany({ columns: { studentId: true, month: true, status: true } }),
    db.query.feeStructures.findMany(),
  ]);

  // group each student's fee records by month for quick lookup
  const feesByStudent = new Map<number, Map<string, "paid" | "unpaid">>();
  for (const f of allFees) {
    if (!feesByStudent.has(f.studentId)) feesByStudent.set(f.studentId, new Map());
    feesByStudent.get(f.studentId)!.set(f.month, f.status);
  }

  const data = studentRows.map((s) => ({
    id: s.id,
    name: s.user.name,
    email: s.user.email,
    contactNumber: s.user.contactNumber,
    classId: s.classId,
    className: s.class?.name ?? "—",
    rollNumber: s.rollNumber,
    fee: s.fee,
    admissionDate: s.admissionDate,
    photoUrl: s.photoUrl,
    schoolName: s.schoolName,
    isActive: s.user.isActive,
    status: s.status,
    // overall status from admission date through the current month — not just this month
    feeStatus: computeOverallFeeStatus(s.admissionDate, feesByStudent.get(s.id) ?? new Map()),
  }));

  return (
    <StudentsClient
      initialData={data}
      classes={classList}
      feeStructures={structures.map((s) => ({ classId: s.classId, amount: s.amount }))}
      currentMonth={month}
    />
  );
}