"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMonthLabel } from "./fee-range";

export type FeeRow = {
  id: number;
  studentId: number;
  studentName: string;
  rollNumber: string | null;
  classId: number | null;
  className: string | null;
  month: string;
  amount: number;
  status: "paid" | "unpaid";
  paidDate: string | null;
};

interface FeeColumnsOptions {
  onTogglePaid: (row: FeeRow) => void;
}

export function getFeeColumns({ onTogglePaid }: FeeColumnsOptions): ColumnDef<FeeRow>[] {
  return [
    { accessorKey: "studentName", header: "Student" },
    { accessorKey: "rollNumber", header: "Roll No." },
    { accessorKey: "className", header: "Class" },
    {
      accessorKey: "month",
      header: "Month",
      cell: ({ row }) => formatMonthLabel(row.original.month),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `Rs. ${row.original.amount.toLocaleString()}`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            className={status === "paid" ? "bg-green-600 hover:bg-green-600 text-white" : "bg-red-600 hover:bg-red-600 text-white"}
          >
            {status === "paid" ? "Paid" : "Unpaid"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "paidDate",
      header: "Paid On",
      cell: ({ row }) => row.original.paidDate ?? "—",
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onTogglePaid(row.original); }}>
          Mark {row.original.status === "paid" ? "Unpaid" : "Paid"}
        </Button>
      ),
    },
  ];
}
