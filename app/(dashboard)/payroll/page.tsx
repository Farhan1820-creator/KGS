import type { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { attendance, employees, leaveRequests } from "@/db/schema";
import { eq, and, like } from "drizzle-orm";
import { PayrollTabs } from "./payroll-tabs";
import { SalaryView } from "./payroll/salary-view";
import { MySalaryView } from "./payroll/my-salary-view";
import { AdminAttendanceView } from "./attendance/admin-attendance-view";
import { MyAttendanceView } from "./attendance/my-attendance-view";
import { buildAttendanceReport, calculateSalary, currentMonth, todayString, type WorkSchedule } from "./attendance/attendance-helpers";
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

  const scheduleRows = await db.query.workSchedules.findMany({ with: { days: true } });
  const schedules: WorkSchedule[] = scheduleRows.map((r) => ({
    id: r.id,
    effectiveFrom: r.effectiveFrom,
    label: r.label,
    days: r.days.map((d) => ({ dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime })),
  }));

  const offDayRows = await db.query.offDays.findMany();
  const offDaysList = offDayRows.map((d) => d.dayOfWeek);

  let attendanceContent: ReactNode;
  let payrollContent: ReactNode;

  if (role === "admin") {
    const [employeeRows, monthAttendance, approvedLeaves, pendingLeaveRows] = await Promise.all([
      db.query.employees.findMany({ with: { user: true } }),
      db.query.attendance.findMany({ where: like(attendance.date, `${month}%`) }),
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

    const employeeList = employeeRows.map((e) => ({ id: e.id, name: e.user.name, designation: e.designation }));

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
      offDaysList
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
        offDays={offDaysList}
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
        },
        month,
        rawRecords,
        schedules,
        approvedLeaves.filter((l) => l.employeeId === e.id).map((l) => ({ fromDate: l.fromDate, toDate: l.toDate })),
        offDaysList
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
          where: and(eq(attendance.employeeId, employee.id), like(attendance.date, `${month}%`)),
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
        [{ id: employee.id, name: "", designation: "" }],
        month,
        rawRecords,
        schedules,
        approvedOwnLeaves,
        offDaysList
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
        },
        month,
        rawRecords,
        schedules,
        approvedOwnLeaves.map((l) => ({ fromDate: l.fromDate, toDate: l.toDate })),
        offDaysList
      );

      payrollContent = <MySalaryView month={month} salary={salary} />;
    }
  }

  return (
    <div className="page-shell space-y-4">
      <h2 className="text-2xl font-semibold">Payroll</h2>
      <PayrollTabs tab={tab} payrollContent={payrollContent} attendanceContent={attendanceContent} />
    </div>
  );
}
