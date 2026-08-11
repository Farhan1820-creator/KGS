import { db } from "@/db";
import { classes, fees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { StudentsClient } from "./students-client";

export const dynamic = "force-dynamic";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function StudentsPage() {
  const month = currentMonth();

  // one query with relations instead of separate user/class round-trips (see db/queries/students.ts)
  const [studentRows, classList, monthFees, structures] = await Promise.all([
    db.query.students.findMany({
      with: { user: true, class: true },
    }),
    db.query.classes.findMany(),
    db.query.fees.findMany({ where: eq(fees.month, month), columns: { studentId: true, status: true } }),
    db.query.feeStructures.findMany(),
  ]);

  const feeStatusByStudent = new Map(monthFees.map((f) => [f.studentId, f.status]));

  const data = studentRows.map((s) => ({
    id: s.id,
    name: s.user.name,
    email: s.user.email,
    contactNumber: s.user.contactNumber,
    classId: s.classId,
    className: s.class?.name ?? "—",
    rollNumber: s.rollNumber,
    fee: s.fee,
    feeStatus: feeStatusByStudent.get(s.id) ?? null, // null = no fee record generated yet for this month
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
