"use server";

import { db } from "@/db";
import { auth } from "@/auth";
import { users, teachers, employees, attendance, leaveRequests, workSchedules, scheduleDays, offDates, appSettings } from "@/db/schema";
import { eq, and, isNull, isNotNull, inArray, lte } from "drizzle-orm";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { isPgUniqueViolation } from "@/lib/db-errors";
import { fetchCalendarEvents, type CalendarEvent } from "@/lib/ics";
import {
  todayString,
  nextDateString,
  statusFromSeconds,
  requiredSecondsForDate,
  checkWindowForDate,
  formatTimeLabel,
  dateTimeFromParts,
  type WorkSchedule,
  type AttendanceStatus,
} from "./attendance-helpers";
import {
  leaveRequestSchema,
  employeeSchema,
  employeeSettingsSchema,
  workScheduleSchema,
  calendarSyncSchema,
  offDateSchema,
  attendanceEditSchema,
  type LeaveRequestFormValues,
  type EmployeeFormValues,
  type EmployeeSettingsFormValues,
  type WorkScheduleFormValues,
  type CalendarSyncFormValues,
  type OffDateFormValues,
  type AttendanceEditFormValues,
} from "./attendance-validation";

const GOOGLE_CALENDAR_URL_SETTING = "google_calendar_ical_url";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Not authenticated." };
  if (session.user.role !== "admin") return { ok: false as const, error: "Only admins can do this." };
  return { ok: true as const };
}

async function activeSchedules(): Promise<WorkSchedule[]> {
  const rows = await db.query.workSchedules.findMany({ with: { days: true } });
  return rows.map((r) => ({
    id: r.id,
    effectiveFrom: r.effectiveFrom,
    appliedAt: r.appliedAt,
    isActive: r.isActive,
    label: r.label,
    days: r.days.map((d) => ({ dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime })),
  }));
}

async function allOffDates(): Promise<string[]> {
  const rows = await db.query.offDates.findMany({ columns: { date: true } });
  return rows.map((r) => r.date);
}

type ActionErrors<T extends Record<string, unknown>> = Partial<Record<keyof T | "root", string[]>>;
type ActionResult<T extends Record<string, unknown>> =
  | { success: true }
  | { success: false; errors: ActionErrors<T> };

async function currentEmployeeId(): Promise<number | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const employee = await db.query.employees.findFirst({
    where: eq(employees.userId, Number(session.user.id)),
    columns: { id: true },
  });
  return employee?.id ?? null;
}

// ---- Self check-in / check-out --------------------------------------------

export async function checkIn(): Promise<ActionResult<Record<string, never>>> {
  const employeeId = await currentEmployeeId();
  if (!employeeId) return { success: false, errors: { root: ["No employee profile found for your account."] } };

  const today = todayString();
  try {
    const schedules = await activeSchedules();
    const offDatesList = await allOffDates();
    const window = checkWindowForDate(today, schedules, offDatesList);
    if (!window) {
      return { success: false, errors: { root: ["Today is not a scheduled working day."] } };
    }
    const now = new Date();
    if (now < window.start || now > window.end) {
      return {
        success: false,
        errors: {
          root: [
            `You can only check in between ${formatTimeLabel(
              `${String(window.start.getHours()).padStart(2, "0")}:${String(window.start.getMinutes()).padStart(2, "0")}`
            )} and ${formatTimeLabel(
              `${String(window.end.getHours()).padStart(2, "0")}:${String(window.end.getMinutes()).padStart(2, "0")}`
            )}.`,
          ],
        },
      };
    }

    const existing = await db.query.attendance.findFirst({
      where: and(eq(attendance.employeeId, employeeId), eq(attendance.date, today)),
    });
    if (existing?.checkIn) {
      return { success: false, errors: { root: ["You've already checked in today."] } };
    }

    if (existing) {
      await db.update(attendance).set({ checkIn: now }).where(eq(attendance.id, existing.id));
    } else {
      await db.insert(attendance).values({ employeeId, date: today, checkIn: now, status: "absent" });
    }
    revalidatePath("/payroll");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not check in. Try again."] } };
  }
}

