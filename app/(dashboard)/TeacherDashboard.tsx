import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { employees, attendance } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { SelfAttendanceCard } from "./payroll/attendance/self-attendance-card";
import { todayString, requiredSecondsForDate, type WorkSchedule } from "./payroll/attendance/attendance-helpers";

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
      label: r.label,
      days: r.days.map((d) => ({ dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime })),
    }));

    attendanceCard = (
      <SelfAttendanceCard
        requiredSecondsToday={requiredSecondsForDate(today, schedules)}
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
        todayStatus={todayRecord?.status ?? null}
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
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Your employee profile isn&apos;t set up yet, so check-in/check-out isn&apos;t available.{" "}
          Contact the admin, or see the{" "}
          <Link href="/payroll" className="underline">
            Payroll
          </Link>{" "}
          page.
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
