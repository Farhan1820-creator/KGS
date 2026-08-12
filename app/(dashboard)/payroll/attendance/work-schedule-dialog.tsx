"use client";

import { useState, useTransition } from "react";
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
import { createWorkSchedule } from "./attendance-actions";
import { WEEKDAY_LABELS, todayString } from "./attendance-helpers";
import { cn } from "@/lib/utils";

interface WorkScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DayState = { enabled: boolean; startTime: string; endTime: string };

function defaultDays(): Record<number, DayState> {
  const days: Record<number, DayState> = {};
  for (let i = 0; i <= 6; i++) {
    days[i] = { enabled: i !== 0, startTime: "08:00", endTime: "10:00" }; // Sunday off by default
  }
  return days;
}

export function WorkScheduleDialog({ open, onOpenChange }: WorkScheduleDialogProps) {
  const router = useRouter();
  const [effectiveFrom, setEffectiveFrom] = useState(todayString());
  const [label, setLabel] = useState("");
  const [days, setDays] = useState<Record<number, DayState>>(defaultDays());
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function updateDay(day: number, patch: Partial<DayState>) {
    setDays((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  }

  function reset() {
    setEffectiveFrom(todayString());
    setLabel("");
    setDays(defaultDays());
    setErrors({});
  }

  function handleSave() {
    setErrors({});
    const selectedDays = Object.entries(days)
      .filter(([, v]) => v.enabled)
      .map(([dayOfWeek, v]) => ({ dayOfWeek: Number(dayOfWeek), startTime: v.startTime, endTime: v.endTime }));

    startTransition(async () => {
      const result = await createWorkSchedule({ effectiveFrom, label, days: selectedDays });
      if (!result.success) {
        setErrors(result.errors as Record<string, string[]>);
        return;
      }
      toast.success("Work schedule saved");
      reset();
      router.refresh();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Work Schedule</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Set per-day timings. This applies from the effective date onward — past attendance/salary keeps
          whatever schedule was active at the time.
        </p>

        <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Effective From</Label>
              <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
              {errors.effectiveFrom && <p className="text-sm text-destructive">{errors.effectiveFrom[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Label (optional)</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Summer Camp Hours" />
            </div>
          </div>

          <div className="space-y-2">
            {WEEKDAY_LABELS.map((weekdayLabel, day) => {
              const state = days[day];
              return (
                <div
                  key={day}
                  className={cn(
                    "flex items-center gap-3 rounded-md border p-2.5",
                    !state.enabled && "opacity-60"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => updateDay(day, { enabled: !state.enabled })}
                    className={cn(
                      "w-24 shrink-0 rounded-md px-2 py-1.5 text-sm text-left transition-colors",
                      state.enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {weekdayLabel.slice(0, 3)}
                  </button>
                  {state.enabled ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={state.startTime}
                        onChange={(e) => updateDay(day, { startTime: e.target.value })}
                        className="w-32"
                      />
                      <span className="text-muted-foreground text-sm">to</span>
                      <Input
                        type="time"
                        value={state.endTime}
                        onChange={(e) => updateDay(day, { endTime: e.target.value })}
                        className="w-32"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Off</span>
                  )}
                </div>
              );
            })}
          </div>

          {errors.days && <p className="text-sm text-destructive">{errors.days[0]}</p>}
          {errors.root && <p className="text-sm text-destructive">{errors.root[0]}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
