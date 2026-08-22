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

// One form handles both create and edit modes by swapping the resolver.
// Merged type is the union of all fields from both schemas so register("teacherId") is valid.
type TeacherAnyFormValues = TeacherFormValues & Partial<TeacherUpdateFormValues>;

import { createTeacher, updateTeacher, previewNextTeacherId } from "./teacher-actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TeacherRow } from "./teacher-columns";

type DialogMode = "view" | "edit" | "create";

interface TeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: { id: number; name: string }[];
  onSaved: () => void;
  teacher?: TeacherRow | null; // null => create mode
  mode?: "view" | "edit"; // initial mode when `teacher` is set; ignored for create
}

function todayDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
}

const emptyDefaults: TeacherAnyFormValues = {
  teacherId: "",
  name: "",
  email: "",
  password: "",
  contactNumber: "",
  subjectId: "",
  joinDate: todayDate(),
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

// One dialog for viewing, editing, and creating a teacher. Opens in "view"
// mode (a read-only summary) with an Edit button that switches the same
// dialog into the form — no separate detail dialog to keep in sync.
export function TeacherDialog({ open, onOpenChange, subjects, onSaved, teacher, mode: initialMode = "view" }: TeacherDialogProps) {
  const isCreate = !teacher;
  const [mode, setMode] = useState<DialogMode>(isCreate ? "create" : initialMode);
  const isFormMode = mode !== "view";
  const [idPreview, setIdPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TeacherAnyFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver((isCreate ? teacherSchema : teacherUpdateSchema) as any) as Resolver<TeacherAnyFormValues>,
    defaultValues: emptyDefaults as TeacherAnyFormValues,
  });

  const nameVal = watch("name");
  const contactVal = watch("contactNumber");

  // Auto-generate email and password in create mode
  useEffect(() => {
    if (mode === "create") {
      const prefix = (nameVal || "").toLowerCase().replace(/\s+/g, "");
      setValue("email", prefix ? `${prefix}@teacher.learnex` : "", { shouldValidate: !!prefix });
    }
  }, [nameVal, mode, setValue]);

  useEffect(() => {
    if (mode === "create") {
      setValue("password", contactVal || "", { shouldValidate: !!contactVal });
    }
  }, [contactVal, mode, setValue]);

  useEffect(() => {
    if (!open) return;
    setMode(isCreate ? "create" : initialMode);
    if (teacher) {
      reset({
        name: teacher.name,
        email: teacher.email || "",
        password: "",
        contactNumber: teacher.contactNumber ?? "",
        subjectId: teacher.subjectId ? String(teacher.subjectId) : "",
        // carried through to updateTeacher via the update schema's teacherId field
        teacherId: teacher.teacherId ?? "",
        joinDate: teacher.joinDate ?? todayDate(),
      });
    } else {
      reset(emptyDefaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, teacher, initialMode]);

  // Show a live preview of the teacher ID a new teacher will get — the
  // actual ID is only reserved server-side at submit time.
  useEffect(() => {
    if (!open || mode !== "create") {
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
  }, [open, mode]);

  async function onSubmit(values: TeacherAnyFormValues) {
    const res = mode === "edit" && teacher
      ? await updateTeacher(teacher.id, values as unknown as TeacherUpdateFormValues)
      : await createTeacher(values as TeacherFormValues);

    if (!res.success) {
      Object.entries(res.errors ?? {}).forEach(([key, msgs]) => {
        setError(key as keyof TeacherAnyFormValues, { message: (msgs as string[] | undefined)?.[0] });
      });
      toast.error(res.errors?.root?.[0] ?? "Please fix the errors and try again");
      return;
    }

    toast.success(mode === "edit" ? "Teacher updated" : "Teacher created");
    reset(emptyDefaults);
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl lg:max-w-3xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-8">
            <DialogTitle>
              {mode === "create" ? "Add Teacher" : mode === "edit" ? "Edit Teacher" : "Teacher Details"}
            </DialogTitle>
            {mode === "view" && (
              <Button type="button" size="sm" variant="outline" onClick={() => setMode("edit")}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_132px] sm:gap-8">
          {/* Initials avatar — top-right on landscape screens, matching the
              student dialog's photo slot even though teachers have no photo. */}
          <div className="order-1 flex justify-center sm:order-2 sm:justify-end">
            <div
              className="flex items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/40 text-2xl font-semibold text-muted-foreground/70"
              style={{ width: 132, height: 132 }}
            >
              {initialsOf(teacher?.name ?? "?")}
            </div>
          </div>

          <div className="order-2 sm:order-1">
            {mode === "view" && teacher ? (
              <div className="grid grid-cols-1 gap-4 py-1 text-sm sm:grid-cols-2">
                <Field label="Full Name" value={teacher.name} />
                <Field label="Teacher ID" value={teacher.teacherId ?? ""} />
                <Field label="Email" value={teacher.email} />
                <Field label="Contact Number" value={teacher.contactNumber ?? ""} />
                <Field label="Subject" value={teacher.subjectName ?? ""} />
                <Field label="Join Date" value={teacher.joinDate ?? ""} />
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="max-h-[65vh] space-y-4 overflow-y-auto pr-1 sm:max-h-[60vh]"
              >
                <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" placeholder="e.g. Sara Khan" {...register("name")} />
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                  </div>

                                                          <div className="space-y-1">
                      <Label htmlFor="email">Email</Label>
                      {mode === "create" ? (
                        <div className="flex items-center h-10">
                          <Input 
                            id="email"
                            type="text"
                            className="rounded-r-none h-full"
                            placeholder="teacher"
                            value={(watch("email") || "").replace("@teacher.learnex", "")}
                            onChange={(e) => setValue("email", e.target.value + "@teacher.learnex", { shouldValidate: true })}
                          />
                          <span className="inline-flex items-center justify-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground h-full whitespace-nowrap">
                            @teacher.learnex
                          </span>
                        </div>
                      ) : (
                        <Input id="email" type="email" placeholder="teacher@example.com" {...register("email")} />
                      )}
                      {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" placeholder={mode === "edit" ? "Leave blank to keep unchanged" : "Min. 8 characters"} {...register("password")} />
                      {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                    </div>

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

                  <div className="space-y-1">
                    <Label htmlFor="joinDate">Join date</Label>
                    <Input id="joinDate" type="date" {...register("joinDate")} />
                    {errors.joinDate && <p className="text-sm text-red-500">{errors.joinDate.message}</p>}
                  </div>

                  {mode === "edit" ? (
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
                    </div>
                  )}

                  {mode === "create" && (
                    <p className="text-xs text-muted-foreground sm:col-span-2 sm:-mt-2">
                      Teacher ID is auto-assigned when the teacher is created — not editable here.
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  {mode === "edit" && (
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setMode("view")}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (mode === "edit" ? "Saving..." : "Creating...") : mode === "edit" ? "Save Changes" : "Create Teacher"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
