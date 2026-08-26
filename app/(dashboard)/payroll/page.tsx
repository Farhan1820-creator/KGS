import type { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { attendance, employees, leaveRequests } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { PayrollTabs } from "./payroll-tabs";
import { SalaryView } from "./payroll/salary-view";
import { MySalaryView } from "./payroll/my-salary-view";
import { AdminAttendanceView } from "./attendance/admin-attendance-view";
import { MyAttendanceView } from "./attendance/my-attendance-view";
import { buildAttendanceReport, calculateSalary, currentMonth, todayString, type WorkSchedule } from "./attendance/attendance-helpers";
import { getCalendarSyncUrl, autoCloseStaleAttendance } from "./attendance/attendance-actions";
import type { PendingLeaveRow } from "./attendance/leave-approvals";
import type { EmployeeRow } from "./attendance/employees-panel";

export const dynamic = "force-dynamic";

interface PayrollPageProps {
  searchParams: Promise<{ tab?: string; month?: string }>;
}

export default async function PayrollPage({ searchParams }: PayrollPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const month = params.month || currentMonth();
  const tab = params.tab === "payroll" ? "payroll" : "attendance";
  const role = session.user.role;

  if (role !== "admin" && role !== "teacher" && role !== "staff") {
    redirect("/");
  }

  // Close out anyone who forgot to check out past their scheduled shift end
  // before we read attendance for this page (see attendance-actions.ts).
  await autoCloseStaleAttendance();

  const [scheduleRows, offDateRows, calendarSyncUrl] = await Promise.all([
    db.query.workSchedules.findMany({ with: { days: true } }),
    db.query.offDates.findMany(),
    getCalendarSyncUrl(),
  ]);

  const schedules: WorkSchedule[] = scheduleRows.map((r) => ({
    id: r.id,
    effectiveFrom: r.effectiveFrom,
    appliedAt: r.appliedAt,
    isActive: r.isActive,
    label: r.label,
    days: r.days.map((d) => ({ dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime })),
  }));

  const offDatesList = offDateRows.map((d) => d.date);
  const offDatesForUi = offDateRows.map((d) => ({ date: d.date, label: d.label, source: d.source }));

  const y = parseInt(month.slice(0, 4), 10);
  const m = parseInt(month.slice(5, 7), 10);
  const nextMonthStart = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}-01`;
  const monthStart = `${month}-01`;


  let attendanceContent: ReactNode;
  let payrollContent: ReactNode;

  if (role === "admin") {
    const [employeeRows, monthAttendance, approvedLeaves, pendingLeaveRows] = await Promise.all([
      db.query.employees.findMany({ with: { user: true } }),
      db.query.attendance.findMany({ where: and(gte(attendance.date, monthStart), lt(attendance.date, nextMonthStart)) }),
      db.query.leaveRequests.findMany({ where: eq(leaveRequests.status, "approved") }),
      db.query.leaveRequests.findMany({
        where: eq(leaveRequests.status, "pending"),
        with: { employee: { with: { user: true } } },
        orderBy: (t, { asc }) => [asc(t.createdAt)],
      }),
    ]);

    // Only requests that overlap the month currently selected in the month
    // picker — a request "belongs" to this month if its from/to date range
    // touches it at all, even if it spans into an adjacent month.
    const pendingLeaveRowsThisMonth = pendingLeaveRows.filter(
      (l) => l.fromDate.slice(0, 7) <= month && l.toDate.slice(0, 7) >= month
    );

    const employeeList = employeeRows.map((e) => ({ id: e.id, name: e.user.name, designation: e.designation, joinDate: e.joinDate }));

    const rawRecords = monthAttendance.map((a) => ({
      employeeId: a.employeeId,
      date: a.date,
      checkIn: a.checkIn,
      checkOut: a.checkOut,
      secondsWorked: a.secondsWorked,
      status: a.status,
    }));

    const records = buildAttendanceReport(
      employeeList,
      month,
      rawRecords,
      schedules,
      approvedLeaves.map((l) => ({ employeeId: l.employeeId, fromDate: l.fromDate, toDate: l.toDate })),
      offDatesList
    );

    const pendingLeaves: PendingLeaveRow[] = pendingLeaveRowsThisMonth.map((l) => ({
      id: l.id,
      employeeName: l.employee.user.name,
      fromDate: l.fromDate,
      toDate: l.toDate,
      reason: l.reason,
    }));

    const employeesForPanel: EmployeeRow[] = employeeRows.map((e) => ({
      id: e.id,
      name: e.user.name,
      designation: e.designation,
      employeeType: e.employeeType,
      basicSalary: e.basicSalary,
      allowances: e.allowances,
    }));

    attendanceContent = (
      <AdminAttendanceView
        month={month}
        records={records}
        employeeOptions={employeeList.map((e) => ({ id: e.id, name: e.name }))}
        pendingLeaves={pendingLeaves}
        employees={employeesForPanel}
        schedules={schedules}
        offDates={offDatesForUi}
        calendarSyncUrl={calendarSyncUrl}
      />
    );

    const salaries = employeeRows.map((e) =>
      calculateSalary(
        {
          id: e.id,
          name: e.user.name,
          designation: e.designation,
          basicSalary: e.basicSalary,
          allowances: e.allowances,
          joinDate: e.joinDate,
        },
        month,
        rawRecords,
        schedules,
        approvedLeaves.filter((l) => l.employeeId === e.id).map((l) => ({ fromDate: l.fromDate, toDate: l.toDate })),
        offDatesList
      )
    );

    payrollContent = <SalaryView month={month} salaries={salaries} />;
  } else {
    const employee = await db.query.employees.findFirst({ where: eq(employees.userId, Number(session.user.id)) });

    if (!employee) {
      const emptyState = (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Your employee profile isn&apos;t set up yet. Contact the admin.
        </div>
      );
      attendanceContent = emptyState;
      payrollContent = emptyState;
    } else {
      const [attendanceRows, myLeaves] = await Promise.all([
        db.query.attendance.findMany({
          where: and(
            eq(attendance.employeeId, employee.id),
            gte(attendance.date, monthStart),
            lt(attendance.date, nextMonthStart)
          ),
        }),
        db.query.leaveRequests.findMany({
          where: eq(leaveRequests.employeeId, employee.id),
          orderBy: (t, { desc }) => [desc(t.createdAt)],
        }),
      ]);

      // Only this employee's leave requests that overlap the currently
      // selected month (same "belongs to this month" rule as the admin view).
      const myLeavesThisMonth = myLeaves.filter((l) => l.fromDate.slice(0, 7) <= month && l.toDate.slice(0, 7) >= month);

      const today = todayString();
      const todayRecord = attendanceRows.find((a) => a.date === today) ?? null;

      const approvedOwnLeaves = myLeaves
        .filter((l) => l.status === "approved")
        .map((l) => ({ employeeId: employee.id, fromDate: l.fromDate, toDate: l.toDate }));

      const rawRecords = attendanceRows.map((a) => ({
        employeeId: a.employeeId,
        date: a.date,
        checkIn: a.checkIn,
        checkOut: a.checkOut,
        secondsWorked: a.secondsWorked,
        status: a.status,
      }));

      const history = buildAttendanceReport(
        [{ id: employee.id, name: "", designation: "", joinDate: employee.joinDate }],
        month,
        rawRecords,
        schedules,
        approvedOwnLeaves,
        offDatesList
      );

      attendanceContent = (
        <MyAttendanceView
          history={history}
          leaves={myLeavesThisMonth.map((l) => ({ id: l.id, fromDate: l.fromDate, toDate: l.toDate, reason: l.reason, status: l.status }))}
        />
      );

      const salary = calculateSalary(
        {
          id: employee.id,
          name: session.user.name ?? "",
          designation: employee.designation,
          basicSalary: employee.basicSalary,
          allowances: employee.allowances,
          joinDate: employee.joinDate,
        },
        month,
        rawRecords,
        schedules,
        approvedOwnLeaves.map((l) => ({ fromDate: l.fromDate, toDate: l.toDate })),
        offDatesList
      );

      payrollContent = <MySalaryView month={month} salary={salary} />;
    }
  }

  return (
    <div className="page-shell space-y-4">
      <PayrollTabs tab={tab} payrollContent={payrollContent} attendanceContent={attendanceContent} />
    </div>
  );
}