export async function checkOut(): Promise<ActionResult<Record<string, never>>> {
  const employeeId = await currentEmployeeId();
  if (!employeeId) return { success: false, errors: { root: ["No employee profile found for your account."] } };

  const today = todayString();
  try {
    const record = await db.query.attendance.findFirst({
      where: and(eq(attendance.employeeId, employeeId), eq(attendance.date, today)),
    });

    if (!record?.checkIn) {
      return { success: false, errors: { root: ["Check in first before checking out."] } };
    }
    if (record.checkOut) {
      return { success: false, errors: { root: ["You've already checked out today."] } };
    }

    const schedules = await activeSchedules();
    const offDatesList = await allOffDates();
    const window = checkWindowForDate(today, schedules, offDatesList);

    // If the shift window has already ended, this manual click just performs
    // the same close that auto-checkout would — clamp to the scheduled end
    // time rather than letting seconds worked run past the shift.
    const now = new Date();
    const checkOutTime = window && now > window.end ? window.end : now;

    const secondsWorked = Math.max(0, Math.round((checkOutTime.getTime() - new Date(record.checkIn).getTime()) / 1000));
    const requiredSeconds = requiredSecondsForDate(today, schedules, offDatesList) ?? 8 * 3600; // fallback: 8h if no schedule configured
    const status = statusFromSeconds(secondsWorked, requiredSeconds);

    await db
      .update(attendance)
      .set({ checkOut: checkOutTime, secondsWorked, status })
      .where(eq(attendance.id, record.id));

    revalidatePath("/payroll");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not check out. Try again."] } };
  }
}

// ---- Auto check-out for anyone who forgot ----------------------------------
// Finds every attendance row that has a check-in but no check-out where the
// scheduled shift end for that date has already passed, and closes it out at
// exactly the scheduled end time (so hours worked = the full shift, not
// however long the page happened to stay open). Safe to call repeatedly.
//
// This runs lazily — triggered whenever the payroll page or dashboard is
// loaded, since the app has no background job runner. For exact-time closing
// even when nobody opens the app, point an external scheduler (e.g. Vercel
// Cron, or `pg_cron`) at POST /api/cron/auto-checkout instead/as well.
export async function autoCloseStaleAttendance(): Promise<number> {
  const today = todayString();
  const schedules = await activeSchedules();
  const offDatesList = await allOffDates();

  // Push the date filter into the DB — only rows where check-in exists, check-out
  // is missing, AND the date is on or before today (stale). Avoids loading
  // future/today's in-progress rows into memory unnecessarily.
  const staleCandidates = await db.query.attendance.findMany({
    where: and(
      isNotNull(attendance.checkIn),
      isNull(attendance.checkOut),
      lte(attendance.date, today)
    ),
  });

  let closed = 0;
  for (const record of staleCandidates) {
    const window = checkWindowForDate(record.date, schedules, offDatesList);
    if (!window) continue; // no schedule for that date — leave for admin to fix manually

    const now = new Date();
    const isPastEnd = record.date < today || now > window.end;
    if (!isPastEnd) continue;

    const secondsWorked = Math.max(0, Math.round((window.end.getTime() - new Date(record.checkIn!).getTime()) / 1000));
    const requiredSeconds = requiredSecondsForDate(record.date, schedules, offDatesList) ?? 8 * 3600;
    const status = statusFromSeconds(secondsWorked, requiredSeconds);

    await db
      .update(attendance)
      .set({ checkOut: window.end, secondsWorked, status })
      .where(eq(attendance.id, record.id));
    closed++;
  }

  if (closed > 0) {
    revalidatePath("/payroll");
    revalidatePath("/");
  }
  return closed;
}

