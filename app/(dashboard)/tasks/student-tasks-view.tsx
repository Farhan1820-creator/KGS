"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitTask } from "./tasks-actions";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { toast } from "sonner";
import {
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  UploadCloud,
  X,
  Loader2,
  ChevronRight,
  GraduationCap,
  FileText,
  CheckSquare,
  MessageSquare,
  Download,
  Eye,
  Calendar,
} from "lucide-react";
import { ImagePreviewDialog, downloadImageFile } from "./image-preview-dialog";

export interface StudentTaskItem {
  assignmentId: number;
  taskId: number;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  subjectName?: string | null;
  dueDate?: string | null;
  totalPoints: number;
  status: "pending" | "submitted" | "graded";
  submissionText?: string | null;
  submissionImageUrl?: string | null;
  submittedAt?: string | Date | null;
  achievedPoints?: number | null;
  percentage?: string | number | null;
  feedback?: string | null;
  teacherName?: string | null;
}

// Backward compatibility alias
export type StudentQuestItem = StudentTaskItem;

interface StudentTasksViewProps {
  studentName: string;
  tasks?: StudentTaskItem[];
  quests?: StudentTaskItem[]; // Fallback for previous prop name
}

// Calculate academic level and title based on total earned marks
function calculateStudentLevel(totalScore: number) {
  const level = Math.floor(totalScore / 200) + 1;
  const currentLevelBaseScore = (level - 1) * 200;
  const scoreInCurrentLevel = totalScore - currentLevelBaseScore;
  const progressPercent = Math.min(100, Math.round((scoreInCurrentLevel / 200) * 100));

  let academicRank = "Active Student";
  if (level >= 2 && level < 4) academicRank = "Rising Scholar";
  else if (level >= 4 && level < 7) academicRank = "Top Performer";
  else if (level >= 7 && level < 10) academicRank = "Star Scholar";
  else if (level >= 10) academicRank = "Academic Topper";

  return {
    level,
    academicRank,
    scoreInCurrentLevel,
    nextLevelScore: 200,
    progressPercent,
  };
}

