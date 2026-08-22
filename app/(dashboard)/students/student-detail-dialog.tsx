"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import type { StudentRow } from "./student-columns";

interface StudentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentRow | null;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}

export function StudentDetailDialog({ open, onOpenChange, student }: StudentDetailDialogProps) {
  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-2 py-2">
          {/* Passport-size photo (~35mm x 45mm ratio) */}
          <div className="h-[152px] w-[120px] rounded-md border overflow-hidden flex items-center justify-center bg-muted/50">
            {student.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={student.photoUrl} alt={student.name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm py-2">
          <Field label="Full Name" value={student.name} />
          <Field label="Roll Number" value={student.rollNumber ?? ""} />
          <Field label="Email" value={student.email} />
          <Field label="Contact Number" value={student.contactNumber ?? ""} />
          <Field label="Class" value={student.className ?? ""} />
          <Field label="Admission Date" value={student.admissionDate ?? ""} />
          <Field label="Monthly Fee" value={student.fee ? `Rs. ${student.fee.toLocaleString()}` : "Uses class fee"} />
          <div>
            <p className="text-xs text-muted-foreground">Fee (this month)</p>
            {student.feeStatus ? (
              <Badge
                className={
                  student.feeStatus === "paid"
                    ? "bg-green-600 hover:bg-green-600 text-white"
                    : "bg-red-600 hover:bg-red-600 text-white"
                }
              >
                {student.feeStatus === "paid" ? "Paid" : "Unpaid"}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">Not generated</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
