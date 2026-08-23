"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addTestMark } from "./test-reports-actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TestMarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  classes: { id: number; name: string; section: string | null }[];
  students: { id: number; name: string; classId: number | null }[];
}

export function TestMarkDialog({ open, onOpenChange, onSaved, classes, students }: TestMarkDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [achievedMarks, setAchievedMarks] = useState("");

  const filteredStudents = classId ? students.filter((s) => s.classId === parseInt(classId)) : [];
  
  // Format YYYY-MM
  const defaultMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(defaultMonth);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!classId || !studentId || !title || !totalMarks || !achievedMarks || !month) {
      toast.error("Please fill in all fields");
      return;
    }

    startTransition(async () => {
      const res = await addTestMark({
        classId: parseInt(classId),
        studentId: parseInt(studentId),
        title,
        month,
        totalMarks: parseInt(totalMarks),
        achievedMarks: parseInt(achievedMarks),
      });

      if (!res.success) {
        toast.error(res.error ?? "Failed to save test mark.");
      } else {
        toast.success("Test mark saved successfully.");
        onSaved();
        onOpenChange(false);
        // Reset form
        setClassId("");
        setStudentId("");
        setTitle("");
        setTotalMarks("");
        setAchievedMarks("");
        setMonth(defaultMonth);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Test Mark</DialogTitle>
          <DialogDescription>
            Enter the student's marks for a specific test. Percentage is auto-calculated.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="month">Month</Label>
            <Input id="month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} required />
          </div>

          <div className="grid gap-2">
            <Label>Class</Label>
            <Select value={classId} onValueChange={(v) => { setClassId(v || ""); setStudentId(""); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}{c.section ? ` – ${c.section}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Student</Label>
            <Select value={studentId} onValueChange={(v) => setStudentId(v || "")} disabled={!classId}>
              <SelectTrigger>
                <SelectValue placeholder={classId ? "Select student" : "Select a class first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredStudents.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
                {filteredStudents.length === 0 && classId && (
                  <SelectItem value="none" disabled>No students found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Test Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Midterm, Chapter 1 Quiz" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="totalMarks">Total Marks</Label>
              <Input id="totalMarks" type="number" min="1" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="achievedMarks">Achieved Marks</Label>
              <Input id="achievedMarks" type="number" min="0" max={totalMarks || undefined} value={achievedMarks} onChange={(e) => setAchievedMarks(e.target.value)} required />
            </div>
          </div>

          {totalMarks && achievedMarks && parseInt(totalMarks) > 0 && (
            <div className="text-sm font-medium">
              Percentage: {((parseInt(achievedMarks) / parseInt(totalMarks)) * 100).toFixed(2)}%
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Test Mark
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
