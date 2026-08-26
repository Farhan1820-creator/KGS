"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Image, FileSpreadsheet, Presentation, File, Download, X, BookOpen, Video } from "lucide-react";

interface NoteItem {
  id: number;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  youtubeUrl?: string;
  createdAt: string;
  subjectId?: number;
  subjectName?: string;
  uploaderName: string;
}

interface SubjectOption {
  id: number;
  name: string;
}

interface NotesGridProps {
  notes: NoteItem[];
  subjects: SubjectOption[];
  className: string;
  isWebsiteStudent: boolean;
  studentName: string;
}

function fileIcon(fileType: string) {
  const t = fileType.toLowerCase();
  if (t.includes("pdf")) return { Icon: FileText, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" };
  if (t.includes("image") || t.includes("png") || t.includes("jpg") || t.includes("jpeg") || t.includes("webp"))
    return { Icon: Image, color: "text-green-500", bg: "bg-green-50", border: "border-green-100" };
  if (t.includes("sheet") || t.includes("excel") || t.includes("csv"))
    return { Icon: FileSpreadsheet, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" };
  if (t.includes("presentation") || t.includes("powerpoint") || t.includes("ppt"))
    return { Icon: Presentation, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" };
  return { Icon: File, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" };
}

function formatSize(bytes?: number) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function NotesGrid({ notes, subjects, className, isWebsiteStudent, studentName }: NotesGridProps) {
  const [activeSubject, setActiveSubject] = useState<number | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  const filtered = activeSubject
    ? notes.filter((n) => n.subjectId === activeSubject)
    : notes;

  return (
    <div>
      {/* Welcome banner — only for website (non-academy) students */}
      {isWebsiteStudent && !welcomeDismissed && (
        <div className="mb-6 flex items-start gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-200">
            <BookOpen size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-blue-900">
              Welcome, {studentName}! 👋
            </p>
            <p className="mt-0.5 text-sm text-blue-700">
              You&apos;re accessing study material for <strong>{className}</strong>. Browse notes below, filter by subject, and download what you need. Happy studying! 📚
            </p>
          </div>
          <button
            onClick={() => setWelcomeDismissed(true)}
            className="flex-shrink-0 rounded-lg p-1 text-blue-400 transition hover:bg-blue-100 hover:text-blue-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page heading */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            <BookOpen className="mr-2 inline-block text-blue-500" size={22} />
            Study Notes
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">{className}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
          {filtered.length} {filtered.length === 1 ? "note" : "notes"}
        </span>
      </div>

      {/* Subject filter pills */}
      {subjects.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubject(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeSubject === null
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSubject(activeSubject === s.id ? null : s.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeSubject === s.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Notes grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <FileText size={40} className="mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No notes uploaded yet</p>
          <p className="mt-1 text-xs text-gray-400">Check back later or try a different subject.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((note) => {
            const { Icon, color, bg, border } = fileIcon(note.fileType);
            return (
              <div
                key={note.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-50"
              >
                <div>
                  {/* Top bar */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border ${bg} ${border}`}>
                      <Icon size={24} className={color} />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {note.youtubeUrl && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 border border-red-100">
                          <Video size={11} />
                          Video
                        </span>
                      )}
                      {note.subjectName && (
                        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                          {note.subjectName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <Link
                    href={`/notes/${note.id}`}
                    className="block group-hover:text-blue-600 transition-colors"
                  >
                    <p className="mb-1 line-clamp-2 text-sm font-bold text-gray-800">{note.title}</p>
                  </Link>

                  {/* Description */}
                  {note.description && (
                    <p className="mb-2 line-clamp-2 text-xs text-gray-500">{note.description}</p>
                  )}
                </div>

                {/* Meta & Action */}
                <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="truncate max-w-[120px]">By {note.uploaderName}</span>
                    <span>{formatDate(note.createdAt)}</span>
                  </div>

                  <Link
                    href={`/notes/${note.id}`}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 active:scale-95 shadow-xs"
                  >
                    <span>Study &amp; Ask Teacher</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

