import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { students, fees, studentAttendance, testMarks } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { currentMonth, formatMonthLabel } from "../accounts/fees/fee-range";
import { Badge } from "@/components/ui/badge";
import { Wallet, CheckCircle2, CalendarCheck, ClipboardList } from "lucide-react";
import { SchoolInfoCard } from "./school-info-card";

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

  if (student) {
    const month = currentMonth();
    
    // Attendance Insights
    const attendanceStats = await db.select({
      status: studentAttendance.status,
      count: sql<number>`count(*)`,
    })
    .from(studentAttendance)
    .where(
      and(
        eq(studentAttendance.studentId, student.id),
        sql`to_char(${studentAttendance.date}, 'YYYY-MM') = ${month}`
      )
    )
    .groupBy(studentAttendance.status);

    const counts = { present: 0, absent: 0, leave: 0 };
    attendanceStats.forEach((stat) => {
      counts[stat.status as keyof typeof counts] = Number(stat.count);
    });
    const totalDays = counts.present + counts.absent + counts.leave;
    const presentPercentage = totalDays > 0 ? Math.round((counts.present / totalDays) * 100) : 0;

    attendanceCard = (
      <div className="rounded-xl shadow-md border border-muted/50 p-5 bg-white flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-emerald-600" />
            <h3 className="font-semibold text-gray-700">Attendance - {formatMonthLabel(month)}</h3>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-800">{presentPercentage}%</p>
          </div>
        </div>
        <div className="flex justify-between mt-auto pt-2 border-t text-sm">
          <div className="text-emerald-600 font-medium">{counts.present} Present</div>
          <div className="text-rose-500 font-medium">{counts.absent} Absent</div>
          <div className="text-amber-500 font-medium">{counts.leave} Leave</div>
        </div>
      </div>
    );

    // Recent Test Marks
    const recentTests = await db.query.testMarks.findMany({
      where: and(eq(testMarks.studentId, student.id), eq(testMarks.month, month)),
      orderBy: [desc(testMarks.createdAt)],
      limit: 3,
    });

    testReportsCard = (
      <div className="rounded-xl shadow-md border border-muted/50 p-5 bg-white flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-gray-700">Test Reports - {formatMonthLabel(month)}</h3>
          </div>
          <Link href="/dashboard/test-reports" className="text-xs text-blue-600 hover:underline">
            View All
          </Link>
        </div>
        {recentTests.length > 0 ? (
          <div className="space-y-3 mt-auto">
            {recentTests.map(test => (
              <div key={test.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-sm text-gray-800">{test.title}</p>
                  <p className="text-xs text-gray-500">{test.achievedMarks} / {test.totalMarks} Marks</p>
                </div>
                <Badge variant={Number(test.percentage) >= 50 ? "default" : "destructive"}>
                  {Number(test.percentage)}%
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4 my-auto">No tests recorded this month.</p>
        )}
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-col items-center justify-center py-6 w-full space-y-4">
        {student?.photoUrl ? (
          <img 
            src={student.photoUrl} 
            alt="Profile" 
            className="w-24 h-24 rounded-full object-cover border-4 border-muted shadow-sm"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 shadow-sm">
            <span className="text-3xl text-muted-foreground font-semibold">{name ? name.charAt(0).toUpperCase() : "?"}</span>
          </div>
        )}
        <h2 className="text-3xl text-center">
          Welcome
          <span className="text-primary font-bold">{name ? `, ${name}` : ""}</span>
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 items-stretch max-w-4xl mx-auto">
        {attendanceCard}
        {testReportsCard}
      </div>

      <SchoolInfoCard />
    </div>
  );
};

export default StudentDashboard;