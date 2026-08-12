"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { adminAttendanceColumns, AttendanceRow } from "./attendance-columns";
import { LeaveApprovals, PendingLeaveRow } from "./leave-approvals";
import { EmployeesPanel, EmployeeRow } from "./employees-panel";
import { WorkScheduleDialog } from "./work-schedule-dialog";
import { getActiveSchedule, formatTimeLabel, WEEKDAY_LABELS, todayString, type WorkSchedule } from "./attendance-helpers";
import { Settings2 } from "lucide-react";

interface AdminAttendanceViewProps {
  month: string;
  records: AttendanceRow[];
  employeeOptions: { id: number; name: string }[];
  pendingLeaves: PendingLeaveRow[];
  employees: EmployeeRow[];
  schedules: WorkSchedule[];
}

export function AdminAttendanceView({
  month,
  records,
  employeeOptions,
  pendingLeaves,
  employees,
  schedules,
}: AdminAttendanceViewProps) {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const activeSchedule = getActiveSchedule(todayString(), schedules);

  function applyMonth(value: string) {
    setSelectedMonth(value);
    router.push(`/payroll?tab=attendance&month=${value}`);
  }

  const filteredRecords = useMemo(() => {
    if (employeeFilter === "all") return records;
    return records.filter((r) => r.key.startsWith(`${employeeFilter}-`));
  }, [records, employeeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Input type="month" value={selectedMonth} onChange={(e) => applyMonth(e.target.value)} className="w-44" />
          <Select value={employeeFilter} onValueChange={(v:string | null) => setEmployeeFilter(v ?? "all")}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employees</SelectItem>
              {employeeOptions.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => setScheduleDialogOpen(true)}>
          <Settings2 className="h-4 w-4 mr-1" />
          Work Schedule
        </Button>
      </div>

      {activeSchedule && (
        <div className="rounded-lg border p-3 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
          <span className="font-medium text-foreground">
            Active schedule{activeSchedule.label ? ` — ${activeSchedule.label}` : ""}:
          </span>
          {activeSchedule.days
            .slice()
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
            .map((d) => (
              <span key={d.dayOfWeek}>
                {WEEKDAY_LABELS[d.dayOfWeek].slice(0, 3)} {formatTimeLabel(d.startTime)}–{formatTimeLabel(d.endTime)}
              </span>
            ))}
        </div>
      )}

      <DataTable columns={adminAttendanceColumns} data={filteredRecords} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-3">Pending Leave Requests</h3>
          <LeaveApprovals requests={pendingLeaves} />
        </div>
        <div className="rounded-lg border p-4">
          <EmployeesPanel employees={employees} />
        </div>
      </div>

      <WorkScheduleDialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen} />
    </div>
  );
}
