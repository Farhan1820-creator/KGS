"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { TeacherRow } from "./teacher-columns";

interface TeacherDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: TeacherRow | null;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}

export function TeacherDetailDialog({ open, onOpenChange, teacher }: TeacherDetailDialogProps) {
  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Teacher Details</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 text-sm py-2">
          <Field label="Full Name" value={teacher.name} />
          <Field label="Teacher ID" value={teacher.teacherId ?? ""} />
          <Field label="Email" value={teacher.email} />
          <Field label="Contact Number" value={teacher.contactNumber ?? ""} />
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">Assigned Subject(s)</p>
            {teacher.subjectNames && teacher.subjectNames.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {teacher.subjectNames.map((name) => (
                  <Badge key={name} variant="secondary" className="font-normal text-xs py-0.5 px-2">
                    {name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="font-medium text-muted-foreground">—</p>
            )}
          </div>
          <Field label="Join Date" value={teacher.joinDate ?? ""} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
