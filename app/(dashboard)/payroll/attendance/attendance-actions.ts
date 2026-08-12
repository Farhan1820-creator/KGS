"use server";

import { db } from "@/db";
import { auth } from "@/auth";
import { users, teachers, employees, attendance, leaveRequests, workSchedules, scheduleDays, offDays } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { isPgUniqueViolation } from "@/lib/db-errors";
import { todayString, statusFromSeconds, requiredSecondsForDate, type WorkSchedule } from "./attendance-helpers";
import {
  leaveRequestSchema,
  employeeSchema,
  employeeSettingsSchema,
  workScheduleSchema,
  type LeaveRequestFormValues,
  type EmployeeFormValues,
  type EmployeeSettingsFormValues,
  type WorkScheduleFormValues,
} from "./attendance-validation";

async function activeSchedules(): Promise<WorkSchedule[]> {
  const rows = await db.query.workSchedules.findMany({ with: { days: true } });
  return rows.map((r) => ({
    id: r.id,
    effectiveFrom: r.effectiveFrom,
    label: r.label,
    days: r.days.map((d) => ({ dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime })),
  }));
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
    const existing = await db.query.attendance.findFirst({
      where: and(eq(attendance.employeeId, employeeId), eq(attendance.date, today)),
    });
    if (existing?.checkIn) {
      return { success: false, errors: { root: ["You've already checked in today."] } };
    }

    if (existing) {
      await db.update(attendance).set({ checkIn: new Date() }).where(eq(attendance.id, existing.id));
    } else {
      await db.insert(attendance).values({ employeeId, date: today, checkIn: new Date(), status: "absent" });
    }
    revalidatePath("/payroll");
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

    const checkOutTime = new Date();
    const secondsWorked = Math.max(0, Math.round((checkOutTime.getTime() - new Date(record.checkIn).getTime()) / 1000));
    const schedules = await activeSchedules();
    const requiredSeconds = requiredSecondsForDate(today, schedules) ?? 8 * 3600; // fallback: 8h if no schedule configured
    const status = statusFromSeconds(secondsWorked, requiredSeconds);

    await db
      .update(attendance)
      .set({ checkOut: checkOutTime, secondsWorked, status })
      .where(eq(attendance.id, record.id));

    revalidatePath("/payroll");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not check out. Try again."] } };
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

    // If approved, mark each covered date (that isn't already a checked-in day) as "leave".
    if (decision === "approved") {
      const leave = await db.query.leaveRequests.findFirst({ where: eq(leaveRequests.id, leaveId) });
      if (leave) {
        const start = new Date(leave.fromDate);
        const end = new Date(leave.toDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().slice(0, 10);
          const existing = await db.query.attendance.findFirst({
            where: and(eq(attendance.employeeId, leave.employeeId), eq(attendance.date, dateStr)),
          });
          if (existing) {
            if (!existing.checkIn) {
              await db.update(attendance).set({ status: "leave" }).where(eq(attendance.id, existing.id));
            }
          } else {
            await db.insert(attendance).values({ employeeId: leave.employeeId, date: dateStr, status: "leave" });
          }
        }
      }
    }

    revalidatePath("/payroll");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not update leave request."] } };
  }
}

// ---- Work schedule (admin) ---------------------------------------------------

// Adds a new schedule effective from a given date onward. Past attendance and
// salary are unaffected — they keep whatever schedule was active on the day.
export async function createWorkSchedule(formData: unknown): Promise<ActionResult<WorkScheduleFormValues>> {
  const parsed = workScheduleSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }
  const { effectiveFrom, label, days } = parsed.data;

  try {
    const [schedule] = await db
      .insert(workSchedules)
      .values({ effectiveFrom, label: label || null })
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

// ---- Off days (admin) ----------------------------------------------------

// Replaces the global set of weekly off days (0=Sunday..6=Saturday) in one
// go. There's no db.transaction() on this driver, so this does a delete-then
// -insert; a brief window where the table is empty is fine for a low-traffic
// settings action like this one.
export async function setOffDays(days: number[]): Promise<ActionResult<Record<string, never>>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, errors: { root: ["Not authenticated."] } };
  if (session.user.role !== "admin") return { success: false, errors: { root: ["Only admins can change off days."] } };

  const uniqueDays = Array.from(new Set(days)).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);

  try {
    await db.delete(offDays);
    if (uniqueDays.length > 0) {
      await db.insert(offDays).values(uniqueDays.map((dayOfWeek) => ({ dayOfWeek })));
    }
    revalidatePath("/payroll");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not save off days."] } };
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
export async function syncTeacherEmployees(): Promise<ActionResult<Record<string, never>>> {
  try {
    const allTeachers = await db.query.teachers.findMany({ with: { user: true, subject: true, employee: true } });
    const missing = allTeachers.filter((t) => !t.employee);

    for (const t of missing) {
      await db.insert(employees).values({
        userId: t.userId,
        teacherId: t.id,
        employeeType: "teacher",
        designation: t.subject ? `${t.subject.name} Teacher` : "Teacher",
        basicSalary: 0,
        allowances: 0,
      });
    }

    revalidatePath("/payroll");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not sync teachers."] } };
  }
}
