// Shared helpers for attendance status/hours math. Kept framework-agnostic
// (no db import) so both server queries and client components can use them.

export type AttendanceStatus = "present" | "half_day" | "absent" | "leave";

export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// All "YYYY-MM-DD" dates in a given "YYYY-MM" month, up to (and including) today
// if the month is the current month, otherwise the full month.
export function datesInMonth(month: string): string[] {
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && monthNum === today.getMonth() + 1;
  const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;

  const dates: string[] = [];
  for (let d = 1; d <= lastDay; d++) {
    dates.push(`${year}-${String(monthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return dates;
}

export function dayOfWeek(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).getDay(); // 0=Sunday..6=Saturday
}

export function isDateWithinLeave(date: string, leave: { fromDate: string; toDate: string }): boolean {
  return date >= leave.fromDate && date <= leave.toDate;
}

// ---- Work schedule (flexible, date-effective timetable) --------------------

export type DaySchedule = { dayOfWeek: number; startTime: string; endTime: string };
export type WorkSchedule = { id: number; effectiveFrom: string; label: string | null; days: DaySchedule[] };

// Picks whichever schedule was actually in effect on `date` — the one with
// the latest effectiveFrom that is still <= date. Lets admin change timings
// going forward without altering how past attendance/salary is graded.
export function getActiveSchedule(date: string, schedules: WorkSchedule[]): WorkSchedule | null {
  const applicable = schedules.filter((s) => s.effectiveFrom <= date);
  if (applicable.length === 0) return null;
  return applicable.reduce((latest, s) => (s.effectiveFrom > latest.effectiveFrom ? s : latest));
}

// Returns this date's start/end timing, or null if it's a non-working day —
// either because the schedule active on that date has no entry for this
// weekday, or because this weekday is a global off day (see `offDays` below).
export function getDaySchedule(date: string, schedules: WorkSchedule[], offDays: number[] = []): DaySchedule | null {
  if (offDays.includes(dayOfWeek(date))) return null;
  const active = getActiveSchedule(date, schedules);
  if (!active) return null;
  return active.days.find((d) => d.dayOfWeek === dayOfWeek(date)) ?? null;
}

export function isWorkingDay(date: string, schedules: WorkSchedule[], offDays: number[] = []): boolean {
  return getDaySchedule(date, schedules, offDays) !== null;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Required seconds for a full day on this date, or null if it's a non-working day.
export function requiredSecondsForDate(date: string, schedules: WorkSchedule[], offDays: number[] = []): number | null {
  const day = getDaySchedule(date, schedules, offDays);
  if (!day) return null;
  return Math.max(0, (timeToMinutes(day.endTime) - timeToMinutes(day.startTime)) * 60);
}

export function formatTimeLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

// Status from seconds worked vs the required seconds for that specific date
// (from the schedule that was active then).
export function statusFromSeconds(secondsWorked: number, requiredSeconds: number): AttendanceStatus {
  if (requiredSeconds <= 0) return "present";
  if (secondsWorked >= requiredSeconds) return "present";
  if (secondsWorked >= requiredSeconds / 2) return "half_day";
  return "absent";
}

export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

export const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  half_day: "Half-Day",
  absent: "Absent",
  leave: "Leave",
};

// ---- Report building --------------------------------------------------------

type RawAttendanceRecord = {
  employeeId: number;
  date: string;
  checkIn: Date | string | null;
  checkOut: Date | string | null;
  secondsWorked: number | null;
  status: AttendanceStatus;
};

type RawApprovedLeave = { employeeId: number; fromDate: string; toDate: string };

export type ReportRow = {
  key: string;
  employeeId: number;
  employeeName: string;
  designation: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  secondsWorked: number | null;
  status: AttendanceStatus;
};

function formatTime(value: Date | string | null): string | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// Builds one row per employee per working day in the month: uses the actual
// attendance record if one exists, otherwise infers "leave" (approved leave
// covers the date) or "absent" (no record, no leave, not an off day).
export function buildAttendanceReport(
  employees: { id: number; name: string; designation: string }[],
  month: string,
  records: RawAttendanceRecord[],
  schedules: WorkSchedule[],
  approvedLeaves: RawApprovedLeave[],
  offDays: number[] = []
): ReportRow[] {
  const dates = datesInMonth(month);
  const rows: ReportRow[] = [];

  for (const emp of employees) {
    for (const date of dates) {
      if (!isWorkingDay(date, schedules, offDays)) continue;

      const existing = records.find((r) => r.employeeId === emp.id && r.date === date);
      if (existing) {
        rows.push({
          key: `${emp.id}-${date}`,
          employeeId: emp.id,
          employeeName: emp.name,
          designation: emp.designation,
          date,
          checkIn: formatTime(existing.checkIn),
          checkOut: formatTime(existing.checkOut),
          secondsWorked: existing.secondsWorked,
          status: existing.status,
        });
        continue;
      }

      const onLeave = approvedLeaves.some((l) => l.employeeId === emp.id && isDateWithinLeave(date, l));
      rows.push({
        key: `${emp.id}-${date}`,
        employeeId: emp.id,
        employeeName: emp.name,
        designation: emp.designation,
        date,
        checkIn: null,
        checkOut: null,
        secondsWorked: null,
        status: onLeave ? "leave" : "absent",
      });
    }
  }

  return rows.sort((a, b) => (a.date === b.date ? a.employeeName.localeCompare(b.employeeName) : b.date.localeCompare(a.date)));
}

// ---- Salary calculation --------------------------------------------------
// Basic salary is prorated per working day (basicSalary / workingDaysInMonth),
// then each day's earned amount is scaled by secondsWorked / requiredSeconds
// (capped at 1, so overtime doesn't earn extra) for second-level precision.
// Approved leave days count as a full paid day. Allowances are fixed and
// always paid in full, regardless of attendance.

export type SalaryBreakdown = {
  employeeId: number;
  employeeName: string;
  designation: string;
  basicSalary: number;
  allowances: number;
  workingDaysInMonth: number;
  daysPresent: number;
  daysHalfDay: number;
  daysAbsent: number;
  daysLeave: number;
  totalSecondsWorked: number;
  totalRequiredSeconds: number; // sum of each working day's required seconds (varies day to day now)
  earnedBasic: number; // rounded to nearest currency unit
  totalSalary: number; // earnedBasic + allowances
};

export function calculateSalary(
  employee: { id: number; name: string; designation: string; basicSalary: number; allowances: number },
  month: string,
  records: RawAttendanceRecord[],
  schedules: WorkSchedule[],
  approvedLeaves: { fromDate: string; toDate: string }[],
  offDays: number[] = []
): SalaryBreakdown {
  const dates = datesInMonth(month);
  const workingDates = dates.filter((d) => isWorkingDay(d, schedules, offDays));
  const workingDaysInMonth = workingDates.length || 1; // avoid div-by-zero
  const dailyRate = employee.basicSalary / workingDaysInMonth;

  let daysPresent = 0;
  let daysHalfDay = 0;
  let daysAbsent = 0;
  let daysLeave = 0;
  let totalSecondsWorked = 0;
  let totalRequiredSeconds = 0;
  let earnedBasic = 0;

  for (const date of workingDates) {
    const requiredSecondsForDay = requiredSecondsForDate(date, schedules, offDays) ?? 0;
    totalRequiredSeconds += requiredSecondsForDay;
    const record = records.find((r) => r.employeeId === employee.id && r.date === date);

    if (record) {
      const seconds = record.secondsWorked ?? 0;
      totalSecondsWorked += seconds;

      if (record.status === "leave") {
        daysLeave++;
        earnedBasic += dailyRate; // approved leave paid in full
      } else {
        const fraction = Math.min(1, requiredSecondsForDay > 0 ? seconds / requiredSecondsForDay : 0);
        earnedBasic += dailyRate * fraction;
        if (record.status === "present") daysPresent++;
        else if (record.status === "half_day") daysHalfDay++;
        else daysAbsent++;
      }
      continue;
    }

    const onLeave = approvedLeaves.some((l) => isDateWithinLeave(date, l));
    if (onLeave) {
      daysLeave++;
      earnedBasic += dailyRate;
    } else {
      daysAbsent++;
    }
  }

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    designation: employee.designation,
    basicSalary: employee.basicSalary,
    allowances: employee.allowances,
    workingDaysInMonth,
    daysPresent,
    daysHalfDay,
    daysAbsent,
    daysLeave,
    totalSecondsWorked,
    totalRequiredSeconds,
    earnedBasic: Math.round(earnedBasic),
    totalSalary: Math.round(earnedBasic) + employee.allowances,
  };
}
