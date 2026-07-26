"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { teacherSchema, TeacherFormValues } from "./teacher-validation";
import { createTeacher } from "./teacher-actions";
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

interface TeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: { id: number; name: string }[];
  onCreated: () => void;
}

export function TeacherDialog({ open, onOpenChange, subjects, onCreated }: TeacherDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { name: "", email: "", password: "", contactNumber: "", subjectId: "" },
  });

  async function onSubmit(values: TeacherFormValues) {
    const res = await createTeacher(values);

    if (!res.success) {
      Object.entries(res.errors ?? {}).forEach(([key, msgs]) => {
        setError(key as keyof TeacherFormValues, { message: msgs?.[0] });
      });
      toast.error(res.errors?.root?.[0] ?? "Please fix the errors and try again");
      return;
    }

    toast.success("Teacher created");
    reset();
    onOpenChange(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Teacher</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="e.g. Sara Khan" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Teacher"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
