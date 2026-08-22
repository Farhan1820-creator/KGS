// ---- Timezone-aware date helpers -------------------------------------------
// Pakistan Standard Time is UTC+5. Using toLocaleDateString with en-CA locale
// gives a guaranteed YYYY-MM-DD format across all JS engines. This prevents
// the classic midnight UTC bug where checking in at 11 PM PKT would record
// tomorrow's date because new Date().toISOString() is in UTC.

const PKR_TIMEZONE = "Asia/Karachi";

export function todayString(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: PKR_TIMEZONE });
}

export function currentMonth(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: PKR_TIMEZONE }).slice(0, 7);
}

// Advances a "YYYY-MM-DD" string by one calendar day using pure string
// arithmetic — no Date constructor involved, so there's no UTC-vs-local
// ambiguity. Safe to use in loops that iterate over a date range.
export function nextDateString(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate(); // last day of this month
  if (d < daysInMonth) {
    return `${y}-${String(m).padStart(2, "0")}-${String(d + 1).padStart(2, "0")}`;
  }
  // roll over to the next month (and possibly next year)
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear  = m === 12 ? y + 1 : y;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}


// Shared helpers for attendance status/hours math. Kept framework-agnostic
// (no db import) so both server queries and client components can use them.

export type AttendanceStatus = "present" | "half_day" | "absent" | "leave";

