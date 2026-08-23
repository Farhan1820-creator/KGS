import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { students, fees, studentAttendance, testMarks, workSchedules, offDates, tasks, taskAssignments } from "@/db/schema";
import { eq, and, sql, desc, gte, lt } from "drizzle-orm";
import { currentMonth, formatMonthLabel } from "../accounts/fees/fee-range";
import { Badge } from "@/components/ui/badge";
import { Wallet, CheckCircle2, CalendarCheck, ClipboardList, CalendarOff, Clock, UserCheck, AlertCircle, Swords, Zap, Trophy } from "lucide-react";
import { SchoolInfoCard } from "./school-info-card";
import {
  datesInMonth,
  isWorkingDay,
  todayString,
  type WorkSchedule,
} from "../payroll/attendance/attendance-helpers";

type StudentDashboardProps = {
  name?: string | null;
};

const StudentDashboard = async ({ name }: StudentDashboardProps) => {
  const session = await auth();
  const student = session?.user?.id
    ? await db.query.students.findFirst({
      where: eq(students.userId, Number(session.user.id)),
      with: { class: true },
    })
    : null;

  let attendanceCard = null;
  let testReportsCard = null;
  let taskInsightsCard = null;

  if (student) {
    const month = currentMonth();
    const today = todayString();

    const [scheduleRows, offDateRows, attendanceRecords, recentTests, studentTaskAssignments] = await Promise.all([
      db.query.workSchedules.findMany({ with: { days: true } }),
      db.query.offDates.findMany(),
      db.query.studentAttendance.findMany({
        where: and(
          eq(studentAttendance.studentId, student.id),
          sql`to_char(${studentAttendance.date}, 'YYYY-MM') = ${month}`
        ),
      }),
      db.query.testMarks.findMany({
        where: and(eq(testMarks.studentId, student.id), eq(testMarks.month, month)),
        orderBy: [desc(testMarks.createdAt)],
        limit: 3,
      }),
      db.query.taskAssignments.findMany({
        where: eq(taskAssignments.studentId, student.id),
        with: { task: true },
        orderBy: [desc(taskAssignments.createdAt)],
      }),
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
    const allDatesInMonth = datesInMonth(month);

    // Filter to working days according to the active schedule and holidays
    const admissionDate = student.admissionDate;
    const workingDaysInMonth = allDatesInMonth.filter(
      (d) => (!admissionDate || d >= admissionDate) && isWorkingDay(d, schedules, offDatesList)
    );

    const holidayDaysInMonth = allDatesInMonth.filter(
      (d) => (!admissionDate || d >= admissionDate) && offDatesList.includes(d)
    );

    // Map recorded attendance
    const recordMap = new Map<string, string>();
    attendanceRecords.forEach((r) => {
      recordMap.set(r.date, r.status);
    });

    let present = 0;
    let absent = 0;
    let leave = 0;

    for (const date of workingDaysInMonth) {
      if (date > today) continue; // Future dates not yet marked

      const status = recordMap.get(date);
      if (status === "present") {
        present++;
      } else if (status === "leave") {
        leave++;
      } else if (status === "absent") {
        absent++;
      } else {
        // Unmarked past working day defaults to absent
        absent++;
      }
    }

    const elapsedWorkingDays = workingDaysInMonth.filter((d) => d <= today).length;
    const presentPercentage =
      elapsedWorkingDays > 0 ? Math.round((present / elapsedWorkingDays) * 100) : 100;

    const getStatusColor = (pct: number) => {
      if (pct >= 80) return "text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-transparent dark:bg-transparent";
      if (pct >= 60) return "text-blue-600 dark:text-blue-400 border-blue-500/20 bg-transparent dark:bg-transparent";
      if (pct >= 40) return "text-amber-600 dark:text-amber-400 border-amber-500/20 bg-transparent dark:bg-transparent";
      return "text-rose-600 dark:text-rose-400 border-rose-500/20 bg-transparent dark:bg-transparent";
    };

    const getProgressBarColor = (pct: number) => {
      if (pct >= 80) return "bg-emerald-500";
      if (pct >= 60) return "bg-blue-500";
      if (pct >= 40) return "bg-amber-500";
      return "bg-rose-500";
    };

    attendanceCard = (
      <div className="rounded-2xl shadow-sm border border-muted/50 p-5 bg-card flex flex-col justify-between h-full space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <CalendarCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Attendance Overview</h3>
                <p className="text-xs text-muted-foreground">{formatMonthLabel(month)}</p>
              </div>
            </div>

            <div className={`px-2.5 py-1 rounded-xl border font-bold text-lg ${getStatusColor(presentPercentage)}`}>
              {presentPercentage}%
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>Attendance Rate</span>
              <span>{present} of {elapsedWorkingDays} days</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(presentPercentage)}`}
                style={{ width: `${Math.min(100, Math.max(0, presentPercentage))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t text-center">
          <div className="p-2 rounded-xl bg-transparent dark:bg-transparent border border-emerald-500/20">
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Present</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{present}</p>
          </div>
          <div className="p-2 rounded-xl bg-transparent dark:bg-transparent border border-rose-500/20">
            <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">Absent</p>
            <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">{absent}</p>
          </div>
          <div className="p-2 rounded-xl bg-transparent dark:bg-transparent border border-amber-500/20">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Leave</p>
            <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">{leave}</p>
          </div>
          <div className="p-2 rounded-xl bg-transparent dark:bg-transparent border border-muted">
            <p className="text-xs text-muted-foreground font-medium">Holidays</p>
            <p className="text-base font-bold text-foreground mt-0.5">{holidayDaysInMonth.length}</p>
          </div>
        </div>
      </div>
    );

    testReportsCard = (
      <div className="rounded-2xl shadow-sm border border-muted/50 p-5 bg-card flex flex-col justify-between h-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Recent Test Reports</h3>
              <p className="text-xs text-muted-foreground">{formatMonthLabel(month)}</p>
            </div>
          </div>
          <Link
            href="/dashboard/test-reports"
            className="text-xs font-semibold text-primary hover:underline"
          >
            View All
          </Link>
        </div>

        {recentTests.length > 0 ? (
          <div className="space-y-2.5 my-auto">
            {recentTests.map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between p-2.5 rounded-xl border bg-background/50 hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm text-foreground">{test.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {test.achievedMarks} / {test.totalMarks} Marks
                  </p>
                </div>
                <Badge
                  variant={Number(test.percentage) >= 50 ? "default" : "destructive"}
                  className="font-mono text-xs"
                >
                  {Number(test.percentage)}%
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-muted-foreground my-auto">
            <p>No test reports recorded for {formatMonthLabel(month)}.</p>
          </div>
        )}

        <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between items-center">
          <span>Total tests this month: {recentTests.length}</span>
          <Link href="/dashboard/test-reports" className="text-primary hover:underline font-medium">
            Test performance &rarr;
          </Link>
        </div>
      </div>
    );
    const totalAssignedTasks = studentTaskAssignments.length;
    const completedTasksList = studentTaskAssignments.filter(
      (a) => a.status === "graded" || a.status === "submitted"
    );
    const gradedTasksList = studentTaskAssignments.filter((a) => a.status === "graded");
    const pendingTasksList = studentTaskAssignments.filter((a) => a.status === "pending");

    const totalEarnedScore = gradedTasksList.reduce((acc, a) => acc + (a.achievedPoints || 0), 0);
    const avgTaskScore =
      gradedTasksList.length > 0
        ? Math.round(
          gradedTasksList.reduce(
            (acc, a) => acc + (parseFloat(String(a.percentage)) || 0),
            0
          ) / gradedTasksList.length
        )
        : 0;

    const taskCompletionRate =
      totalAssignedTasks > 0
        ? Math.round((completedTasksList.length / totalAssignedTasks) * 100)
        : 100;

    taskInsightsCard = (
      <div className="rounded-2xl shadow-sm border border-muted/50 p-5 bg-card flex flex-col justify-between h-full space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Swords className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Tasks & Quest Insights</h3>
                <p className="text-xs text-muted-foreground">{totalAssignedTasks} total tasks assigned</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <Zap className="h-4 w-4 fill-amber-500" />
              Score: {totalEarnedScore}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 my-3">
            <div className="p-2.5 rounded-xl border bg-background/50">
              <p className="text-xs text-muted-foreground">Completion Rate</p>
              <p className="text-lg font-bold text-foreground mt-0.5">{taskCompletionRate}%</p>
              <p className="text-[11px] text-muted-foreground">{completedTasksList.length} of {totalAssignedTasks} done</p>
            </div>

            <div className="p-2.5 rounded-xl border bg-background/50">
              <p className="text-xs text-muted-foreground">Average Score</p>
              <p className="text-lg font-bold text-primary mt-0.5">
                {gradedTasksList.length > 0 ? `${avgTaskScore}%` : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">{gradedTasksList.length} graded</p>
            </div>
          </div>

          {pendingTasksList.length > 0 ? (
            <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between text-xs">
              <span className="font-medium text-amber-700 dark:text-amber-300">
                ⚔️ {pendingTasksList.length} active quest(s) waiting!
              </span>
              <Link href="/tasks" className="font-bold text-amber-600 dark:text-amber-400 hover:underline">
                Turn in &rarr;
              </Link>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl border bg-emerald-500/5 border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>All active quests completed!</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between items-center">
          <span>Active quests: {pendingTasksList.length}</span>
          <Link href="/tasks" className="text-primary hover:underline font-medium flex items-center gap-1">
            Open Quest Board &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col items-center justify-center py-6 w-full space-y-3">
        {student?.photoUrl ? (
          <img
            src={student.photoUrl}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-muted shadow-sm ring-2 ring-primary/20"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center border-2 border-primary/20 shadow-sm">
            <span className="text-3xl font-bold">
              {name ? name.charAt(0).toUpperCase() : "?"}
            </span>
          </div>
        )}
        <div className="text-center space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome, <span className="text-primary">{name || "Student"}</span>!
          </h2>
          {student?.class && (
            <p className="text-xs text-muted-foreground font-medium">
              {student.class.name} {student.class.section ? `(${student.class.section})` : ""} &bull; Roll No: {student.rollNumber || "N/A"}
            </p>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 items-stretch max-w-6xl mx-auto">
        {attendanceCard}
        {taskInsightsCard}
        {testReportsCard}
      </div>

      {/* School Timing & Vacations */}
      <div className="max-w-6xl mx-auto w-full">
        <SchoolInfoCard />
      </div>
    </div>
  );
};

export default StudentDashboard;