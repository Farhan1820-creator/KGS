"use client";

import { ColumnDef } from "@tanstack/react-table";

export type TeacherRow = {
  id: number;
  name: string;
  email: string;
  contactNumber: string | null;
  subjectName: string | null;
};

export const teacherColumns: ColumnDef<TeacherRow>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "contactNumber", header: "Contact" },
  { accessorKey: "subjectName", header: "Subject" },
];
