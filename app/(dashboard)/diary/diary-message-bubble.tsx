"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDown, Pencil, Trash2, Check, X } from "lucide-react";
import { updateDiaryEntry, deleteDiaryEntry } from "./diary-actions";

export type DiaryEntryRow = {
  id: number;
  senderId: number;
  senderName: string;
  message: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
};

interface DiaryMessageBubbleProps {
  entry: DiaryEntryRow;
  canManage: boolean; // true if current user (teacher-own or admin) may edit/delete this entry
  isOwn: boolean; // controls left/right alignment, whatsapp-style
}

export function DiaryMessageBubble({ entry, canManage, isOwn }: DiaryMessageBubbleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.message ?? "");
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    const res = await updateDiaryEntry(entry.id, draft);
    setBusy(false);
    if (!res.success) {
      toast.error(res.errors?.message?.[0] ?? res.errors?.root?.[0] ?? "Could not update message");
      return;
    }
    toast.success("Message updated");
    setEditing(false);
  }

  async function handleDelete() {
    setBusy(true);
    const res = await deleteDiaryEntry(entry.id);
    setBusy(false);
    if (!res.success) {
      toast.error(res.errors?.root?.[0] ?? "Could not delete message");
    }
  }

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-lg px-3 py-2 space-y-1",
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {!isOwn && <p className="text-xs font-semibold opacity-70">{entry.senderName}</p>}

        {editing ? (
          <div className="space-y-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} disabled={busy} />
            <div className="flex gap-1 justify-end">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSave} disabled={busy}>
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => {
                  setEditing(false);
                  setDraft(entry.message ?? "");
                }}
                disabled={busy}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            {entry.message && <p className="text-sm whitespace-pre-wrap">{entry.message}</p>}

            {entry.fileUrl && (
              <a
                href={entry.fileUrl}
                download={entry.fileName ?? true}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm underline underline-offset-2"
              >
                <FileDown className="h-4 w-4 shrink-0" />
                <span className="truncate">{entry.fileName ?? "Attachment"}</span>
              </a>
            )}

            <p className="text-[10px] opacity-60">{new Date(entry.createdAt).toLocaleString()}</p>
          </>
        )}

        {canManage && !editing && (
          <div className="flex gap-1 justify-end pt-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 opacity-70"
              onClick={() => setEditing(true)}
              disabled={busy}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 opacity-70"
              onClick={handleDelete}
              disabled={busy}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
