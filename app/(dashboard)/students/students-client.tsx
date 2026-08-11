"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageToolbar, FilterConfig } from "@/components/layout/page-toolbar";
import { DataTable } from "@/components/layout/data-table";
import { getStudentColumns, StudentRow } from "./student-columns";
import { StudentDialog, StudentEditTarget } from "./student-dialog";

interface StudentsClientProps {
  initialData: StudentRow[];
  classes: { id: number; name: string }[];
  feeStructures: { classId: number; amount: number }[];
  currentMonth: string;
}

export function StudentsClient({ initialData, classes, feeStructures, currentMonth }: StudentsClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StudentEditTarget | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filterConfig: FilterConfig[] = [
    { type: "search", key: "name", placeholder: "Search by name" },
    { type: "search", key: "contactNumber", placeholder: "Search by contact" },
    {
      type: "select",
      key: "className",
      placeholder: "Filter by class",
      options: classes.map((c) => ({ label: c.name, value: c.name })),
    },
  ];

  const filteredData = useMemo(() => {
    return initialData.filter((row) =>
      Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const cell = String(row[key as keyof StudentRow] ?? "").toLowerCase();
        return cell.includes(value.toLowerCase());
      })
    );
  }, [initialData, filters]);

  function handleAdd() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function handleEdit(row: StudentRow) {
    setEditTarget({
      id: row.id,
      name: row.name,
      contactNumber: row.contactNumber,
      classId: row.classId,
      rollNumber: row.rollNumber,
      fee: row.fee,
    });
    setDialogOpen(true);
  }

  // Jumps to the fees page pre-filtered to this student, with the month
  // filter set to the current month so the fee detail is right there.
  function handleViewFeeDetails(row: StudentRow) {
    const params = new URLSearchParams({ studentId: String(row.id), month: currentMonth });
    router.push(`/accounts/fees?${params.toString()}`);
  }

  const columns = getStudentColumns({ onEdit: handleEdit, onViewFeeDetails: handleViewFeeDetails });

  return (
    <div className="page-shell space-y-4">
      <PageToolbar
        filters={filterConfig}
        values={filters}
        onChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        onAdd={handleAdd}
        addLabel="Add Student"
      />

      <DataTable columns={columns} data={filteredData} />

      <StudentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        classes={classes}
        feeStructures={feeStructures}
        student={editTarget}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
