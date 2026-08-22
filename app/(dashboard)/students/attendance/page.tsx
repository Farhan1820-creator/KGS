import { Metadata } from "next";
import { AttendanceClient } from "./attendance-client";
import { getClasses } from "./attendance-actions";

export const metadata: Metadata = {
  title: "Student Attendance | The Learnex Academy",
};

export default async function StudentAttendancePage() {
  const classes = await getClasses();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Student Attendance</h2>
      </div>
      <div className="mt-4">
        <AttendanceClient classes={classes} />
      </div>
    </div>
  );
}