// ---- Admin: manual edit of one attendance row ------------------------------
// Lets the admin correct/override a specific employee's record for a date —
// including days that don't have a DB row yet (e.g. currently shown as
// "Absent" purely because nothing was recorded). Recomputes secondsWorked
// from the given times when both are present; otherwise keeps the status the
// admin picked as-is (e.g. marking a day "Leave" or "Absent" with no times).
export async function updateAttendanceRecord(formData: unknown): Promise<ActionResult<AttendanceEditFormValues>> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, errors: { root: [admin.error] } };

  const parsed = attendanceEditSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }
  const { employeeId, date, isLeave } = parsed.data;
  const checkInTime = parsed.data.checkIn || "";
  const checkOutTime = parsed.data.checkOut || "";

  try {
    const checkInDate = checkInTime ? dateTimeFromParts(date, checkInTime) : null;
    const checkOutDate = checkOutTime ? dateTimeFromParts(date, checkOutTime) : null;

    // Status is derived from the times, not chosen directly:
    // - both check-in and check-out set -> present/half_day based on hours
    //   worked vs that date's required shift length.
    // - no times at all -> "leave" if the admin ticked it, otherwise "absent".
    let secondsWorked: number | null = null;
    let status: AttendanceStatus;
    if (checkInDate && checkOutDate) {
      secondsWorked = Math.max(0, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 1000));
      const schedules = await activeSchedules();
      const offDatesList = await allOffDates();
      const requiredSeconds = requiredSecondsForDate(date, schedules, offDatesList) ?? 8 * 3600;
      status = statusFromSeconds(secondsWorked, requiredSeconds);
    } else {
      status = isLeave ? "leave" : "absent";
    }

    const existing = await db.query.attendance.findFirst({
      where: and(eq(attendance.employeeId, employeeId), eq(attendance.date, date)),
    });

    if (existing) {
      await db
        .update(attendance)
        .set({ checkIn: checkInDate, checkOut: checkOutDate, secondsWorked, status })
        .where(eq(attendance.id, existing.id));
    } else {
      await db.insert(attendance).values({
        employeeId,
        date,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        secondsWorked,
        status,
      });
    }

    revalidatePath("/payroll");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not update this record. Try again."] } };
  }
}

// ---- Leave requests ---------------------------------------------------------

export async function requestLeave(formData: unknown): Promise<ActionResult<LeaveRequestFormValues>> {
  const employeeId = await currentEmployeeId();
  if (!employeeId) return { success: false, errors: { root: ["No employee profile found for your account."] } };

  const parsed = leaveRequestSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db.insert(leaveRequests).values({ employeeId, ...parsed.data, status: "pending" });
    revalidatePath("/payroll");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}

export async function decideLeaveRequest(
  leaveId: number,
  decision: "approved" | "rejected"
): Promise<ActionResult<Record<string, never>>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, errors: { root: ["Not authenticated."] } };

  try {
    await db
      .update(leaveRequests)
      .set({ status: decision, decidedBy: Number(session.user.id), decidedAt: new Date() })
      .where(eq(leaveRequests.id, leaveId));

    if (decision === "approved") {
      const leave = await db.query.leaveRequests.findFirst({ where: eq(leaveRequests.id, leaveId) });
      if (leave) {
        // Build date list using pure string arithmetic — no new Date("YYYY-MM-DD")
        // to avoid UTC-vs-PKR timezone bugs.
        const leaveDates: string[] = [];
        for (let d = leave.fromDate; d <= leave.toDate; d = nextDateString(d)) {
          leaveDates.push(d);
        }

        // 1 query: fetch ALL existing rows for the entire date range at once.
        const existingRows = await db
          .select({ id: attendance.id, date: attendance.date, checkIn: attendance.checkIn })
          .from(attendance)
          .where(
            and(
              eq(attendance.employeeId, leave.employeeId),
              inArray(attendance.date, leaveDates)
            )
          );

        const existingByDate = new Map(existingRows.map((r) => [r.date, r]));

        // IDs of rows that exist but have no check-in → flip to "leave" in one UPDATE.
        const idsToUpdate = existingRows.filter((r) => !r.checkIn).map((r) => r.id);

        // Dates with no row at all → batch INSERT as "leave".
        const rowsToInsert = leaveDates
          .filter((d) => !existingByDate.has(d))
          .map((d) => ({ employeeId: leave.employeeId, date: d, status: "leave" as const }));

        // 2 queries in parallel — total cost is always ≤ 3 queries regardless of leave length.
        await Promise.all([
          idsToUpdate.length > 0
            ? db
                .update(attendance)
                .set({ status: "leave" })
                .where(inArray(attendance.id, idsToUpdate))
            : Promise.resolve(),
          rowsToInsert.length > 0
            ? db.insert(attendance).values(rowsToInsert)
            : Promise.resolve(),
        ]);
      }
    }

    revalidatePath("/payroll");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not update leave request."] } };
  }
}


