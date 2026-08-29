"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap, Users } from "lucide-react";

interface DiaryFiltersProps {
  classes: { id: number; name: string; section: string | null }[];
  students: { id: number; name: string; rollNumber: string | null }[];
  selectedClassId: string;
  selectedStudentId: string;
}

export function DiaryFilters({
  classes,
  students,
  selectedClassId,
  selectedStudentId,
}: DiaryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleClassChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("classId", value);
    params.delete("studentId"); // reset student when class changes
    router.push(`/diary?${params.toString()}`);
  }

  function handleStudentChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete("studentId");
    } else {
      params.set("studentId", value);
    }
    router.push(`/diary?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Class selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <GraduationCap className="h-3.5 w-3.5" />
          <span>Class</span>
        </div>
        <Select value={selectedClassId} onValueChange={handleClassChange}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}{c.section ? ` - ${c.section}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Separator dot */}
      <div className="h-1 w-1 rounded-full bg-border hidden sm:block" />

      {/* Student selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Users className="h-3.5 w-3.5" />
          <span>Student</span>
        </div>
        <Select
          value={selectedStudentId || "all"}
          onValueChange={handleStudentChange}
        >
          <SelectTrigger className="w-48 h-8 text-sm">
            <SelectValue placeholder="All Students" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            {students.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}{s.rollNumber ? ` (${s.rollNumber})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
