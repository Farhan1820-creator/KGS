"use client";

import { useState, useEffect, useTransition, useMemo, useCallback } from "react";
import {
  getAttendanceData,
  saveAttendance,
  clearClassAttendance,
  StudentAttendanceStatus,
  DateInfo,
} from "./attendance-actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  CheckCheck,
  RotateCcw,
  Save,
  Users,
  Calendar,
  Settings2,
  CalendarOff,
  AlertCircle,
  X,
  CalendarCheck,
} from "lucide-react";
import { ScheduleDialog } from "@/app/(dashboard)/payroll/attendance/schedule-dialog";
import { StudentAttendanceDialog } from "../student-attendance-dialog";
import {
  getActiveSchedule,
  formatTimeLabel,
  upcomingOffDates,
  WEEKDAY_LABELS,
  todayString,
  type WorkSchedule,
} from "@/app/(dashboard)/payroll/attendance/attendance-helpers";

type ClassType = {
  id: number;
  name: string;
  section: string | null;
  studentCount?: number;
};

type StudentItem = {
  id: number;
  name: string;
  rollNumber: string | null;
  photoUrl: string | null;
  contactNumber?: string | null;
  email?: string | null;
  classId?: number | null;
  className?: string;
};

type AttendanceRecord = {
  id: number;
  studentId: number;
  classId: number;
  date: string;
  status: StudentAttendanceStatus;
  markerName?: string | null;
  editorName?: string | null;
  updatedAt?: Date;
};

interface OffDateEntry {
  date: string;
  label: string | null;
  source: string;
}

