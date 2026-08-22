import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { employees, attendance } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { SelfAttendanceCard } from "../payroll/attendance/self-attendance-card";
import { todayString, requiredSecondsForDate, statusFromSeconds, type WorkSchedule } from "../payroll/attendance/attendance-helpers";
import { autoCloseStaleAttendance } from "../payroll/attendance/attendance-actions";
import { SchoolInfoCard } from "./school-info-card";

type TeacherDashboardProps = {
  name?: string | null;
};

const TeacherDashboard = async ({ name }: TeacherDashboardProps) => {
  const session = await auth();
  const employee = session?.user?.id
    ? await db.query.employees.findFirst({ where: eq(employees.userId, Number(session.user.id)) })
    : null;

  let attendanceCard = null;

  if (employee) {
    await autoCloseStaleAttendance();
    const today = todayString();
    const [todayRecord, scheduleRows] = await Promise.all([
      db.query.attendance.findFirst({
        where: and(eq(attendance.employeeId, employee.id), eq(attendance.date, today)),
      }),
      db.query.workSchedules.findMany({ with: { days: true } }),
    ]);

    const schedules: WorkSchedule[] = scheduleRows.map((r) => ({
      id: r.id,
      effectiveFrom: r.effectiveFrom,
      appliedAt: r.appliedAt,
      isActive: r.isActive,
      label: r.label,
      days: r.days.map((d) => ({ dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime })),
    }));

    const requiredSecondsToday = requiredSecondsForDate(today, schedules);

    // While still checked in with no check-out yet, the stored status is
    // just the "absent" placeholder set at check-in time — show the real,
    // currently-true status instead, computed live from elapsed seconds.
    let todayDisplayStatus = todayRecord?.status ?? null;
    if (todayRecord?.checkIn && !todayRecord.checkOut) {
      const elapsedSeconds = Math.max(0, Math.round((Date.now() - new Date(todayRecord.checkIn).getTime()) / 1000));
      todayDisplayStatus = statusFromSeconds(elapsedSeconds, requiredSecondsToday ?? 8 * 3600);
    }

    attendanceCard = (
      <SelfAttendanceCard
        requiredSecondsToday={requiredSecondsToday}
        todayCheckIn={
          todayRecord?.checkIn
            ? new Date(todayRecord.checkIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : null
        }
        todayCheckInAt={todayRecord?.checkIn ? new Date(todayRecord.checkIn).toISOString() : null}
        todayCheckOut={
          todayRecord?.checkOut
            ? new Date(todayRecord.checkOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : null
        }
        todaySecondsWorked={todayRecord?.secondsWorked ?? null}
        todayStatus={todayDisplayStatus}
      />
    );
  }

  return (
    <div className="page-shell space-y-6">

      <div className="text-3xl text-center py-6 w-full flex items-center justify-center">
        <h2>Welcome
          <span  className="text-primary font-bold"> {name ? `, ${name}` : ""}
            </span>
          </h2>
      </div>
      {attendanceCard ?? (
        <div className="rounded-xl shadow-sm border border-muted/50 p-4 text-center text-sm text-muted-foreground bg-card">
          Your employee profile isn&apos;t set up yet, so check-in/check-out isn&apos;t available.{" "}
          Contact the admin, or see the{" "}
          <Link href="/payroll" className="underline">
            Payroll
          </Link>{" "}
          page.
        </div>
      )}

      <SchoolInfoCard />
    </div>
  );
};

export default TeacherDashboard;
