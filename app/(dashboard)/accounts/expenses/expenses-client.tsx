"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/layout/data-table";
import { getExpenseColumns, ExpenseRow } from "./expense-columns";
import { ExpenseDialog, ExpenseEditTarget } from "./expense-dialog";
import { ExpenseDetailDialog } from "./expense-detail-dialog";
import { CategoryDialog, ExpenseCategory, ExpenseSubCategory } from "./category-dialog";
import { deleteExpense } from "./expense-actions";
import { currentMonth } from "./expense-range";
import { Settings2, Plus, X } from "lucide-react";

interface ExpensesClientProps {
  initialData: ExpenseRow[];
  categories: ExpenseCategory[];
  subCategories: ExpenseSubCategory[];
  from: string; // "YYYY-MM"
  to: string; // "YYYY-MM"
  categoryId?: string;
  subCategoryId?: string;
}

export function ExpensesClient({
  initialData,
  categories,
  subCategories,
  from,
  to,
  categoryId,
  subCategoryId,
}: ExpensesClientProps) {
  const router = useRouter();
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpenseEditTarget | null>(null);
  const [detailRow, setDetailRow] = useState<ExpenseRow | null>(null);
  const [search, setSearch] = useState("");
  const [, startTransition] = useTransition();

  function updateParams(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const next = {
      from,
      to,
      categoryId,
      subCategoryId,
      ...patch,
    };
    if (next.from) params.set("from", next.from);
    if (next.to) params.set("to", next.to);
    if (next.categoryId) params.set("categoryId", next.categoryId);
    if (next.subCategoryId) params.set("subCategoryId", next.subCategoryId);
    router.push(`/accounts/expenses?${params.toString()}`);
  }

  function handleFromChange(value: string) {
    updateParams({ from: value || undefined });
  }

  function handleToChange(value: string) {
    updateParams({ to: value || undefined });
  }

  function handleCategoryChange(value: string) {
    updateParams({
      categoryId: value === "all" ? undefined : value,
      subCategoryId: undefined, // reset subcategory on category change
    });
  }

  function handleSubCategoryChange(value: string) {
    updateParams({ subCategoryId: value === "all" ? undefined : value });
  }

  function clearFilters() {
    setSearch("");
    router.push(`/accounts/expenses?from=${currentMonth()}&to=${currentMonth()}`);
  }

  const visibleSubCategories = useMemo(
    () => subCategories.filter((sc) => !categoryId || sc.categoryId === Number(categoryId)),
    [subCategories, categoryId]
  );

  const filteredData = useMemo(() => {
    if (!search.trim()) return initialData;
    const q = search.trim().toLowerCase();
    return initialData.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        row.categoryName.toLowerCase().includes(q) ||
        (row.subCategoryName ?? "").toLowerCase().includes(q)
    );
  }, [initialData, search]);

  const totals = useMemo(() => {
    const totalAmount = filteredData.reduce((sum, e) => sum + e.amount, 0);
    return { totalAmount, total: filteredData.length };
  }, [filteredData]);

  function handleAdd() {
    setEditTarget(null);
    setExpenseDialogOpen(true);
  }

  function handleEdit(row: ExpenseRow) {
    setEditTarget({
      id: row.id,
      categoryId: row.categoryId,
      subCategoryId: row.subCategoryId,
      title: row.title,
      amount: row.amount,
      date: row.date,
      notes: row.notes,
    });
    setExpenseDialogOpen(true);
  }

  function handleDelete(row: ExpenseRow) {
    if (!confirm(`Delete "${row.title}"?`)) return;
    startTransition(async () => {
      const result = await deleteExpense(row.id);
      if (!result.success) {
        toast.error(result.errors.root?.[0] ?? "Could not delete expense");
        return;
      }
      toast.success("Expense deleted");
      router.refresh();
    });
  }

  const columns = getExpenseColumns({ onEdit: handleEdit, onDelete: handleDelete });

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(categoryId) ||
    Boolean(subCategoryId) ||
    from !== currentMonth() ||
    to !== currentMonth();

  return (
    <div className="page-shell space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setCategoryDialogOpen(true)} className="shadow-xs">
          <Settings2 className="h-4 w-4 mr-1.5" />
          Manage Categories
        </Button>
        <Button onClick={handleAdd} size="sm" className="shadow-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Expense
        </Button>
      </div>

      {/* Toolbar & Filters Card */}
      <div className="bg-card rounded-2xl shadow-sm border border-muted/50 p-4 sm:p-5 space-y-4">
        {/* Filters Controls Row */}
        <div className="flex flex-wrap items-end gap-3 sm:gap-3.5">
          {/* Month Range Filter */}
          <div className="space-y-1.5 w-full sm:w-auto">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Month Range
            </Label>
            <div className="flex items-center gap-1.5">
              <Input
                type="month"
                value={from}
                onChange={(e) => handleFromChange(e.target.value)}
                className="w-36 h-10"
                title="From month"
              />
              <span className="text-xs text-muted-foreground font-medium px-0.5">to</span>
              <Input
                type="month"
                value={to}
                onChange={(e) => handleToChange(e.target.value)}
                className="w-36 h-10"
                title="To month"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5 w-full sm:w-48">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Category
            </Label>
            <Select value={categoryId ?? "all"} onValueChange={(v: string | null) => handleCategoryChange(v ?? "all")}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub-Category Filter */}
          <div className="space-y-1.5 w-full sm:w-48">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Sub-Category
            </Label>
            <Select
              value={subCategoryId ?? "all"}
              onValueChange={(v: string | null) => handleSubCategoryChange(v ?? "all")}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="All sub-categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sub-categories</SelectItem>
                {visibleSubCategories.map((sc) => (
                  <SelectItem key={sc.id} value={String(sc.id)}>
                    {sc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Box */}
          <div className="space-y-1.5 w-full sm:flex-1 sm:min-w-48">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Search
            </Label>
            <div className="relative">
              <Input
                placeholder="Search title or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pr-7"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Clear Button */}
          {hasActiveFilters && (
            <div className="w-full sm:w-auto">
              <Button
                variant="ghost"
                size="default"
                onClick={clearFilters}
                className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground h-10 px-3"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Summary Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-muted/50 text-sm">
          <div className="rounded-lg border border-muted/50 bg-background/50 p-2.5 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground font-medium">Total Records</span>
            <span className="text-lg font-bold mt-0.5">{totals.total}</span>
          </div>
          <div className="rounded-lg border border-muted/50 bg-background/50 p-2.5 flex flex-col justify-between">
            <span className="text-xs text-destructive font-medium">Total Spent</span>
            <span className="text-lg font-bold text-destructive mt-0.5">
              Rs. {totals.totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable columns={columns} data={filteredData} onRowClick={(row) => setDetailRow(row)} />

      {/* Detail Dialog */}
      <ExpenseDetailDialog
        expense={detailRow}
        onOpenChange={(open) => !open && setDetailRow(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Add / Edit Expense Dialog */}
      <ExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        categories={categories}
        subCategories={subCategories}
        expense={editTarget}
        onSaved={() => router.refresh()}
      />

      {/* Manage Categories Dialog */}
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        categories={categories}
        subCategories={subCategories}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
