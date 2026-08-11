"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  createSubCategory,
  deleteSubCategory,
} from "./expense-actions";

export interface ExpenseCategory {
  id: number;
  name: string;
}

export interface ExpenseSubCategory {
  id: number;
  categoryId: number;
  name: string;
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ExpenseCategory[];
  subCategories: ExpenseSubCategory[];
  onSaved: () => void;
}

export function CategoryDialog({ open, onOpenChange, categories, subCategories, onSaved }: CategoryDialogProps) {
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [subCategoryId, setSubCategoryId] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [subCategoryError, setSubCategoryError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  function handleAddCategory() {
    setCategoryError(null);
    startTransition(async () => {
      const result = await createCategory({ name: categoryName });
      if (!result.success) {
        setCategoryError(result.errors.name?.[0] ?? result.errors.root?.[0] ?? "Something went wrong");
        return;
      }
      toast.success("Category added");
      setCategoryName("");
      onSaved();
    });
  }

  function handleDeleteCategory(id: number) {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (!result.success) {
        toast.error(result.errors.root?.[0] ?? "Could not delete category");
        return;
      }
      toast.success("Category deleted");
      onSaved();
    });
  }

  function handleAddSubCategory() {
    setSubCategoryError(null);
    startTransition(async () => {
      const result = await createSubCategory({ categoryId: subCategoryId, name: subCategoryName });
      if (!result.success) {
        setSubCategoryError(result.errors.name?.[0] ?? result.errors.categoryId?.[0] ?? result.errors.root?.[0] ?? "Something went wrong");
        return;
      }
      toast.success("Sub-category added");
      setSubCategoryName("");
      onSaved();
    });
  }

  function handleDeleteSubCategory(id: number) {
    startTransition(async () => {
      const result = await deleteSubCategory(id);
      if (!result.success) {
        toast.error(result.errors.root?.[0] ?? "Could not delete sub-category");
        return;
      }
      toast.success("Sub-category deleted");
      onSaved();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="categories">
          <TabsList>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="subcategories">Sub-categories</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4 pt-2">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label>New category</Label>
                <Input
                  placeholder="e.g. Utilities"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
                {categoryError && <p className="text-sm text-destructive">{categoryError}</p>}
              </div>
              <Button onClick={handleAddCategory} disabled={isPending || !categoryName}>
                Add
              </Button>
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto">
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground">No categories yet.</p>
              )}
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-sm">{c.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => handleDeleteCategory(c.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="subcategories" className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={subCategoryId} onValueChange={(value) => setSubCategoryId(value ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label>New sub-category</Label>
                <Input
                  placeholder="e.g. Electricity Bill"
                  value={subCategoryName}
                  onChange={(e) => setSubCategoryName(e.target.value)}
                />
                {subCategoryError && <p className="text-sm text-destructive">{subCategoryError}</p>}
              </div>
              <Button onClick={handleAddSubCategory} disabled={isPending || !subCategoryId || !subCategoryName}>
                Add
              </Button>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto">
              {subCategories
                .filter((sc) => !subCategoryId || sc.categoryId === Number(subCategoryId))
                .map((sc) => {
                  const parent = categories.find((c) => c.id === sc.categoryId);
                  return (
                    <div key={sc.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span className="text-sm">
                        {sc.name}
                        {!subCategoryId && <span className="text-muted-foreground"> — {parent?.name}</span>}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleDeleteSubCategory(sc.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
