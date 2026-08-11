"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { expenseRangeOptions, ExpenseRange } from "./expense-range";
import { Settings2, Plus } from "lucide-react";

interface ExpensesClientProps {
  initialData: ExpenseRow[];
  categories: ExpenseCategory[];
  subCategories: ExpenseSubCategory[];
  range: ExpenseRange;
  date?: string; // specific date override — filters that exact day
  categoryId?: string;
  subCategoryId?: string;
}

export function ExpensesClient({
  initialData,
  categories,
  subCategories,
  range,
  date,
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
    const next = { range, date, categoryId, subCategoryId, ...patch };
    if (next.range) params.set("range", next.range);
    if (next.date) params.set("date", next.date);
    if (next.categoryId) params.set("categoryId", next.categoryId);
    if (next.subCategoryId) params.set("subCategoryId", next.subCategoryId);
    router.push(`/accounts/expenses?${params.toString()}`);
  }

  function handleRangeChange(value: ExpenseRange) {
    updateParams({ range: value, date: undefined });
  }

  function handleDateChange(value: string) {
    updateParams({ date: value || undefined });
  }

  function handleCategoryChange(value: string) {
    updateParams({ categoryId: value === "all" ? undefined : value, subCategoryId: undefined });
  }

  function handleSubCategoryChange(value: string) {
    updateParams({ subCategoryId: value === "all" ? undefined : value });
  }

  function clearFilters() {
    router.push(`/accounts/expenses?range=this_month`);
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

  return (
    <div className="page-shell space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Expense
        </Button>
        <Button variant="outline" size="sm" onClick={() => setCategoryDialogOpen(true)}>
          <Settings2 className="h-4 w-4 mr-1" />
          Manage Categories
        </Button>
      </div>

      {/* Filters header */}
      <div className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:flex sm:flex-wrap sm:items-center">
<Select value={range} onValueChange={(v: string | null) => handleRangeChange(v as ExpenseRange)}>
            <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent>
            {expenseRangeOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={date ?? ""}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full sm:w-44"
          title="Pick a specific date"
        />

<Select value={categoryId ?? "all"} onValueChange={(v: string | null) => handleCategoryChange(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-48">
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

<Select value={subCategoryId ?? "all"} onValueChange={(v: string | null) => handleSubCategoryChange(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-48">
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

        <Input
          placeholder="Search by title or category"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-56"
        />

        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full sm:w-auto">
          Clear
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Records</p>
          <p className="text-lg font-semibold">{totals.total}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Spent</p>
          <p className="text-lg font-semibold text-destructive">Rs. {totals.totalAmount.toLocaleString()}</p>
        </div>
      </div>

      <DataTable columns={columns} data={filteredData} onRowClick={(row) => setDetailRow(row)} />

      <ExpenseDetailDialog
        expense={detailRow}
        onOpenChange={(open) => !open && setDetailRow(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        categories={categories}
        subCategories={subCategories}
        expense={editTarget}
        onSaved={() => router.refresh()}
      />

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
