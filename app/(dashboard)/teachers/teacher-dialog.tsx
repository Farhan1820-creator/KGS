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
type TeacherAnyFormValues = TeacherFormValues & Partial<TeacherUpdateFormValues>;

import { createTeacher, updateTeacher, previewNextTeacherId } from "./teacher-actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Check, X, Eye, EyeOff } from "lucide-react";
import type { TeacherRow } from "./teacher-columns";
import { PhotoUploadSquare } from "@/components/layout/photo-upload-square";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { deleteCloudinaryImage } from "@/lib/cloudinary-server";

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
  subjectIds: [],
  joinDate: todayDate(),
  photoUrl: "",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}

export function TeacherDialog({ open, onOpenChange, subjects, onSaved, teacher, mode: initialMode = "view" }: TeacherDialogProps) {
  const isCreate = !teacher;
  const [mode, setMode] = useState<DialogMode>(isCreate ? "create" : initialMode);
  const [idPreview, setIdPreview] = useState<string | null>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showViewPassword, setShowViewPassword] = useState(false);

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
    setShowPassword(false);
    setShowViewPassword(false);
    if (teacher) {
      reset({
        name: teacher.name,
        email: teacher.email || "",
        password: teacher.password || "",
        contactNumber: teacher.contactNumber ?? "",
        subjectIds: teacher.subjectIds ?? [],
        teacherId: teacher.teacherId ?? "",
        joinDate: teacher.joinDate ?? todayDate(),
        photoUrl: teacher.photoUrl ?? "",
      });
      setPhotoPreview(teacher.photoUrl ?? null);
    } else {
      reset(emptyDefaults);
      setPhotoPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, teacher, initialMode]);

  // Show a live preview of the teacher ID a new teacher will get
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

  async function onSubmit(values: TeacherAnyFormValues) {
    const res = mode === "edit" && teacher
      ? await updateTeacher(teacher.id, values as unknown as TeacherUpdateFormValues)
      : await createTeacher(values as TeacherFormValues);

    if (!res.success) {
      const errMap = res.errors as Record<string, string[] | undefined> | undefined;
      Object.entries(res.errors ?? {}).forEach(([key, msgs]) => {
        setError(key as keyof TeacherAnyFormValues, { message: (msgs as string[] | undefined)?.[0] });
      });
      const errorMsg = errMap?.email?.[0] || errMap?.teacherId?.[0] || errMap?.root?.[0] || "Please fix the errors and try again";
      toast.error(errorMsg);
      return;
    }

    toast.success(mode === "edit" ? "Teacher updated" : "Teacher created");
    reset(emptyDefaults);
    onOpenChange(false);
    onSaved();
  }

  const isFormMode = mode === "create" || mode === "edit";

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
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_132px] sm:gap-8">
          {/* Photo Slot */}
          <div className="order-1 flex justify-center sm:order-2 sm:justify-end">
            <PhotoUploadSquare
              photoUrl={isFormMode ? photoPreview : teacher?.photoUrl ?? null}
              name={watch("name") || teacher?.name}
              editable={isFormMode}
              uploading={uploadingPhoto}
              progress={uploadProgress}
              onFileSelected={handlePhotoChange}
              onRemove={photoPreview ? handlePhotoRemove : undefined}
              removing={removingPhoto}
              size={132}
            />
          </div>

          <div className="order-2 sm:order-1">
            {mode === "view" && teacher ? (
              <div className="grid grid-cols-1 gap-4 py-1 text-sm sm:grid-cols-2">
                <Field label="Full Name" value={teacher.name} />
                <Field label="Teacher ID" value={teacher.teacherId ?? ""} />
                <Field label="Email" value={teacher.email} />
                <div>
                  <p className="text-xs text-muted-foreground">Password</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="font-medium font-mono text-sm">
                      {showViewPassword ? (teacher.password || "—") : (teacher.password ? "••••••••" : "—")}
                    </p>
                    {teacher.password && (
                      <button
                        type="button"
                        onClick={() => setShowViewPassword(!showViewPassword)}
                        className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                        title={showViewPassword ? "Hide password" : "Show password"}
                      >
                        {showViewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>
                </div>
                <Field label="Contact Number" value={teacher.contactNumber ?? ""} />
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Assigned Subject(s)</p>
                  {teacher.subjectNames && teacher.subjectNames.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {teacher.subjectNames.map((name) => (
                        <Badge key={name} variant="secondary" className="font-normal text-xs py-0.5 px-2">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="font-medium text-muted-foreground">—</p>
                  )}
                </div>
                <Field label="Join Date" value={teacher.joinDate ?? ""} />
              </div>
            ) : (
              <form
                autoComplete="off"
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
                      <Input id="email" type="email" autoComplete="off" data-lpignore="true" placeholder="teacher@example.com" {...register("email")} />
                    )}
                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        data-lpignore="true"
                        placeholder="Min. 6 characters"
                        className="pr-10"
                        {...register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="contactNumber">Contact number</Label>
                    <Input id="contactNumber" placeholder="e.g. +92 300 1234567" {...register("contactNumber")} />
                    {errors.contactNumber && <p className="text-sm text-red-500">{errors.contactNumber.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="joinDate">Join date</Label>
                    <Input id="joinDate" type="date" {...register("joinDate")} />
                    {errors.joinDate && <p className="text-sm text-red-500">{errors.joinDate.message}</p>}
                  </div>

                  {/* Multi-select Subject Field (Optional) */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Assigned Subject(s) <span className="text-muted-foreground text-xs font-normal">(Optional)</span></Label>
                    <Controller
                      control={control}
                      name="subjectIds"
                      render={({ field }) => {
                        const selectedIds: number[] = Array.isArray(field.value) ? field.value : [];
                        const toggleSubject = (id: number) => {
                          if (selectedIds.includes(id)) {
                            field.onChange(selectedIds.filter((x) => x !== id));
                          } else {
                            field.onChange([...selectedIds, id]);
                          }
                        };

                        return (
                          <div className="space-y-2">
                            {/* Selected Chips */}
                            <div className="flex flex-wrap gap-1.5 p-2 rounded-md border min-h-[42px] bg-background items-center">
                              {selectedIds.length === 0 ? (
                                <span className="text-xs text-muted-foreground">No subjects selected (Optional)</span>
                              ) : (
                                selectedIds.map((sId) => {
                                  const sub = subjects.find((s) => s.id === sId);
                                  if (!sub) return null;
                                  return (
                                    <Badge
                                      key={sub.id}
                                      variant="secondary"
                                      className="gap-1 pl-2.5 pr-1 py-1 text-xs font-medium"
                                    >
                                      {sub.name}
                                      <button
                                        type="button"
                                        onClick={() => toggleSubject(sub.id)}
                                        className="rounded-full hover:bg-muted p-0.5"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  );
                                })
                              )}
                            </div>

                            {/* Options Grid */}
                            <div className="border rounded-lg p-2.5 bg-muted/20 max-h-36 overflow-y-auto space-y-1">
                              <p className="text-xs font-medium text-muted-foreground mb-1.5 px-1">Click to add/remove subjects:</p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                {subjects.map((sub) => {
                                  const isChecked = selectedIds.includes(sub.id);
                                  return (
                                    <button
                                      key={sub.id}
                                      type="button"
                                      onClick={() => toggleSubject(sub.id)}
                                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors text-left ${
                                        isChecked
                                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                          : "bg-background text-foreground border-border hover:bg-muted"
                                      }`}
                                    >
                                      <span className="truncate">{sub.name}</span>
                                      {isChecked && <Check className="h-3.5 w-3.5 ml-1 shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                  </div>

                  {mode === "edit" ? (
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="teacherId">Teacher ID</Label>
                      <Input id="teacherId" placeholder="e.g. 2026-TCH-007" {...register("teacherId")} />
                      {errors.teacherId && <p className="text-sm text-red-500">{errors.teacherId.message}</p>}
                    </div>
                  ) : (
                    <div className="space-y-1 sm:col-span-2">
                      <Label>Teacher ID</Label>
                      <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground">
                        {idPreview ?? "Generating..."}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Teacher ID is auto-assigned when created — not editable here.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
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
