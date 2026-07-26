"use client";

import { ColumnDef } from "@tanstack/react-table";

export type StudentRow = {
  id: number;
  name: string;
  email: string;
  contactNumber: string | null;
  className: string | null;
  rollNumber: string | null;
};

export const studentColumns: ColumnDef<StudentRow>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "contactNumber", header: "Contact" },
  { accessorKey: "className", header: "Class" },
  { accessorKey: "rollNumber", header: "Roll No." },
];
