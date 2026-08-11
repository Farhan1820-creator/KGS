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
import { requestLeave } from "./attendance-actions";

interface LeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaveRequestDialog({ open, onOpenChange }: LeaveRequestDialogProps) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function reset() {
    setFromDate("");
    setToDate("");
    setReason("");
    setErrors({});
  }

  function handleSubmit() {
    setErrors({});
    startTransition(async () => {
      const result = await requestLeave({ fromDate, toDate, reason });
      if (!result.success) {
        setErrors(result.errors as Record<string, string[]>);
        return;
      }
      toast.success("Leave request submitted");
      reset();
      router.refresh();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Leave</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>From</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              {errors.fromDate && <p className="text-sm text-destructive">{errors.fromDate[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>To</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              {errors.toDate && <p className="text-sm text-destructive">{errors.toDate[0]}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Family event" />
            {errors.reason && <p className="text-sm text-destructive">{errors.reason[0]}</p>}
          </div>

          {errors.root && <p className="text-sm text-destructive">{errors.root[0]}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !fromDate || !toDate || !reason}>
            {isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
