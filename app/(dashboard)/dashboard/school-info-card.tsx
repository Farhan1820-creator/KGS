import { db } from "@/db";
import {
  formatTimeLabel,
  upcomingOffDates,
  WEEKDAY_LABELS,
  todaySchoolTiming,
  activeWeeklyTiming,
  dayOfWeek,
  todayString,
  type WorkSchedule,
} from "../payroll/attendance/attendance-helpers";
import { Badge } from "@/components/ui/badge";
import { Clock, CalendarOff } from "lucide-react";

// Pure data-fetching + presentation card: today's school timing (from the
// active work schedule) and the next few upcoming vacations/off dates — the
// same "active timing" and "coming vacations" info admins see on the
// attendance page, surfaced for teachers and students on their dashboard.
export async function SchoolInfoCard() {
  const [scheduleRows, offDateRows] = await Promise.all([
    db.query.workSchedules.findMany({ with: { days: true } }),
    db.query.offDates.findMany(),
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

  const today = todaySchoolTiming(schedules, offDatesList);
  const todayDayOfWeek = dayOfWeek(todayString());
  const weekly = activeWeeklyTiming(schedules);
  const vacations = upcomingOffDates(
    offDateRows.map((d) => ({ date: d.date, label: d.label })),
    5
  );

  if (weekly.length === 0 && vacations.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl shadow-md bg-card border border-muted/50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">School Timing</h3>
        </div>

        {weekly.length === 0 ? (
          <p className="text-sm text-muted-foreground">No school timing has been set up yet.</p>
        ) : (
          <>
            <p className="text-sm">
              {today.isOffToday ? (
                <Badge variant="secondary">Today is off</Badge>
              ) : (
                <>
                  <span className="text-muted-foreground">Today: </span>
                  <span className="font-medium">
                    {formatTimeLabel(today.startTime!)} – {formatTimeLabel(today.endTime!)}
                  </span>
                </>
              )}
            </p>
            <div className="space-y-1 text-xs">
              {WEEKDAY_LABELS.map((label, day) => {
                const timing = weekly.find((d) => d.dayOfWeek === day);
                const isToday = day === todayDayOfWeek;
                return (
                  <div
                    key={day}
                    className={
                      isToday
                        ? "flex justify-between items-center rounded-md bg-primary/10 px-2 py-1 font-medium"
                        : "flex justify-between items-center px-2 py-1 text-muted-foreground"
                    }
                  >
                    <span>{label}</span>
                    <span>{timing ? `${formatTimeLabel(timing.startTime)} – ${formatTimeLabel(timing.endTime)}` : "Off"}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl shadow-md bg-card border border-muted/50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarOff className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Coming Vacations</h3>
        </div>
        {vacations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming vacations scheduled.</p>
        ) : (
          <div className="space-y-1">
            {vacations.map((v) => (
              <div key={v.date} className="flex justify-between items-center text-sm rounded-md px-2 py-1.5 odd:bg-muted/50">
                <span className="text-muted-foreground">{v.date}</span>
                <Badge variant="outline">{v.label ?? "Holiday"}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
