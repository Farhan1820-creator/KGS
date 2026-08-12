"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageToolbar, FilterConfig } from "@/components/layout/page-toolbar";
import { DataTable } from "@/components/layout/data-table";
import { getSubjectColumns, getClassColumns, SubjectRow, ClassRow } from "./settings-columns";
import { SubjectDialog } from "./subject-dialog";
import { ClassDialog } from "./class-dialog";
import { deleteSubject, deleteClass } from "./settings-actions";

interface SettingsClientProps {
  subjects: SubjectRow[];
  classes: ClassRow[];
}

export function SettingsClient({ subjects, classes }: SettingsClientProps) {
  const router = useRouter();
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [subjectEditTarget, setSubjectEditTarget] = useState<SubjectRow | null>(null);
  const [classEditTarget, setClassEditTarget] = useState<ClassRow | null>(null);
  const [subjectFilters, setSubjectFilters] = useState<Record<string, string>>({});
  const [classFilters, setClassFilters] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  const subjectFilterConfig: FilterConfig[] = [
    { type: "search", key: "name", placeholder: "Search by name" },
    { type: "search", key: "code", placeholder: "Search by code" },
  ];

  const classFilterConfig: FilterConfig[] = [
    { type: "search", key: "name", placeholder: "Search by name" },
    { type: "search", key: "section", placeholder: "Search by section" },
  ];

  const filteredSubjects = useMemo(
    () =>
      subjects.filter((row) =>
        Object.entries(subjectFilters).every(([key, value]) => {
          if (!value) return true;
          return String(row[key as keyof SubjectRow] ?? "")
            .toLowerCase()
            .includes(value.toLowerCase());
        })
      ),
    [subjects, subjectFilters]
  );

  const filteredClasses = useMemo(
    () =>
      classes.filter((row) =>
        Object.entries(classFilters).every(([key, value]) => {
          if (!value) return true;
          return String(row[key as keyof ClassRow] ?? "")
            .toLowerCase()
            .includes(value.toLowerCase());
        })
      ),
    [classes, classFilters]
  );

  function handleAddSubject() {
    setSubjectEditTarget(null);
    setSubjectDialogOpen(true);
  }

  function handleEditSubject(row: SubjectRow) {
    setSubjectEditTarget(row);
    setSubjectDialogOpen(true);
  }

  function handleDeleteSubject(row: SubjectRow) {
    if (!confirm(`Delete subject "${row.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteSubject(row.id);
      if (!res.success) {
        toast.error(res.errors?.root?.[0] ?? "Could not delete subject");
        return;
      }
      toast.success("Subject deleted");
      router.refresh();
    });
  }

  function handleAddClass() {
    setClassEditTarget(null);
    setClassDialogOpen(true);
  }

  function handleEditClass(row: ClassRow) {
    setClassEditTarget(row);
    setClassDialogOpen(true);
  }

  function handleDeleteClass(row: ClassRow) {
    if (!confirm(`Delete class "${row.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteClass(row.id);
      if (!res.success) {
        toast.error(res.errors?.root?.[0] ?? "Could not delete class");
        return;
      }
      toast.success("Class deleted");
      router.refresh();
    });
  }

  const subjectColumns = getSubjectColumns({ onEdit: handleEditSubject, onDelete: handleDeleteSubject });
  const classColumns = getClassColumns({ onEdit: handleEditClass, onDelete: handleDeleteClass });

  return (
    <div className="page-shell">
      <Tabs defaultValue="subjects flex flex-col">
        <TabsList>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-4 mt-4">
          <PageToolbar
            filters={subjectFilterConfig}
            values={subjectFilters}
            onChange={(key, value) => setSubjectFilters((f) => ({ ...f, [key]: value }))}
            onAdd={handleAddSubject}
            addLabel="Add Subject"
          />
          <DataTable columns={subjectColumns} data={filteredSubjects} />
          <SubjectDialog
            open={subjectDialogOpen}
            onOpenChange={setSubjectDialogOpen}
            editTarget={subjectEditTarget}
            onCreated={() => router.refresh()}
          />
        </TabsContent>

        <TabsContent value="classes" className="space-y-4 mt-4">
          <PageToolbar
            filters={classFilterConfig}
            values={classFilters}
            onChange={(key, value) => setClassFilters((f) => ({ ...f, [key]: value }))}
            onAdd={handleAddClass}
            addLabel="Add Class"
          />
          <DataTable columns={classColumns} data={filteredClasses} />
          <ClassDialog
            open={classDialogOpen}
            onOpenChange={setClassDialogOpen}
            editTarget={classEditTarget}
            onCreated={() => router.refresh()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
