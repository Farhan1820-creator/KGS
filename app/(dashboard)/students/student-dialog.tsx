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

// One form handles both create and edit modes by swapping the resolver.
// This merged type is the union of all fields from both schemas so
// register("rollNumber") and register("email") are both valid.
type StudentAnyFormValues = StudentFormValues & Partial<StudentUpdateFormValues>;
import { createStudent, updateStudent, previewNextRollNumber } from "./student-actions";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { deleteCloudinaryImage } from "@/lib/cloudinary-server";
import { PhotoUploadSquare } from "@/components/layout/photo-upload-square";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StudentRow } from "./student-columns";

type DialogMode = "view" | "edit" | "create";

interface StudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: { id: number; name: string }[];
  feeStructures?: { classId: number; amount: number }[];
  onSaved: () => void;
  student?: StudentRow | null; // null => create mode
  mode?: "view" | "edit"; // initial mode when `student` is set; ignored for create
}

function todayDate(): string {
  // Use PKR timezone to match the rest of the app
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
}

const emptyDefaults: StudentFormValues = {
  name: "",
  email: "",
  password: "",
  contactNumber: "",
  classId: "",
  fee: "",
  admissionDate: todayDate(),
  photoUrl: "",
  schoolName: "",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}

// One dialog for viewing, editing, and creating a student. Opens in "view"
// mode (a read-only summary) with an Edit button that switches the same
// dialog into the form — no separate detail dialog to keep in sync.
export function StudentDialog({
  open,
  onOpenChange,
  classes,
  feeStructures = [],
  onSaved,
  student,
  mode: initialMode = "view",
}: StudentDialogProps) {
  const isCreate = !student;
  const [mode, setMode] = useState<DialogMode>(isCreate ? "create" : initialMode);
  const isFormMode = mode !== "view";

  const structureMap = new Map(feeStructures.map((s) => [s.classId, s.amount]));
  const [rollPreview, setRollPreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [removingPhoto, setRemovingPhoto] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StudentAnyFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver((isCreate ? studentSchema : studentUpdateSchema) as any) as Resolver<StudentAnyFormValues>,
    defaultValues: emptyDefaults as StudentAnyFormValues,
  });

  // Reset mode + form whenever the dialog opens for a (possibly different) student.
  useEffect(() => {
    if (!open) return;
    setMode(isCreate ? "create" : initialMode);
    if (student) {
      reset({
        name: student.name,
        email: "",
        password: "",
        contactNumber: student.contactNumber ?? "",
        classId: student.classId ? String(student.classId) : "",
        rollNumber: student.rollNumber ?? "",
        fee: student.fee ? String(student.fee) : "",
        admissionDate: student.admissionDate ?? todayDate(),
        photoUrl: student.photoUrl ?? "",
        schoolName: student.schoolName ?? "",
      });
      setPhotoPreview(student.photoUrl ?? null);
    } else {
      reset(emptyDefaults);
      setPhotoPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, student, initialMode]);

  // Show a live preview of the roll number a new student will get — the
  // actual number is only reserved server-side at submit time.
  useEffect(() => {
    if (!open || mode !== "create") {
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
  }, [open, mode]);

  const feeTouched = watch("fee");

  // Nice-to-have: when creating a new student and a class is picked, prefill
  // the fee with that class's default so the admin only overrides when needed.
  function handleClassChange(value: string | null, onChange: (v: string) => void) {
    const v = value ?? "";
    onChange(v);
    if (mode === "create" && !feeTouched) {
      const def = structureMap.get(Number(v));
      if (def) setValue("fee", String(def));
    }
  }

  async function handlePhotoChange(file: File) {
    setUploadingPhoto(true);
    setUploadProgress(0);
    try {
      const result = await uploadImageToCloudinary(file, { onProgress: setUploadProgress });
      setValue("photoUrl", result.url, { shouldDirty: true });
      setPhotoPreview(result.url);
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Photo upload failed. Try again.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  // Deletes the photo from Cloudinary right away (rather than waiting for
  // form submit) so an admin who removes-then-cancels doesn't leave orphaned
  // images, and so a removed photo can't accidentally linger if they never
  // touch the field again before saving.
  async function handlePhotoRemove() {
    const currentUrl = photoPreview;
    setRemovingPhoto(true);
    try {
      const result = await deleteCloudinaryImage(currentUrl);
      if (!result.success) {
        toast.error("Could not remove photo. Try again.");
        return;
      }
      setValue("photoUrl", "", { shouldDirty: true });
      setPhotoPreview(null);
      toast.success("Photo removed");
    } finally {
      setRemovingPhoto(false);
    }
  }

  async function onSubmit(values: StudentAnyFormValues) {
    const res = mode === "edit" && student
      ? await updateStudent(student.id, values as unknown as StudentUpdateFormValues)
      : await createStudent(values as StudentFormValues);

    if (!res.success) {
      Object.entries(res.errors ?? {}).forEach(([key, msgs]) => {
        setError(key as keyof StudentAnyFormValues, { message: (msgs as string[] | undefined)?.[0] });
      });
      toast.error(res.errors?.root?.[0] ?? "Please fix the errors and try again");
      return;
    }

    toast.success(mode === "edit" ? "Student updated" : "Student created");
    reset(emptyDefaults);
    setPhotoPreview(null);
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl lg:max-w-3xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-8">
            <DialogTitle>
              {mode === "create" ? "Add Student" : mode === "edit" ? "Edit Student" : "Student Details"}
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
          {/* Photo — top-right on landscape screens, above the details on mobile */}
          <div className="order-1 flex justify-center sm:order-2 sm:justify-end">
            <PhotoUploadSquare
              photoUrl={isFormMode ? photoPreview : student?.photoUrl ?? null}
              name={student?.name}
              editable={isFormMode}
              uploading={uploadingPhoto}
              progress={uploadProgress}
              onFileSelected={handlePhotoChange}
              onRemove={handlePhotoRemove}
              removing={removingPhoto}
            />
          </div>

          <div className="order-2 sm:order-1">
            {mode === "view" && student ? (
              <div className="grid grid-cols-1 gap-4 py-1 text-sm sm:grid-cols-2">
                <Field label="Full Name" value={student.name} />
                <Field label="Roll Number" value={student.rollNumber ?? ""} />
                <Field label="Email" value={student.email} />
                <Field label="Contact Number" value={student.contactNumber ?? ""} />
                <Field label="Class" value={student.className ?? ""} />
                <Field label="School Name" value={student.schoolName ?? "Not specified"} />
                <Field label="Admission Date" value={student.admissionDate ?? ""} />
                <Field label="Monthly Fee" value={student.fee ? `Rs. ${student.fee.toLocaleString()}` : "Uses class fee"} />
                <div>
                  <p className="text-xs text-muted-foreground">Fee Status (overall)</p>
                  {student.feeStatus ? (
                    <Badge
                      className={
                        student.feeStatus === "paid"
                          ? "bg-green-600 hover:bg-green-600 text-white"
                          : student.feeStatus === "pending"
                            ? "bg-yellow-500 hover:bg-yellow-500 text-white"
                            : "bg-red-600 hover:bg-red-600 text-white"
                      }
                    >
                      {student.feeStatus === "paid" ? "Paid" : student.feeStatus === "pending" ? "Pending" : "Unpaid"}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not generated</span>
                  )}
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="max-h-[65vh] space-y-4 overflow-y-auto pr-1 sm:max-h-[60vh]"
              >
                <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" placeholder="e.g. Ali Raza" {...register("name")} />
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                  </div>

                  {mode === "create" && (
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
                        <Select value={field.value} onValueChange={(v: string | null) => handleClassChange(v, field.onChange)}>
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

                  {mode === "edit" ? (
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
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="admissionDate">Admission date</Label>
                    <Input id="admissionDate" type="date" {...register("admissionDate")} />
                    {errors.admissionDate && <p className="text-sm text-red-500">{errors.admissionDate.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="schoolName">School name</Label>
                    <Input id="schoolName" placeholder="e.g. Beaconhouse" {...register("schoolName")} />
                    {errors.schoolName && <p className="text-sm text-red-500">{errors.schoolName.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="fee">Monthly fee (Rs.)</Label>
                    <Input id="fee" type="number" placeholder="Leave blank to use class fee" {...register("fee")} />
                    {errors.fee && <p className="text-sm text-red-500">{errors.fee.message}</p>}
                  </div>

                  <p className="text-xs text-muted-foreground sm:col-span-2 sm:-mt-2">
                    Fee optional — if left blank, this student uses their class&apos;s fee structure amount.
                    {mode === "create" && " Roll number is auto-assigned when the student is created."}
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  {mode === "edit" && (
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setMode("view")}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" className="flex-1" disabled={isSubmitting || uploadingPhoto || removingPhoto}>
                    {isSubmitting ? (mode === "edit" ? "Saving..." : "Creating...") : mode === "edit" ? "Save Changes" : "Create Student"}
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