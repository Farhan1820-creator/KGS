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

export function isOffDay(date: string, offDays: Set<number>): boolean {
  return offDays.has(dayOfWeek(date));
}

export function isDateWithinLeave(date: string, leave: { fromDate: string; toDate: string }): boolean {
  return date >= leave.fromDate && date <= leave.toDate;
}

// Status from minutes worked vs the employee's required shift, once checked out.
export function statusFromMinutes(minutesWorked: number, shiftHours: number): AttendanceStatus {
  const requiredMinutes = shiftHours * 60;
  if (minutesWorked >= requiredMinutes) return "present";
  if (minutesWorked >= requiredMinutes / 2) return "half_day";
  return "absent";
}

export function formatMinutes(minutes: number | null): string {
  if (!minutes || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
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
  hoursWorked: number | null;
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
  hoursWorked: number | null;
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
  offDays: Set<number>,
  approvedLeaves: RawApprovedLeave[]
): ReportRow[] {
  const dates = datesInMonth(month);
  const rows: ReportRow[] = [];

  for (const emp of employees) {
    for (const date of dates) {
      if (isOffDay(date, offDays)) continue;

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
          hoursWorked: existing.hoursWorked,
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
        hoursWorked: null,
        status: onLeave ? "leave" : "absent",
      });
    }
  }

  return rows.sort((a, b) => (a.date === b.date ? a.employeeName.localeCompare(b.employeeName) : b.date.localeCompare(a.date)));
}
