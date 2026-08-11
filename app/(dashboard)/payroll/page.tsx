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
import { buildAttendanceReport, calculateSalary, currentMonth, todayString } from "./attendance/attendance-helpers";
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

  const offDayRows = await db.query.offDays.findMany();
  const offDaysSet = new Set(offDayRows.map((o) => o.dayOfWeek));

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
      offDaysSet,
      approvedLeaves.map((l) => ({ employeeId: l.employeeId, fromDate: l.fromDate, toDate: l.toDate }))
    );

    const pendingLeaves: PendingLeaveRow[] = pendingLeaveRows.map((l) => ({
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
      shiftHours: e.shiftHours,
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
        currentOffDays={Array.from(offDaysSet)}
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
          shiftHours: e.shiftHours,
        },
        month,
        rawRecords,
        offDaysSet,
        approvedLeaves.filter((l) => l.employeeId === e.id).map((l) => ({ fromDate: l.fromDate, toDate: l.toDate }))
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
        offDaysSet,
        approvedOwnLeaves
      );

      attendanceContent = (
        <MyAttendanceView
          shiftHours={employee.shiftHours}
          today={{
            checkIn: todayRecord?.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : null,
            checkInAt: todayRecord?.checkIn ? new Date(todayRecord.checkIn).toISOString() : null,
            checkOut: todayRecord?.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : null,
            secondsWorked: todayRecord?.secondsWorked ?? null,
            status: todayRecord?.status ?? null,
          }}
          history={history}
          leaves={myLeaves.map((l) => ({ id: l.id, fromDate: l.fromDate, toDate: l.toDate, reason: l.reason, status: l.status }))}
        />
      );

      const salary = calculateSalary(
        {
          id: employee.id,
          name: session.user.name ?? "",
          designation: employee.designation,
          basicSalary: employee.basicSalary,
          allowances: employee.allowances,
          shiftHours: employee.shiftHours,
        },
        month,
        rawRecords,
        offDaysSet,
        approvedOwnLeaves.map((l) => ({ fromDate: l.fromDate, toDate: l.toDate }))
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
