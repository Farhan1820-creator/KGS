"use client";

import { ColumnDef } from "@tanstack/react-table";

export type SubjectRow = { id: number; name: string; code: string };
export type ClassRow = { id: number; name: string; section: string | null };

export const subjectColumns: ColumnDef<SubjectRow>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "code", header: "Code" },
];

export const classColumns: ColumnDef<ClassRow>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "section", header: "Section" },
];
