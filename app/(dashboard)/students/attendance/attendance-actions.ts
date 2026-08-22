"use server";

import { db } from "@/db";
import { studentAttendance, students, classes } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getClasses() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return await db.query.classes.findMany({
    orderBy: [asc(classes.name), asc(classes.section)],
  });
}

export async function getAttendanceData(classId: number, dateStr: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const classStudents = await db.query.students.findMany({
    where: and(
      eq(students.classId, classId),
      eq(students.status, "active")
    ),
    with: {
      user: true,
    },
    orderBy: [asc(students.rollNumber)],
  });

  const attendanceRecords = await db.query.studentAttendance.findMany({
    where: and(
      eq(studentAttendance.classId, classId),
      eq(studentAttendance.date, dateStr)
    ),
    with: {
      marker: true,
      editor: true,
    }
  });

  const attendanceMap: Record<number, any> = {};
  for (const record of attendanceRecords) {
    attendanceMap[record.studentId] = {
      ...record,
      markerName: record.marker?.name,
      editorName: record.editor?.name,
    };
  }

  return {
    students: classStudents.map(s => ({
      id: s.id,
      name: s.user.name,
      rollNumber: s.rollNumber,
      photoUrl: s.photoUrl,
    })),
    attendance: attendanceMap,
    currentUserRole: session.user.role,
  };
}

export async function saveAttendance(classId: number, dateStr: string, attendanceData: Array<{ studentId: number, status: "present" | "absent" | "leave" }>) {
  const session = await auth();
  if (!session?.user || !session.user.id) throw new Error("Unauthorized");
  
  const userId = parseInt(session.user.id);

  for (const record of attendanceData) {
    const existing = await db.query.studentAttendance.findFirst({
      where: and(
        eq(studentAttendance.studentId, record.studentId),
        eq(studentAttendance.date, dateStr)
      )
    });

    if (existing) {
      if (existing.status !== record.status) {
        await db.update(studentAttendance)
          .set({
            status: record.status,
            lastEditedBy: userId,
            updatedAt: new Date()
          })
          .where(eq(studentAttendance.id, existing.id));
      }
    } else {
      await db.insert(studentAttendance).values({
        studentId: record.studentId,
        classId: classId,
        date: dateStr,
        status: record.status,
        markedBy: userId,
      });
    }
  }

  revalidatePath("/students/attendance");
  return { success: true };
}
