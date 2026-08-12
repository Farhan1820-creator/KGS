"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  studentSchema,
  studentUpdateSchema,
  StudentFormValues,
  StudentUpdateFormValues,
} from "./student-validation";
import { createStudent, updateStudent, previewNextRollNumber } from "./student-actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Editing a student we already have on hand — id plus the fields the form
// needs to pre-fill. Email/password aren't edited here.
export interface StudentEditTarget {
  id: number;
  name: string;
  contactNumber: string | null;
  classId: number | null;
  rollNumber: string | null;
  fee: number | null;
}

interface StudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: { id: number; name: string }[];
  feeStructures?: { classId: number; amount: number }[];
  onSaved: () => void;
  student?: StudentEditTarget | null; // when set, dialog runs in edit mode
}

const emptyDefaults: StudentFormValues = {
  name: "",
  email: "",
  password: "",
  contactNumber: "",
  classId: "",
  rollNumber: "",
  fee: "",
};

export function StudentDialog({ open, onOpenChange, classes, feeStructures = [], onSaved, student }: StudentDialogProps) {
  const isEdit = Boolean(student);
  const structureMap = new Map(feeStructures.map((s) => [s.classId, s.amount]));
  const [rollPreview, setRollPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(isEdit ? studentUpdateSchema : studentSchema) as unknown as Resolver<StudentFormValues>,
    defaultValues: emptyDefaults,
  });

  // Reset the form whenever the dialog opens — either blank for create,
  // or pre-filled for editing the selected student.
  useEffect(() => {
    if (!open) return;
    if (student) {
      reset({
        name: student.name,
        email: "",
        password: "",
        contactNumber: student.contactNumber ?? "",
        classId: student.classId ? String(student.classId) : "",
        rollNumber: student.rollNumber ?? "",
        fee: student.fee ? String(student.fee) : "",
      });
    } else {
      reset(emptyDefaults);
    }
  }, [open, student, reset]);

  // Show a live preview of the roll number a new student will get — the
  // actual number is only reserved server-side at submit time.
  useEffect(() => {
    if (!open || isEdit) {
      setRollPreview(null);
      return;
    }
    let cancelled = false;
    previewNextRollNumber().then((code) => {
      if (!cancelled) setRollPreview(code);
    });
    return () => {
      cancelled = true;
    };
  }, [open, isEdit]);

  const feeTouched = watch("fee");

  // Nice-to-have: when creating a new student and a class is picked, prefill
  // the fee with that class's default so the admin only overrides when needed.
  function handleClassChange(value: string | null, onChange: (v: string) => void) {
    const v = value ?? "";
    onChange(v);
    if (!isEdit && !feeTouched) {
      const def = structureMap.get(Number(v));
      if (def) setValue("fee", String(def));
    }
  }

  async function onSubmit(values: StudentFormValues) {
    const res = isEdit && student
      ? await updateStudent(student.id, values as unknown as StudentUpdateFormValues)
      : await createStudent(values);

    if (!res.success) {
      Object.entries(res.errors ?? {}).forEach(([key, msgs]) => {
        setError(key as keyof StudentFormValues, { message: (msgs as string[] | undefined)?.[0] });
      });
      toast.error(res.errors?.root?.[0] ?? "Please fix the errors and try again");
      return;
    }

    toast.success(isEdit ? "Student updated" : "Student created");
    reset(emptyDefaults);
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Student" : "Add Student"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-1">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="e.g. Ali Raza" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          {!isEdit && (
            <>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="student@example.com" {...register("email")} />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Min. 8 characters" {...register("password")} />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>
            </>
          )}

          <div className="space-y-1">
            <Label htmlFor="contactNumber">Contact number</Label>
            <Input id="contactNumber" placeholder="e.g. +92 300 1234567" {...register("contactNumber")} />
            {errors.contactNumber && <p className="text-sm text-red-500">{errors.contactNumber.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Class</Label>
            <Controller
              control={control}
              name="classId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v:string | null) => handleClassChange(v, field.onChange)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.classId && <p className="text-sm text-red-500">{errors.classId.message}</p>}
          </div>

          {isEdit ? (
            <div className="space-y-1">
              <Label htmlFor="rollNumber">Roll number</Label>
              <Input id="rollNumber" placeholder="e.g. 2026-STD-014" {...register("rollNumber")} />
              {errors.rollNumber && <p className="text-sm text-red-500">{errors.rollNumber.message}</p>}
            </div>
          ) : (
            <div className="space-y-1">
              <Label>Roll number</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground">
                {rollPreview ?? "Generating..."}
              </div>
              <p className="text-xs text-muted-foreground">
                Auto-assigned when the student is created — not editable here.
              </p>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="fee">Monthly fee (Rs.)</Label>
            <Input id="fee" type="number" placeholder="Leave blank to use class fee" {...register("fee")} />
            <p className="text-xs text-muted-foreground">
              Optional — if left blank, this student uses their class&apos;s fee structure amount.
            </p>
            {errors.fee && <p className="text-sm text-red-500">{errors.fee.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save Changes" : "Create Student"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}