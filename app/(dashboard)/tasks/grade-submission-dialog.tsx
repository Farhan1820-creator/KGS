"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { gradeTask } from "./tasks-actions";
import { toast } from "sonner";
import { Award, CheckCircle, ExternalLink, Loader2, Star, Download, Eye } from "lucide-react";
import { ImagePreviewDialog, downloadImageFile } from "./image-preview-dialog";

export interface SubmissionItem {
  id: number; // taskAssignments.id
  taskId: number;
  taskTitle: string;
  totalPoints: number;
  studentId: number;
  studentName: string;
  rollNumber?: string | null;
  className?: string;
  status: "pending" | "submitted" | "graded";
  submissionText?: string | null;
  submissionImageUrl?: string | null;
  submittedAt?: Date | string | null;
  achievedPoints?: number | null;
  percentage?: string | number | null;
  feedback?: string | null;
}

interface GradeSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: SubmissionItem | null;
  onGraded: () => void;
}

export function GradeSubmissionDialog({
  open,
  onOpenChange,
  submission,
  onGraded,
}: GradeSubmissionDialogProps) {
  const [achievedPoints, setAchievedPoints] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (submission) {
      setAchievedPoints(
        submission.achievedPoints !== null && submission.achievedPoints !== undefined
          ? String(submission.achievedPoints)
          : String(submission.totalPoints || 100)
      );
      setFeedback(submission.feedback || "");
    }
  }, [submission]);

  if (!submission) return null;

  const totalPoints = submission.totalPoints || 100;
  const numPoints = parseFloat(achievedPoints) || 0;
  const livePercentage = ((numPoints / totalPoints) * 100).toFixed(1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!submission) return;

    const points = parseFloat(achievedPoints);
    if (isNaN(points) || points < 0 || points > totalPoints) {
      toast.error(`Marks must be between 0 and ${totalPoints}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await gradeTask(submission.id, {
        achievedPoints: points,
        feedback: feedback.trim() || null,
      });

      if (!res.success) {
        toast.error(res.error || "Could not grade task");
        setIsSubmitting(false);
        return;
      }

      toast.success(`Graded ${submission.studentName}: ${points}/${totalPoints} (${livePercentage}%)`);
      setIsSubmitting(false);
      onOpenChange(false);
      onGraded();
    } catch (err) {
      console.error(err);
      toast.error("Failed to grade submission");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] p-4 sm:p-6 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Award className="h-5 w-5 text-amber-500" />
              Review & Grade Submission
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Student Info & Quest */}
            <div className="rounded-xl border bg-muted/30 p-3 sm:p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-sm">{submission.studentName}</h4>
                  <p className="text-xs text-muted-foreground">
                    {submission.className ? `Class: ${submission.className} • ` : ""}
                    {submission.rollNumber ? `Roll: ${submission.rollNumber}` : ""}
                  </p>
                </div>
                <Badge
                  variant={
                    submission.status === "graded"
                      ? "default"
                      : submission.status === "submitted"
                      ? "secondary"
                      : "outline"
                  }
                  className="capitalize shrink-0"
                >
                  {submission.status}
                </Badge>
              </div>

              <div className="pt-2 border-t text-xs">
                <span className="text-muted-foreground">Task: </span>
                <span className="font-medium">{submission.taskTitle}</span>
              </div>
            </div>

            {/* Student Submission Content */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Student&apos;s Solution / Answer
              </Label>

              {submission.submissionText ? (
                <div className="rounded-xl border bg-background p-3 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                  {submission.submissionText}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No text submitted.</p>
              )}

              {/* Student Uploaded Image */}
              {submission.submissionImageUrl ? (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Attached Homework Proof:</span>
                    <button
                      type="button"
                      onClick={() =>
                        downloadImageFile(
                          submission.submissionImageUrl!,
                          `${submission.studentName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-proof.jpg`
                        )
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download Image
                    </button>
                  </div>
                  <div className="relative group rounded-xl overflow-hidden border max-w-sm">
                    <img
                      src={submission.submissionImageUrl}
                      alt="Homework Proof"
                      className="w-full max-h-48 object-cover cursor-pointer transition-transform group-hover:scale-105"
                      onClick={() => setPreviewImage(submission.submissionImageUrl!)}
                    />
                    <div
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-medium gap-1.5"
                      onClick={() => setPreviewImage(submission.submissionImageUrl!)}
                    >
                      <Eye className="h-4 w-4" />
                      Click to expand & preview
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No image attached.</p>
              )}
            </div>

            {/* Grading Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="grade-points" className="text-xs font-semibold">Marks / Points Awarded</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="grade-points"
                      type="number"
                      min="0"
                      max={totalPoints}
                      step="0.5"
                      placeholder="e.g. 90"
                      value={achievedPoints}
                      onChange={(e) => setAchievedPoints(e.target.value)}
                      className="h-9 text-xs sm:text-sm"
                      required
                    />
                    <span className="text-xs sm:text-sm text-muted-foreground font-medium shrink-0">/ {totalPoints}</span>
                  </div>
                </div>

                <div className="p-2 sm:p-2.5 rounded-xl border bg-primary/5 text-center flex flex-row sm:flex-col items-center justify-between sm:justify-center">
                  <p className="text-xs text-muted-foreground">Calculated Score</p>
                  <p className="text-base sm:text-lg font-bold text-primary">{livePercentage}%</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="grade-feedback" className="text-xs font-semibold">Teacher Feedback / Notes (Optional)</Label>
                <Textarea
                  id="grade-feedback"
                  placeholder="e.g. Excellent solution! Great attention to detail."
                  rows={2}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:flex-1 h-9"
                  disabled={isSubmitting}
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:flex-1 font-bold gap-2 h-9" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving Grade...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Grade & Notify
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Size Image Preview Modal with Download & Zoom */}
      <ImagePreviewDialog
        open={!!previewImage}
        onOpenChange={(open) => {
          if (!open) setPreviewImage(null);
        }}
        imageUrl={previewImage}
        title={
          submission
            ? `${submission.studentName}'s Homework Proof — ${submission.taskTitle}`
            : "Attachment Preview"
        }
        filename={
          submission
            ? `${submission.studentName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-proof.jpg`
            : "homework-proof.jpg"
        }
      />
    </>
  );
}
