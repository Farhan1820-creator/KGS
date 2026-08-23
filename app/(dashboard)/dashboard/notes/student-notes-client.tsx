"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  File,
  Download,
  Search,
  BookOpen,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface StudentNoteItem {
  id: number;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number | null;
  createdAt: string;
  subjectId?: number | null;
  subjectName?: string | null;
  uploaderName: string;
}

export interface StudentSubjectOption {
  id: number;
  name: string;
}

interface StudentNotesClientProps {
  notes: StudentNoteItem[];
  subjects: StudentSubjectOption[];
  className: string;
  studentName: string;
}

function getFileMeta(fileType: string) {
  const t = fileType.toLowerCase();
  if (t.includes("pdf")) {
    return {
      Icon: FileText,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
      label: "PDF",
    };
  }
  if (t.includes("image") || t.includes("png") || t.includes("jpg") || t.includes("jpeg") || t.includes("webp")) {
    return {
      Icon: ImageIcon,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      label: "Image",
    };
  }
  if (t.includes("sheet") || t.includes("excel") || t.includes("csv")) {
    return {
      Icon: FileSpreadsheet,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-500/10 border-teal-500/20",
      label: "Sheet",
    };
  }
  if (t.includes("presentation") || t.includes("powerpoint") || t.includes("ppt")) {
    return {
      Icon: Presentation,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      label: "Slides",
    };
  }
  return {
    Icon: File,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    label: "Document",
  };
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(isoDate: string) {
  try {
    return new Date(isoDate).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

export function StudentNotesClient({
  notes,
  subjects,
  className,
  studentName,
}: StudentNotesClientProps) {
  const [search, setSearch] = useState("");
  const [activeSubject, setActiveSubject] = useState<number | null>(null);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        (n.description && n.description.toLowerCase().includes(q)) ||
        (n.subjectName && n.subjectName.toLowerCase().includes(q)) ||
        n.uploaderName.toLowerCase().includes(q);

      const matchesSubject = activeSubject === null || n.subjectId === activeSubject;

      return matchesSearch && matchesSubject;
    });
  }, [notes, search, activeSubject]);

  return (
    <div className="space-y-6">
      {/* Quick Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-xl border border-muted/50 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-foreground">Enrolled Class:</span>
              <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-semibold">
                <GraduationCap className="h-3 w-3 mr-1" />
                {className}
              </Badge>
            </div>
          </div>
        </div>

        <Badge variant="outline" className="px-3 py-1 text-xs font-medium border-primary/20 bg-background/60">
          <Sparkles className="h-3.5 w-3.5 text-primary mr-1" />
          {filteredNotes.length} {filteredNotes.length === 1 ? "Note Available" : "Notes Available"}
        </Badge>
      </div>

      {/* Toolbar: Search & Subject Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 bg-card p-4 sm:p-5 rounded-2xl border border-muted/50 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes by title, topic, or teacher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-background text-sm w-full"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {/* Subject Filter Pills */}
        {subjects.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <Button
              size="default"
              variant={activeSubject === null ? "default" : "outline"}
              onClick={() => setActiveSubject(null)}
              className="rounded-xl h-10 px-3.5 text-xs font-semibold shrink-0 shadow-2xs"
            >
              All Subjects
            </Button>
            {subjects.map((sub) => {
              const isSelected = activeSubject === sub.id;
              return (
                <Button
                  key={sub.id}
                  size="default"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => setActiveSubject(isSelected ? null : sub.id)}
                  className="rounded-xl h-10 px-3.5 text-xs font-semibold shrink-0 shadow-2xs"
                >
                  {sub.name}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-muted/60 bg-card/40 py-16 text-center px-4">
          <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-3.5 text-muted-foreground/60">
            <FileText className="h-7 w-7" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No study notes found</h3>
          <p className="mt-1 max-w-sm text-xs sm:text-sm text-muted-foreground">
            {search || activeSubject !== null
              ? "Try adjusting your search query or subject filter to find what you're looking for."
              : `Your teachers haven't uploaded any study material for ${className} yet. Check back soon!`}
          </p>
          {(search || activeSubject !== null) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setActiveSubject(null);
              }}
              className="mt-4"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredNotes.map((note) => {
            const { Icon, color, bg, label } = getFileMeta(note.fileType);
            const sizeStr = formatFileSize(note.fileSize);

            return (
              <div
                key={note.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-muted/60 bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary/30"
              >
                <div>
                  {/* Top Bar inside card */}
                  <div className="flex items-start justify-between gap-2 mb-3.5">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {note.subjectName && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                          {note.subjectName}
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-muted-foreground/80">
                        {label}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3
                    className="font-bold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors"
                    title={note.title}
                  >
                    {note.title}
                  </h3>

                  {note.description && (
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {note.description}
                    </p>
                  )}
                </div>

                {/* Footer / Meta & Action */}
                <div className="mt-5 pt-3 border-t border-muted/50 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="truncate max-w-[120px]" title={note.uploaderName}>
                      By {note.uploaderName}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {sizeStr && <span>{sizeStr} &bull;</span>}
                      <span>{formatDate(note.createdAt)}</span>
                    </div>
                  </div>

                  <a
                    href={note.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={note.fileName}
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground py-2 text-xs font-semibold shadow-xs transition hover:bg-primary/90 active:scale-[0.98]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>View / Download</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
