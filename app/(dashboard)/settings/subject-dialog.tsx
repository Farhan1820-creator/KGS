"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { subjectSchema, SubjectFormValues } from "./subject-validation";
import { createSubject } from "./settings-actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function SubjectDialog({ open, onOpenChange, onCreated }: SubjectDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SubjectFormValues>({ resolver: zodResolver(subjectSchema) });

  async function onSubmit(values: SubjectFormValues) {
    const res = await createSubject(values);

    if (!res.success) {
      Object.entries(res.errors ?? {}).forEach(([key, msgs]) => {
        setError(key as keyof SubjectFormValues, { message: msgs?.[0] });
      });
      toast.error(res.errors?.root?.[0] ?? "Please fix the errors and try again");
      return;
    }

    toast.success("Subject created");
    reset();
    onOpenChange(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Subject</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Subject name</Label>
            <Input id="name" placeholder="e.g. Mathematics" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="code">Code</Label>
            <Input id="code" placeholder="e.g. MATH101" {...register("code")} />
            {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Subject"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
