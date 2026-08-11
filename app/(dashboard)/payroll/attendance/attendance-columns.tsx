"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatMinutes, STATUS_LABELS, type AttendanceStatus } from "./attendance-helpers";

export type AttendanceRow = {
  key: string; // `${employeeId}-${date}`
  employeeName: string;
  designation: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hoursWorked: number | null; // minutes
  status: AttendanceStatus;
};

function badgeVariant(status: AttendanceStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "present") return "default";
  if (status === "half_day") return "secondary";
  if (status === "leave") return "outline";
  return "destructive";
}

export const adminAttendanceColumns: ColumnDef<AttendanceRow>[] = [
  { accessorKey: "employeeName", header: "Employee" },
  { accessorKey: "designation", header: "Designation" },
  { accessorKey: "date", header: "Date" },
  { accessorKey: "checkIn", header: "Check In", cell: ({ row }) => row.original.checkIn ?? "—" },
  { accessorKey: "checkOut", header: "Check Out", cell: ({ row }) => row.original.checkOut ?? "—" },
  {
    accessorKey: "hoursWorked",
    header: "Hours Worked",
    cell: ({ row }) => formatMinutes(row.original.hoursWorked),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant={badgeVariant(row.original.status)}>{STATUS_LABELS[row.original.status]}</Badge>,
  },
];

export const myAttendanceColumns: ColumnDef<AttendanceRow>[] = [
  { accessorKey: "date", header: "Date" },
  { accessorKey: "checkIn", header: "Check In", cell: ({ row }) => row.original.checkIn ?? "—" },
  { accessorKey: "checkOut", header: "Check Out", cell: ({ row }) => row.original.checkOut ?? "—" },
  {
    accessorKey: "hoursWorked",
    header: "Hours Worked",
    cell: ({ row }) => formatMinutes(row.original.hoursWorked),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant={badgeVariant(row.original.status)}>{STATUS_LABELS[row.original.status]}</Badge>,
  },
];
