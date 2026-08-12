"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/layout/data-table";
import { LeaveRequestDialog } from "./leave-request-dialog";
import { MyLeaveList, MyLeaveRow } from "./my-leave-list";
import { myAttendanceColumns, AttendanceRow } from "./attendance-columns";
import { Plus } from "lucide-react";

interface MyAttendanceViewProps {
  history: AttendanceRow[];
  leaves: MyLeaveRow[];
}

export function MyAttendanceView({ history, leaves }: MyAttendanceViewProps) {
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
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
