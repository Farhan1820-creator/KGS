"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

export type TeacherRow = {
  id: number;
  name: string;
  email: string;
  contactNumber: string | null;
  subjectId: number | null;
  subjectName: string | null;
  teacherId: string | null;
  joinDate: string | null;
  isActive: boolean;
};

interface TeacherColumnsOptions {
  onToggleActive: (row: TeacherRow) => void;
}

export function getTeacherColumns({ onToggleActive }: TeacherColumnsOptions): ColumnDef<TeacherRow>[] {
  return [
    { accessorKey: "teacherId", header: "Teacher ID" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "contactNumber", header: "Contact" },
    { accessorKey: "subjectName", header: "Subject" },
    { accessorKey: "joinDate", header: "Join Date", cell: ({ row }) => row.original.joinDate ?? "—" },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const active = row.original.isActive;
        return (
          <Button
            size="sm"
            variant="outline"
            className={
              active
                ? "border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                : "border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
            }
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive(row.original);
            }}
          >
            {active ? "Active" : "Inactive"}
          </Button>
        );
      },
    },
  ];
}

