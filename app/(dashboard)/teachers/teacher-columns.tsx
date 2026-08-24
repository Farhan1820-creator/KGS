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
  photoUrl?: string | null;
  isActive: boolean;
};

interface TeacherColumnsOptions {
  onToggleActive: (row: TeacherRow) => void;
}

export function getTeacherColumns({ onToggleActive }: TeacherColumnsOptions): ColumnDef<TeacherRow>[] {
  return [
    { accessorKey: "teacherId", header: "Teacher ID" },
    {
      accessorKey: "name",
      header: "Teacher",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          {row.original.photoUrl ? (
            <img
              src={row.original.photoUrl}
              alt={row.original.name}
              className="h-7 w-7 rounded-full object-cover shrink-0 border border-border"
            />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
              {row.original.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-semibold text-foreground">{row.original.name}</span>
        </div>
      ),
    },
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
