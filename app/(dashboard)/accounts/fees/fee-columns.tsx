"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMonthLabel } from "./fee-range";

export type FeeRow = {
  id: number;
  studentId: number;
  studentName: string;
  photoUrl?: string | null;
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
    {
      id: "photo",
      header: "",
      cell: ({ row }) =>
        row.original.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.original.photoUrl}
            alt={row.original.studentName}
            className="h-8 w-8 rounded-full object-cover border"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground border">
            {row.original.studentName ? row.original.studentName.slice(0, 1).toUpperCase() : "?"}
          </div>
        ),
    },
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
