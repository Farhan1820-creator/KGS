"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogIn, LogOut, Clock } from "lucide-react";
import { checkIn, checkOut } from "./attendance-actions";
import { formatDuration, STATUS_LABELS, type AttendanceStatus } from "./attendance-helpers";

interface SelfAttendanceCardProps {
  todayCheckIn: string | null;
  todayCheckInAt: string | null; // ISO timestamp, used to drive the live timer
  todayCheckOut: string | null;
  todaySecondsWorked: number | null;
  todayStatus: AttendanceStatus | null;
  requiredSecondsToday: number | null; // null = today is an off day / no schedule configured
}

export function SelfAttendanceCard({
  todayCheckIn,
  todayCheckInAt,
  todayCheckOut,
  todaySecondsWorked,
  todayStatus,
  requiredSecondsToday,
}: SelfAttendanceCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [liveSeconds, setLiveSeconds] = useState(0);

  // Live ticking elapsed-time counter while checked in and not yet checked out.
  useEffect(() => {
    if (!todayCheckInAt || todayCheckOut) return;

    const checkInMs = new Date(todayCheckInAt).getTime();
    const tick = () => setLiveSeconds(Math.max(0, Math.floor((Date.now() - checkInMs) / 1000)));

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [todayCheckInAt, todayCheckOut]);

  function handleCheckIn() {
    startTransition(async () => {
      const result = await checkIn();
      if (!result.success) {
        toast.error(result.errors.root?.[0] ?? "Could not check in");
        return;
      }
      toast.success("Checked in");
      router.refresh();
    });
  }

  function handleCheckOut() {
    startTransition(async () => {
      const result = await checkOut();
      if (!result.success) {
        toast.error(result.errors.root?.[0] ?? "Could not check out");
        return;
      }
      toast.success("Checked out");
      router.refresh();
    });
  }

  const isLive = !!todayCheckInAt && !todayCheckOut;
  const displaySeconds = isLive ? liveSeconds : todaySecondsWorked;

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Today's Attendance</h3>
          <p className="text-xs text-muted-foreground">
            {requiredSecondsToday ? `Today's requirement: ${formatDuration(requiredSecondsToday)}` : "No shift scheduled today"}
          </p>
        </div>
        {todayStatus && <Badge variant="outline">{STATUS_LABELS[todayStatus]}</Badge>}
      </div>

      <div className="flex flex-wrap items-center gap-6 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Check In</p>
          <p className="font-medium">{todayCheckIn ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Check Out</p>
          <p className="font-medium">{todayCheckOut ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{isLive ? "Time Worked (live)" : "Time Worked"}</p>
          <p className={`font-medium tabular-nums ${isLive ? "text-primary" : ""}`}>{formatDuration(displaySeconds)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleCheckIn} disabled={isPending || !!todayCheckIn} size="sm">
          <LogIn className="h-4 w-4 mr-1" />
          Check In
        </Button>
        <Button
          onClick={handleCheckOut}
          disabled={isPending || !todayCheckIn || !!todayCheckOut}
          variant="outline"
          size="sm"
        >
          <LogOut className="h-4 w-4 mr-1" />
          Check Out
        </Button>
        {!todayCheckIn && (
          <span className="flex items-center text-xs text-muted-foreground gap-1">
            <Clock className="h-3 w-3" /> Not checked in yet today
          </span>
        )}
      </div>
    </div>
  );
}