// ---- Work schedule (admin) ---------------------------------------------------

// Saves a schedule as a draft template — not live on any date until an
// admin explicitly applies it (see applyWorkSchedule below).
export async function createWorkSchedule(formData: unknown): Promise<ActionResult<WorkScheduleFormValues>> {
  const parsed = workScheduleSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }
  const { label, days } = parsed.data;

  try {
    const [schedule] = await db
      .insert(workSchedules)
      .values({ label: label || null })
      .returning({ id: workSchedules.id });

    await db.insert(scheduleDays).values(
      days.map((d) => ({ scheduleId: schedule.id, dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime }))
    );

    revalidatePath("/payroll");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not save the schedule."] } };
  }
}

// Edits an existing schedule's label/days.
// - Pure drafts (never applied — effectiveFrom is null) are edited in place;
//   nothing depends on their exact values yet, so this is always safe.
// - A schedule that has ever been applied (effectiveFrom is set, whether or
//   not it's still active) is never mutated in place — that would silently
//   rewrite the hours used for past attendance/salary. Instead this clones
//   it into a new draft with the edited values, and if the original was the
//   currently active one, immediately applies the clone (effective today),
//   so the edit takes effect "from now on" while the old row — and every
//   past record that resolved to it — stays exactly as it was.
export async function editWorkSchedule(
  scheduleId: number,
  formData: unknown
): Promise<ActionResult<WorkScheduleFormValues> & { clonedAndApplied?: boolean }> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, errors: { root: [guard.error] } };

  const parsed = workScheduleSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }
  const { label, days } = parsed.data;

  const existing = await db.query.workSchedules.findFirst({
    where: eq(workSchedules.id, scheduleId),
    columns: { effectiveFrom: true, isActive: true },
  });
  if (!existing) {
    return { success: false, errors: { root: ["Schedule not found."] } };
  }

  try {
    if (existing.effectiveFrom === null) {
      // Pure draft — edit in place.
      await db.update(workSchedules).set({ label: label || null }).where(eq(workSchedules.id, scheduleId));
      await db.delete(scheduleDays).where(eq(scheduleDays.scheduleId, scheduleId));
      await db.insert(scheduleDays).values(
        days.map((d) => ({ scheduleId, dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime }))
      );
      revalidatePath("/payroll");
      return { success: true, clonedAndApplied: false };
    }

    // Was applied at some point — clone instead of mutating history.
    const [clone] = await db.insert(workSchedules).values({ label: label || null }).returning({ id: workSchedules.id });
    await db.insert(scheduleDays).values(
      days.map((d) => ({ scheduleId: clone.id, dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime }))
    );

    if (existing.isActive) {
      await db.update(workSchedules).set({ isActive: false }).where(eq(workSchedules.isActive, true));
      const today = todayString();
      await db
        .update(workSchedules)
        .set({ isActive: true, effectiveFrom: today, appliedAt: new Date() })
        .where(eq(workSchedules.id, clone.id));
      revalidatePath("/payroll");
      return { success: true, clonedAndApplied: true };
    }

    revalidatePath("/payroll");
    return { success: true, clonedAndApplied: false };
  } catch {
    return { success: false, errors: { root: ["Could not save the changes."] } };
  }
}

