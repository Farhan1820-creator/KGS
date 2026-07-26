"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { studentSchema, StudentFormValues } from "@/lib/validations/student";
import { createStudent } from "@/actions/student-actions";
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

interface StudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: { id: number; name: string }[];
  onCreated: () => void;
}

export function StudentDialog({ open, onOpenChange, classes, onCreated }: StudentDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({ resolver: zodResolver(studentSchema) });

  async function onSubmit(values: StudentFormValues) {
    const res = await createStudent(values);

    if (!res.success) {
      // map server-side field errors onto the form, and toast a summary
      Object.entries(res.errors ?? {}).forEach(([key, msgs]) => {
        setError(key as keyof StudentFormValues, { message: msgs?.[0] });
      });
      toast.error(res.errors?.root?.[0] ?? "Please fix the errors and try again");
      return;
    }

    toast.success("Student created");
    reset();
    onOpenChange(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="e.g. Ali Raza" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

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
                <Select onValueChange={field.onChange} value={field.value}>
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

          <div className="space-y-1">
            <Label htmlFor="rollNumber">Roll number</Label>
            <Input id="rollNumber" placeholder="e.g. 2026-STD-014" {...register("rollNumber")} />
            {errors.rollNumber && <p className="text-sm text-red-500">{errors.rollNumber.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Student"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
