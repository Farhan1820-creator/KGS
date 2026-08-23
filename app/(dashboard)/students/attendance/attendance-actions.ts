"use server";

import { db } from "@/db";
import { studentAttendance, students, classes, users, workSchedules, offDates } from "@/db/schema";
import { eq, and, asc, desc, sql, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  getActiveSchedule,
  getDaySchedule,
  isWorkingDay,
  datesInMonth,
  allDatesInMonth,
  todayString,
  currentMonth,
  type WorkSchedule,
} from "@/app/(dashboard)/payroll/attendance/attendance-helpers";

export type StudentAttendanceStatus = "present" | "absent" | "leave";

export type DateInfo = {
  isWorkingDay: boolean;
  isHoliday: boolean;
  holidayLabel: string | null;
  isWeeklyOff: boolean;
  dayTiming: { startTime: string; endTime: string } | null;
  scheduleLabel: string | null;
};

export async function getClasses() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const classList = await db.query.classes.findMany({
    orderBy: [asc(classes.name), asc(classes.section)],
  });

  // Fetch active student count per class for enhanced UI
  const studentCounts = await db
    .select({
      classId: students.classId,
      count: sql<number>`count(*)`,
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(and(eq(students.status, "active"), eq(users.isActive, true)))
    .groupBy(students.classId);

  const countMap = new Map<number, number>();
  for (const row of studentCounts) {
    if (row.classId !== null) {
      countMap.set(row.classId, Number(row.count));
    }
  }

  return classList.map((c) => ({
    id: c.id,
    name: c.name,
    section: c.section,
    studentCount: countMap.get(c.id) ?? 0,
  }));
}

export async function getAttendanceData(classId: number | null, dateStr: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Fetch all active students in class or across all classes
  const classStudents = await db.query.students.findMany({
    where: classId !== null
      ? and(eq(students.classId, classId), eq(students.status, "active"))
      : eq(students.status, "active"),
    with: {
      user: true,
      class: true,
    },
    orderBy: [asc(students.rollNumber)],
  });

  const activeStudents = classStudents.filter((s) => s.user && s.user.isActive);

  // Fetch attendance records for this class/all classes on this date & schedules/holidays concurrently
  const [attendanceRecords, scheduleRows, offDateRows] = await Promise.all([
    db.query.studentAttendance.findMany({
      where: classId !== null
        ? and(eq(studentAttendance.classId, classId), eq(studentAttendance.date, dateStr))
        : eq(studentAttendance.date, dateStr),
      with: {
        marker: true,
        editor: true,
      },
    }),
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
  const holidayRow = offDateRows.find((d) => d.date === dateStr);
  const isHoliday = Boolean(holidayRow);
  const holidayLabel = holidayRow?.label ?? null;

  // Day timing check against active schedule and holidays
  const timing = getDaySchedule(dateStr, schedules, offDatesList);
  const isWeeklyOff = !isHoliday && getDaySchedule(dateStr, schedules, []) === null;
  const activeSchedule = getActiveSchedule(dateStr, schedules);

  const dateInfo: DateInfo = {
    isWorkingDay: timing !== null,
    isHoliday,
    holidayLabel,
    isWeeklyOff,
    dayTiming: timing ? { startTime: timing.startTime, endTime: timing.endTime } : null,
    scheduleLabel: activeSchedule?.label ?? null,
  };

  const attendanceMap: Record<
    number,
    {
      id: number;
      studentId: number;
      classId: number;
      date: string;
      status: StudentAttendanceStatus;
      markerName?: string | null;
      editorName?: string | null;
      updatedAt?: Date;
    }
  > = {};

  for (const record of attendanceRecords) {
    attendanceMap[record.studentId] = {
      id: record.id,
      studentId: record.studentId,
      classId: record.classId,
      date: record.date,
      status: record.status as StudentAttendanceStatus,
      markerName: record.marker?.name,
      editorName: record.editor?.name,
      updatedAt: record.updatedAt,
    };
  }

  return {
    students: activeStudents.map((s) => ({
      id: s.id,
      name: s.user.name,
      rollNumber: s.rollNumber,
      photoUrl: s.photoUrl,
      contactNumber: s.user.contactNumber,
      email: s.user.email,
      classId: s.classId,
      className: s.class ? `${s.class.name}${s.class.section ? ` - ${s.class.section}` : ""}` : "—",
    })),
    attendance: attendanceMap,
    currentUserRole: session.user.role,
    dateInfo,
  };
}

export async function saveAttendance(
  classId: number | null,
  dateStr: string,
  attendanceData: Array<{ studentId: number; status: StudentAttendanceStatus; classId?: number }>
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  // Robustly resolve user ID from database to avoid foreign key errors from stale sessions
  let currentUserId: number | null = null;
  if (session.user.id && !isNaN(parseInt(session.user.id))) {
    const u = await db.query.users.findFirst({
      where: eq(users.id, parseInt(session.user.id)),
      columns: { id: true },
    });
    if (u) currentUserId = u.id;
  }

  if (!currentUserId && session.user.email) {
    const u = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
      columns: { id: true },
    });
    if (u) currentUserId = u.id;
  }

  if (!attendanceData || attendanceData.length === 0) {
    return { success: false, message: "No attendance data provided." };
  }

  // Pre-fetch student class mapping in case classId is null (All classes)
  const studentIds = attendanceData.map((a) => a.studentId);
  const studentRows = await db.query.students.findMany({
    where: inArray(students.id, studentIds),
    columns: { id: true, classId: true },
  });
  const studentClassMap = new Map(studentRows.map((s) => [s.id, s.classId]));

  try {
    for (const record of attendanceData) {
      const targetClassId = record.classId ?? classId ?? studentClassMap.get(record.studentId);
      if (!targetClassId) continue;

      await db
        .insert(studentAttendance)
        .values({
          studentId: record.studentId,
          classId: targetClassId,
          date: dateStr,
          status: record.status,
          markedBy: currentUserId,
          lastEditedBy: currentUserId,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [studentAttendance.studentId, studentAttendance.date],
          set: {
            status: record.status,
            classId: targetClassId,
            lastEditedBy: currentUserId,
            updatedAt: new Date(),
          },
        });
    }

    revalidatePath("/students/attendance");
    revalidatePath("/dashboard");
    return { success: true, count: attendanceData.length };
  } catch (error: any) {
    console.error("Error saving student attendance:", error);
    return { success: false, message: error?.message || "Failed to save attendance records." };
  }
}

export async function clearClassAttendance(classId: number | null, dateStr: string) {
  const session = await auth();
  if (!session?.user || !["admin", "teacher"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  try {
    if (classId !== null) {
      await db
        .delete(studentAttendance)
        .where(
          and(
            eq(studentAttendance.classId, classId),
            eq(studentAttendance.date, dateStr)
          )
        );
    } else {
      await db
        .delete(studentAttendance)
        .where(eq(studentAttendance.date, dateStr));
    }

    revalidatePath("/students/attendance");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error clearing class attendance:", error);
    return { success: false, message: "Failed to clear attendance." };
  }
}

export type StudentAttendanceProfile = {
  student: {
    id: number;
    name: string;
    rollNumber: string | null;
    className: string | null;
    classId: number | null;
    admissionDate: string | null;
    photoUrl: string | null;
    contactNumber: string | null;
    email: string | null;
  };
  summary: {
    present: number;
    absent: number;
    leave: number;
    holidays: number;
    totalWorkingDays: number;
    attendancePercentage: number;
  };
  availableMonths: { month: string; label: string }[];
  records: {
    date: string;
    dayOfWeek: string;
    status: "present" | "absent" | "leave" | "holiday" | "weekly_off" | "unmarked";
    statusLabel: string;
    isHoliday: boolean;
    holidayLabel: string | null;
    markerName: string | null;
    editorName: string | null;
    updatedAt: string | null;
  }[];
  monthlyTrends: {
    month: string;
    monthLabel: string;
    present: number;
    absent: number;
    leave: number;
    totalWorkingDays: number;
    percentage: number;
  }[];
};

export async function getStudentAttendanceProfile(
  studentId: number,
  selectedMonth?: string
): Promise<{ success: boolean; data?: StudentAttendanceProfile; error?: string }> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      with: {
        user: true,
        class: true,
      },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    const [allAttendanceRows, scheduleRows, offDateRows] = await Promise.all([
      db.query.studentAttendance.findMany({
        where: eq(studentAttendance.studentId, studentId),
        with: {
          marker: true,
          editor: true,
        },
        orderBy: [desc(studentAttendance.date)],
      }),
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
    const offDateMap = new Map(offDateRows.map((d) => [d.date, d.label || "Holiday"]));

    const attendanceMap = new Map(
      allAttendanceRows.map((r) => [
        r.date,
        {
          status: r.status,
          markerName: r.marker?.name ?? null,
          editorName: r.editor?.name ?? null,
          updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : null,
        },
      ])
    );

    const today = todayString();
    const currMonth = currentMonth();

    // Available months determination (from admissionDate or earliest attendance up to current month)
    const startMonth = student.admissionDate ? student.admissionDate.slice(0, 7) : currMonth;
    const monthsSet = new Set<string>();
    monthsSet.add(currMonth);
    allAttendanceRows.forEach((r) => monthsSet.add(r.date.slice(0, 7)));

    // Generate list of months
    const availableMonths = Array.from(monthsSet)
      .sort((a, b) => b.localeCompare(a))
      .map((m) => {
        const [y, mo] = m.split("-").map(Number);
        const d = new Date(y, mo - 1, 1);
        const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        return { month: m, label };
      });

    const activeFilterMonth = selectedMonth && selectedMonth !== "all" ? selectedMonth : "all";

    // Build day records for either the selected month or all months
    const targetMonths =
      activeFilterMonth === "all"
        ? availableMonths.map((m) => m.month)
        : [activeFilterMonth];

    const records: StudentAttendanceProfile["records"] = [];
    const monthlyTrends: StudentAttendanceProfile["monthlyTrends"] = [];

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLeave = 0;
    let totalHolidays = 0;
    let totalWorkingDays = 0;

    const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (const m of targetMonths) {
      const monthDates = allDatesInMonth(m);
      let mPresent = 0;
      let mAbsent = 0;
      let mLeave = 0;
      let mWorking = 0;

      for (const dStr of monthDates) {
        // Don't record dates before admission date
        if (student.admissionDate && dStr < student.admissionDate) continue;

        const isHoliday = offDatesList.includes(dStr);
        const holidayLabel = offDateMap.get(dStr) ?? null;
        const [y, mo, day] = dStr.split("-").map(Number);
        const dayIdx = new Date(y, mo - 1, day).getDay();
        const dayName = weekdayNames[dayIdx];

        const isSchedWorking = isWorkingDay(dStr, schedules, offDatesList);
        const recorded = attendanceMap.get(dStr);

        let finalStatus: StudentAttendanceProfile["records"][0]["status"] = "weekly_off";
        let statusLabel = "Weekly Off";

        if (isHoliday) {
          finalStatus = "holiday";
          statusLabel = holidayLabel ? `Holiday (${holidayLabel})` : "Holiday";
          if (dStr <= today) totalHolidays++;
        } else if (isSchedWorking) {
          if (recorded) {
            finalStatus = recorded.status;
            statusLabel = recorded.status === "present" ? "Present" : recorded.status === "leave" ? "Leave" : "Absent";
            if (recorded.status === "present") {
              mPresent++;
              totalPresent++;
            } else if (recorded.status === "leave") {
              mLeave++;
              totalLeave++;
            } else {
              mAbsent++;
              totalAbsent++;
            }
          } else {
            if (dStr <= today) {
              finalStatus = "unmarked";
              statusLabel = "Unmarked (Absent)";
              mAbsent++;
              totalAbsent++;
            } else {
              finalStatus = "not_marked" as any;
              statusLabel = "Scheduled";
            }
          }
          if (dStr <= today) {
            mWorking++;
            totalWorkingDays++;
          }
        } else {
          finalStatus = "weekly_off";
          statusLabel = "Weekly Off";
        }

        // Push to day records (only up to today for historical review, or full month if viewing)
        records.push({
          date: dStr,
          dayOfWeek: dayName,
          status: finalStatus,
          statusLabel,
          isHoliday,
          holidayLabel,
          markerName: recorded?.markerName ?? null,
          editorName: recorded?.editorName ?? null,
          updatedAt: recorded?.updatedAt ?? null,
        });
      }

      const mPct = mWorking > 0 ? Math.round((mPresent / mWorking) * 100) : 100;
      const [y, mo] = m.split("-").map(Number);
      const mLabel = new Date(y, mo - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });

      monthlyTrends.push({
        month: m,
        monthLabel: mLabel,
        present: mPresent,
        absent: mAbsent,
        leave: mLeave,
        totalWorkingDays: mWorking,
        percentage: mPct,
      });
    }

    // Sort records newest to oldest
    records.sort((a, b) => b.date.localeCompare(a.date));

    const attendancePercentage =
      totalWorkingDays > 0 ? Math.round((totalPresent / totalWorkingDays) * 100) : 100;

    return {
      success: true,
      data: {
        student: {
          id: student.id,
          name: student.user?.name ?? `Student #${student.id}`,
          rollNumber: student.rollNumber ?? null,
          className: student.class ? `${student.class.name}${student.class.section ? ` (${student.class.section})` : ""}` : null,
          classId: student.classId ?? null,
          admissionDate: student.admissionDate ?? null,
          photoUrl: student.photoUrl ?? null,
          contactNumber: student.user?.contactNumber ?? null,
          email: student.user?.email ?? null,
        },
        summary: {
          present: totalPresent,
          absent: totalAbsent,
          leave: totalLeave,
          holidays: totalHolidays,
          totalWorkingDays,
          attendancePercentage,
        },
        availableMonths,
        records,
        monthlyTrends,
      },
    };
  } catch (error: any) {
    console.error("getStudentAttendanceProfile error:", error);
    return { success: false, error: error?.message || "Failed to load student attendance." };
  }
}

