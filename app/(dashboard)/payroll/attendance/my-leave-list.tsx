"use client";

import { Badge } from "@/components/ui/badge";

export type MyLeaveRow = {
  id: number;
  fromDate: string;
  toDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
};

function badgeVariant(status: MyLeaveRow["status"]): "default" | "secondary" | "destructive" {
  if (status === "approved") return "default";
  if (status === "rejected") return "destructive";
  return "secondary";
}

export function MyLeaveList({ leaves }: { leaves: MyLeaveRow[] }) {
  if (leaves.length === 0) {
    return <p className="text-sm text-muted-foreground">No leave requests yet.</p>;
  }

  return (
    <div className="space-y-2">
      {leaves.map((l) => (
        <div key={l.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
          <div>
            <p className="font-medium">
              {l.fromDate === l.toDate ? l.fromDate : `${l.fromDate} → ${l.toDate}`}
            </p>
            <p className="text-muted-foreground">{l.reason}</p>
          </div>
          <Badge variant={badgeVariant(l.status)}>{l.status[0].toUpperCase() + l.status.slice(1)}</Badge>
        </div>
      ))}
    </div>
  );
}
