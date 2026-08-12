"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export type TeacherRow = {
  id: number;
  name: string;
  email: string;
  contactNumber: string | null;
  subjectId: number | null;
  subjectName: string | null;
  teacherId: string | null;
};

interface TeacherColumnsOptions {
  onEdit: (row: TeacherRow) => void;
}

export function getTeacherColumns({ onEdit }: TeacherColumnsOptions): ColumnDef<TeacherRow>[] {
  return [
    { accessorKey: "teacherId", header: "Teacher ID" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "contactNumber", header: "Contact" },
    { accessorKey: "subjectName", header: "Subject" },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(row.original);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];
}