interface AttendanceClientProps {
  classes: ClassType[];
  schedules: WorkSchedule[];
  offDates: OffDateEntry[];
  calendarSyncUrl: string | null;
  userRole?: string;
}

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AttendanceClient({
  classes,
  schedules,
  offDates,
  calendarSyncUrl,
  userRole = "",
}: AttendanceClientProps) {
  const [date, setDate] = useState<string>(getTodayString());
  // Default to "all" classes
  const [classId, setClassId] = useState<string>("all");
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [attendance, setAttendance] = useState<Record<number, AttendanceRecord>>({});
  const [role, setRole] = useState<string>(userRole);
  const [dateInfo, setDateInfo] = useState<DateInfo | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<number | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Local state to track unsaved edits: studentId -> status
  const [edits, setEdits] = useState<Record<number, StudentAttendanceStatus>>({});

  const activeSchedule = getActiveSchedule(todayString(), schedules);
  const upcomingVacations = upcomingOffDates(offDates, 4);

  const totalAllStudents = useMemo(() => {
    return classes.reduce((sum, c) => sum + (c.studentCount ?? 0), 0);
  }, [classes]);

  const fetchData = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    setEdits({});
    try {
      const targetClassId = classId === "all" ? null : parseInt(classId);
      const data = await getAttendanceData(targetClassId, date);
      setStudents(data.students);
      setAttendance(data.attendance);
      if (data.currentUserRole) setRole(data.currentUserRole);
      if (data.dateInfo) setDateInfo(data.dateInfo);
    } catch {
      toast.error("Failed to load attendance data.");
    } finally {
      setLoading(false);
    }
  }, [classId, date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = (studentId: number, status: StudentAttendanceStatus) => {
    setEdits((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: StudentAttendanceStatus) => {
    if (students.length === 0) return;
    const newEdits: Record<number, StudentAttendanceStatus> = { ...edits };
    for (const student of students) {
      newEdits[student.id] = status;
    }
    setEdits(newEdits);
    toast.info(`Marked all as ${status.toUpperCase()}`);
  };

  const handleResetEdits = () => {
    setEdits({});
    toast.info("Reset unsaved edits.");
  };

  const handleClearDatabase = async () => {
    if (!date) return;
    const targetClassId = classId === "all" ? null : parseInt(classId);
    const confirmMsg =
      classId === "all"
        ? "Are you sure you want to clear saved attendance for ALL classes on this date?"
        : "Are you sure you want to clear saved attendance for this class on this date?";

    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      const res = await clearClassAttendance(targetClassId, date);
      if (res.success) {
        toast.success("Attendance cleared successfully.");
        fetchData();
      } else {
        toast.error(res.message || "Failed to clear attendance.");
      }
    });
  };

  const handleSave = () => {
    const targetClassId = classId === "all" ? null : parseInt(classId);

    const payload = students
      .map((s) => {
        const status = edits[s.id] || attendance[s.id]?.status;
        return status ? { studentId: s.id, status, classId: s.classId ?? undefined } : null;
      })
      .filter(Boolean) as Array<{ studentId: number; status: StudentAttendanceStatus; classId?: number }>;

    if (payload.length === 0) {
      toast.error("Please mark attendance for at least one student before saving.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await saveAttendance(targetClassId, date, payload);
        if (res.success) {
          toast.success(`Attendance saved for ${res.count} student(s)!`);
          setEdits({});
          fetchData();
        } else {
          toast.error(res.message || "Failed to save attendance.");
        }
      } catch {
        toast.error("An error occurred while saving attendance.");
      }
    });
  };

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (Object.keys(edits).length > 0 && !isPending) {
          handleSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [edits, isPending, students, classId, date]);

  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let unmarked = 0;

    for (const student of students) {
      const status = edits[student.id] || attendance[student.id]?.status;
      if (status === "present") present++;
      else if (status === "absent") absent++;
      else if (status === "leave") leave++;
      else unmarked++;
    }

    const total = students.length;
    const markedTotal = present + absent + leave;
    const attendancePercentage = markedTotal > 0 ? Math.round((present / markedTotal) * 100) : 0;

    return {
      total,
      present,
      absent,
      leave,
      unmarked,
      attendancePercentage,
      hasUnsavedChanges: Object.keys(edits).length > 0,
      unsavedCount: Object.keys(edits).length,
    };
  }, [students, attendance, edits]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        search.trim() === "" ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(search.toLowerCase())) ||
        (s.className && s.className.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === "all") return true;

      const currentStatus = edits[s.id] || attendance[s.id]?.status || "unmarked";
      return currentStatus === statusFilter;
    });
  }, [students, search, statusFilter, edits, attendance]);

  const selectedClass = classes.find((c) => String(c.id) === classId);

  return (
    <div className="space-y-4">
      {role === "admin" && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScheduleDialogOpen(true)}
            className="shadow-xs"
          >
            <Settings2 className="h-4 w-4 mr-1.5" />
            Schedule & Holidays
          </Button>
        </div>
      )}

      {/* Schedule & Holidays Information Strip */}
      {(activeSchedule || upcomingVacations.length > 0) && (
        <div className="rounded-xl border border-muted/50 bg-card p-3 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {activeSchedule && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-foreground">
                  Active schedule{activeSchedule.label ? ` — ${activeSchedule.label}` : ""}:
                </span>
                <span>
                  {activeSchedule.days
                    .slice()
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((d) => `${WEEKDAY_LABELS[d.dayOfWeek].slice(0, 3)} ${formatTimeLabel(d.startTime)}–${formatTimeLabel(d.endTime)}`)
                    .join(", ")}
                </span>
              </div>
            )}
          </div>

          {upcomingVacations.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-foreground">Coming vacations:</span>
              <span className="text-muted-foreground">
                {upcomingVacations.map((v) => `${v.date}${v.label ? ` (${v.label})` : ""}`).join(", ")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Off-Day / Holiday Alert Notice */}
      {dateInfo && (!dateInfo.isWorkingDay || dateInfo.isHoliday) && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong className="font-semibold text-foreground">
                {dateInfo.isHoliday
                  ? `Holiday: ${dateInfo.holidayLabel || "School Holiday"}`
                  : "Weekly Off Day (Weekend)"}
              </strong>
              {" — "}
              Regular attendance is not scheduled for this date. You may still view or mark entries if needed.
            </span>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono shrink-0">
            {date}
          </Badge>
        </div>
      )}

      {/* Toolbar & Filters */}
      <div className="bg-card rounded-2xl shadow-sm border border-muted/50 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 sm:gap-3.5 flex-1">
            {/* Date Picker */}
            <div className="space-y-1.5 w-full sm:w-auto">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Date
              </Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-40 h-10"
                />
                <Button
                  type="button"
                  variant={date === getTodayString() ? "secondary" : "outline"}
                  size="default"
                  className="h-10 px-3 text-xs shadow-2xs"
                  onClick={() => setDate(getTodayString())}
                >
                  Today
                </Button>
              </div>
            </div>

            {/* Class Selector */}
            <div className="space-y-1.5 w-full sm:w-52">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Class
              </Label>
              <Select value={classId} onValueChange={(v) => setClassId(v || "all")}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Classes{" "}
                    <span className="text-muted-foreground text-xs ml-1">
                      ({totalAllStudents})
                    </span>
                  </SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name} {c.section ? ` - ${c.section}` : ""}{" "}
                      <span className="text-muted-foreground text-xs ml-1">
                        ({c.studentCount ?? 0})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Filter */}
            <div className="space-y-1.5 w-full sm:flex-1 sm:min-w-48">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Search
              </Label>
              <div className="relative">
                <Input
                  placeholder="Search name, roll no..."
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

            {/* Status Filter */}
            <div className="space-y-1.5 w-full sm:w-40">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Status
              </Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="unmarked">Unmarked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Mark All Buttons */}
          {students.length > 0 && (
            <div className="flex items-end self-stretch lg:self-end">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  className="h-10 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 flex-1 sm:flex-none shadow-2xs"
                  onClick={() => handleMarkAll("present")}
                  disabled={isPending}
                >
                  Mark All Present
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  className="h-10 text-xs text-red-700 dark:text-red-400 border-red-500/30 hover:bg-red-500/10 flex-1 sm:flex-none shadow-2xs"
                  onClick={() => handleMarkAll("absent")}
                  disabled={isPending}
                >
                  Mark All Absent
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Live Attendance Stats */}
        {students.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-muted/50 text-sm">
            <div className="rounded-lg border border-muted/50 bg-background/50 p-2.5 flex flex-col justify-between">
              <span className="text-xs text-muted-foreground font-medium">Total Students</span>
              <span className="text-lg font-bold mt-0.5">{stats.total}</span>
            </div>
            <div className="rounded-lg border border-muted/50 bg-background/50 p-2.5 flex flex-col justify-between">
              <span className="text-xs text-green-600 font-medium">Present ({stats.attendancePercentage}%)</span>
              <span className="text-lg font-bold text-green-600 mt-0.5">{stats.present}</span>
            </div>
            <div className="rounded-lg border border-muted/50 bg-background/50 p-2.5 flex flex-col justify-between">
              <span className="text-xs text-red-600 font-medium">Absent</span>
              <span className="text-lg font-bold text-red-600 mt-0.5">{stats.absent}</span>
            </div>
            <div className="rounded-lg border border-muted/50 bg-background/50 p-2.5 flex flex-col justify-between">
              <span className="text-xs text-amber-600 font-medium">Leave</span>
              <span className="text-lg font-bold text-amber-600 mt-0.5">{stats.leave}</span>
            </div>
            <div className="rounded-lg border border-muted/50 bg-background/50 p-2.5 flex flex-col justify-between col-span-2 sm:col-span-1">
              <span className="text-xs text-muted-foreground font-medium">Unmarked</span>
              <span className="text-lg font-bold text-muted-foreground mt-0.5">{stats.unmarked}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Student Attendance Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl shadow-md border border-muted/50">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading attendance records...</p>
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-muted/50 overflow-hidden shadow-md bg-card">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[110px]">Roll No</TableHead>
                  <TableHead>Student</TableHead>
                  {classId === "all" && <TableHead className="w-[130px]">Class</TableHead>}
                  <TableHead className="w-[100px] text-center">History</TableHead>
                  <TableHead className="w-[300px] text-center">Status</TableHead>
                  {role === "admin" && <TableHead className="w-[180px]">Audit</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const record = attendance[student.id];
                  const currentStatus = edits[student.id] || record?.status;
                  const isModified = Boolean(edits[student.id]);

                  return (
                    <TableRow
                      key={student.id}
                      className={isModified ? "bg-primary/5" : ""}
                    >
                      {/* Roll Number */}
                      <TableCell className="font-mono text-xs">
                        {student.rollNumber ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {student.rollNumber}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Student Profile Info */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {student.photoUrl ? (
                            <img
                              src={student.photoUrl}
                              alt={student.name}
                              className="w-8 h-8 rounded-full object-cover border border-muted"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold text-xs text-muted-foreground">
                              {student.name ? student.name.charAt(0).toUpperCase() : "?"}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium text-sm flex items-center gap-1.5">
                              {student.name}
                              {isModified && (
                                <span
                                  className="inline-block w-1.5 h-1.5 rounded-full bg-primary"
                                  title="Unsaved edit"
                                />
                              )}
                            </span>
                            {student.contactNumber && (
                              <span className="text-xs text-muted-foreground">
                                {student.contactNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Class Badge (When All Classes Selected) */}
                      {classId === "all" && (
                        <TableCell>
                          {student.className ? (
                            <Badge variant="secondary" className="text-[11px] font-normal">
                              {student.className}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                      )}

                      {/* Individual Attendance Insights Button */}
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px] font-medium gap-1 text-primary border-primary/20 hover:bg-primary hover:text-white transition-colors"
                          title="View Student Attendance Profile & Insights"
                          onClick={() => {
                            setSelectedStudentForProfile(student.id);
                            setSelectedStudentName(student.name);
                            setProfileDialogOpen(true);
                          }}
                        >
                          <CalendarCheck className="h-3.5 w-3.5" />
                          Record
                        </Button>
                      </TableCell>

                      {/* Status Button Group */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-1 bg-muted/40 p-1 rounded-lg border border-muted/50 max-w-[280px] mx-auto">
                          {/* Present */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, "present")}
                            className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md text-xs font-medium transition-all ${
                              currentStatus === "present"
                                ? "bg-green-600 text-white shadow-xs"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Present
                          </button>

                          {/* Absent */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, "absent")}
                            className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md text-xs font-medium transition-all ${
                              currentStatus === "absent"
                                ? "bg-red-600 text-white shadow-xs"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Absent
                          </button>

                          {/* Leave */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, "leave")}
                            className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md text-xs font-medium transition-all ${
                              currentStatus === "leave"
                                ? "bg-amber-600 text-white shadow-xs"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            Leave
                          </button>
                        </div>
                      </TableCell>

                      {/* Audit Details */}
                      {role === "admin" && (
                        <TableCell className="text-xs text-muted-foreground">
                          {record ? (
                            <div className="flex flex-col leading-tight">
                              {record.markerName && (
                                <span className="font-medium text-foreground">
                                  {record.markerName}
                                </span>
                              )}
                              {record.updatedAt && (
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(record.updatedAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Sticky Save Bar */}
          <div className="sticky bottom-4 z-20 flex items-center justify-between p-3 px-4 rounded-xl bg-card/95 backdrop-blur-md border border-muted/50 shadow-lg">
            <div className="flex items-center gap-3">
              {stats.hasUnsavedChanges ? (
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium">
                    {stats.unsavedCount} unsaved change{stats.unsavedCount > 1 ? "s" : ""}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetEdits}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Discard
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>All records saved.</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {role === "admin" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearDatabase}
                  disabled={isPending}
                  className="text-xs text-destructive hover:bg-destructive/10"
                >
                  Clear Date
                </Button>
              )}
              <Button
                type="button"
                onClick={handleSave}
                disabled={isPending || (!stats.hasUnsavedChanges && stats.unmarked === 0)}
                size="sm"
                className="shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" /> Save Attendance
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-muted/50 bg-card space-y-2 shadow-sm">
          <Users className="h-8 w-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-semibold">
            No Students {classId === "all" ? "in Academy" : `in ${selectedClass?.name || "Class"}`}
          </h3>
          <p className="text-xs text-muted-foreground">
            No active students found.
          </p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-muted/50 bg-card space-y-2 shadow-sm">
          <Search className="h-8 w-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-semibold">No students match filter</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : null}

      {/* Schedule & Holidays Modal for Admin */}
      <ScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        schedules={schedules}
        offDates={offDates}
        calendarSyncUrl={calendarSyncUrl}
      />

      {/* Individual Student Attendance Dialog */}
      <StudentAttendanceDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        studentId={selectedStudentForProfile}
        studentName={selectedStudentName}
      />
    </div>
  );
}
