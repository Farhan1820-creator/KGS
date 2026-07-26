"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { classSchema, ClassFormValues } from "./class-validation";
import { createClass } from "./settings-actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function ClassDialog({ open, onOpenChange, onCreated }: ClassDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormValues>({ resolver: zodResolver(classSchema) });

  async function onSubmit(values: ClassFormValues) {
    const res = await createClass(values);

    if (!res.success) {
      Object.entries(res.errors ?? {}).forEach(([key, msgs]) => {
        setError(key as keyof ClassFormValues, { message: msgs?.[0] });
      });
      toast.error(res.errors?.root?.[0] ?? "Please fix the errors and try again");
      return;
    }

    toast.success("Class created");
    reset();
    onOpenChange(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Class</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Class name</Label>
            <Input id="name" placeholder="e.g. Grade 9" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="section">Section</Label>
            <Input id="section" placeholder="e.g. A" {...register("section")} />
            {errors.section && <p className="text-sm text-red-500">{errors.section.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Class"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
