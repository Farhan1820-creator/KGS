"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatDuration } from "../attendance/attendance-helpers";
import type { SalaryBreakdown } from "../attendance/attendance-helpers";

function money(n: number): string {
  return n.toLocaleString("en-PK", { maximumFractionDigits: 0 });
}

export const salaryColumns: ColumnDef<SalaryBreakdown>[] = [
  { accessorKey: "employeeName", header: "Employee" },
  { accessorKey: "designation", header: "Designation" },
  {
    accessorKey: "attendanceSummary",
    header: "Present / Half / Leave / Absent",
    cell: ({ row }) => {
      const s = row.original;
      return `${s.daysPresent} / ${s.daysHalfDay} / ${s.daysLeave} / ${s.daysAbsent}`;
    },
  },
  {
    accessorKey: "totalSecondsWorked",
    header: "Time Worked",
    cell: ({ row }) => formatDuration(row.original.totalSecondsWorked),
  },
  {
    accessorKey: "basicSalary",
    header: "Basic (Full)",
    cell: ({ row }) => money(row.original.basicSalary),
  },
  {
    accessorKey: "earnedBasic",
    header: "Earned Basic",
    cell: ({ row }) => money(row.original.earnedBasic),
  },
  {
    accessorKey: "allowances",
    header: "Allowances",
    cell: ({ row }) => money(row.original.allowances),
  },
  {
    accessorKey: "totalSalary",
    header: "Total Salary",
    cell: ({ row }) => <span className="font-medium">{money(row.original.totalSalary)}</span>,
  },
];
