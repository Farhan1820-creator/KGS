import { NextRequest, NextResponse } from "next/server";
import { autoCloseStaleAttendance } from "@/app/(dashboard)/payroll/attendance/attendance-actions";

// Hit this from an external scheduler (Vercel Cron, cron-job.org, pg_cron,
// etc.) every few minutes so employees who forgot to check out get closed
// out at their exact scheduled end time, even if nobody has the app open.
//
// The app already does the same thing lazily whenever the payroll page or
// dashboard loads, so this route is optional — only needed for exact-time
// closing with zero page visits. Protect it with CRON_SECRET in your env.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const closed = await autoCloseStaleAttendance();
  return NextResponse.json({ closed });
}

export const dynamic = "force-dynamic";
