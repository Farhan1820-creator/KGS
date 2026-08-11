"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { expenseSchema, ExpenseFormValues } from "./expense-validation";
import { createExpense, updateExpense } from "./expense-actions";
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
import type { ExpenseCategory, ExpenseSubCategory } from "./category-dialog";

export interface ExpenseEditTarget {
  id: number;
  categoryId: number;
  subCategoryId: number | null;
  title: string;
  amount: number;
  date: string;
  notes: string | null;
}

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ExpenseCategory[];
  subCategories: ExpenseSubCategory[];
  expense?: ExpenseEditTarget | null; // when set, dialog runs in edit mode
  onSaved: () => void;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

const emptyDefaults: ExpenseFormValues = {
  categoryId: "",
  subCategoryId: "",
  title: "",
  amount: 0,
  date: todayDate(),
  notes: "",
};

export function ExpenseDialog({ open, onOpenChange, categories, subCategories, expense, onSaved }: ExpenseDialogProps) {
  const isEdit = Boolean(expense);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;
    if (expense) {
      reset({
        categoryId: String(expense.categoryId),
        subCategoryId: expense.subCategoryId ? String(expense.subCategoryId) : "",
        title: expense.title,
        amount: expense.amount,
        date: expense.date,
        notes: expense.notes ?? "",
      });
    } else {
      reset(emptyDefaults);
    }
  }, [open, expense, reset]);

  const categoryId = watch("categoryId");
  const availableSubCategories = useMemo(
    () => subCategories.filter((sc) => sc.categoryId === Number(categoryId)),
    [subCategories, categoryId]
  );

  async function onSubmit(values: ExpenseFormValues) {
    const res = isEdit && expense ? await updateExpense(expense.id, values) : await createExpense(values);

    if (!res.success) {
      Object.entries(res.errors ?? {}).forEach(([key, msgs]) => {
        setError(key as keyof ExpenseFormValues, { message: (msgs as string[] | undefined)?.[0] });
      });
      toast.error(res.errors?.root?.[0] ?? "Please fix the errors and try again");
      return;
    }

    toast.success(isEdit ? "Expense updated" : "Expense added");
    reset(emptyDefaults);
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Expense" : "Add Expense"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g. Electricity bill — March" {...register("title")} />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Category</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v: string | null) => {
  field.onChange(v);
  setValue("subCategoryId", "");
}}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Sub-category (optional)</Label>
            <Controller
              control={control}
              name="subCategoryId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!categoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder={categoryId ? "Select sub-category" : "Select a category first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubCategories.map((sc) => (
                      <SelectItem key={sc.id} value={String(sc.id)}>
                        {sc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="amount">Amount (Rs.)</Label>
            <Input id="amount" type="number" placeholder="e.g. 5000" {...register("amount")} />
            {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register("date")} />
            {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" placeholder="Any additional details" {...register("notes")} />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (isEdit ? "Saving..." : "Adding...") : isEdit ? "Save Changes" : "Add Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
