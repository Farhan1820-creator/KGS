"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { NoteUploadDialog } from "./note-upload-dialog";
import { deleteNote, type NoteRow } from "./notes-actions";
import { toast } from "sonner";
import { FileText, Image, FileSpreadsheet, Presentation, File, Trash2, Plus, Search, Filter, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


function fileIcon(fileType: string) {
  const t = fileType.toLowerCase();
  if (t.includes("pdf")) return { Icon: FileText, color: "text-red-500", bg: "bg-red-50" };
  if (t.includes("image") || t.includes("png") || t.includes("jpg"))
    return { Icon: Image, color: "text-green-500", bg: "bg-green-50" };
  if (t.includes("sheet") || t.includes("excel") || t.includes("csv"))
    return { Icon: FileSpreadsheet, color: "text-emerald-500", bg: "bg-emerald-50" };
  if (t.includes("presentation") || t.includes("powerpoint") || t.includes("ppt"))
    return { Icon: Presentation, color: "text-orange-500", bg: "bg-orange-50" };
  return { Icon: File, color: "text-blue-500", bg: "bg-blue-50" };
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

interface Props {
  initialNotes: NoteRow[];
  classes: { id: number; name: string; section: string | null }[];
  subjects: { id: number; name: string }[];
  role: string;
  userId: number;
}

export function NotesClient({ initialNotes, classes, subjects, role, userId }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [isPending, startTransition] = useTransition();

  const filtered = notes.filter((n) => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === "all" || String(n.classId) === filterClass;
    const matchSubject = filterSubject === "all" || String(n.subjectId) === filterSubject;
    return matchSearch && matchClass && matchSubject;
  });

  function handleDelete(noteId: number) {
    startTransition(async () => {
      const res = await deleteNote(noteId);
      if (!res.success) {
        toast.error(res.error ?? "Delete failed.");
      } else {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        toast.success("Note deleted.");
      }
    });
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-card rounded-2xl shadow-sm border border-muted/50 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 sm:gap-3.5 flex-1">
          {/* Search */}
          <div className="space-y-1.5 w-full sm:flex-1 sm:min-w-52">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Search
            </Label>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notes by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 w-full"
              />
            </div>
          </div>

          {/* Class */}
          <div className="space-y-1.5 w-full sm:w-48">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Class
            </Label>
            <Select value={filterClass} onValueChange={(v) => setFilterClass(v ?? "")}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}{c.section ? ` – ${c.section}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-1.5 w-full sm:w-48">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Subject
            </Label>
            <Select value={filterSubject} onValueChange={(v) => setFilterSubject(v ?? "")}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full lg:w-auto shrink-0 flex items-end">
          <Button onClick={() => setDialogOpen(true)} className="gap-2 w-full sm:w-auto shadow-xs h-10">
            <Plus size={16} />
            Upload Note
          </Button>
        </div>
      </div>

      {/* Stats */}
      <p className="mb-4 text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "note" : "notes"} found
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <FileText size={40} className="mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No notes yet</p>
          <p className="mt-1 text-xs text-muted-foreground/60">Click &quot;Upload Note&quot; to add the first one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((note) => {
            const { Icon, color, bg } = fileIcon(note.fileType);
            const canDelete = role === "admin" || note.uploaderId === userId;
            return (
              <div
                key={note.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-muted/60 bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30"
              >
                <div>
                  {/* Top Bar with Icon + Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
                      <Icon size={22} className={color} />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {note.youtubeUrl && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 border border-red-100">
                          <Video size={11} />
                          Video
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Class + Subject badges */}
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-600">
                      {note.className}{note.classSection ? ` – ${note.classSection}` : ""}
                    </span>
                    {note.subjectName && (
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-600">
                        {note.subjectName}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <Link
                    href={`/dashboard/notes/${note.id}`}
                    className="block group-hover:text-primary transition-colors"
                  >
                    <p className="mb-1 line-clamp-2 text-sm font-bold text-foreground">{note.title}</p>
                  </Link>

                  {note.description && (
                    <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{note.description}</p>
                  )}
                </div>

                {/* Meta & Actions */}
                <div className="mt-4 pt-3 border-t border-muted/50">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-3">
                    <span className="truncate max-w-[120px]" title={note.uploaderName}>
                      By {note.uploaderName}
                    </span>
                    <span>{formatDate(note.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/notes/${note.id}`}
                      className="flex-1 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white py-2 text-center text-xs font-semibold transition-all shadow-2xs"
                    >
                      View &amp; Discuss
                    </Link>

                    {canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(note.id);
                        }}
                        className="h-8 w-8 flex-shrink-0 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        title="Delete note"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


      <NoteUploadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={async () => {
          // Trigger a page refresh to get fresh data from server
          window.location.reload();
        }}
        classes={classes}
        subjects={subjects}
      />
    </div>
  );
}