// All "YYYY-MM-DD" dates in a given "YYYY-MM" month, up to (and including) today
// if the month is the current month, otherwise the full month.
export function datesInMonth(month: string): string[] {
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  // Use PKR-aware today so the cutoff is correct in Pakistan time
  const todayPkr = todayString(); // "YYYY-MM-DD" in PKR timezone
  const todayDay = Number(todayPkr.slice(8, 10));
  const todayMonth = todayPkr.slice(0, 7);
  const isCurrentMonth = `${year}-${String(monthNum).padStart(2, "0")}` === todayMonth;
  const lastDay = isCurrentMonth ? todayDay : daysInMonth;

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
export type WorkSchedule = {
  id: number;
  // Null = draft template, never applied — not live on any date.
  effectiveFrom: string | null;
  // When it was applied; only used to break ties if two schedules somehow
  // share the same effectiveFrom date (shouldn't normally happen, since
  // applying one always deactivates the rest, but this keeps the picture
  // unambiguous either way).
  appliedAt: string | Date | null;
  isActive: boolean;
  label: string | null;
  days: DaySchedule[];
};

// Picks whichever schedule was actually in effect on `date` — the applied
// schedule with the latest effectiveFrom that is still <= date, breaking
// ties by whichever was applied more recently. Draft (never-applied)
// templates are ignored. Past dates naturally resolve to whatever schedule
// was live back then, so historical salary/attendance stays accurate even
// though today's admin only ever sees one "Active" schedule.
export function getActiveSchedule(date: string, schedules: WorkSchedule[]): WorkSchedule | null {
  const applicable = schedules.filter((s): s is WorkSchedule & { effectiveFrom: string } => s.effectiveFrom !== null && s.effectiveFrom <= date);
  if (applicable.length === 0) return null;
  return applicable.reduce((latest, s) => {
    if (s.effectiveFrom !== latest.effectiveFrom) return s.effectiveFrom > latest.effectiveFrom ? s : latest;
    const sTime = s.appliedAt ? new Date(s.appliedAt).getTime() : 0;
    const latestTime = latest.appliedAt ? new Date(latest.appliedAt).getTime() : 0;
    return sTime > latestTime ? s : latest;
  });
}

// Returns this date's start/end timing, or null if it's a non-working day —
// either because the schedule active on that date has no entry for this
// weekday (the weekly pattern itself marks that day off), or because this
// exact date is a specific holiday/vacation (see `offDates` — "YYYY-MM-DD"
// strings, from the Holidays calendar / synced Google Calendar), which
// overrides the weekly pattern regardless of what it says for that weekday.
export function getDaySchedule(date: string, schedules: WorkSchedule[], offDates: string[] = []): DaySchedule | null {
  if (offDates.includes(date)) return null;
  const active = getActiveSchedule(date, schedules);
  if (!active) return null;
  return active.days.find((d) => d.dayOfWeek === dayOfWeek(date)) ?? null;
}

export function isWorkingDay(date: string, schedules: WorkSchedule[], offDates: string[] = []): boolean {
  return getDaySchedule(date, schedules, offDates) !== null;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Required seconds for a full day on this date, or null if it's a non-working day.
export function requiredSecondsForDate(date: string, schedules: WorkSchedule[], offDates: string[] = []): number | null {
  const day = getDaySchedule(date, schedules, offDates);
  if (!day) return null;
  return Math.max(0, (timeToMinutes(day.endTime) - timeToMinutes(day.startTime)) * 60);
}

// Builds a real Date object for "HH:MM" on a given "YYYY-MM-DD" date, in
// server-local time. Used to compare "now" against a shift's start/end, and
// to stamp an auto check-out at the exact scheduled end time.
export function dateTimeFromParts(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

// Whether `now` falls within [start, end] of the shift scheduled for `date`.
// Returns false (and no window) on off days / days with no schedule.
export function checkWindowForDate(
  date: string,
  schedules: WorkSchedule[],
  offDates: string[] = []
): { start: Date; end: Date } | null {
  const day = getDaySchedule(date, schedules, offDates);
  if (!day) return null;
  return { start: dateTimeFromParts(date, day.startTime), end: dateTimeFromParts(date, day.endTime) };
}

export function formatTimeLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

// Status from seconds worked vs the required seconds for that specific date
// (from the schedule that was active then). Only called once a check-in
// already exists (manual check-out / auto check-out), so "absent" is never
// the outcome here — an employee who checked in, even for a single minute,
// is at minimum a "half_day"; only a full shift's worth of seconds counts
// as "present". Days with no check-in at all stay "absent" elsewhere
// (the default row status / the report builder), never through this path.
export function statusFromSeconds(secondsWorked: number, requiredSeconds: number): AttendanceStatus {
  if (requiredSeconds <= 0) return "present";
  if (secondsWorked >= requiredSeconds) return "present";
  return "half_day";
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

// ---- School timing / vacations summary (used on teacher & student dashboards) --

export type OffDateEntry = { date: string; label: string | null };

// Today's active schedule, formatted for a simple "school timing" display —
// e.g. what a teacher/student dashboard shows so everyone knows today's hours
// without digging into the attendance/payroll page.
export function todaySchoolTiming(schedules: WorkSchedule[], offDates: string[] = []) {
  const today = todayString();
  const active = getActiveSchedule(today, schedules);
  const day = getDaySchedule(today, schedules, offDates);
  return {
    scheduleLabel: active?.label ?? null,
    isOffToday: day === null,
    startTime: day?.startTime ?? null,
    endTime: day?.endTime ?? null,
  };
}

// The full weekly timing table for the schedule active today — used to show
// "Mon–Fri 8:00–14:00, Sat 8:00–12:00" style listings on dashboards.
export function activeWeeklyTiming(schedules: WorkSchedule[]): DaySchedule[] {
  const active = getActiveSchedule(todayString(), schedules);
  if (!active) return [];
  return active.days.slice().sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

// Upcoming specific-date off days (holidays/vacations) from today onward,
// nearest first, capped to `limit`.
export function upcomingOffDates(offDates: OffDateEntry[], limit = 8): OffDateEntry[] {
  const today = todayString();
  return offDates
    .filter((d) => d.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

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
// Dates before `joinDate` (when set) are skipped entirely — an employee
// can't be "absent" from a job they hadn't joined yet.
export function buildAttendanceReport(
  employees: { id: number; name: string; designation: string; joinDate?: string | null }[],
  month: string,
  records: RawAttendanceRecord[],
  schedules: WorkSchedule[],
  approvedLeaves: RawApprovedLeave[],
  offDates: string[] = []
): ReportRow[] {
  const dates = datesInMonth(month);
  const rows: ReportRow[] = [];

  for (const emp of employees) {
    for (const date of dates) {
      if (emp.joinDate && date < emp.joinDate) continue;

      const existing = records.find((r) => r.employeeId === emp.id && r.date === date);
      if (existing) {
        // Still checked in with no check-out yet (today, shift in progress):
        // the stored status is just the "absent" placeholder set at check-in
        // time and hasn't been finalized. Show the real, currently-true
        // status instead — computed live from elapsed seconds — so the
        // table never displays "Absent" for someone who's actually
        // checked in and working right now.
        let displayStatus = existing.status;
        let displaySeconds = existing.secondsWorked;
        if (existing.checkIn && !existing.checkOut && date === todayString()) {
          const elapsedSeconds = Math.max(0, Math.round((Date.now() - new Date(existing.checkIn).getTime()) / 1000));
          const requiredSeconds = requiredSecondsForDate(date, schedules, offDates) ?? 8 * 3600;
          displayStatus = statusFromSeconds(elapsedSeconds, requiredSeconds);
          displaySeconds = elapsedSeconds;
        }
        rows.push({
          key: `${emp.id}-${date}`,
          employeeId: emp.id,
          employeeName: emp.name,
          designation: emp.designation,
          date,
          checkIn: formatTime(existing.checkIn),
          checkOut: formatTime(existing.checkOut),
          secondsWorked: displaySeconds,
          status: displayStatus,
        });
        continue;
      }

      // No record for this date. If it's a non-working day (weekly off or a
      // holiday), skip it entirely rather than inventing a row for it — only
      // the four real statuses (Present / Half-Day / Leave / Absent) ever
      // appear in the attendance table now.
      if (!isWorkingDay(date, schedules, offDates)) {
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
  employee: { id: number; name: string; designation: string; basicSalary: number; allowances: number; joinDate?: string | null },
  month: string,
  records: RawAttendanceRecord[],
  schedules: WorkSchedule[],
  approvedLeaves: { fromDate: string; toDate: string }[],
  offDates: string[] = []
): SalaryBreakdown {
  const dates = datesInMonth(month);
  // Days before the employee joined are excluded entirely — they're neither
  // "absent" nor part of the denominator basic salary is prorated over, so a
  // teacher who joined mid-month isn't docked for days they weren't employed.
  const workingDates = dates
    .filter((d) => isWorkingDay(d, schedules, offDates))
    .filter((d) => !employee.joinDate || d >= employee.joinDate);
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
    const requiredSecondsForDay = requiredSecondsForDate(date, schedules, offDates) ?? 0;
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
