"use client";

import { useState, useRef, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Upload, FileText, Image, File, X, CloudUpload } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { uploadNote } from "./notes-actions";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
  classes: { id: number; name: string; section: string | null }[];
  subjects: { id: number; name: string }[];
}

function fileIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("pdf")) return <FileText size={20} className="text-red-500" />;
  if (t.includes("image")) return <Image size={20} className="text-green-500" />;
  return <File size={20} className="text-blue-500" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function NoteUploadDialog({ open, onOpenChange, onSaved, classes, subjects }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setTitle("");
    setDescription("");
    setClassId("");
    setSubjectId("");
    setSelectedFile(null);
    setUploadProgress(0);
  }

  function handleFile(file: File) {
    setSelectedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) { toast.error("Please select a file."); return; }
    if (!classId) { toast.error("Please select a class."); return; }
    if (!title.trim()) { toast.error("Please enter a title."); return; }

    startTransition(async () => {
      try {
        // Upload to Cloudinary
        toast.loading("Uploading file...", { id: "note-upload" });
        const result = await uploadToCloudinary(selectedFile);
        setUploadProgress(90);

        // Save to DB
        const res = await uploadNote({
          title: title.trim(),
          description: description.trim() || undefined,
          classId: parseInt(classId),
          subjectId: subjectId ? parseInt(subjectId) : undefined,
          fileUrl: result.url,
          fileName: selectedFile.name,
          fileType: selectedFile.type || result.fileType,
          fileSize: selectedFile.size,
        });

        toast.dismiss("note-upload");

        if (!res.success) {
          toast.error(res.error ?? "Upload failed.");
          return;
        }

        setUploadProgress(100);
        toast.success("Note uploaded successfully!");
        reset();
        onOpenChange(false);
        onSaved();
      } catch (err) {
        toast.dismiss("note-upload");
        toast.error(err instanceof Error ? err.message : "Upload failed.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudUpload size={18} className="text-blue-600" />
            Upload Note
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              isDragOver
                ? "border-blue-400 bg-blue-50"
                : selectedFile
                ? "border-green-300 bg-green-50"
                : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                {fileIcon(selectedFile.type)}
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{formatSize(selectedFile.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                  className="ml-auto rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div>
                <Upload size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">Drop file here or click to browse</p>
                <p className="mt-0.5 text-xs text-gray-400">PDF, Word, PPT, Excel, Images — any format</p>
              </div>
            )}
          </div>

          {/* Upload progress */}
          {isPending && uploadProgress > 0 && (
            <div className="overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* Title */}
          <div>
            <Label>Title <span className="text-red-500">*</span></Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 3 — Algebra"
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label>Description <span className="text-gray-400 text-xs">(optional)</span></Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this note..."
              className="mt-1"
            />
          </div>

          {/* Class + Subject side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Class <span className="text-red-500">*</span></Label>
              <Select value={classId} onValueChange={(v) => setClassId(v ?? "")}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      Class {c.name}{c.section ? ` – ${c.section}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject <span className="text-gray-400 text-xs">(optional)</span></Label>
              <Select value={subjectId} onValueChange={(v) => setSubjectId(v ?? "")}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No subject —</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Upload Note
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
