"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageToolbar, FilterConfig } from "@/components/layout/page-toolbar";
import { DataTable } from "@/components/layout/data-table";
import { getTeacherColumns, TeacherRow } from "./teacher-columns";
import { TeacherDialog, TeacherEditTarget } from "./teacher-dialog";

interface TeachersClientProps {
  initialData: TeacherRow[];
  subjects: { id: number; name: string }[];
}

export function TeachersClient({ initialData, subjects }: TeachersClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeacherEditTarget | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filterConfig: FilterConfig[] = [
    { type: "search", key: "name", placeholder: "Search by name" },
    { type: "search", key: "teacherId", placeholder: "Search by teacher ID" },
    { type: "search", key: "contactNumber", placeholder: "Search by contact" },
    {
      type: "select",
      key: "subjectName",
      placeholder: "Filter by subject",
      options: subjects.map((s) => ({ label: s.name, value: s.name })),
    },
  ];

  const filteredData = useMemo(() => {
    return initialData.filter((row) =>
      Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const cell = String(row[key as keyof TeacherRow] ?? "").toLowerCase();
        return cell.includes(value.toLowerCase());
      })
    );
  }, [initialData, filters]);

  function handleAdd() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function handleEdit(row: TeacherRow) {
    setEditTarget({
      id: row.id,
      name: row.name,
      contactNumber: row.contactNumber,
      subjectId: row.subjectId,
      teacherId: row.teacherId,
    });
    setDialogOpen(true);
  }

  const columns = getTeacherColumns({ onEdit: handleEdit });

  return (
    <div className="page-shell space-y-4">
      <PageToolbar
        filters={filterConfig}
        values={filters}
        onChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        onAdd={handleAdd}
        addLabel="Add Teacher"
      />

      <DataTable columns={columns} data={filteredData} />

      <TeacherDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subjects={subjects}
        teacher={editTarget}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
