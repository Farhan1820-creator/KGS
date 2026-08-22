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
import { AttendanceEditDialog } from "./attendance-edit-dialog";
import { LeaveApprovals, PendingLeaveRow } from "./leave-approvals";
import { EmployeesPanel, EmployeeRow } from "./employees-panel";
import { ScheduleDialog } from "./schedule-dialog";
import {
  getActiveSchedule,
  formatTimeLabel,
  upcomingOffDates,
  WEEKDAY_LABELS,
  todayString,
  STATUS_LABELS,
  type AttendanceStatus,
  type WorkSchedule,
} from "./attendance-helpers";
import { Settings2 } from "lucide-react";

interface OffDatesEntry {
  date: string;
  label: string | null;
  source: string;
}

interface AdminAttendanceViewProps {
  month: string;
  records: AttendanceRow[];
  employeeOptions: { id: number; name: string }[];
  pendingLeaves: PendingLeaveRow[];
  employees: EmployeeRow[];
  schedules: WorkSchedule[];
  offDates: OffDatesEntry[];
  calendarSyncUrl: string | null;
}

export function AdminAttendanceView({
  month,
  records,
  employeeOptions,
  pendingLeaves,
  employees,
  schedules,
  offDates,
  calendarSyncUrl,
}: AdminAttendanceViewProps) {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AttendanceRow | null>(null);

  const activeSchedule = getActiveSchedule(todayString(), schedules);
  const upcomingVacations = upcomingOffDates(offDates, 5);

  function applyMonth(value: string) {
    setSelectedMonth(value);
    router.push(`/payroll?tab=attendance&month=${value}`);
  }

  function resetToThisMonth() {
    const now = new Date();
    applyMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  }

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (employeeFilter !== "all" && !r.key.startsWith(`${employeeFilter}-`)) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [records, employeeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Input type="month" value={selectedMonth} onChange={(e) => applyMonth(e.target.value)} className="w-44" />
            <Button variant="ghost" size="sm" onClick={resetToThisMonth}>
              This Month
            </Button>
          </div>
          <Select value={employeeFilter} onValueChange={(v: string | null) => setEmployeeFilter(v ?? "all")}>
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
          <Select value={statusFilter} onValueChange={(v: string | null) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => setScheduleDialogOpen(true)}>
          <Settings2 className="h-4 w-4 mr-1" />
          Schedule & Holidays
        </Button>
      </div>

      {(activeSchedule || upcomingVacations.length > 0) && (
        <div className="rounded-lg border p-3 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
          {activeSchedule && (
            <>
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
            </>
          )}
          {upcomingVacations.length > 0 && (
            <span>
              <span className="font-medium text-foreground">Coming vacations:</span>{" "}
              {upcomingVacations.map((v) => `${v.date}${v.label ? ` (${v.label})` : ""}`).join(", ")}
            </span>
          )}
        </div>
      )}

      <DataTable columns={adminAttendanceColumns} data={filteredRecords} onRowClick={(row) => setEditTarget(row)} />
      <p className="text-xs text-muted-foreground -mt-3">Click any row to view or edit its full attendance detail.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-3">Pending Leave Requests</h3>
          <LeaveApprovals requests={pendingLeaves} />
        </div>
        <div className="rounded-lg border p-4">
          <EmployeesPanel employees={employees} />
        </div>
      </div>

      <ScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        schedules={schedules}
        offDates={offDates}
        calendarSyncUrl={calendarSyncUrl}
      />

      <AttendanceEditDialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        record={editTarget}
      />
    </div>
  );
}
