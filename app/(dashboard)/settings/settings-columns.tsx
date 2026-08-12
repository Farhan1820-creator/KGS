"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

export type SubjectRow = { id: number; name: string; code: string };
export type ClassRow = { id: number; name: string; section: string | null };

interface SubjectColumnsOptions {
  onEdit: (row: SubjectRow) => void;
  onDelete: (row: SubjectRow) => void;
}

export function getSubjectColumns({ onEdit, onDelete }: SubjectColumnsOptions): ColumnDef<SubjectRow>[] {
  return [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "code", header: "Code" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="icon-sm" variant="ghost" onClick={() => onEdit(row.original)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => onDelete(row.original)}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];
}

interface ClassColumnsOptions {
  onEdit: (row: ClassRow) => void;
  onDelete: (row: ClassRow) => void;
}

export function getClassColumns({ onEdit, onDelete }: ClassColumnsOptions): ColumnDef<ClassRow>[] {
  return [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "section", header: "Section" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="icon-sm" variant="ghost" onClick={() => onEdit(row.original)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => onDelete(row.original)}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];
}
