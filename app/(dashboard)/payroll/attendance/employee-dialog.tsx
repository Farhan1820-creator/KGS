"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createStaffEmployee, updateEmployeeSettings } from "./attendance-actions";

export type EmployeeEditTarget = {
  id: number;
  designation: string;
  shiftHours: number;
  basicSalary: number;
  allowances: number;
};

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTarget: EmployeeEditTarget | null; // null = "add new staff" mode
  onSaved: () => void;
}

const emptyForm = { name: "", email: "", password: "", contactNumber: "", designation: "", shiftHours: "8", basicSalary: "", allowances: "0" };

export function EmployeeDialog({ open, onOpenChange, editTarget, onSaved }: EmployeeDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const isEdit = !!editTarget;

  useEffect(() => {
    if (editTarget) {
      setForm({
        name: "",
        email: "",
        password: "",
        contactNumber: "",
        designation: editTarget.designation,
        shiftHours: String(editTarget.shiftHours),
        basicSalary: String(editTarget.basicSalary),
        allowances: String(editTarget.allowances),
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [editTarget, open]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    setErrors({});
    startTransition(async () => {
      const result = isEdit
        ? await updateEmployeeSettings(editTarget!.id, {
            designation: form.designation,
            shiftHours: form.shiftHours,
            basicSalary: form.basicSalary,
            allowances: form.allowances,
          })
        : await createStaffEmployee(form);

      if (!result.success) {
        setErrors(result.errors as Record<string, string[]>);
        return;
      }
      toast.success(isEdit ? "Employee updated" : "Staff member added");
      onSaved();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Employee" : "Add Staff Member"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
          {!isEdit && (
            <>
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
                {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                {errors.email && <p className="text-sm text-destructive">{errors.email[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} />
                {errors.password && <p className="text-sm text-destructive">{errors.password[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Contact Number</Label>
                <Input value={form.contactNumber} onChange={(e) => set("contactNumber", e.target.value)} />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label>Designation</Label>
            <Input
              value={form.designation}
              onChange={(e) => set("designation", e.target.value)}
              placeholder="e.g. Peon, Accountant"
            />
            {errors.designation && <p className="text-sm text-destructive">{errors.designation[0]}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Shift Hours</Label>
              <Input type="number" value={form.shiftHours} onChange={(e) => set("shiftHours", e.target.value)} />
              {errors.shiftHours && <p className="text-sm text-destructive">{errors.shiftHours[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Basic Salary</Label>
              <Input type="number" value={form.basicSalary} onChange={(e) => set("basicSalary", e.target.value)} />
              {errors.basicSalary && <p className="text-sm text-destructive">{errors.basicSalary[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Allowances</Label>
              <Input type="number" value={form.allowances} onChange={(e) => set("allowances", e.target.value)} />
              {errors.allowances && <p className="text-sm text-destructive">{errors.allowances[0]}</p>}
            </div>
          </div>

          {errors.root && <p className="text-sm text-destructive">{errors.root[0]}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : isEdit ? "Save" : "Add Staff"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
