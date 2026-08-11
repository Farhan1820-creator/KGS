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
import type { ExpenseRow } from "./expense-columns";

interface ExpenseDetailDialogProps {
  expense: ExpenseRow | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (row: ExpenseRow) => void;
  onDelete: (row: ExpenseRow) => void;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{children}</span>
    </div>
  );
}

export function ExpenseDetailDialog({ expense, onOpenChange, onEdit, onDelete }: ExpenseDetailDialogProps) {
  return (
    <Dialog open={Boolean(expense)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Expense Details</DialogTitle>
        </DialogHeader>

        {expense && (
          <div className="divide-y">
            <DetailRow label="Title">{expense.title}</DetailRow>
            <DetailRow label="Category">
              <Badge variant="secondary">{expense.categoryName}</Badge>
            </DetailRow>
            <DetailRow label="Sub-category">{expense.subCategoryName ?? "—"}</DetailRow>
            <DetailRow label="Amount">Rs. {expense.amount.toLocaleString()}</DetailRow>
            <DetailRow label="Date">{new Date(expense.date).toLocaleDateString()}</DetailRow>
            <DetailRow label="Notes">{expense.notes || "—"}</DetailRow>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {expense && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  onEdit(expense);
                  onOpenChange(false);
                }}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(expense);
                  onOpenChange(false);
                }}
              >
                Delete
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
