"use server";

import { db } from "@/db";
import { auth } from "@/auth";
import { users, teachers, employees, attendance, leaveRequests, offDays } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { isPgUniqueViolation } from "@/lib/db-errors";
import { todayString, statusFromMinutes } from "./attendance-helpers";
import {
  leaveRequestSchema,
  employeeSchema,
  employeeSettingsSchema,
  type LeaveRequestFormValues,
  type EmployeeFormValues,
  type EmployeeSettingsFormValues,
} from "./attendance-validation";

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
    const [record, employee] = await Promise.all([
      db.query.attendance.findFirst({ where: and(eq(attendance.employeeId, employeeId), eq(attendance.date, today)) }),
      db.query.employees.findFirst({ where: eq(employees.id, employeeId), columns: { shiftHours: true } }),
    ]);

    if (!record?.checkIn) {
      return { success: false, errors: { root: ["Check in first before checking out."] } };
    }
    if (record.checkOut) {
      return { success: false, errors: { root: ["You've already checked out today."] } };
    }

    const checkOutTime = new Date();
    const minutesWorked = Math.max(0, Math.round((checkOutTime.getTime() - new Date(record.checkIn).getTime()) / 60000));
    const status = statusFromMinutes(minutesWorked, employee?.shiftHours ?? 8);

    await db
      .update(attendance)
      .set({ checkOut: checkOutTime, hoursWorked: minutesWorked, status })
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

// ---- Off days (admin) -------------------------------------------------------

export async function setOffDays(days: number[]): Promise<ActionResult<Record<string, never>>> {
  try {
    await db.delete(offDays);
    if (days.length > 0) {
      await db.insert(offDays).values(days.map((dayOfWeek) => ({ dayOfWeek })));
    }
    revalidatePath("/payroll");
    return { success: true };
  } catch {
    return { success: false, errors: { root: ["Could not update off days."] } };
  }
}

// ---- Employees (admin) -------------------------------------------------------

// Adds a non-teaching staff member: creates a login (users) + employees row.
export async function createStaffEmployee(formData: unknown): Promise<ActionResult<EmployeeFormValues>> {
  const parsed = employeeSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }
  const { name, email, password, contactNumber, designation, shiftHours, basicSalary, allowances } = parsed.data;

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
        shiftHours,
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
        shiftHours: 8,
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
