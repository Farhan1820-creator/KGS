"use client";

import { useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertFeeStructure } from "./fee-actions";

interface FeeStructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: { id: number; name: string; section: string | null }[];
  structures: { classId: number; amount: number }[];
  onSaved: () => void;
}

export function FeeStructureDialog({ open, onOpenChange, classes, structures, onSaved }: FeeStructureDialogProps) {
  const [classId, setClassId] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const structureMap = new Map(structures.map((s) => [s.classId, s.amount]));

  function handleClassChange(value: string) {
    setClassId(value);
    const existing = structureMap.get(Number(value));
    setAmount(existing ? String(existing) : "");
  }

  function handleSubmit() {
    setErrors({});
    startTransition(async () => {
      const result = await upsertFeeStructure({ classId, amount });
      if (!result.success) {
        setErrors(result.errors as Record<string, string[]>);
        return;
      }
      toast.success("Fee structure saved");
      setClassId("");
      setAmount("");
      onSaved();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Class Fee</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Class</Label>
            <Select value={classId} onValueChange={(v) => handleClassChange(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} {c.section ?? ""}
                    {structureMap.has(c.id) ? ` — Rs. ${structureMap.get(c.id)}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.classId && <p className="text-sm text-destructive">{errors.classId[0]}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Monthly Amount (Rs.)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
            />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount[0]}</p>}
          </div>

          {errors.root && <p className="text-sm text-destructive">{errors.root[0]}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !classId || !amount}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}