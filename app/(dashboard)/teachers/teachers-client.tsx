"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageToolbar, FilterConfig } from "@/components/layout/page-toolbar";
import { DataTable } from "@/components/layout/data-table";
import { getTeacherColumns, TeacherRow } from "./teacher-columns";
import { TeacherDialog } from "./teacher-dialog";
import { toggleTeacherActive } from "./teacher-actions";

interface TeachersClientProps {
  initialData: TeacherRow[];
  subjects: { id: number; name: string }[];
}

export function TeachersClient({ initialData, subjects }: TeachersClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view");
  const [dialogTarget, setDialogTarget] = useState<TeacherRow | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  // Show only active teachers by default — toggle to reveal departed teachers
  const [showInactive, setShowInactive] = useState(false);

  const filterConfig: FilterConfig[] = [
    { type: "search", key: "name", placeholder: "Search by name", label: "Teacher Name" },
    { type: "search", key: "teacherId", placeholder: "Search by teacher ID", label: "Teacher ID" },
    { type: "search", key: "contactNumber", placeholder: "Search by contact", label: "Contact Number" },
    {
      type: "select",
      key: "subjectName",
      placeholder: "Filter by subject",
      label: "Subject",
      options: subjects.map((s) => ({ label: s.name, value: s.name })),
    },
  ];

  const filteredData = useMemo(() => {
    return initialData
      .filter((row) => showInactive || row.isActive) // hide inactive by default
      .filter((row) =>
        Object.entries(filters).every(([key, value]) => {
          if (!value) return true;
          if (key === "subjectName") {
            return (
              row.subjectNames?.some((s) => s.toLowerCase().includes(value.toLowerCase())) ||
              (row.subjectName ?? "").toLowerCase().includes(value.toLowerCase())
            );
          }
          const cell = String(row[key as keyof TeacherRow] ?? "").toLowerCase();
          return cell.includes(value.toLowerCase());
        })
      );
  }, [initialData, filters, showInactive]);

  function handleAdd() {
    setDialogTarget(null);
    setDialogOpen(true);
  }

  // Row click opens the read-only view, which has its own Edit button to
  // switch the same dialog into edit mode.
  function handleView(row: TeacherRow) {
    setDialogTarget(row);
    setDialogMode("view");
    setDialogOpen(true);
  }

  function handleToggleActive(row: TeacherRow) {
    startTransition(async () => {
      const result = await toggleTeacherActive(row.id);
      if (result.success) {
        toast.success(result.isActive ? `${row.name} reactivated.` : `${row.name} marked as inactive.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const columns = getTeacherColumns({ onToggleActive: handleToggleActive });

  return (
    <div className="page-shell space-y-4">
      <PageToolbar
        filters={filterConfig}
        values={filters}
        onChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        onAdd={handleAdd}
        addLabel="Add Teacher"
      />

      {/* Show Inactive toggle */}
      <div className="flex items-center gap-2 text-sm">
        <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground">
          <input
            type="checkbox"
            checked={showInactive}
            disabled={isPending}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="accent-primary"
          />
          Show inactive teachers
        </label>
      </div>

      <DataTable columns={columns} data={filteredData} onRowClick={handleView} />

      <TeacherDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subjects={subjects}
        teacher={dialogTarget}
        mode={dialogMode}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
