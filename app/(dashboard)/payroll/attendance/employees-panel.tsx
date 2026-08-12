"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Pencil } from "lucide-react";
import { EmployeeDialog, EmployeeEditTarget } from "./employee-dialog";
import { syncTeacherEmployees } from "./attendance-actions";

export type EmployeeRow = {
  id: number;
  name: string;
  designation: string;
  employeeType: "teacher" | "staff";
  basicSalary: number;
  allowances: number;
};

export function EmployeesPanel({ employees }: { employees: EmployeeRow[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EmployeeEditTarget | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function handleEdit(row: EmployeeRow) {
    setEditTarget({
      id: row.id,
      designation: row.designation,
      basicSalary: row.basicSalary,
      allowances: row.allowances,
    });
    setDialogOpen(true);
  }

  function handleSync() {
    startTransition(async () => {
      const result = await syncTeacherEmployees();
      if (!result.success) {
        toast.error(result.errors.root?.[0] ?? "Could not sync teachers");
        return;
      }
      toast.success("Teachers synced");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Employees</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={isPending}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Sync Teachers
          </Button>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Add Staff
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {employees.length === 0 && (
          <p className="text-sm text-muted-foreground">No employees yet — add staff or sync teachers.</p>
        )}
        {employees.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{e.name}</span>
              <Badge variant={e.employeeType === "teacher" ? "default" : "secondary"}>{e.designation}</Badge>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>Rs. {(e.basicSalary + e.allowances).toLocaleString()}/mo</span>
              <Button size="icon-sm" variant="ghost" onClick={() => handleEdit(e)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editTarget={editTarget}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
