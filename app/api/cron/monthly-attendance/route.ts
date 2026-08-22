import { NextResponse } from "next/server";
import { db } from "@/db";
import { students, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendNotificationToMultiple } from "@/lib/notifications";

// Setup via vercel.json or external cron to hit this route at the end of the month
export async function GET(req: Request) {
  try {
    const activeStudents = await db
      .select({ userId: students.userId })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(and(eq(users.isActive, true), eq(students.status, "active")));

    const userIds = activeStudents.map((s) => s.userId).filter(Boolean) as number[];

    if (userIds.length > 0) {
      await sendNotificationToMultiple(
        userIds,
        "Monthly Attendance Report",
        "Check your Monthly Attendance Reports on your dashboard.",
        "/dashboard"
      );
    }

    return NextResponse.json({ success: true, notified: userIds.length });
  } catch (err: any) {
    console.error("Monthly attendance cron failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

