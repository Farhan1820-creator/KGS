"use client";

import { useState, useTransition } from "react";
import { TestMarkDialog } from "./test-mark-dialog";
import { deleteTestMark, type TestMarkRow } from "./test-reports-actions";
import { toast } from "sonner";
import { Plus, Search, Filter, Trash2, FileSpreadsheet, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  initialMarks: TestMarkRow[];
  classes: { id: number; name: string; section: string | null }[];
  students: { id: number; name: string; classId: number | null }[];
  role: string;
}

export function TestReportsClient({ initialMarks, classes, students, role }: Props) {
  const [marks, setMarks] = useState(initialMarks);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterStudent, setFilterStudent] = useState("all");
  
  // Format YYYY-MM
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [filterMonth, setFilterMonth] = useState(currentMonth);

  const [isPending, startTransition] = useTransition();

  const filtered = marks.filter((m) => {
    const matchSearch = 
      m.title.toLowerCase().includes(search.toLowerCase()) || 
      m.studentName.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === "all" || String(m.classId) === filterClass;
    const matchStudent = filterStudent === "all" || String(m.studentId) === filterStudent;
    const matchMonth = filterMonth === "" || m.month === filterMonth;

    return matchSearch && matchClass && matchStudent && matchMonth;
  });

  const studentsInClass = filterClass !== "all" 
    ? students.filter(s => String(s.classId) === filterClass)
    : students;

  function handleDelete(id: number) {
    startTransition(async () => {
      const res = await deleteTestMark(id);
      if (!res.success) {
        toast.error(res.error ?? "Delete failed.");
      } else {
        setMarks((prev) => prev.filter((m) => m.id !== id));
        toast.success("Test mark deleted.");
      }
    });
  }

  function getScoreColor(percentageStr: string) {
    const p = parseFloat(percentageStr);
    if (p >= 80) return "text-green-600 bg-green-50";
    if (p >= 50) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-card rounded-2xl shadow-sm border border-muted/50 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 sm:gap-3.5 flex-1">
          {/* Search */}
          <div className="space-y-1.5 w-full sm:flex-1 sm:min-w-48">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Search
            </Label>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search test or student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 w-full"
              />
            </div>
          </div>
          
          {/* Month */}
          <div className="space-y-1.5 w-full sm:w-40">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Month
            </Label>
            <Input 
              type="month" 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(e.target.value)} 
              className="w-full h-10"
            />
          </div>

          {/* Class */}
          <div className="space-y-1.5 w-full sm:w-44">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Class
            </Label>
            <Select value={filterClass} onValueChange={(v) => { setFilterClass(v || ""); setFilterStudent("all"); }}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name} {c.section && ` - ${c.section}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student */}
          <div className="space-y-1.5 w-full sm:w-44">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Student
            </Label>
            <Select value={filterStudent} onValueChange={(v) => setFilterStudent(v || "")}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="All students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {studentsInClass.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full lg:w-auto shrink-0 flex items-end">
          <Button onClick={() => setDialogOpen(true)} className="gap-2 w-full sm:w-auto shadow-xs h-10">
            <Plus size={16} />
            Add Test Mark
          </Button>
        </div>
      </div>

      {/* Stats */}
      <p className="mb-4 text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "report" : "reports"} found
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <FileSpreadsheet size={40} className="mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No test marks found</p>
          <p className="mt-1 text-xs text-muted-foreground/60">Adjust filters or click "Add Test Mark" to create one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((mark) => {
            const scoreStyles = getScoreColor(mark.percentage);
            return (
              <div key={mark.id} className="group relative flex flex-col rounded-xl border bg-card p-5 shadow-sm transition hover:shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${scoreStyles}`}>
                    <Percent size={20} />
                  </div>
                  {(role === "admin" || role === "teacher") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => handleDelete(mark.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>

                <div className="mb-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-600">
                    {mark.className}{mark.classSection ? ` – ${mark.classSection}` : ""}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                    {mark.month}
                  </span>
                </div>

                <p className="mb-1 line-clamp-1 text-sm font-bold text-foreground">{mark.title}</p>
                <p className="mb-3 line-clamp-1 text-sm font-medium text-muted-foreground">{mark.studentName}</p>

                <div className="mt-auto grid grid-cols-2 gap-2 text-sm border-t pt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="font-semibold">{mark.achievedMarks} / {mark.totalMarks}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Percentage</p>
                    <p className={`font-semibold ${scoreStyles.split(' ')[0]}`}>{mark.percentage}%</p>
                  </div>
                </div>
                
                <div className="mt-3 text-[10px] text-muted-foreground text-right">
                  Added by {mark.creatorName}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TestMarkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={() => window.location.reload()}
        classes={classes}
        students={students}
      />
    </div>
  );
}
