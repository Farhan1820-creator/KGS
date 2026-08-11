"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";

export type ExpenseRow = {
  id: number;
  categoryId: number;
  categoryName: string;
  subCategoryId: number | null;
  subCategoryName: string | null;
  title: string;
  amount: number;
  date: string; // "YYYY-MM-DD"
  notes: string | null;
};

interface ExpenseColumnsOptions {
  onEdit: (row: ExpenseRow) => void;
  onDelete: (row: ExpenseRow) => void;
}

export function getExpenseColumns({ onEdit, onDelete }: ExpenseColumnsOptions): ColumnDef<ExpenseRow>[] {
  return [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
    },
    { accessorKey: "title", header: "Title" },
    {
      accessorKey: "categoryName",
      header: "Category",
      cell: ({ row }) => <Badge variant="secondary">{row.original.categoryName}</Badge>,
    },
    {
      accessorKey: "subCategoryName",
      header: "Sub-category",
      cell: ({ row }) => row.original.subCategoryName ?? "—",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `Rs. ${row.original.amount.toLocaleString()}`,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(row.original); }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDelete(row.original); }}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];
}
