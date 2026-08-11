"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { decideLeaveRequest } from "./attendance-actions";

export type PendingLeaveRow = {
  id: number;
  employeeName: string;
  fromDate: string;
  toDate: string;
  reason: string;
};

export function LeaveApprovals({ requests }: { requests: PendingLeaveRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function decide(id: number, decision: "approved" | "rejected") {
    startTransition(async () => {
      const result = await decideLeaveRequest(id, decision);
      if (!result.success) {
        toast.error(result.errors.root?.[0] ?? "Could not update leave request");
        return;
      }
      toast.success(decision === "approved" ? "Leave approved" : "Leave rejected");
      router.refresh();
    });
  }

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending leave requests.</p>;
  }

  return (
    <div className="space-y-2">
      {requests.map((r) => (
        <div key={r.id} className="flex items-center justify-between rounded-md border p-3 text-sm gap-3">
          <div>
            <p className="font-medium">{r.employeeName}</p>
            <p className="text-muted-foreground">
              {r.fromDate === r.toDate ? r.fromDate : `${r.fromDate} → ${r.toDate}`} — {r.reason}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="icon-sm" variant="outline" disabled={isPending} onClick={() => decide(r.id, "approved")}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon-sm" variant="destructive" disabled={isPending} onClick={() => decide(r.id, "rejected")}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
