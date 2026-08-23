"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageToolbar, FilterConfig } from "@/components/layout/page-toolbar";
import { DataTable } from "@/components/layout/data-table";
import { getStudentColumns, StudentRow } from "./student-columns";
import { StudentDialog } from "./student-dialog";
import { StudentAttendanceDialog } from "./student-attendance-dialog";
import { updateStudentStatus } from "./student-actions";

interface StudentsClientProps {
  initialData: StudentRow[];
  classes: { id: number; name: string }[];
  feeStructures: { classId: number; amount: number }[];
  currentMonth: string;
}

export function StudentsClient({ initialData, classes, feeStructures, currentMonth }: StudentsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view");
  const [dialogTarget, setDialogTarget] = useState<StudentRow | null>(null);

  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [attendanceTargetStudent, setAttendanceTargetStudent] = useState<StudentRow | null>(null);

  const [filters, setFilters] = useState<Record<string, string>>({});
  // Toggles for different statuses
  const [showInactive, setShowInactive] = useState(false);
  const [showWebsite, setShowWebsite] = useState(false);

  const filterConfig: FilterConfig[] = [
    { type: "search", key: "name", placeholder: "Search by name", label: "Student Name" },
    { type: "search", key: "contactNumber", placeholder: "Search by contact", label: "Contact Number" },
    {
      type: "select",
      key: "className",
      placeholder: "Filter by class",
      label: "Class",
      options: classes.map((c) => ({ label: c.name, value: c.name })),
    },
  ];

  const filteredData = useMemo(() => {
    return initialData
      .filter((row) => {
        if (!row.isActive) return showInactive;
        if (row.status === "website") return showWebsite;
        return true; // active academy student
      })
      .filter((row) =>
        Object.entries(filters).every(([key, value]) => {
          if (!value) return true;
          const cell = String(row[key as keyof StudentRow] ?? "").toLowerCase();
          return cell.includes(value.toLowerCase());
        })
      );
  }, [initialData, filters, showInactive, showWebsite]);

  function handleAdd() {
    setDialogTarget(null);
    setDialogOpen(true);
  }

  function handleView(row: StudentRow) {
    setDialogTarget(row);
    setDialogMode("view");
    setDialogOpen(true);
  }

  function handleViewFeeDetails(row: StudentRow) {
    const params = new URLSearchParams({ studentId: String(row.id), from: currentMonth, to: currentMonth });
    router.push(`/accounts/fees?${params.toString()}`);
  }

  function handleViewAttendance(row: StudentRow) {
    setAttendanceTargetStudent(row);
    setAttendanceDialogOpen(true);
  }

  function handleUpdateStatus(row: StudentRow, status: "Active" | "Website" | "Inactive") {
    startTransition(async () => {
      const result = await updateStudentStatus(row.id, status);
      if (result.success) {
        toast.success(`${row.name} status updated to ${status}.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const columns = getStudentColumns({
    onViewFeeDetails: handleViewFeeDetails,
    onViewAttendance: handleViewAttendance,
    onUpdateStatus: handleUpdateStatus,
  });

  return (
    <div className="page-shell space-y-4">
      <PageToolbar
        filters={filterConfig}
        values={filters}
        onChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        onAdd={handleAdd}
        addLabel="Add Student"
      />

      {/* Toggles */}
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors">
          <input
            type="checkbox"
            checked={showInactive}
            disabled={isPending}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="accent-primary"
          />
          Show inactive students
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors">
          <input
            type="checkbox"
            checked={showWebsite}
            disabled={isPending}
            onChange={(e) => setShowWebsite(e.target.checked)}
            className="accent-primary"
          />
          Show website students
        </label>
      </div>

      <DataTable columns={columns} data={filteredData} onRowClick={handleView} />

      <StudentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        classes={classes}
        feeStructures={feeStructures}
        student={dialogTarget}
        mode={dialogMode}
        onSaved={() => router.refresh()}
      />

      <StudentAttendanceDialog
        open={attendanceDialogOpen}
        onOpenChange={setAttendanceDialogOpen}
        studentId={attendanceTargetStudent?.id ?? null}
        studentName={attendanceTargetStudent?.name}
      />
    </div>
  );
}