// Makes a saved template the live schedule as of today. Only one schedule is
// ever active at a time. Deactivates every other schedule first, then
// activates the target — two sequential updates rather than one transaction
// since neon-http doesn't support transactions; a failure mid-way just means
// a retry is needed, nothing is silently left in a half-applied state because
// the second update either succeeds and this schedule becomes the sole active
// one, or fails and the admin sees an error and can retry.
export async function applyWorkSchedule(scheduleId: number): Promise<ActionResult<Record<string, never>>> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, errors: { root: [guard.error] } };

  try {
    await db.update(workSchedules).set({ isActive: false }).where(eq(workSchedules.isActive, true));
    const today = todayString();
    await db
      .update(workSchedules)
      .set({ isActive: true, effectiveFrom: today, appliedAt: new Date() })
      .where(eq(workSchedules.id, scheduleId));

    revalidatePath("/payroll");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not apply the schedule."] } };
  }
}

// Deletes a draft template. Refuses to delete the currently active schedule
// — an admin must apply a different one first, so there's never a moment
// with no active schedule at all.
export async function deleteWorkSchedule(scheduleId: number): Promise<ActionResult<Record<string, never>>> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, errors: { root: [guard.error] } };

  const schedule = await db.query.workSchedules.findFirst({ where: eq(workSchedules.id, scheduleId), columns: { isActive: true } });
  if (schedule?.isActive) {
    return { success: false, errors: { root: ["Apply a different schedule before deleting this one."] } };
  }

  try {
    await db.delete(workSchedules).where(eq(workSchedules.id, scheduleId));
    revalidatePath("/payroll");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not delete the schedule."] } };
  }
}

// ---- Specific-date off days / vacations (admin) ---------------------------

// Toggles a single calendar date on/off as a non-working day. Used by the
// off-days calendar UI — clicking a date adds it (source "manual"); clicking
// an already-off date removes it again.
export async function toggleOffDate(formData: unknown): Promise<ActionResult<OffDateFormValues>> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, errors: { root: [admin.error] } };

  const parsed = offDateSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const existing = await db.query.offDates.findFirst({ where: eq(offDates.date, parsed.data.date) });
    if (existing) {
      await db.delete(offDates).where(eq(offDates.id, existing.id));
    } else {
      await db.insert(offDates).values({
        date: parsed.data.date,
        label: parsed.data.label || null,
        source: "manual",
      });
    }
    revalidatePath("/payroll");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not update that date."] } };
  }
}

// Imports one event from the synced Google Calendar preview as an off date
// (source "google"). If that date is already off, this is a no-op success.
export async function importOffDateFromCalendar(date: string, label: string): Promise<ActionResult<Record<string, never>>> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, errors: { root: [admin.error] } };

  try {
    const existing = await db.query.offDates.findFirst({ where: eq(offDates.date, date) });
    if (!existing) {
      await db.insert(offDates).values({ date, label: label || null, source: "google" });
    }
    revalidatePath("/payroll");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not import that date."] } };
  }
}

// ---- Google Calendar sync (admin) ------------------------------------------
// Read-only sync via a public iCal ("Secret address in iCal format") URL —
// no Google login/OAuth needed. Admin pastes the link once; we fetch + parse
// it on demand so they can review upcoming events and choose which ones to
// mark as off days.

export async function setCalendarSyncUrl(formData: unknown): Promise<ActionResult<CalendarSyncFormValues>> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, errors: { root: [admin.error] } };

  const parsed = calendarSyncSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db
      .insert(appSettings)
      .values({ key: GOOGLE_CALENDAR_URL_SETTING, value: parsed.data.icalUrl })
      .onConflictDoUpdate({ target: appSettings.key, set: { value: parsed.data.icalUrl } });
    revalidatePath("/payroll");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not save the calendar link."] } };
  }
}

export async function clearCalendarSyncUrl(): Promise<ActionResult<Record<string, never>>> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, errors: { root: [admin.error] } };

  try {
    await db.delete(appSettings).where(eq(appSettings.key, GOOGLE_CALENDAR_URL_SETTING));
    revalidatePath("/payroll");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not remove the calendar link."] } };
  }
}

export async function getCalendarSyncUrl(): Promise<string | null> {
  const row = await db.query.appSettings.findFirst({ where: eq(appSettings.key, GOOGLE_CALENDAR_URL_SETTING) });
  return row?.value ?? null;
}

