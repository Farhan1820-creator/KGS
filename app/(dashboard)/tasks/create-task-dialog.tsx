"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createTask } from "./tasks-actions";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { toast } from "sonner";
import { UploadCloud, X, Loader2, CheckSquare, Square, Calendar, Eye } from "lucide-react";
import { ImagePreviewDialog } from "./image-preview-dialog";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: { id: number; name: string }[];
  classes: { id: number; name: string; section?: string | null }[];
  students: { id: number; name: string; classId?: number | null; className?: string }[];
  onCreated: () => void;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  subjects,
  classes,
  students,
  onCreated,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState<string>("all");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [totalPoints, setTotalPoints] = useState("100");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter students based on selected class
  const filteredStudents = students.filter(
    (s) => selectedClassId === "all" || String(s.classId) === selectedClassId
  );

  function handleClassChange(val: string) {
    setSelectedClassId(val);
    if (val === "all") {
      // Keep existing selection
    } else {
      // Auto-select all students of this class or let user pick
      const classStudentIds = students.filter((s) => String(s.classId) === val).map((s) => s.id);
      setSelectedStudentIds(classStudentIds);
    }
  }

  function toggleStudent(id: number) {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((x) => x !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  }

  function handleSelectAll() {
    const allFilteredIds = filteredStudents.map((s) => s.id);
    const allSelected = allFilteredIds.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => !allFilteredIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedStudentIds, ...allFilteredIds]));
      setSelectedStudentIds(merged);
    }
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

  function clearImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    if (selectedStudentIds.length === 0) {
      toast.error("Please select at least one student to assign the task");
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedImageUrl: string | null = null;
      if (imageFile) {
        setUploadProgress(10);
        const uploadRes = await uploadImageToCloudinary(imageFile, {
          onProgress: (p) => setUploadProgress(p),
        });
        uploadedImageUrl = uploadRes.url;
      }

      const res = await createTask({
        title: title.trim(),
        description: description.trim() || null,
        subjectId: subjectId === "all" ? null : Number(subjectId),
        classId: selectedClassId === "all" ? null : Number(selectedClassId),
        studentIds: selectedStudentIds,
        imageUrl: uploadedImageUrl,
        dueDate: dueDate || null,
        totalPoints: Number(totalPoints) || 100,
      });

      if (!res.success) {
        toast.error(res.error || "Could not create task");
        setIsSubmitting(false);
        setUploadProgress(null);
        return;
      }

      toast.success("Task created & notifications sent to students!");
      // Reset form
      setTitle("");
      setDescription("");
      setSubjectId("all");
      setSelectedClassId("all");
      setSelectedStudentIds([]);
      setDueDate("");
      setTotalPoints("100");
      clearImage();
      setUploadProgress(null);
      setIsSubmitting(false);
      onOpenChange(false);
      onCreated();
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while creating task");
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] p-4 sm:p-6 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CheckSquare className="h-5 w-5 text-primary" />
            Create & Assign New Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-xs font-semibold">Task Title *</Label>
            <Input
              id="task-title"
              placeholder="e.g. Chapter 4 Exercise 4.2 Questions 1 to 5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-xs sm:text-sm"
              required
            />
          </div>

          {/* Subject & Class Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Subject (Optional)</Label>
              <Select value={subjectId} onValueChange={(val) => setSubjectId(val || "all")}>
                <SelectTrigger className="h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="All / General Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All / General Subject</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Filter by Class</Label>
              <Select value={selectedClassId} onValueChange={(val) => handleClassChange(val || "all")}>
                <SelectTrigger className="h-9 text-xs sm:text-sm">
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
          </div>

          {/* Student Selector Multi-select with Select All */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                Assign To Students * ({selectedStudentIds.length} selected)
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary px-2"
                onClick={handleSelectAll}
              >
                {filteredStudents.every((s) => selectedStudentIds.includes(s.id))
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>

            <div className="border rounded-xl p-2.5 bg-muted/20 max-h-40 overflow-y-auto space-y-1">
              {filteredStudents.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center">No students found in this class.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {filteredStudents.map((stu) => {
                    const isSelected = selectedStudentIds.includes(stu.id);
                    return (
                      <button
                        key={stu.id}
                        type="button"
                        onClick={() => toggleStudent(stu.id)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors text-left ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-background text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        <span className="truncate">{stu.name}</span>
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 ml-1.5 shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 ml-1.5 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-desc" className="text-xs font-semibold">Task Instructions / Description</Label>
            <Textarea
              id="task-desc"
              placeholder="Describe the homework questions, guidelines, or required steps..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Image Attachment Upload */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Attach Question / Homework Image (Optional)</Label>
            {imagePreview ? (
              <div className="relative rounded-xl border p-2 bg-muted/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-14 w-14 object-cover rounded-lg border shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setPreviewOpen(true)}
                  />
                  <div className="text-xs min-w-0">
                    <p className="font-medium truncate">
                      {imageFile?.name}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      {(imageFile?.size ? imageFile.size / 1024 : 0).toFixed(1)} KB
                    </p>
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(true)}
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
                  onClick={clearImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 cursor-pointer hover:bg-muted/40 transition-colors border-muted-foreground/30 text-center">
                <UploadCloud className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs font-medium text-foreground">Click to upload photo / question image</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG, JPEG up to 8MB</span>
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
                <p className="text-[11px] text-muted-foreground text-right">Uploading image: {uploadProgress}%</p>
              </div>
            )}
          </div>

          {/* Points & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="task-points" className="text-xs font-semibold">Total Marks</Label>
              <Input
                id="task-points"
                type="number"
                min="1"
                placeholder="100"
                value={totalPoints}
                onChange={(e) => setTotalPoints(e.target.value)}
                className="h-9 text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-due" className="text-xs font-semibold">Due Date</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t">
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
                  Assigning Task...
                </>
              ) : (
                "Assign Task & Notify"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Full Size Image Preview Modal with Zoom & Rotate */}
      <ImagePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        imageUrl={imagePreview}
        title={imageFile?.name ? `Question Image Preview — ${imageFile.name}` : "Question Image Preview"}
        filename={imageFile?.name || "question-attachment.jpg"}
      />
    </Dialog>
  );
}
