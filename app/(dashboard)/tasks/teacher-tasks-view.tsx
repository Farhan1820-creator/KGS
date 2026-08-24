"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateTaskDialog } from "./create-task-dialog";
import { GradeSubmissionDialog, SubmissionItem } from "./grade-submission-dialog";
import { deleteTask } from "./tasks-actions";
import { toast } from "sonner";
import {
  Plus,
  Search,
  ListTodo,
  Calendar,
  CheckCircle2,
  Clock,
  Award,
  Trash2,
  Users,
  Image as ImageIcon,
  BookOpen,
  ArrowRight,
  Download,
  Eye,
} from "lucide-react";
import { ImagePreviewDialog, downloadImageFile } from "./image-preview-dialog";

export interface TaskRecord {
  id: number;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  subjectId?: number | null;
  subjectName?: string | null;
  classId?: number | null;
  className?: string | null;
  dueDate?: string | null;
  totalPoints: number;
  createdAt: string | Date;
  teacherName?: string | null;
  assignments: {
    id: number;
    studentId: number;
    studentName: string;
    rollNumber?: string | null;
    className?: string;
    status: "pending" | "submitted" | "graded";
    submissionText?: string | null;
    submissionImageUrl?: string | null;
    submittedAt?: string | Date | null;
    achievedPoints?: number | null;
    percentage?: string | number | null;
    feedback?: string | null;
  }[];
}

interface TeacherTasksViewProps {
  tasks: TaskRecord[];
  subjects: { id: number; name: string }[];
  classes: { id: number; name: string; section?: string | null }[];
  students: { id: number; name: string; classId?: number | null; className?: string }[];
}

