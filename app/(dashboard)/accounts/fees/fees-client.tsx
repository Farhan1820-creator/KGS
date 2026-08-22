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
import { getFeeColumns, FeeRow } from "./fee-columns";
import { FeeStructureDialog } from "./fee-structure-dialog";
import { FeeDetailDialog } from "./fee-detail-dialog";
import { generateFeesForMonth, markFeePaid, markFeeUnpaid, updateFeeAmount } from "./fee-actions";
import { currentMonth } from "./fee-range";
import { Settings2, Sparkles } from "lucide-react";

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
    router.push(`/accounts/fees?from=${currentMonth()}&to=${currentMonth()}`);
  }

  const filteredData = useMemo(() => {
    if (!search.trim()) return initialData;
    const q = search.trim().toLowerCase();
    return initialData.filter(
      (row) => row.studentName.toLowerCase().includes(q) || (row.rollNumber ?? "").toLowerCase().includes(q)
    );
  }, [initialData, search]);

  const totals = useMemo(() => {
    const totalAmount = filteredData.reduce((sum, f) => sum + f.amount, 0);
    const paidAmount = filteredData.filter((f) => f.status === "paid").reduce((sum, f) => sum + f.amount, 0);
    const unpaidAmount = totalAmount - paidAmount;
    const paidCount = filteredData.filter((f) => f.status === "paid").length;
    return { totalAmount, paidAmount, unpaidAmount, paidCount, total: filteredData.length };
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

  return (
    <div className="page-shell space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            type="month"
            value={generateMonth}
            onChange={(e) => setGenerateMonth(e.target.value)}
            className="w-full sm:w-44"
          />
          <Button onClick={handleGenerate} disabled={isPending} size="sm">
            <Sparkles className="h-4 w-4 mr-1" />
            Generate Fees
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setStructureDialogOpen(true)}>
          <Settings2 className="h-4 w-4 mr-1" />
          Set Class Fee
        </Button>
      </div>

      {/* Filters header */}
      <div className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:flex sm:flex-wrap sm:items-center">
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Input
            type="month"
            value={from}
            onChange={(e) => handleFromChange(e.target.value)}
            className="w-full sm:w-40"
            title="From month"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="month"
            value={to}
            onChange={(e) => handleToChange(e.target.value)}
            className="w-full sm:w-40"
            title="To month"
          />
        </div>

        <Select value={classId ?? "all"} onValueChange={(v:string | null) => handleClassChange(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-44">
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

        <Select value={studentId ?? "all"} onValueChange={(v:string | null) => handleStudentChange(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-52">
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

        <Input
          placeholder="Search by name or roll number"
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
          <p className="text-xs text-muted-foreground">Total Amount</p>
          <p className="text-lg font-semibold">Rs. {totals.totalAmount.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Collected ({totals.paidCount})</p>
          <p className="text-lg font-semibold text-green-600">Rs. {totals.paidAmount.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-lg font-semibold text-destructive">Rs. {totals.unpaidAmount.toLocaleString()}</p>
        </div>
      </div>

      <DataTable columns={columns} data={filteredData} onRowClick={(row) => setDetailRow(row)} />

            <FeeDetailDialog
        fee={detailRow}
        onOpenChange={(open) => !open && setDetailRow(null)}
        onTogglePaid={handleTogglePaid}
        onUpdateAmount={handleUpdateAmount}
      />

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
