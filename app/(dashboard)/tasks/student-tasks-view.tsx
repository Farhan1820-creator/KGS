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
  Swords,
  Shield,
  Trophy,
  Star,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  UploadCloud,
  X,
  Loader2,
  ExternalLink,
  ChevronRight,
  Zap,
  Target,
  Crown,
} from "lucide-react";

export interface StudentQuestItem {
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

interface StudentTasksViewProps {
  studentName: string;
  quests: StudentQuestItem[];
}

// Calculate level and rank title based on total earned Score
function calculatePlayerLevel(totalScore: number) {
  const level = Math.floor(totalScore / 200) + 1;
  const currentLevelBaseScore = (level - 1) * 200;
  const nextLevelScore = level * 200;
  const scoreInCurrentLevel = totalScore - currentLevelBaseScore;
  const progressPercent = Math.min(100, Math.round((scoreInCurrentLevel / 200) * 100));

  let rankTitle = "Novice Explorer";
  if (level >= 2 && level < 4) rankTitle = "Scholar Apprentice";
  else if (level >= 4 && level < 7) rankTitle = "Knight of Knowledge";
  else if (level >= 7 && level < 10) rankTitle = "Master Alchemist";
  else if (level >= 10) rankTitle = "Legendary Grandmaster";

  return {
    level,
    rankTitle,
    scoreInCurrentLevel,
    nextLevelScore: 200,
    progressPercent,
  };
}

export function StudentTasksView({ studentName, quests }: StudentTasksViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"active" | "review" | "completed">("active");
  const [selectedQuest, setSelectedQuest] = useState<StudentQuestItem | null>(null);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [imagePreviewModal, setImagePreviewModal] = useState<string | null>(null);

  // Form states for submitting quest
  const [submissionText, setSubmissionText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [celebrationSuccess, setCelebrationSuccess] = useState(false);

  // Filter quests
  const activeQuests = quests.filter((q) => q.status === "pending");
  const reviewQuests = quests.filter((q) => q.status === "submitted");
  const completedQuests = quests.filter((q) => q.status === "graded");

  // Track seen/unseen graded quests (like WhatsApp unread badges)
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
    ? completedQuests.filter((q) => !seenGradedIds.includes(q.assignmentId)).length
    : 0;

  function handleTabChange(tab: "active" | "review" | "completed") {
    setActiveTab(tab);
    if (tab === "completed") {
      const allCompletedIds = completedQuests.map((q) => q.assignmentId);
      const updatedSeen = Array.from(new Set([...seenGradedIds, ...allCompletedIds]));
      setSeenGradedIds(updatedSeen);
      try {
        localStorage.setItem("seen_graded_task_ids", JSON.stringify(updatedSeen));
      } catch (e) {
        console.error(e);
      }
    }
  }

  // Score & Gamification Stats
  const totalEarnedScore = completedQuests.reduce((acc, q) => acc + (q.achievedPoints || 0), 0);
  const playerStats = calculatePlayerLevel(totalEarnedScore);

  // Average percentage of graded quests
  const avgPercentage = completedQuests.length > 0
    ? Math.round(
        completedQuests.reduce((acc, q) => acc + (parseFloat(String(q.percentage)) || 0), 0) /
          completedQuests.length
      )
    : 0;

  function openSubmitDialog(quest: StudentQuestItem) {
    setSelectedQuest(quest);
    setSubmissionText(quest.submissionText || "");
    setImageFile(null);
    setImagePreview(quest.submissionImageUrl || null);
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
    if (imagePreview && imagePreview !== selectedQuest?.submissionImageUrl) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  }

  async function handleQuestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedQuest) return;

    if (!submissionText.trim() && !imageFile && !imagePreview) {
      toast.error("Please write your solution or attach a homework photo.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl: string | null = selectedQuest.submissionImageUrl || null;

      if (imageFile) {
        setUploadProgress(15);
        const uploadRes = await uploadImageToCloudinary(imageFile, {
          onProgress: (p) => setUploadProgress(p),
        });
        finalImageUrl = uploadRes.url;
      }

      const res = await submitTask(selectedQuest.assignmentId, {
        submissionText: submissionText.trim() || null,
        submissionImageUrl: finalImageUrl,
      });

      if (!res.success) {
        toast.error(res.error || "Could not submit quest");
        setIsSubmitting(false);
        setUploadProgress(null);
        return;
      }

      setCelebrationSuccess(true);
      toast.success("🎉 Quest Turned In! Your teacher has been notified.");
      setIsSubmitting(false);
      setUploadProgress(null);

      setTimeout(() => {
        setSubmissionModalOpen(false);
        setCelebrationSuccess(false);
        router.refresh();
      }, 1600);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit quest");
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  }

  return (
    <div className="page-shell space-y-6">
      {/* ── Gamified Hero Player Banner ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/95 via-primary to-accent/90 p-5 sm:p-6 text-white shadow-xl">
        {/* Subtle background game particles / glowing circles */}
        <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 -bottom-10 h-36 w-36 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left: Player Avatar & Level */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-lg">
              <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-amber-300 drop-shadow-md" />
              <div className="absolute -bottom-2 -right-1 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-black text-black shadow-md border border-white/40">
                LVL {playerStats.level}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">{studentName}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-xs">
                  <Shield className="h-3 w-3 text-amber-300" />
                  {playerStats.rankTitle}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/80 mt-0.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Complete assigned tasks to level up and earn rewards!
              </p>
            </div>
          </div>

          {/* Right: Score Stats & Progress */}
          <div className="w-full md:w-64 bg-black/20 backdrop-blur-md rounded-xl p-3.5 border border-white/15 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1 text-amber-300">
                <Zap className="h-3.5 w-3.5 fill-amber-300" />
                {totalEarnedScore} Total Score
              </span>
              <span className="text-white/80">Next: {playerStats.progressPercent}%</span>
            </div>

            <div className="h-2.5 w-full bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500 rounded-full shadow-xs"
                style={{ width: `${playerStats.progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-white/70 pt-0.5">
              <span>{completedQuests.length} Quests Finished</span>
              <span>{avgPercentage > 0 ? `${avgPercentage}% Accuracy` : "Ready"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quest Categories / Tabs ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b pb-2 overflow-x-auto">
        <button
          onClick={() => handleTabChange("active")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "active"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Swords className="h-4 w-4" />
          Active Quests
          {activeQuests.length > 0 && (
            <span className="rounded-full bg-amber-400 text-black px-2 py-0.2 text-xs font-bold">
              {activeQuests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange("review")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "review"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Clock className="h-4 w-4" />
          In Review
          {reviewQuests.length > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.2 text-xs">
              {reviewQuests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange("completed")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === "completed"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Trophy className="h-4 w-4 text-amber-400" />
          Completed & Graded
          {unseenGradedCount > 0 && (
            <span className="rounded-full bg-emerald-500 text-white px-2 py-0.5 text-xs font-bold animate-pulse shadow-sm">
              {unseenGradedCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Quests Grid Display ─────────────────────────────────────────── */}
      {activeTab === "active" && (
        <div className="space-y-4">
          {activeQuests.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center bg-card space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold">All caught up, Champion!</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                You have no active pending quests right now. Relax or check back when your teacher assigns new homework!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeQuests.map((quest) => (
                <div
                  key={quest.assignmentId}
                  className="group relative rounded-2xl border-2 border-primary/20 hover:border-primary bg-card p-4 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    {/* Header Tags */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="font-semibold text-xs py-0.5 px-2.5">
                        {quest.subjectName || "General Quest"}
                      </Badge>
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold">
                        <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        Score: {quest.totalPoints}
                      </span>
                    </div>

                    {/* Quest Title */}
                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {quest.title}
                    </h3>

                    {/* Description */}
                    {quest.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {quest.description}
                      </p>
                    )}

                    {/* Question Image Attachment Preview */}
                    {quest.imageUrl && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setImagePreviewModal(quest.imageUrl!)}
                          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Question Attachment
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Footer & CTA Button */}
                  <div className="space-y-2.5 pt-2 border-t text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {quest.dueDate ? `Due: ${quest.dueDate}` : "No deadline"}
                      </span>
                      {quest.teacherName && (
                        <span className="truncate max-w-[110px]">By: {quest.teacherName}</span>
                      )}
                    </div>

                    <Button
                      onClick={() => openSubmitDialog(quest)}
                      className="w-full justify-between font-semibold shadow-sm group-hover:shadow-md"
                      size="sm"
                    >
                      <span className="flex items-center gap-1.5">
                        <Swords className="h-4 w-4" />
                        Turn In Solution
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

      {/* ── Under Review Quests ─────────────────────────────────────────── */}
      {activeTab === "review" && (
        <div className="space-y-4">
          {reviewQuests.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center bg-card">
              <Clock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No tasks currently awaiting review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviewQuests.map((quest) => (
                <div
                  key={quest.assignmentId}
                  className="rounded-2xl border bg-card p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{quest.subjectName || "General"}</Badge>
                    <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30">
                      In Review ⏳
                    </Badge>
                  </div>

                  <h3 className="font-bold text-sm text-foreground">{quest.title}</h3>

                  <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-2.5 rounded-lg border">
                    <p className="font-medium text-foreground">Your Submitted Solution:</p>
                    {quest.submissionText && <p className="line-clamp-2 italic">{quest.submissionText}</p>}
                    {quest.submissionImageUrl && (
                      <button
                        type="button"
                        onClick={() => setImagePreviewModal(quest.submissionImageUrl!)}
                        className="text-primary hover:underline text-xs flex items-center gap-1 pt-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Attached Proof Image
                      </button>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => openSubmitDialog(quest)}
                  >
                    Edit / Re-submit Proof
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Completed & Graded Quests ────────────────────────────────────── */}
      {activeTab === "completed" && (
        <div className="space-y-4">
          {completedQuests.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center bg-card">
              <Trophy className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No graded quests yet. Once your teacher reviews your submissions, your score & badges will appear here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedQuests.map((quest) => {
                const scorePercent = parseFloat(String(quest.percentage)) || 0;
                const isGreat = scorePercent >= 80;

                return (
                  <div
                    key={quest.assignmentId}
                    className="rounded-2xl border bg-card p-4 shadow-sm space-y-3 relative overflow-hidden"
                  >
                    {/* Score Ribbon */}
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{quest.subjectName || "General"}</Badge>
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                        <Trophy className="h-3.5 w-3.5 text-amber-500" />
                        Score: {quest.achievedPoints} / {quest.totalPoints} ({quest.percentage}%)
                      </div>
                    </div>

                    <h3 className="font-bold text-sm text-foreground">{quest.title}</h3>

                    {/* Teacher Feedback Card */}
                    {quest.feedback ? (
                      <div className="rounded-xl border bg-primary/5 p-3 text-xs space-y-1">
                        <p className="font-semibold text-primary flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-primary" />
                          Teacher Feedback:
                        </p>
                        <p className="text-muted-foreground italic">&ldquo;{quest.feedback}&rdquo;</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No feedback comments provided.</p>
                    )}

                    {/* Attached Proof link */}
                    {quest.submissionImageUrl && (
                      <button
                        type="button"
                        onClick={() => setImagePreviewModal(quest.submissionImageUrl!)}
                        className="text-primary hover:underline text-xs flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Your Submitted Work
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Submit / Turn In Quest Modal ─────────────────────────────────── */}
      <Dialog open={submissionModalOpen} onOpenChange={setSubmissionModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Swords className="h-5 w-5 text-primary" />
              Turn In Quest: {selectedQuest?.title}
            </DialogTitle>
          </DialogHeader>

          {celebrationSuccess ? (
            <div className="py-10 text-center space-y-3">
              <div className="h-16 w-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-black text-foreground">Quest Completed!</h3>
              <p className="text-sm text-muted-foreground">
                Your homework has been submitted to your teacher for grading.
              </p>
            </div>
          ) : (
            <form onSubmit={handleQuestSubmit} className="space-y-4 pt-2">
              {/* Task Details Info Box */}
              <div className="rounded-xl border bg-muted/30 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    Subject: {selectedQuest?.subjectName || "General"}
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    Max Score: {selectedQuest?.totalPoints}
                  </span>
                </div>
                {selectedQuest?.description && (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedQuest.description}
                  </p>
                )}

                {selectedQuest?.imageUrl && (
                  <div className="pt-1">
                    <span className="text-muted-foreground">Teacher&apos;s Attached Question: </span>
                    <button
                      type="button"
                      onClick={() => setImagePreviewModal(selectedQuest.imageUrl!)}
                      className="font-medium text-primary hover:underline inline-flex items-center gap-1 ml-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Image
                    </button>
                  </div>
                )}
              </div>

              {/* Solution Answer Text */}
              <div className="space-y-1.5">
                <Label htmlFor="solution-text">Your Solution / Notes</Label>
                <Textarea
                  id="solution-text"
                  placeholder="Type your answer, solution steps, or summary here..."
                  rows={4}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                />
              </div>

              {/* Image / Homework Photo Proof */}
              <div className="space-y-1.5">
                <Label>Attach Homework Photo / Solution Proof</Label>
                {imagePreview ? (
                  <div className="relative rounded-lg border p-2 bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={imagePreview}
                        alt="Proof Preview"
                        className="h-16 w-16 object-cover rounded-md border"
                      />
                      <div className="text-xs">
                        <p className="font-medium truncate max-w-[200px] sm:max-w-xs">
                          {imageFile?.name || "Attached Homework Image"}
                        </p>
                        <p className="text-muted-foreground">
                          {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : "Uploaded"}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={clearSelectedImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 cursor-pointer hover:bg-muted/40 transition-colors border-primary/30">
                    <UploadCloud className="h-7 w-7 text-primary mb-1" />
                    <span className="text-xs font-semibold text-foreground">Upload Homework Photo</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">Take a photo of your notebook or upload image</span>
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
                    <p className="text-[11px] text-muted-foreground text-right">Uploading proof: {uploadProgress}%</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={isSubmitting}
                  onClick={() => setSubmissionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 font-bold gap-2" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Quest...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Submit Quest Proof
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Full Image Preview Modal ─────────────────────────────────────── */}
      {imagePreviewModal && (
        <Dialog open={!!imagePreviewModal} onOpenChange={() => setImagePreviewModal(null)}>
          <DialogContent className="max-w-3xl p-2 bg-black/90 border-none">
            <div className="relative flex items-center justify-center p-2">
              <img
                src={imagePreviewModal}
                alt="Full Attachment"
                className="max-h-[85vh] w-auto object-contain rounded-lg shadow-2xl"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
