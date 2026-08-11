"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export type StudentRow = {
  id: number;
  name: string;
  email: string;
  contactNumber: string | null;
  classId: number | null;
  className: string | null;
  rollNumber: string | null;
  fee: number | null; // this student's own fee override, if any
  feeStatus: "paid" | "unpaid" | null; // this month's fee status; null = no record yet
};

interface StudentColumnsOptions {
  onEdit: (row: StudentRow) => void;
  onViewFeeDetails: (row: StudentRow) => void;
}

export function getStudentColumns({ onEdit, onViewFeeDetails }: StudentColumnsOptions): ColumnDef<StudentRow>[] {
  return [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "contactNumber", header: "Contact" },
    { accessorKey: "className", header: "Class" },
    { accessorKey: "rollNumber", header: "Roll No." },
    {
      accessorKey: "feeStatus",
      header: "Fee (this month)",
      cell: ({ row }) => {
        const status = row.original.feeStatus;
        return (
          <div className="flex flex-col items-start gap-1">
            {status ? (
              <Badge
                className={status === "paid" ? "bg-green-600 hover:bg-green-600 text-white" : "bg-red-600 hover:bg-red-600 text-white"}
              >
                {status === "paid" ? "Paid" : "Unpaid"}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">Not generated</span>
            )}
            <Button
              size="sm"
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={() => onViewFeeDetails(row.original)}
            >
              Details
            </Button>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button size="sm" variant="ghost" onClick={() => onEdit(row.original)}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];
}
