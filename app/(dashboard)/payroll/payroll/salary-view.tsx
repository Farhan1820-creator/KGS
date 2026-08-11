"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/layout/data-table";
import { salaryColumns } from "./salary-columns";
import type { SalaryBreakdown } from "../attendance/attendance-helpers";
import { Wallet } from "lucide-react";

interface SalaryViewProps {
  month: string;
  salaries: SalaryBreakdown[];
}

function money(n: number): string {
  return n.toLocaleString("en-PK", { maximumFractionDigits: 0 });
}

export function SalaryView({ month, salaries }: SalaryViewProps) {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(month);

  function applyMonth(value: string) {
    setSelectedMonth(value);
    router.push(`/payroll?tab=payroll&month=${value}`);
  }

  const totalPayout = useMemo(() => salaries.reduce((sum, s) => sum + s.totalSalary, 0), [salaries]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input type="month" value={selectedMonth} onChange={(e) => applyMonth(e.target.value)} className="w-44" />
        <div className="flex items-center gap-2 text-sm">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Total payout:</span>
          <span className="font-medium">{money(totalPayout)}</span>
        </div>
      </div>

      <DataTable columns={salaryColumns} data={salaries} />

      <p className="text-xs text-muted-foreground">
        Basic salary is split evenly across the month's working days, then each day is paid in proportion to
        actual seconds worked vs. the required shift length (capped at a full day's pay). Approved leave days
        are paid in full; allowances are always paid in full.
      </p>
    </div>
  );
}
