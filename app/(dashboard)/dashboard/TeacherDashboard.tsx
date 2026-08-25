import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { employees, attendance, teachers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { SelfAttendanceCard } from "../payroll/attendance/self-attendance-card";
import { todayString, requiredSecondsForDate, statusFromSeconds, type WorkSchedule } from "../payroll/attendance/attendance-helpers";
import { autoCloseStaleAttendance } from "../payroll/attendance/attendance-actions";
import { SchoolInfoCard } from "./school-info-card";

type TeacherDashboardProps = {
  name?: string | null;
  image?: string | null;
};

const TeacherDashboard = async ({ name, image }: TeacherDashboardProps) => {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const [employee, teacher] = await Promise.all([
    userId ? db.query.employees.findFirst({ where: eq(employees.userId, userId) }) : null,
    userId ? db.query.teachers.findFirst({ where: eq(teachers.userId, userId) }) : null,
  ]);

  const photoUrl = teacher?.photoUrl || image;

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
      {/* Welcome Banner: Centered Image and Welcome Note */}
      <div className="flex flex-col items-center justify-center text-center gap-3 py-4">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="Profile"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-primary/20 shadow-md ring-2 ring-background"
          />
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl sm:text-3xl border-2 border-primary/20 shadow-md">
            {name ? name.charAt(0).toUpperCase() : "T"}
          </div>
        )}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome, <span className="text-primary">{name ? `${name}` : "Teacher"}</span>!
          </h2>
          {teacher?.teacherId && (
            <p className="text-sm text-muted-foreground font-medium">
              Teacher ID: {teacher.teacherId}
            </p>
          )}
        </div>
      </div>

      {attendanceCard ?? (
        <div className="rounded-xl shadow-xs border border-border/70 p-5 text-center text-sm text-muted-foreground bg-card">
          Your employee profile isn&apos;t set up yet, so check-in/check-out isn&apos;t available.{" "}
          Contact the admin, or see the{" "}
          <Link href="/payroll" className="underline text-primary font-medium">
            Payroll
          </Link>{" "}
          page.
        </div>
      )}

      <div className="w-full">
        <SchoolInfoCard />
      </div>
    </div>
  );
};

export default TeacherDashboard;