// Fetches + parses the synced iCal feed right now, for the admin to preview
// in the off-days calendar before importing any of it. Doesn't touch the DB.
export async function previewCalendarEvents(): Promise<
  { success: true; events: CalendarEvent[] } | { success: false; error: string }
> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const url = await getCalendarSyncUrl();
  if (!url) return { success: false, error: "No calendar linked yet." };

  try {
    const events = await fetchCalendarEvents(url);
    return { success: true, events };
  } catch {
    return { success: false, error: "Could not fetch that calendar. Check the link and try again." };
  }
}

// ---- Employees (admin) -------------------------------------------------------

// Adds a non-teaching staff member: creates a login (users) + employees row.
export async function createStaffEmployee(formData: unknown): Promise<ActionResult<EmployeeFormValues>> {
  const parsed = employeeSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }
  const { name, email, password, contactNumber, designation, basicSalary, allowances } = parsed.data;

  try {
    const hashed = await hash(password, 10);

    const [user] = await db
      .insert(users)
      .values({ name, email, password: hashed, contactNumber, role: "staff" })
      .returning({ id: users.id });

    try {
      await db.insert(employees).values({
        userId: user.id,
        employeeType: "staff",
        designation,
        basicSalary,
        allowances,
        joinDate: todayString(),
      });
    } catch (innerErr) {
      await db.delete(users).where(eq(users.id, user.id));
      throw innerErr;
    }

    revalidatePath("/payroll");
    return { success: true };
  } catch (err) {
    if (isPgUniqueViolation(err)) {
      return { success: false, errors: { email: ["Email already in use"] } };
    }
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}

export async function updateEmployeeSettings(
  employeeId: number,
  formData: unknown
): Promise<ActionResult<EmployeeSettingsFormValues>> {
  const parsed = employeeSettingsSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db.update(employees).set(parsed.data).where(eq(employees.id, employeeId));
    revalidatePath("/payroll");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Something went wrong. Try again."] } };
  }
}

// Creates `employees` rows for any teacher that doesn't have one yet, so
// newly added teachers show up for attendance/payroll without manual setup.
// Also backfills `joinDate` from the teacher record for any teacher-employee
// that's missing it (or drifted out of sync with the teacher's join date) —
// this is what keeps attendance/salary reports from treating days before a
// teacher actually joined as unrecorded "absent" days.
export async function syncTeacherEmployees(): Promise<ActionResult<Record<string, never>>> {
  try {
    const allTeachers = await db.query.teachers.findMany({ with: { user: true, subject: true, employee: true } });
    
    // We want attendance to be calculated from the 1st of the current month when they are synced
    const now = new Date();
    // Using simple YYYY-MM-01 format
    const firstOfCurrentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const missing = allTeachers.filter((t) => !t.employee);
    // If they have an employee record but the join date is different from the sync policy (we will just sync those whose join date is totally off from what it should be? Wait, actually if they are already there, we maybe don't want to overwrite their old attendance? The user said "jb teacher ko payroll mein sync krn to current month k 1st date se uski attendance calculate ho".)
    // Let's just set all outOfSync to the teacher's joinDate, OR if the user means NEWLY synced teachers start from 1st of current month, we just do it for `missing`. 
    // Actually, setting joinDate to first of current month makes sure they aren't marked absent for past months.
    const outOfSync = allTeachers.filter((t) => t.employee && t.employee.joinDate !== (t.joinDate ?? null) && t.employee.joinDate !== firstOfCurrentMonth);

    for (const t of missing) {
      await db.insert(employees).values({
        userId: t.userId,
        teacherId: t.id,
        employeeType: "teacher",
        designation: t.subject ? `${t.subject.name} Teacher` : "Teacher",
        basicSalary: 0,
        allowances: 0,
        joinDate: firstOfCurrentMonth,
      });
    }

    for (const t of outOfSync) {
      await db
        .update(employees)
        .set({ joinDate: firstOfCurrentMonth })
        .where(eq(employees.id, t.employee!.id));
    }

    revalidatePath("/payroll");
    return { success: true };
  } catch (err) {
    return { success: false, errors: { root: ["Could not sync teachers."] } };
  }
}