export function StudentTasksView({ studentName, tasks: propTasks, quests }: StudentTasksViewProps) {
  const allTasks = propTasks || quests || [];
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"active" | "review" | "completed">("active");
  const [selectedTask, setSelectedTask] = useState<StudentTaskItem | null>(null);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ url: string; title: string; filename?: string } | null>(null);

  // Form states for submitting assignment
  const [submissionText, setSubmissionText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [celebrationSuccess, setCelebrationSuccess] = useState(false);

  // Filter tasks
  const activeTasks = allTasks.filter((t) => t.status === "pending");
  const reviewTasks = allTasks.filter((t) => t.status === "submitted");
  const completedTasks = allTasks.filter((t) => t.status === "graded");

  // Track seen/unseen graded tasks
  const [seenGradedIds, setSeenGradedIds] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("seen_graded_task_ids");
      if (stored) {
        setSeenGradedIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const unseenGradedCount = mounted
    ? completedTasks.filter((t) => !seenGradedIds.includes(t.assignmentId)).length
    : 0;

  function handleTabChange(tab: "active" | "review" | "completed") {
    setActiveTab(tab);
    if (tab === "completed") {
      const allCompletedIds = completedTasks.map((t) => t.assignmentId);
      const updatedSeen = Array.from(new Set([...seenGradedIds, ...allCompletedIds]));
      setSeenGradedIds(updatedSeen);
      try {
        localStorage.setItem("seen_graded_task_ids", JSON.stringify(updatedSeen));
      } catch (e) {
        console.error(e);
      }
    }
  }

  // Marks & Academic Stats
  const totalEarnedScore = completedTasks.reduce((acc, t) => acc + (t.achievedPoints || 0), 0);
  const studentStats = calculateStudentLevel(totalEarnedScore);

  // Average percentage of graded tasks
  const avgPercentage =
    completedTasks.length > 0
      ? Math.round(
          completedTasks.reduce((acc, t) => acc + (parseFloat(String(t.percentage)) || 0), 0) /
            completedTasks.length
        )
      : 0;

  function openSubmitDialog(task: StudentTaskItem) {
    setSelectedTask(task);
    setSubmissionText(task.submissionText || "");
    setImageFile(null);
    setImagePreview(task.submissionImageUrl || null);
    setCelebrationSuccess(false);
    setSubmissionModalOpen(true);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearSelectedImage() {
    setImageFile(null);
    if (imagePreview && imagePreview !== selectedTask?.submissionImageUrl) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  }

  async function handleTaskSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTask) return;

    if (!submissionText.trim() && !imageFile && !imagePreview) {
      toast.error("Please write your solution or attach a homework photo.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl: string | null = selectedTask.submissionImageUrl || null;

      if (imageFile) {
        setUploadProgress(15);
        const uploadRes = await uploadImageToCloudinary(imageFile, {
          onProgress: (p) => setUploadProgress(p),
        });
        finalImageUrl = uploadRes.url;
      }

      const res = await submitTask(selectedTask.assignmentId, {
        submissionText: submissionText.trim() || null,
        submissionImageUrl: finalImageUrl,
      });

      if (!res.success) {
        toast.error(res.error || "Could not submit assignment");
        setIsSubmitting(false);
        setUploadProgress(null);
        return;
      }

      setCelebrationSuccess(true);
      toast.success("Assignment Submitted! Your teacher has been notified.");
      setIsSubmitting(false);
      setUploadProgress(null);

      setTimeout(() => {
        setSubmissionModalOpen(false);
        setCelebrationSuccess(false);
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit assignment");
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  }

  return (
    <div className="page-shell space-y-6">
      {/* ── Academic Student Header Banner ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/95 via-primary to-accent/90 p-4 sm:p-6 text-white shadow-xl">
        {/* Background ambient lighting */}
        <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 -bottom-10 h-36 w-36 rounded-full bg-amber-400/15 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 sm:gap-6">
          {/* Left: Student Profile & Level Info */}
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            {/* Level Icon Avatar */}
            <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-md">
              <GraduationCap className="h-7 w-7 sm:h-9 sm:w-9 text-amber-300 drop-shadow-xs" />
              <div className="absolute -bottom-1.5 -right-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-slate-950 shadow-md border border-white/50">
                LVL {studentStats.level}
              </div>
            </div>

            {/* Name and Rank Details */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white leading-tight">
                  {studentName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold text-white backdrop-blur-xs border border-white/20 shrink-0">
                  <Award className="h-3 w-3 text-amber-300 shrink-0" />
                  {studentStats.academicRank}
                </span>
              </div>
              <p className="text-xs text-white/80 leading-snug">
                Complete assigned tasks on time to earn marks and progress!
              </p>
            </div>
          </div>

          {/* Right: Score Progress Box */}
          <div className="w-full lg:w-72 bg-black/25 backdrop-blur-md rounded-xl p-3 sm:p-3.5 border border-white/15 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-amber-300">
                <Award className="h-3.5 w-3.5 fill-amber-300 shrink-0" />
                {totalEarnedScore} Total Marks
              </span>
              <span className="text-white/85 text-[11px]">Level: {studentStats.progressPercent}%</span>
            </div>

            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500 rounded-full shadow-xs"
                style={{ width: `${studentStats.progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-white/75 pt-0.5">
              <span>
                {completedTasks.length} {completedTasks.length === 1 ? "Assignment Done" : "Assignments Done"}
              </span>
              <span className="font-medium text-white/90">
                {avgPercentage > 0 ? `${avgPercentage}% Average` : "Active"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Task Categories / Tabs ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b pb-2 overflow-x-auto">
        <button
          onClick={() => handleTabChange("active")}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "active"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          Active Tasks
          {activeTasks.length > 0 && (
            <span className="rounded-full bg-amber-400 text-black px-2 py-0.2 text-[11px] font-bold">
              {activeTasks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange("review")}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "review"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Clock className="h-4 w-4" />
          In Review
          {reviewTasks.length > 0 && (
            <span className="rounded-full bg-muted-foreground/20 px-2 py-0.2 text-[11px]">
              {reviewTasks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange("completed")}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "completed"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-amber-400" />
          Completed & Graded
          {unseenGradedCount > 0 && (
            <span className="rounded-full bg-emerald-500 text-white px-2 py-0.5 text-[11px] font-bold animate-pulse shadow-sm">
              {unseenGradedCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Tasks Grid Display ───────────────────────────────────────────── */}
      {activeTab === "active" && (
        <div className="space-y-4">
          {activeTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center bg-card space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold">All caught up!</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                You have no pending assignments right now. Check back when your teacher assigns new tasks!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTasks.map((task) => (
                <div
                  key={task.assignmentId}
                  className="group relative rounded-2xl border-2 border-primary/20 hover:border-primary bg-card p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    {/* Header Tags */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="font-semibold text-xs py-0.5 px-2.5">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {task.subjectName || "General"}
                      </Badge>
                      <span className="flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-bold">
                        <Award className="h-3.5 w-3.5" />
                        Max Marks: {task.totalPoints}
                      </span>
                    </div>

                    {/* Task Title */}
                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {task.title}
                    </h3>

                    {/* Description */}
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Question Image Attachment Preview */}
                    {task.imageUrl && (
                      <div className="pt-1.5 flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewData({
                              url: task.imageUrl!,
                              title: `${task.title} — Question Attachment`,
                              filename: `${task.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-question.jpg`,
                            })
                          }
                          className="flex items-center gap-1.5 font-semibold text-primary hover:underline"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Question
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
                          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Footer & CTA Button */}
                  <div className="space-y-2.5 pt-2 border-t text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {task.dueDate ? `Due: ${task.dueDate}` : "No deadline"}
                      </span>
                      {task.teacherName && (
                        <span className="truncate max-w-[110px]">By: {task.teacherName}</span>
                      )}
                    </div>

                    <Button
                      onClick={() => openSubmitDialog(task)}
                      className="w-full justify-between font-semibold shadow-xs group-hover:shadow-sm"
                      size="sm"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-4 w-4" />
                        Submit Assignment
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Under Review Tasks ───────────────────────────────────────────── */}
      {activeTab === "review" && (
        <div className="space-y-4">
          {reviewTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center bg-card">
              <Clock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No assignments currently awaiting review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviewTasks.map((task) => (
                <div
                  key={task.assignmentId}
                  className="rounded-2xl border bg-card p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {task.subjectName || "General"}
                    </Badge>
                    <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30">
                      In Review ⏳
                    </Badge>
                  </div>

                  <h3 className="font-bold text-sm text-foreground">{task.title}</h3>

                  <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-2.5 rounded-lg border">
                    <p className="font-medium text-foreground">Your Submitted Solution:</p>
                    {task.submissionText && <p className="line-clamp-2 italic">{task.submissionText}</p>}
                    {task.submissionImageUrl && (
                      <div className="pt-1.5 flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewData({
                              url: task.submissionImageUrl!,
                              title: `${task.title} — Submitted Solution Proof`,
                              filename: `${task.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-solution.jpg`,
                            })
                          }
                          className="text-primary hover:underline text-xs flex items-center gap-1 font-semibold"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Attached Solution
                        </button>
                        <span className="text-muted-foreground">•</span>
                        <button
                          type="button"
                          onClick={() =>
                            downloadImageFile(
                              task.submissionImageUrl!,
                              `${task.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-solution.jpg`
                            )
                          }
                          className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => openSubmitDialog(task)}
                  >
                    Edit / Re-submit Assignment
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Completed & Graded Tasks ────────────────────────────────────── */}
      {activeTab === "completed" && (
        <div className="space-y-4">
          {completedTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center bg-card">
              <CheckCircle2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No graded assignments yet. Once your teacher evaluates your submissions, marks & feedback will appear here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedTasks.map((task) => (
                <div
                  key={task.assignmentId}
                  className="rounded-2xl border bg-card p-4 shadow-xs space-y-3 relative overflow-hidden"
                >
                  {/* Marks Ribbon */}
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {task.subjectName || "General"}
                    </Badge>
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      Marks: {task.achievedPoints} / {task.totalPoints} ({task.percentage}%)
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-foreground">{task.title}</h3>

                  {/* Teacher Feedback Card */}
                  {task.feedback ? (
                    <div className="rounded-xl border bg-primary/5 p-3 text-xs space-y-1">
                      <p className="font-semibold text-primary flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Teacher Feedback:
                      </p>
                      <p className="text-muted-foreground italic">&ldquo;{task.feedback}&rdquo;</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No teacher remarks provided.</p>
                  )}

                  {/* Attached Solution link */}
                  {task.submissionImageUrl && (
                    <div className="pt-1 flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewData({
                            url: task.submissionImageUrl!,
                            title: `${task.title} — Your Submitted Solution`,
                            filename: `${task.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-solution.jpg`,
                          })
                        }
                        className="text-primary hover:underline text-xs flex items-center gap-1 font-semibold"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Submitted Work
                      </button>
                      <span className="text-muted-foreground">•</span>
                      <button
                        type="button"
                        onClick={() =>
                          downloadImageFile(
                            task.submissionImageUrl!,
                            `${task.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-solution.jpg`
                          )
                        }
                        className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Submit Assignment Modal ────────────────────────────────────────── */}
      <Dialog open={submissionModalOpen} onOpenChange={setSubmissionModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] p-4 sm:p-6 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Submit Assignment: {selectedTask?.title}
            </DialogTitle>
          </DialogHeader>

          {celebrationSuccess ? (
            <div className="py-10 text-center space-y-3">
              <div className="h-16 w-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Assignment Submitted!</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Your homework has been submitted to your teacher for review & grading.
              </p>
            </div>
          ) : (
            <form onSubmit={handleTaskSubmit} className="space-y-4 pt-2">
              {/* Task Details Info Box */}
              <div className="rounded-xl border bg-muted/30 p-3 sm:p-3.5 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    Subject: {selectedTask?.subjectName || "General"}
                  </span>
                  <span className="font-bold text-primary flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    Max Marks: {selectedTask?.totalPoints}
                  </span>
                </div>
                {selectedTask?.description && (
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedTask.description}
                  </p>
                )}

                {selectedTask?.imageUrl && (
                  <div className="pt-1 flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Teacher&apos;s Attached Question:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewData({
                          url: selectedTask.imageUrl!,
                          title: `${selectedTask.title} — Question Attachment`,
                          filename: `${selectedTask.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-question.jpg`,
                        })
                      }
                      className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Image
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        downloadImageFile(
                          selectedTask.imageUrl!,
                          `${selectedTask.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-question.jpg`
                        )
                      }
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  </div>
                )}
              </div>

              {/* Solution Answer Text */}
              <div className="space-y-1.5">
                <Label htmlFor="solution-text" className="text-xs font-semibold">
                  Your Solution / Notes
                </Label>
                <Textarea
                  id="solution-text"
                  placeholder="Type your answer, solution steps, or summary here..."
                  rows={4}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                />
              </div>

              {/* Image / Homework Photo Solution */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Attach Homework Photo / Solution</Label>
                {imagePreview ? (
                  <div className="relative rounded-lg border p-2 bg-muted/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={imagePreview}
                        alt="Solution Preview"
                        className="h-14 w-14 sm:h-16 sm:w-16 object-cover rounded-md border shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() =>
                          setPreviewData({
                            url: imagePreview,
                            title: "Homework Solution Preview",
                            filename: imageFile?.name || "homework-solution.jpg",
                          })
                        }
                      />
                      <div className="text-xs min-w-0">
                        <p className="font-medium truncate">
                          {imageFile?.name || "Attached Homework Image"}
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : "Uploaded"}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewData({
                              url: imagePreview,
                              title: "Homework Solution Preview",
                              filename: imageFile?.name || "homework-solution.jpg",
                            })
                          }
                          className="text-primary hover:underline text-[11px] font-medium inline-flex items-center gap-1 mt-0.5"
                        >
                          <Eye className="h-3 w-3" /> Preview Full
                        </button>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={clearSelectedImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 sm:p-5 cursor-pointer hover:bg-muted/40 transition-colors border-primary/30 text-center">
                    <UploadCloud className="h-6 w-6 sm:h-7 sm:w-7 text-primary mb-1" />
                    <span className="text-xs font-semibold text-foreground">Upload Homework Photo</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      Take a photo of your notebook or upload image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}

                {uploadProgress !== null && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground text-right">Uploading solution: {uploadProgress}%</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-center gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto h-9"
                  onClick={() => setSubmissionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:flex-1 font-bold gap-2 h-9" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Assignment...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Submit Assignment
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Full Image Preview Modal with Download & Zoom ─────────────────── */}
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
