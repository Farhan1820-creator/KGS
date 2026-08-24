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
import { getFeeColumns, FeeRow } from "./fee-columns";
import { FeeStructureDialog } from "./fee-structure-dialog";
import { FeeDetailDialog } from "./fee-detail-dialog";
import { generateFeesForMonth, markFeePaid, markFeeUnpaid, updateFeeAmount } from "./fee-actions";
import { currentMonth } from "./fee-range";
import { Settings2, Receipt, X } from "lucide-react";

interface FeesClientProps {
  initialData: FeeRow[];
  classes: { id: number; name: string; section: string | null }[];
  students: { id: number; name: string }[];
  structures: { classId: number; amount: number }[];
  from: string; // "YYYY-MM", start of the month range (inclusive)
  to: string; // "YYYY-MM", end of the month range (inclusive)
  studentId?: string;
  classId?: string;
}

export function FeesClient({
  initialData,
  classes,
  students,
  structures,
  from,
  to,
  studentId,
  classId,
}: FeesClientProps) {
  const router = useRouter();
  const [structureDialogOpen, setStructureDialogOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<FeeRow | null>(null);
  const [generateMonth, setGenerateMonth] = useState(currentMonth());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  function updateParams(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const next = {
      from,
      to,
      studentId,
      classId,
      ...patch,
    };
    if (next.from) params.set("from", next.from);
    if (next.to) params.set("to", next.to);
    if (next.studentId) params.set("studentId", next.studentId);
    if (next.classId) params.set("classId", next.classId);
    router.push(`/accounts/fees?${params.toString()}`);
  }

  function handleFromChange(value: string) {
    updateParams({ from: value || undefined });
  }

  function handleToChange(value: string) {
    updateParams({ to: value || undefined });
  }

  function handleStudentChange(value: string) {
    updateParams({ studentId: value === "all" ? undefined : value });
  }

  function handleClassChange(value: string) {
    updateParams({ classId: value === "all" ? undefined : value });
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    router.push(`/accounts/fees?from=${currentMonth()}&to=${currentMonth()}`);
  }

  const filteredData = useMemo(() => {
    return initialData.filter((row) => {
      // Status filter
      if (statusFilter !== "all" && row.status !== statusFilter) return false;

      // Search query
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        row.studentName.toLowerCase().includes(q) ||
        (row.rollNumber ?? "").toLowerCase().includes(q) ||
        (row.className ?? "").toLowerCase().includes(q)
      );
    });
  }, [initialData, search, statusFilter]);

  const totals = useMemo(() => {
    const totalAmount = filteredData.reduce((sum, f) => sum + f.amount, 0);
    const paidAmount = filteredData.filter((f) => f.status === "paid").reduce((sum, f) => sum + f.amount, 0);
    const unpaidAmount = totalAmount - paidAmount;
    const paidCount = filteredData.filter((f) => f.status === "paid").length;
    const unpaidCount = filteredData.filter((f) => f.status === "unpaid").length;
    return { totalAmount, paidAmount, unpaidAmount, paidCount, unpaidCount, total: filteredData.length };
  }, [filteredData]);

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateFeesForMonth({ month: generateMonth });
      if (!result.success) {
        toast.error("errors" in result && result.errors.root ? result.errors.root[0] : "Failed to generate fees");
        return;
      }
      toast.success("Fees generated for the month");
      router.refresh();
    });
  }

  function handleTogglePaid(row: FeeRow) {
    startTransition(async () => {
      const result = row.status === "paid" ? await markFeeUnpaid(row.id) : await markFeePaid(row.id);
      if (!result.success) {
        toast.error("Could not update fee status");
        return;
      }
      toast.success(row.status === "paid" ? "Marked as unpaid" : "Marked as paid");
      router.refresh();
    });
  }

  const columns = getFeeColumns({ onTogglePaid: handleTogglePaid });

  function handleUpdateAmount(row: FeeRow, newAmount: number) {
    startTransition(async () => {
      const result = await updateFeeAmount(row.id, newAmount);
      if (!result.success) {
        toast.error("errors" in result && result.errors.root ? result.errors.root[0] : "Failed to update amount");
        return;
      }
      toast.success("Amount updated");
      if (detailRow && detailRow.id === row.id) {
        setDetailRow({ ...detailRow, amount: newAmount });
      }
      router.refresh();
    });
  }

  const hasActiveFilters =
    Boolean(search) ||
    statusFilter !== "all" ||
    Boolean(classId) ||
    Boolean(studentId) ||
    from !== currentMonth() ||
    to !== currentMonth();

  return (
    <div className="page-shell space-y-4">
      {/* Top Action Bar */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStructureDialogOpen(true)}
          className="shadow-xs"
        >
          <Settings2 className="h-4 w-4 mr-1.5" />
          Class Fee Structure
        </Button>
      </div>

      {/* Main Toolbar & Filter Card */}
      <div className="bg-card rounded-2xl shadow-sm border border-muted/50 p-4 sm:p-5 space-y-4">
        {/* Month Generation Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-muted/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Generate Monthly Fees:</span>
            <div className="flex items-center gap-2">
              <Input
                type="month"
                value={generateMonth}
                onChange={(e) => setGenerateMonth(e.target.value)}
                className="w-40 h-10"
              />
              <Button onClick={handleGenerate} disabled={isPending} size="default" className="h-10 shadow-xs">
                <Receipt className="h-4 w-4 mr-1.5" />
                Generate Fees
              </Button>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            Creates monthly fee invoices for all currently active students.
          </span>
        </div>

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

          {/* Class Filter */}
          <div className="space-y-1.5 w-full sm:w-44">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Class
            </Label>
            <Select value={classId ?? "all"} onValueChange={(v: string | null) => handleClassChange(v ?? "all")}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} {c.section ?? ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student Filter */}
          <div className="space-y-1.5 w-full sm:w-48">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Student
            </Label>
            <Select value={studentId ?? "all"} onValueChange={(v: string | null) => handleStudentChange(v ?? "all")}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="All students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter (Paid / Unpaid) */}
          <div className="space-y-1.5 w-full sm:w-36">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Status
            </Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="paid">Paid only</SelectItem>
                <SelectItem value="unpaid">Unpaid only</SelectItem>
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
                placeholder="Search name or roll no..."
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

          {/* Clear Filters Button */}
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
            <span className="text-xs text-muted-foreground font-medium">Total Invoices</span>
            <span className="text-lg font-bold mt-0.5">{totals.total}</span>
          </div>
          <div className="rounded-lg border border-muted/50 bg-background/50 p-2.5 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground font-medium">Total Amount</span>
            <span className="text-lg font-bold mt-0.5">Rs. {totals.totalAmount.toLocaleString()}</span>
          </div>
          <div className="rounded-lg border border-muted/50 bg-background/50 p-2.5 flex flex-col justify-between">
            <span className="text-xs text-green-600 font-medium">Collected ({totals.paidCount})</span>
            <span className="text-lg font-bold text-green-600 mt-0.5">Rs. {totals.paidAmount.toLocaleString()}</span>
          </div>
          <div className="rounded-lg border border-muted/50 bg-background/50 p-2.5 flex flex-col justify-between">
            <span className="text-xs text-red-600 font-medium">Pending ({totals.unpaidCount})</span>
            <span className="text-lg font-bold text-red-600 mt-0.5">Rs. {totals.unpaidAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable columns={columns} data={filteredData} onRowClick={(row) => setDetailRow(row)} />

      {/* Fee Detail Modal */}
      <FeeDetailDialog
        fee={detailRow}
        onOpenChange={(open) => !open && setDetailRow(null)}
        onTogglePaid={handleTogglePaid}
        onUpdateAmount={handleUpdateAmount}
      />

      {/* Fee Structure Modal */}
      <FeeStructureDialog
        open={structureDialogOpen}
        onOpenChange={setStructureDialogOpen}
        classes={classes}
        structures={structures}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
