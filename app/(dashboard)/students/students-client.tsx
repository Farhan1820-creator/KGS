"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageToolbar, FilterConfig } from "@/components/layout/page-toolbar";
import { DataTable } from "@/components/layout/data-table";
import { studentColumns, StudentRow } from "./student-columns";
import { StudentDialog } from "./student-dialog";

interface StudentsClientProps {
  initialData: StudentRow[];
  classes: { id: number; name: string }[];
}

export function StudentsClient({ initialData, classes }: StudentsClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
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

  return (
    <div className="page-shell space-y-4">
      <PageToolbar
        filters={filterConfig}
        values={filters}
        onChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        onAdd={() => setDialogOpen(true)}
        addLabel="Add Student"
      />

      <DataTable columns={studentColumns} data={filteredData} />

      <StudentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        classes={classes}
        onCreated={() => router.refresh()}
      />
    </div>
  );
}
