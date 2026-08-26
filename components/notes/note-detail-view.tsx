"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  File,
  Video,
  Send,
  Loader2,
  Trash2,
  Plus,
  Edit,
  X,
  MessageCircle,
  GraduationCap,
  BookOpen,
  Calendar,
  User,
  Sparkles,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import {
  type NoteRow,
  type NoteCommentItem,
  getNoteComments,
  sendNoteComment,
  deleteNoteComment,
  updateNoteVideoUrl,
} from "@/app/(dashboard)/dashboard/notes/notes-actions";

interface NoteDetailViewProps {
  note: NoteRow;
  initialComments: NoteCommentItem[];
  currentUser: {
    id: number;
    name: string;
    role: string;
    image?: string | null;
  };
  backHref: string;
}

function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const clean = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = clean.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function getFileMeta(fileType: string) {
  const t = fileType.toLowerCase();
  if (t.includes("pdf")) {
    return { Icon: FileText, color: "text-rose-500", bg: "bg-rose-50 border-rose-100", label: "PDF Document" };
  }
  if (t.includes("image") || t.includes("png") || t.includes("jpg") || t.includes("jpeg") || t.includes("webp")) {
    return { Icon: ImageIcon, color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-100", label: "Image File" };
  }
  if (t.includes("sheet") || t.includes("excel") || t.includes("csv")) {
    return { Icon: FileSpreadsheet, color: "text-teal-500", bg: "bg-teal-50 border-teal-100", label: "Spreadsheet" };
  }
  if (t.includes("presentation") || t.includes("powerpoint") || t.includes("ppt")) {
    return { Icon: Presentation, color: "text-amber-500", bg: "bg-amber-50 border-amber-100", label: "Presentation" };
  }
  return { Icon: File, color: "text-blue-500", bg: "bg-blue-50 border-blue-100", label: "Document" };
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NoteDetailView({
  note,
  initialComments,
  currentUser,
  backHref,
}: NoteDetailViewProps) {
  const [comments, setComments] = useState<NoteCommentItem[]>(initialComments);
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState(note.youtubeUrl || "");
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [editVideoUrl, setEditVideoUrl] = useState(note.youtubeUrl || "");
  const [isUpdatingVideo, startVideoTransition] = useTransition();
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEditVideo = currentUser.role === "admin" || currentUser.id === note.uploaderId;
  const youtubeVideoId = extractYouTubeId(youtubeUrl);
  const isImageFile = note.fileType.toLowerCase().includes("image") ||
    note.fileName.match(/\.(jpg|jpeg|png|webp|gif)$/i);
  const isPdfFile = note.fileType.toLowerCase().includes("pdf") ||
    note.fileName.toLowerCase().endsWith(".pdf");

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // Polling for fresh comments only when tab is visible
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.hidden) return;
      try {
        const fresh = await getNoteComments(note.id);
        setComments((prev) => {
          if (fresh.length === prev.length && fresh[fresh.length - 1]?.id === prev[prev.length - 1]?.id) {
            return prev;
          }
          return fresh;
        });
      } catch {
        // silent fallback
      }
    }, 4500);
    return () => clearInterval(interval);
  }, [note.id]);


  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    setSelectedImage(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  }

  function removeSelectedImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!message.trim() && !selectedImage) return;

    try {
      setIsSending(true);
      let uploadedImageUrl: string | null = null;

      if (selectedImage) {
        setUploadProgress(10);
        const res = await uploadImageToCloudinary(selectedImage, {
          onProgress: (p) => setUploadProgress(p),
        });
        uploadedImageUrl = res.url;
      }

      const res = await sendNoteComment({
        noteId: note.id,
        message: message.trim(),
        imageUrl: uploadedImageUrl,
      });

      if (!res.success || !res.comment) {
        toast.error(res.error || "Failed to send message.");
        return;
      }

      setComments((prev) => [...prev, res.comment!]);
      setMessage("");
      removeSelectedImage();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error sending message.");
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  async function handleDeleteComment(commentId: number) {
    try {
      const res = await deleteNoteComment(commentId);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        toast.success("Message deleted.");
      } else {
        toast.error(res.error || "Failed to delete.");
      }
    } catch {
      toast.error("Failed to delete message.");
    }
  }

  function handleSaveVideoUrl(e: React.FormEvent) {
    e.preventDefault();
    startVideoTransition(async () => {
      const res = await updateNoteVideoUrl(note.id, editVideoUrl.trim());
      if (res.success) {
        setYoutubeUrl(editVideoUrl.trim());
        toast.success("YouTube video lecture updated!");
        setVideoModalOpen(false);
      } else {
        toast.error(res.error || "Failed to update video URL.");
      }
    });
  }

  const { Icon: FileIcon, color: fileColor, bg: fileBg, label: fileLabel } = getFileMeta(note.fileType);
  const sizeStr = formatFileSize(note.fileSize);

  return (
    <div className="space-y-6">
      {/* Top Header / Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-2xl border border-muted/50 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-muted hover:bg-muted/70 text-foreground transition-colors shadow-2xs shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground line-clamp-1">
                {note.title}
              </h1>
              {note.subjectName && (
                <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-semibold">
                  <BookOpen className="h-3 w-3 mr-1 text-primary" />
                  {note.subjectName}
                </Badge>
              )}
              <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-semibold">
                <GraduationCap className="h-3 w-3 mr-1 text-primary" />
                {note.className} {note.classSection ? `(${note.classSection})` : ""}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                Uploaded by <strong className="text-foreground">{note.uploaderName}</strong>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(note.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {canEditVideo && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditVideoUrl(youtubeUrl);
                setVideoModalOpen(true);
              }}
              className="gap-1.5 h-9 rounded-xl text-xs font-semibold"
            >
              <Video className="h-3.5 w-3.5 text-red-500" />
              {youtubeUrl ? "Edit Video Link" : "Add Video Lecture"}
            </Button>
          )}

          <a
            href={note.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={note.fileName}
            className="flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 py-2 text-xs font-semibold shadow-xs transition hover:bg-primary/90 active:scale-[0.98]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </a>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Note Preview + YouTube Video (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Note Document Preview Card */}
          <div className="bg-card rounded-2xl border border-muted/50 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-muted/50 bg-muted/20">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border ${fileBg}`}>
                  <FileIcon className={`h-4 w-4 ${fileColor}`} />
                </div>
                <span className="text-sm font-semibold text-foreground">Document Preview</span>
                <span className="text-[11px] font-medium text-muted-foreground">({fileLabel})</span>
              </div>
              <div className="flex items-center gap-2">
                {sizeStr && (
                  <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-muted/60">
                    {sizeStr}
                  </span>
                )}
                <a
                  href={note.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Open</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Preview Body */}
            <div className="p-4 sm:p-5">
              {isImageFile ? (
                <div className="relative rounded-xl overflow-hidden border border-muted bg-slate-950/5 group flex items-center justify-center">
                  <Image
                    src={note.fileUrl}
                    alt={note.title}
                    width={800}
                    height={500}
                    className="w-full max-h-[480px] object-contain rounded-xl transition group-hover:scale-[1.01]"
                  />
                  <button
                    onClick={() => setPreviewImageModal(note.fileUrl)}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 text-white hover:bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="View Full Size"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              ) : isPdfFile ? (
                <div className="rounded-xl overflow-hidden border border-muted bg-muted/20">
                  <iframe
                    src={`${note.fileUrl}#toolbar=0`}
                    title={note.title}
                    className="w-full h-[460px] sm:h-[520px] rounded-xl"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-muted/80 bg-muted/10">
                  <div className={`p-4 rounded-2xl border mb-3 ${fileBg}`}>
                    <FileIcon className={`h-10 w-10 ${fileColor}`} />
                  </div>
                  <h3 className="text-base font-bold text-foreground max-w-md">{note.fileName}</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    {fileLabel} &bull; {sizeStr || "Unknown size"}
                  </p>
                  <div className="flex items-center gap-3 mt-5">
                    <a
                      href={note.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download to View
                    </a>
                  </div>
                </div>
              )}

              {/* Note Description */}
              {note.description && (
                <div className="mt-4 pt-4 border-t border-muted/50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Teacher Notes & Instructions
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap bg-muted/20 p-3.5 rounded-xl border border-muted/40">
                    {note.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 2. YouTube Video Lecture Section */}
          <div className="bg-card rounded-2xl border border-muted/50 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-muted/50 bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600">
                  <Video className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-foreground">Video Lecture</span>
                {youtubeVideoId && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                    YouTube Lesson
                  </span>
                )}
              </div>
              {canEditVideo && youtubeUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditVideoUrl(youtubeUrl);
                    setVideoModalOpen(true);
                  }}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Change Video
                </Button>
              )}
            </div>

            <div className="p-4 sm:p-5">
              {youtubeVideoId ? (
                <div className="space-y-3">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-muted bg-black shadow-inner">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?rel=0`}
                      title="YouTube video lecture"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>Watch lecture alongside your notes for maximum understanding.</span>
                    <a
                      href={youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium flex items-center gap-1"
                    >
                      Watch on YouTube
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-muted/80 bg-muted/10">
                  <div className="p-3.5 rounded-2xl bg-red-50 text-red-500 border border-red-100 mb-2.5">
                    <Video className="h-7 w-7" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">No Video Lecture Attached</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1">
                    There is currently no video lecture linked to this study note.
                  </p>
                  {canEditVideo && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditVideoUrl("");
                        setVideoModalOpen(true);
                      }}
                      className="mt-4 gap-1.5 rounded-xl text-xs font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add YouTube Lecture URL
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Chat with Teacher (5 Cols) */}
        <div className="lg:col-span-5">
          <div className="bg-card rounded-2xl border border-muted/50 shadow-sm flex flex-col h-[650px] lg:h-[calc(100vh-140px)] sticky top-20 overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-muted/50 bg-muted/30 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20">
                    {note.uploaderName.charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-foreground line-clamp-1">{note.uploaderName}</h3>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-semibold uppercase">
                      {note.uploaderRole}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Ask questions & discuss this note</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-muted-foreground bg-background px-2 py-1 rounded-md border border-muted/50">
                  {comments.length} {comments.length === 1 ? "Message" : "Messages"}
                </span>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground space-y-2">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-1">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No questions yet</p>
                  <p className="text-xs max-w-xs text-muted-foreground">
                    Have any doubt about this note? Ask {note.uploaderName} directly here. You can also attach screenshots/images!
                  </p>
                </div>
              ) : (
                comments.map((c) => {
                  const isMe = c.userId === currentUser.id;
                  const canDelete = isMe || currentUser.role === "admin";
                  const isTeacher = c.userRole === "teacher" || c.userRole === "admin";

                  return (
                    <div
                      key={c.id}
                      className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}
                    >
                      {/* Sender Name & Role & Time */}
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground/80">{isMe ? "You" : c.userName}</span>
                        {isTeacher && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.2 rounded-sm">
                            {c.userRole}
                          </span>
                        )}
                        <span>&bull;</span>
                        <span className="text-[10px]">{formatTime(c.createdAt)}</span>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity ml-1 p-0.5"
                            title="Delete message"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`relative rounded-2xl px-4 py-2.5 max-w-[85%] sm:max-w-[78%] shadow-2xs space-y-2 ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-tr-xs"
                            : isTeacher
                            ? "bg-card text-foreground border border-primary/20 shadow-xs rounded-tl-xs"
                            : "bg-card text-foreground border border-muted/80 rounded-tl-xs"
                        }`}
                      >
                        {/* Attached Image if any */}
                        {c.imageUrl && (
                          <div className="rounded-xl overflow-hidden border border-black/10 my-1 cursor-pointer">
                            <Image
                              src={c.imageUrl}
                              alt="Attached image"
                              width={320}
                              height={240}
                              onClick={() => setPreviewImageModal(c.imageUrl)}
                              className="w-full max-h-56 object-cover rounded-xl hover:opacity-95 transition"
                            />
                          </div>
                        )}

                        {/* Text Message */}
                        {c.message && (
                          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {c.message}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Image Preview before Sending */}
            {imagePreview && (
              <div className="p-3 bg-muted/40 border-t border-muted/50 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-muted bg-card">
                    <Image
                      src={imagePreview}
                      alt="Selected upload"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground line-clamp-1">
                      {selectedImage?.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Ready to send ({formatFileSize(selectedImage?.size)})
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removeSelectedImage}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-card border-t border-muted/50 flex items-end gap-2 shrink-0"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImagePick}
                className="hidden"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
                className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 rounded-xl"
                title="Share Image"
              >
                <ImageIcon className="h-5 w-5" />
              </Button>

              <div className="flex-1 relative">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask a question to ${note.uploaderName}...`}
                  rows={1}
                  disabled={isSending}
                  className="min-h-[40px] max-h-32 resize-none py-2.5 text-xs sm:text-sm bg-muted/20 border-muted rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={isSending || (!message.trim() && !selectedImage)}
                className="h-10 px-4 gap-1.5 rounded-xl shrink-0 shadow-xs"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs font-semibold">Send</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Video Lecture Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-red-500" />
              <span>Link YouTube Video Lecture</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveVideoUrl} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">YouTube Video URL</Label>
              <Input
                value={editVideoUrl}
                onChange={(e) => setEditVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Students will be able to play this video lecture directly below the note preview.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setVideoModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingVideo}>
                {isUpdatingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Video Link"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lightbox / Full Size Image Modal */}
      {previewImageModal && (
        <Dialog open={Boolean(previewImageModal)} onOpenChange={() => setPreviewImageModal(null)}>
          <DialogContent className="max-w-4xl p-2 bg-black/95 border-0">
            <div className="relative w-full h-[80vh] flex items-center justify-center">
              <Image
                src={previewImageModal}
                alt="Full size view"
                fill
                className="object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
