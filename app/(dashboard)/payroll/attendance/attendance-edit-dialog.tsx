"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateAttendanceRecord } from "./attendance-actions";
import { formatDuration, STATUS_LABELS } from "./attendance-helpers";
import type { AttendanceRow } from "./attendance-columns";

// "2:30 PM" -> "14:30", for the time inputs (records display formatted
// labels, but the edit form + server action work with 24h "HH:MM").
function to24Hour(label: string | null): string {
  if (!label) return "";
  const match = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return "";
  let h = Number(match[1]);
  const m = match[2];
  const period = match[3].toUpperCase();
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m}`;
}

interface AttendanceEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: AttendanceRow | null;
}

export function AttendanceEditDialog({ open, onOpenChange, record }: AttendanceEditDialogProps) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [isLeave, setIsLeave] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (record) {
      setCheckIn(to24Hour(record.checkIn));
      setCheckOut(to24Hour(record.checkOut));
      setIsLeave(record.status === "leave");
      setErrors({});
    }
  }, [record, open]);

  const hasBothTimes = !!checkIn && !!checkOut;

  function handleSubmit() {
    if (!record) return;
    setErrors({});
    startTransition(async () => {
      const result = await updateAttendanceRecord({
        employeeId: record.employeeId,
        date: record.date,
        checkIn,
        checkOut,
        isLeave,
      });
      if (!result.success) {
        setErrors(result.errors as Record<string, string[]>);
        return;
      }
      toast.success("Attendance updated");
      onOpenChange(false);
      router.refresh();
    });
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Attendance</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Employee</p>
              <p className="font-medium">{record.employeeName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{record.date}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Designation</p>
              <p className="font-medium">{record.designation}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hours Worked (current)</p>
              <p className="font-medium">{formatDuration(record.secondsWorked)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Check In</Label>
              <Input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
              {errors.checkIn && <p className="text-sm text-destructive">{errors.checkIn[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Check Out</Label>
              <Input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
              {errors.checkOut && <p className="text-sm text-destructive">{errors.checkOut[0]}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {hasBothTimes ? "Present / Half-Day — calculated on save" : isLeave ? STATUS_LABELS.leave : STATUS_LABELS.absent}
              </Badge>
            </div>
            {!hasBothTimes && (
              <label className="flex items-center gap-2 text-sm pt-1">
                <input
                  type="checkbox"
                  checked={isLeave}
                  onChange={(e) => setIsLeave(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                Mark as Leave
              </label>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Status is decided automatically from the times: full check-in + check-out gives Present or Half-Day
            based on hours worked, even a short check-in counts as Half-Day. Leave both times blank and tick
            &quot;Mark as Leave&quot; for a leave day, or leave both blank and unticked for Absent.
          </p>

          {errors.root && <p className="text-sm text-destructive">{errors.root[0]}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
