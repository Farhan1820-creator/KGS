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
import { setOffDays } from "./attendance-actions";
import { WEEKDAY_LABELS } from "./attendance-helpers";
import { cn } from "@/lib/utils";

interface OffDaysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentOffDays: number[];
}

export function OffDaysDialog({ open, onOpenChange, currentOffDays }: OffDaysDialogProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set(currentOffDays));
  const [isPending, startTransition] = useTransition();

  function toggle(day: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      const result = await setOffDays(Array.from(selected));
      if (!result.success) {
        toast.error(result.errors.root?.[0] ?? "Could not save off days");
        return;
      }
      toast.success("Off days updated");
      router.refresh();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Weekly Off Days</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Selected days are excluded from absent/leave calculations for every employee.
        </p>

        <div className="grid grid-cols-2 gap-2 py-2">
          {WEEKDAY_LABELS.map((label, day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggle(day)}
              className={cn(
                "rounded-md border px-3 py-2 text-sm text-left transition-colors",
                selected.has(day) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
