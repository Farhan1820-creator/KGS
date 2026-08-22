"use server";
import { sendNotification } from "@/lib/notifications";
import { students } from "@/db/schema";

import { db } from "@/db";
import { testMarks } from "@/db/schema";
import { auth } from "@/auth";
import { eq, and } from "drizzle-orm";

export type TestMarkRow = {
  id: number;
  studentId: number;
  studentName: string;
  classId: number;
  className: string;
  classSection: string | null;
  title: string;
  month: string;
  totalMarks: number;
  achievedMarks: number;
  percentage: string;
  createdAt: Date;
  creatorName: string;
};

export async function addTestMark(data: {
  studentId: number;
  classId: number;
  title: string;
  month: string;
  totalMarks: number;
  achievedMarks: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const role = session.user.role;
    if (!["admin", "teacher"].includes(role)) {
      return { success: false, error: "Forbidden" };
    }

    const percentage = ((data.achievedMarks / data.totalMarks) * 100).toFixed(2);

    await db.insert(testMarks).values({
      studentId: data.studentId,
      classId: data.classId,
      title: data.title,
      month: data.month,
      totalMarks: data.totalMarks,
      achievedMarks: data.achievedMarks,
      percentage,
      createdBy: parseInt(session.user.id),
    });

    
    const student = await db.query.students.findFirst({
      where: eq(students.id, data.studentId)
    });
    
    if (student) {
      await sendNotification(
        student.userId,
        "New Test Report",
        `A new test mark for ${data.title} has been added.`,
        "/dashboard"
      );
    }
    return { success: true };

  } catch (err: any) {
    console.error("addTestMark error:", err);
    return { success: false, error: "Failed to add test mark" };
  }
}

export async function deleteTestMark(id: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const role = session.user.role;
    if (!["admin", "teacher"].includes(role)) {
      return { success: false, error: "Forbidden" };
    }

    await db.delete(testMarks).where(eq(testMarks.id, id));
    return { success: true };
  } catch (err: any) {
    console.error("deleteTestMark error:", err);
    return { success: false, error: "Failed to delete test mark" };
  }
}