export function TeacherTasksView({
  tasks: initialTasks,
  subjects,
  classes,
  students,
}: TeacherTasksViewProps) {
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);

  const [activeSubmissionsTask, setActiveSubmissionsTask] = useState<TaskRecord | null>(null);
  const [previewData, setPreviewData] = useState<{ url: string; title: string; filename?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [isPending, startTransition] = useTransition();

  // Summary statistics
  const totalTasksCount = initialTasks.length;
  const totalAssignmentsCount = initialTasks.reduce((acc, t) => acc + t.assignments.length, 0);
  const totalSubmittedCount = initialTasks.reduce(
    (acc, t) => acc + t.assignments.filter((a) => a.status === "submitted").length,
    0
  );
  const totalGradedCount = initialTasks.reduce(
    (acc, t) => acc + t.assignments.filter((a) => a.status === "graded").length,
    0
  );

  const filteredTasks = useMemo(() => {
    return initialTasks.filter((t) => {
      if (filterSubject !== "all" && String(t.subjectId) !== filterSubject) return false;
      if (filterClass !== "all" && String(t.classId) !== filterClass) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(query);
        const matchDesc = (t.description || "").toLowerCase().includes(query);
        const matchSubject = (t.subjectName || "").toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchSubject) return false;
      }
      return true;
    });
  }, [initialTasks, filterSubject, filterClass, searchQuery]);

  function handleOpenGrading(task: TaskRecord, assignment: TaskRecord["assignments"][0]) {
    setSelectedSubmission({
      id: assignment.id,
      taskId: task.id,
      taskTitle: task.title,
      totalPoints: task.totalPoints,
      studentId: assignment.studentId,
      studentName: assignment.studentName,
      rollNumber: assignment.rollNumber,
      className: assignment.className,
      status: assignment.status,
      submissionText: assignment.submissionText,
      submissionImageUrl: assignment.submissionImageUrl,
      submittedAt: assignment.submittedAt,
      achievedPoints: assignment.achievedPoints,
      percentage: assignment.percentage,
      feedback: assignment.feedback,
    });
    setGradeDialogOpen(true);
  }

  function handleDeleteTask(taskId: number) {
    if (!confirm("Are you sure you want to delete this task? All student submissions will also be deleted.")) {
      return;
    }
    startTransition(async () => {
      const res = await deleteTask(taskId);
      if (res.success) {
        toast.success("Task deleted");
        if (activeSubmissionsTask?.id === taskId) {
          setActiveSubmissionsTask(null);
        }
        router.refresh();
      } else {
        toast.error("Could not delete task");
      }
    });
  }

  return (
    <div className="page-shell space-y-5">
      {/* Top Action Bar */}
      <div className="flex items-center justify-end">
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 shadow-xs">
          <Plus className="h-4 w-4" />
          Create New Task
        </Button>
      </div>

      {/* Summary Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium truncate">
            <ListTodo className="h-4 w-4 text-primary shrink-0" />
            <span>Total Tasks</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold mt-1 text-foreground">{totalTasksCount}</p>
        </div>

        <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium truncate">
            <Users className="h-4 w-4 text-blue-500 shrink-0" />
            <span>Total Assigned</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold mt-1 text-foreground">{totalAssignmentsCount}</p>
        </div>

        <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium truncate">
            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Pending Review</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
            {totalSubmittedCount}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium truncate">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Graded Tasks</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
            {totalGradedCount}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card rounded-2xl shadow-sm border border-muted/50 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 sm:gap-3.5">
          {/* Search Task */}
          <div className="space-y-1.5 w-full sm:flex-1 sm:min-w-64">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Search Task
            </Label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, subject or description..."
                className="pl-10 h-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5 w-full sm:w-48">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Subject
            </Label>
            <Select value={filterSubject} onValueChange={(val) => setFilterSubject(val || "all")}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class */}
          <div className="space-y-1.5 w-full sm:w-48">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Class
            </Label>
            <Select value={filterClass} onValueChange={(val) => setFilterClass(val || "all")}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} {c.section ? `(${c.section})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters */}
          {(searchQuery || filterSubject !== "all" || filterClass !== "all") && (
            <div className="w-full sm:w-auto">
              <Button
                variant="ghost"
                size="default"
                className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground h-10 px-3"
                onClick={() => {
                  setSearchQuery("");
                  setFilterSubject("all");
                  setFilterClass("all");
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Task Cards List */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 sm:p-12 text-center bg-card">
          <ListTodo className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="font-semibold text-base">No tasks found</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-4">
            {initialTasks.length === 0
              ? "Start by creating and assigning your first task to students."
              : "No tasks match your current filters."}
          </p>
          <Button onClick={() => setCreateDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Create Task
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const pendingCount = task.assignments.filter((a) => a.status === "pending").length;
            const submittedCount = task.assignments.filter((a) => a.status === "submitted").length;
            const gradedCount = task.assignments.filter((a) => a.status === "graded").length;
            const totalAssigned = task.assignments.length;

            return (
              <div
                key={task.id}
                className="rounded-2xl border bg-card p-4 sm:p-4.5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Card Header: Subject, Class & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {task.subjectName ? (
                        <Badge variant="secondary" className="font-medium text-xs">
                          {task.subjectName}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          General
                        </Badge>
                      )}
                      {task.className && (
                        <Badge variant="outline" className="text-xs">
                          {task.className}
                        </Badge>
                      )}
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-800/50">
                        Score: {task.totalPoints}
                      </span>
                    </div>

                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 h-7 w-7 shrink-0"
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Task Title & Description */}
                  <h3 className="font-semibold text-sm sm:text-base mt-2 text-foreground line-clamp-1">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  {/* Attachment indicator if image exists */}
                  {task.imageUrl && (
                    <div className="mt-2.5 flex items-center gap-2 text-xs border-t border-dashed pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewData({
                            url: task.imageUrl!,
                            title: `${task.title} — Attached Question`,
                            filename: `${task.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-question.jpg`,
                          })
                        }
                        className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Attached Question
                      </button>
                      <span className="text-muted-foreground">•</span>
                      <button
                        type="button"
                        onClick={() =>
                          downloadImageFile(
                            task.imageUrl!,
                            `${task.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-question.jpg`
                          )
                        }
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                    </div>
                  )}
                </div>

                {/* Submissions Progress & Due Date */}
                <div className="space-y-2.5 pt-2.5 border-t text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{task.dueDate ? `Due: ${task.dueDate}` : "No due date"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        {submittedCount} Submitted
                      </span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {gradedCount} Graded
                      </span>
                    </div>
                  </div>

                  {/* Submissions Progress Bar */}
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${totalAssigned ? (gradedCount / totalAssigned) * 100 : 0}%` }}
                      title={`${gradedCount} Graded`}
                    />
                    <div
                      className="bg-amber-400 h-full transition-all"
                      style={{ width: `${totalAssigned ? (submittedCount / totalAssigned) * 100 : 0}%` }}
                      title={`${submittedCount} Submitted (Needs Review)`}
                    />
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between mt-1 text-xs font-medium h-8.5"
                    onClick={() => setActiveSubmissionsTask(task)}
                  >
                    <span>View Submissions ({totalAssigned})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Submissions Sheet / Dialog */}
      {activeSubmissionsTask && (
        <Dialog open={!!activeSubmissionsTask} onOpenChange={() => setActiveSubmissionsTask(null)}>
          <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] p-4 sm:p-6 overflow-y-auto">
            <DialogHeader>
              <div className="pr-6">
                <DialogTitle className="text-base sm:text-lg font-bold">
                  {activeSubmissionsTask.title} — Submissions
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeSubmissionsTask.assignments.length} assigned students • Max Score:{" "}
                  {activeSubmissionsTask.totalPoints}
                </p>
              </div>
            </DialogHeader>

            <div className="space-y-2 mt-3">
              {activeSubmissionsTask.assignments.map((assignment) => {
                return (
                  <div
                    key={assignment.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors text-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{assignment.studentName}</span>
                        {assignment.rollNumber && (
                          <span className="text-xs text-muted-foreground">({assignment.rollNumber})</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge
                          variant={
                            assignment.status === "graded"
                              ? "default"
                              : assignment.status === "submitted"
                              ? "secondary"
                              : "outline"
                          }
                          className="capitalize py-0 text-[10px]"
                        >
                          {assignment.status}
                        </Badge>
                        {assignment.submittedAt && (
                          <span>
                            {new Date(assignment.submittedAt).toLocaleDateString("en-CA")}
                          </span>
                        )}
                        {assignment.status === "graded" && (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            Score: {assignment.achievedPoints}/{activeSubmissionsTask.totalPoints} ({assignment.percentage}%)
                          </span>
                        )}
                      </div>

                      {/* Student Attached Proof (Quick View & Download) */}
                      {assignment.submissionImageUrl && (
                        <div className="flex items-center gap-2 pt-1 text-xs">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewData({
                                url: assignment.submissionImageUrl!,
                                title: `${assignment.studentName}'s Homework Proof — ${activeSubmissionsTask.title}`,
                                filename: `${assignment.studentName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-proof.jpg`,
                              })
                            }
                            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Attached Proof
                          </button>
                          <span className="text-muted-foreground">•</span>
                          <button
                            type="button"
                            onClick={() =>
                              downloadImageFile(
                                assignment.submissionImageUrl!,
                                `${assignment.studentName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-proof.jpg`
                              )
                            }
                            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="self-end sm:self-auto w-full sm:w-auto">
                      {assignment.status === "pending" ? (
                        <span className="text-xs text-muted-foreground italic">Not submitted</span>
                      ) : (
                        <Button
                          size="sm"
                          variant={assignment.status === "submitted" ? "default" : "outline"}
                          className="text-xs h-8 gap-1.5 w-full sm:w-auto"
                          onClick={() => handleOpenGrading(activeSubmissionsTask, assignment)}
                        >
                          <Award className="h-3.5 w-3.5" />
                          {assignment.status === "submitted" ? "Review & Grade" : "Edit Grade"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        subjects={subjects}
        classes={classes}
        students={students}
        onCreated={() => router.refresh()}
      />

      {/* Grade Submission Dialog */}
      <GradeSubmissionDialog
        open={gradeDialogOpen}
        onOpenChange={setGradeDialogOpen}
        submission={selectedSubmission}
        onGraded={() => {
          router.refresh();
          if (activeSubmissionsTask) {
            // Re-fetch or update
            setActiveSubmissionsTask(null);
          }
        }}
      />

      {/* Full Image Preview Modal with Download & Zoom */}
      <ImagePreviewDialog
        open={!!previewData}
        onOpenChange={(open) => {
          if (!open) setPreviewData(null);
        }}
        imageUrl={previewData?.url || null}
        title={previewData?.title}
        filename={previewData?.filename}
      />
    </div>
  );
}
