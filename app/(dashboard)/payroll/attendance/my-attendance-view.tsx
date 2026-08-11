"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/layout/data-table";
import { SelfAttendanceCard } from "./self-attendance-card";
import { LeaveRequestDialog } from "./leave-request-dialog";
import { MyLeaveList, MyLeaveRow } from "./my-leave-list";
import { myAttendanceColumns, AttendanceRow } from "./attendance-columns";
import { type AttendanceStatus } from "./attendance-helpers";
import { Plus } from "lucide-react";

interface MyAttendanceViewProps {
  shiftHours: number;
  today: {
    checkIn: string | null;
    checkInAt: string | null;
    checkOut: string | null;
    secondsWorked: number | null;
    status: AttendanceStatus | null;
  };
  history: AttendanceRow[];
  leaves: MyLeaveRow[];
}

export function MyAttendanceView({ shiftHours, today, history, leaves }: MyAttendanceViewProps) {
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <SelfAttendanceCard
        shiftHours={shiftHours}
        todayCheckIn={today.checkIn}
        todayCheckInAt={today.checkInAt}
        todayCheckOut={today.checkOut}
        todaySecondsWorked={today.secondsWorked}
        todayStatus={today.status}
      />

      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">My Leave Requests</h3>
          <Button size="sm" onClick={() => setLeaveDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Request Leave
          </Button>
        </div>
        <MyLeaveList leaves={leaves} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Attendance History (This Month)</h3>
        <DataTable columns={myAttendanceColumns} data={history} />
      </div>

      <LeaveRequestDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen} />
    </div>
  );
}
