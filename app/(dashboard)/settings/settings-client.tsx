"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageToolbar, FilterConfig } from "@/components/layout/page-toolbar";
import { DataTable } from "@/components/layout/data-table";
import { subjectColumns, classColumns, SubjectRow, ClassRow } from "./settings-columns";
import { SubjectDialog } from "./subject-dialog";
import { ClassDialog } from "./class-dialog";

interface SettingsClientProps {
  subjects: SubjectRow[];
  classes: ClassRow[];
}

export function SettingsClient({ subjects, classes }: SettingsClientProps) {
  const router = useRouter();
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [subjectFilters, setSubjectFilters] = useState<Record<string, string>>({});
  const [classFilters, setClassFilters] = useState<Record<string, string>>({});

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

  return (
    <div className="page-shell">
      <Tabs defaultValue="subjects">
        <TabsList>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-4 mt-4">
          <PageToolbar
            filters={subjectFilterConfig}
            values={subjectFilters}
            onChange={(key, value) => setSubjectFilters((f) => ({ ...f, [key]: value }))}
            onAdd={() => setSubjectDialogOpen(true)}
            addLabel="Add Subject"
          />
          <DataTable columns={subjectColumns} data={filteredSubjects} />
          <SubjectDialog
            open={subjectDialogOpen}
            onOpenChange={setSubjectDialogOpen}
            onCreated={() => router.refresh()}
          />
        </TabsContent>

        <TabsContent value="classes" className="space-y-4 mt-4">
          <PageToolbar
            filters={classFilterConfig}
            values={classFilters}
            onChange={(key, value) => setClassFilters((f) => ({ ...f, [key]: value }))}
            onAdd={() => setClassDialogOpen(true)}
            addLabel="Add Class"
          />
          <DataTable columns={classColumns} data={filteredClasses} />
          <ClassDialog
            open={classDialogOpen}
            onOpenChange={setClassDialogOpen}
            onCreated={() => router.refresh()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
