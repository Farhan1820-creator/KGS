"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FeeRow } from "./fee-columns";
import { formatMonthLabel } from "./fee-range";

interface FeeDetailDialogProps {
  fee: FeeRow | null;
  onOpenChange: (open: boolean) => void;
  onTogglePaid: (row: FeeRow) => void;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}

export function FeeDetailDialog({ fee, onOpenChange, onTogglePaid }: FeeDetailDialogProps) {
  return (
    <Dialog open={Boolean(fee)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fee Details</DialogTitle>
        </DialogHeader>

        {fee && (
          <div className="divide-y">
            <DetailRow label="Student">{fee.studentName}</DetailRow>
            <DetailRow label="Roll Number">{fee.rollNumber ?? "—"}</DetailRow>
            <DetailRow label="Class">{fee.className ?? "—"}</DetailRow>
            <DetailRow label="Month">{formatMonthLabel(fee.month)}</DetailRow>
            <DetailRow label="Amount">Rs. {fee.amount.toLocaleString()}</DetailRow>
            <DetailRow label="Status">
              <Badge
                className={
                  fee.status === "paid"
                    ? "bg-green-600 hover:bg-green-600 text-white"
                    : "bg-red-600 hover:bg-red-600 text-white"
                }
              >
                {fee.status === "paid" ? "Paid" : "Unpaid"}
              </Badge>
            </DetailRow>
            <DetailRow label="Paid On">{fee.paidDate ?? "—"}</DetailRow>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {fee && (
            <Button
              onClick={() => {
                onTogglePaid(fee);
                onOpenChange(false);
              }}
            >
              Mark {fee.status === "paid" ? "Unpaid" : "Paid"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
