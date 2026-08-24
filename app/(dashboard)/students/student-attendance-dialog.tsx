"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import {
  getStudentAttendanceProfile,
  type StudentAttendanceProfile,
} from "./attendance/attendance-actions";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  CalendarOff,
  User,
  Loader2,
  Calendar,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

interface StudentAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number | null;
  studentName?: string | null;
}

export function StudentAttendanceDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
}: StudentAttendanceDialogProps) {
  const [profile, setProfile] = useState<StudentAttendanceProfile | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open && studentId) {
      loadProfile(studentId, selectedMonth);
    } else if (!open) {
      setProfile(null);
      setSelectedMonth("all");
      setStatusFilter("all");
      setSearchQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentId]);

  function loadProfile(sId: number, monthVal: string) {
    setLoading(true);
    startTransition(async () => {
      const res = await getStudentAttendanceProfile(sId, monthVal);
      if (res.success && res.data) {
        setProfile(res.data);
      }
      setLoading(false);
    });
  }

  function handleMonthChange(val: string | null) {
    const nextMonth = val || "all";
    setSelectedMonth(nextMonth);
    if (studentId) {
      loadProfile(studentId, nextMonth);
    }
  }

  const filteredRecords = useMemo(() => {
    if (!profile?.records) return [];

    return profile.records.filter((r) => {
      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "present" && r.status !== "present") return false;
        if (statusFilter === "absent" && r.status !== "absent" && r.status !== "unmarked") return false;
        if (statusFilter === "leave" && r.status !== "leave") return false;
        if (statusFilter === "holiday" && r.status !== "holiday") return false;
        if (statusFilter === "weekly_off" && r.status !== "weekly_off") return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchDate = r.date.includes(query);
        const matchDay = r.dayOfWeek.toLowerCase().includes(query);
        const matchLabel = r.statusLabel.toLowerCase().includes(query);
        if (!matchDate && !matchDay && !matchLabel) return false;
      }

      return true;
    });
  }, [profile, statusFilter, searchQuery]);

  const summary = profile?.summary;
  const student = profile?.student;
  const pct = summary?.attendancePercentage ?? 0;

  const getPctBadgeStyle = (val: number) => {
    if (val >= 80) return "text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
    if (val >= 60) return "text-blue-700 dark:text-blue-300 border-blue-500/30 bg-blue-500/10";
    if (val >= 40) return "text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/10";
    return "text-rose-700 dark:text-rose-300 border-rose-500/30 bg-rose-500/10";
  };

  const getStatusBadge = (status: string, label: string) => {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-medium text-xs gap-1">
            <CheckCircle2 className="h-3 w-3" /> Present
          </Badge>
        );
      case "absent":
        return (
          <Badge className="bg-rose-600 hover:bg-rose-600 text-white font-medium text-xs gap-1">
            <XCircle className="h-3 w-3" /> Absent
          </Badge>
        );
      case "unmarked":
        return (
          <Badge variant="outline" className="text-rose-600 border-rose-400 bg-rose-50 dark:bg-rose-950/20 text-xs gap-1">
            <AlertCircle className="h-3 w-3" /> Unmarked
          </Badge>
        );
      case "leave":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-500 text-white font-medium text-xs gap-1">
            <Clock className="h-3 w-3" /> Leave
          </Badge>
        );
      case "holiday":
        return (
          <Badge variant="secondary" className="font-medium text-xs gap-1 text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
            <CalendarOff className="h-3 w-3" /> {label}
          </Badge>
        );
      case "weekly_off":
        return (
          <Badge variant="outline" className="text-muted-foreground text-xs">
            Weekly Off
          </Badge>
        );
      default:
        return <Badge variant="outline">{label}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3 text-lg font-bold">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              <span>Student Attendance Record & Insights</span>
            </div>
            {summary && (
              <span className={`px-3 py-1 rounded-full border text-xs font-bold ${getPctBadgeStyle(pct)}`}>
                {pct}% Attendance
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading && !profile ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Loading attendance profile...</p>
          </div>
        ) : profile && student ? (
          <div className="space-y-5 pt-1">
            {/* ── Student Information Hero Card ─────────────────────────── */}
            <div className="rounded-2xl border bg-muted/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {student.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={student.photoUrl}
                    alt={student.name}
                    className="h-14 w-14 rounded-full object-cover border-2 border-primary/20 shadow-xs"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border">
                    {student.name.slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div className="space-y-0.5">
                  <h3 className="font-bold text-base text-foreground">{student.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {student.className && (
                      <span className="font-semibold text-foreground">Class: {student.className}</span>
                    )}
                    {student.rollNumber && <span>• Roll: {student.rollNumber}</span>}
                    {student.admissionDate && <span>• Admitted: {student.admissionDate}</span>}
                  </div>
                  {student.contactNumber && (
                    <p className="text-[11px] text-muted-foreground">Contact: {student.contactNumber}</p>
                  )}
                </div>
              </div>

              {/* Month Selector */}
              <div className="w-full sm:w-auto min-w-[160px] self-end sm:self-center">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Select Period / Month
                </Label>
                <Select value={selectedMonth} onValueChange={handleMonthChange}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months (Overall)</SelectItem>
                    {profile.availableMonths.map((m) => (
                      <SelectItem key={m.month} value={m.month}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── 4-Card Summary Metrics Strip ───────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-xl border bg-card p-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Present Days</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  {summary?.present ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  of {summary?.totalWorkingDays ?? 0} working days
                </p>
              </div>

              <div className="rounded-xl border bg-card p-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Absences</span>
                  <XCircle className="h-4 w-4 text-rose-600" />
                </div>
                <p className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
                  {summary?.absent ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">Missed / Unmarked</p>
              </div>

              <div className="rounded-xl border bg-card p-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Approved Leaves</span>
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                  {summary?.leave ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">Documented leaves</p>
              </div>

              <div className="rounded-xl border bg-card p-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Holidays</span>
                  <CalendarOff className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">
                  {summary?.holidays ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">Official school off days</p>
              </div>
            </div>

            {/* ── Monthly Progress Breakdown (if viewing All Months) ──────── */}
            {selectedMonth === "all" && profile.monthlyTrends.length > 1 && (
              <div className="rounded-2xl border bg-card p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    Monthly Attendance Performance
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    {profile.monthlyTrends.length} months recorded
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {profile.monthlyTrends.map((trend) => (
                    <div
                      key={trend.month}
                      onClick={() => handleMonthChange(trend.month)}
                      className="p-3 rounded-xl border bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-foreground">
                          {trend.monthLabel}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getPctBadgeStyle(trend.percentage)}`}>
                          {trend.percentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${trend.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span className="text-emerald-600">{trend.present} Present</span>
                        <span className="text-rose-600">{trend.absent} Absent</span>
                        <span className="text-amber-600">{trend.leave} Leave</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Filter & Search Toolbar ───────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[200px]">
                <div className="relative flex-1 min-w-[150px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by date or day..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs rounded-xl"
                  />
                </div>

                <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
                  <SelectTrigger className="h-8 text-xs min-w-[120px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="present">Present Only</SelectItem>
                    <SelectItem value="absent">Absent Only</SelectItem>
                    <SelectItem value="leave">Leave Only</SelectItem>
                    <SelectItem value="holiday">Holidays Only</SelectItem>
                    <SelectItem value="weekly_off">Weekly Offs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <span className="text-xs text-muted-foreground">
                Showing {filteredRecords.length} day records
              </span>
            </div>

            {/* ── Day-by-Day Attendance History Table ─────────────────────── */}
            <div className="rounded-xl border overflow-hidden">
              <div className="max-h-72 overflow-y-auto divide-y">
                {filteredRecords.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No attendance entries match your search/filter.
                  </div>
                ) : (
                  filteredRecords.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 sm:px-3.5 flex items-center justify-between text-xs hover:bg-muted/30 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{r.date}</span>
                          <span className="text-muted-foreground font-normal">({r.dayOfWeek})</span>
                        </div>
                        {r.markerName && (
                          <p className="text-[10px] text-muted-foreground pl-5.5">
                            Marked by: {r.markerName}
                            {r.editorName && r.editorName !== r.markerName && ` • Edited by: ${r.editorName}`}
                          </p>
                        )}
                      </div>

                      <div>{getStatusBadge(r.status, r.statusLabel)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Could not load student attendance record.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
