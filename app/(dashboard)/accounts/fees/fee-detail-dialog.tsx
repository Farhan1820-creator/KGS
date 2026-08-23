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
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { User, Pencil, Check, X } from "lucide-react";
import type { FeeRow } from "./fee-columns";
import { formatMonthLabel } from "./fee-range";

interface FeeDetailDialogProps {
  fee: FeeRow | null;
  onOpenChange: (open: boolean) => void;
  onTogglePaid: (row: FeeRow) => void;
  onUpdateAmount: (row: FeeRow, amount: number) => void;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}

export function FeeDetailDialog({ fee, onOpenChange, onTogglePaid, onUpdateAmount }: FeeDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState("");

  useEffect(() => {
    if (fee) {
      setEditAmount(fee.amount.toString());
      setIsEditing(false);
    }
  }, [fee]);

  function handleSaveAmount() {
    const num = Number(editAmount);
    if (!isNaN(num) && num > 0 && fee) {
      onUpdateAmount(fee, num);
      setIsEditing(false);
    }
  }

  return (
    <Dialog open={Boolean(fee)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fee Details</DialogTitle>
        </DialogHeader>

        {fee && (
          <div className="space-y-3">
            <div className="flex flex-col items-center gap-1 py-1">
              <div className="h-[110px] w-[90px] rounded-md border overflow-hidden flex items-center justify-center bg-muted/50">
                {fee.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fee.photoUrl} alt={fee.studentName} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="divide-y border-t">
              <DetailRow label="Student">{fee.studentName}</DetailRow>
              <DetailRow label="Roll Number">{fee.rollNumber ?? "—"}</DetailRow>
              <DetailRow label="Class">{fee.className ?? "—"}</DetailRow>
              <DetailRow label="Month">{formatMonthLabel(fee.month)}</DetailRow>
              <div className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">Amount</span>
                <div className="text-sm font-medium flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <span className="text-muted-foreground">Rs.</span>
                      <Input
                        type="number"
                        className="h-7 w-24 px-2 text-right"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveAmount()}
                        autoFocus
                      />
                      <Button size="icon-sm" variant="ghost" onClick={handleSaveAmount} className="h-6 w-6 text-green-600">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-6 w-6 text-red-600">
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span>Rs. {fee.amount.toLocaleString()}</span>
                      {fee.status === "unpaid" && (
                        <Button size="icon-sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-6 w-6 opacity-50 hover:opacity-100">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
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
