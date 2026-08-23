"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type TeacherRow = {
  id: number;
  name: string;
  email: string;
  contactNumber: string | null;
  subjectIds: number[];
  subjectNames: string[];
  subjectName: string | null; // comma-separated string for easy table display/search
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
    {
      accessorKey: "subjectNames",
      header: "Subject(s)",
      cell: ({ row }) => {
        const names = row.original.subjectNames;
        if (!names || names.length === 0) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[240px]">
            {names.map((name) => (
              <Badge key={name} variant="secondary" className="font-normal text-xs py-0.5 px-2">
                {name}
              </Badge>
            ))}
          </div>
        );
      },
    },
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
