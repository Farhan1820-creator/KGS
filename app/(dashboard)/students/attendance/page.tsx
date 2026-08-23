import { Metadata } from "next";
import { AttendanceClient } from "./attendance-client";
import { getClasses } from "./attendance-actions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getCalendarSyncUrl } from "@/app/(dashboard)/payroll/attendance/attendance-actions";
import type { WorkSchedule } from "@/app/(dashboard)/payroll/attendance/attendance-helpers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student Attendance | The Learnex Academy",
};

export default async function StudentAttendancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [classes, scheduleRows, offDateRows, calendarSyncUrl] = await Promise.all([
    getClasses(),
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

  const offDatesForUi = offDateRows.map((d) => ({
    date: d.date,
    label: d.label,
    source: d.source,
  }));

  return (
    <div className="page-shell space-y-4">
      <AttendanceClient
        classes={classes}
        schedules={schedules}
        offDates={offDatesForUi}
        calendarSyncUrl={calendarSyncUrl}
        userRole={session.user.role}
      />
    </div>
  );
}


