"use client";

import { useState, useTransition } from "react";
import { NoteUploadDialog } from "./note-upload-dialog";
import { deleteNote, type NoteRow } from "./notes-actions";
import { toast } from "sonner";
import { FileText, Image, FileSpreadsheet, Presentation, File, Trash2, Plus, Search, Filter } from "lucide-react";
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
      <div className="mb-6 flex flex-wrap items-end gap-3 bg-card rounded-xl shadow-md border border-muted/50 p-4">
        {/* Search */}
        <div className="space-y-1.5 flex-1 min-w-48">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Search
          </Label>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Class */}
        <div className="space-y-1.5 w-full sm:w-auto">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Class
          </Label>
          <Select value={filterClass} onValueChange={(v) => setFilterClass(v ?? "")}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  Class {c.name}{c.section ? ` – ${c.section}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subject */}
        <div className="space-y-1.5 w-full sm:w-auto">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Subject
          </Label>
          <Select value={filterSubject} onValueChange={(v) => setFilterSubject(v ?? "")}>
            <SelectTrigger className="w-44">
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

        <div className="self-end ml-auto">
          <Button onClick={() => setDialogOpen(true)} className="gap-2 shadow-sm">
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
            const canDelete = role === "admin" || note.uploaderName === note.uploaderName; // simplified — server enforces
            return (
              <div key={note.id} className="group relative flex flex-col rounded-xl border bg-card p-5 shadow-sm transition hover:shadow-md">
                {/* Icon */}
                <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
                  <Icon size={22} className={color} />
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
                <p className="mb-1 line-clamp-2 text-sm font-bold text-foreground">{note.title}</p>
                {note.description && (
                  <p className="mb-2 line-clamp-1 text-xs text-muted-foreground">{note.description}</p>
                )}

                {/* Meta */}
                <div className="mt-auto pt-3 text-[11px] text-muted-foreground">
                  <p>By {note.uploaderName}</p>
                  <p>{formatDate(note.createdAt)}</p>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <a
                    href={note.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-lg border py-1.5 text-center text-xs font-medium transition hover:bg-accent"
                  >
                    View / Download
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => handleDelete(note.id)}
                    className="h-8 w-8 flex-shrink-0 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
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
