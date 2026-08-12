"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  teacherSchema,
  teacherUpdateSchema,
  TeacherFormValues,
  TeacherUpdateFormValues,
} from "./teacher-validation";
import { createTeacher, updateTeacher, previewNextTeacherId } from "./teacher-actions";
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

// Editing a teacher we already have on hand — id plus the fields the form
// needs to pre-fill. Email/password aren't edited here.
export interface TeacherEditTarget {
  id: number;
  name: string;
  contactNumber: string | null;
  subjectId: number | null;
  teacherId: string | null;
}

interface TeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: { id: number; name: string }[];
  onSaved: () => void;
  teacher?: TeacherEditTarget | null; // when set, dialog runs in edit mode
}

const emptyDefaults: TeacherFormValues = {
  name: "",
  email: "",
  password: "",
  contactNumber: "",
  subjectId: "",
};

export function TeacherDialog({ open, onOpenChange, subjects, onSaved, teacher }: TeacherDialogProps) {
  const isEdit = Boolean(teacher);
  const [idPreview, setIdPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(isEdit ? teacherUpdateSchema : teacherSchema) as unknown as Resolver<TeacherFormValues>,
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;
    if (teacher) {
      reset({
        name: teacher.name,
        email: "",
        password: "",
        contactNumber: teacher.contactNumber ?? "",
        subjectId: teacher.subjectId ? String(teacher.subjectId) : "",
        // carried through to updateTeacher via the update schema's teacherId field
        teacherId: teacher.teacherId ?? "",
      } as unknown as TeacherFormValues);
    } else {
      reset(emptyDefaults);
    }
  }, [open, teacher, reset]);

  // Show a live preview of the teacher ID a new teacher will get — the
  // actual ID is only reserved server-side at submit time.
  useEffect(() => {
    if (!open || isEdit) {
      setIdPreview(null);
      return;
    }
    let cancelled = false;
    previewNextTeacherId().then((code) => {
      if (!cancelled) setIdPreview(code);
    });
    return () => {
      cancelled = true;
    };
  }, [open, isEdit]);

  async function onSubmit(values: TeacherFormValues) {
    const res = isEdit && teacher
      ? await updateTeacher(teacher.id, values as unknown as TeacherUpdateFormValues)
      : await createTeacher(values);

    if (!res.success) {
      Object.entries(res.errors ?? {}).forEach(([key, msgs]) => {
        setError(key as keyof TeacherFormValues, { message: (msgs as string[] | undefined)?.[0] });
      });
      toast.error(res.errors?.root?.[0] ?? "Please fix the errors and try again");
      return;
    }

    toast.success(isEdit ? "Teacher updated" : "Teacher created");
    reset(emptyDefaults);
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Teacher" : "Add Teacher"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-1">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="e.g. Sara Khan" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          {!isEdit && (
            <>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="teacher@example.com" {...register("email")} />
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
            <Label>Subject</Label>
            <Controller
              control={control}
              name="subjectId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.subjectId && <p className="text-sm text-red-500">{errors.subjectId.message}</p>}
          </div>

          {isEdit ? (
            <div className="space-y-1">
              <Label htmlFor="teacherId">Teacher ID</Label>
              <Input id="teacherId" placeholder="e.g. 2026-TCH-007" {...register("teacherId")} />
              {errors.teacherId && <p className="text-sm text-red-500">{errors.teacherId.message}</p>}
            </div>
          ) : (
            <div className="space-y-1">
              <Label>Teacher ID</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground">
                {idPreview ?? "Generating..."}
              </div>
              <p className="text-xs text-muted-foreground">
                Auto-assigned when the teacher is created — not editable here.
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save Changes" : "Create Teacher"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
