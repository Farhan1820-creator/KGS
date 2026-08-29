"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Paperclip, Send, X, Loader2, Users, User } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { createDiaryEntry } from "./diary-actions";

interface DiaryComposerProps {
  classId: string;
  students: { id: number; name: string; rollNumber: string | null }[];
}

export function DiaryComposer({ classId, students }: DiaryComposerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [studentId, setStudentId] = useState<string>("");

  const busy = uploading || sending;

  const selectedStudentName = studentId
    ? students.find((s) => String(s.id) === studentId)?.name
    : null;

  async function handleSend() {
    if (!classId) {
      toast.error("Select a class first");
      return;
    }
    if (!text.trim() && !file) {
      toast.error("Write a message or attach a file");
      return;
    }

    let fileData: { url: string; fileName: string; fileType: string } | null = null;

    if (file) {
      setUploading(true);
      try {
        fileData = await uploadToCloudinary(file);
      } catch {
        setUploading(false);
        toast.error("File upload failed. Try again.");
        return;
      }
      setUploading(false);
    }

    setSending(true);
    const res = await createDiaryEntry({
      classId,
      studentId: studentId || undefined,
      message: text,
      fileUrl: fileData?.url,
      fileName: fileData?.fileName,
      fileType: fileData?.fileType,
    });
    setSending(false);

    if (!res.success) {
      toast.error(res.errors?.message?.[0] ?? res.errors?.root?.[0] ?? "Could not send message");
      return;
    }

    setText("");
    setFile(null);
    setStudentId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="border-t bg-gradient-to-t from-muted/30 to-transparent">
      {/* Student target indicator + file preview row */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-2 flex-wrap">
        {/* Send-to selector */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {studentId ? (
              <User className="h-3 w-3" />
            ) : (
              <Users className="h-3 w-3" />
            )}
            <span className="font-medium">To:</span>
          </div>
          <Select
            value={studentId || "all"}
            onValueChange={(val) => setStudentId(!val || val === "all" ? "" : val)}
          >
            <SelectTrigger className="h-7 w-44 text-xs border-dashed">
              <SelectValue placeholder="Entire Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3 w-3" />
                  Entire Class
                </span>
              </SelectItem>
              {students.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File preview chip */}
        {file && (
          <div className="flex items-center gap-1.5 text-xs bg-muted/80 rounded-full px-2.5 py-1 ml-auto">
            <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="truncate max-w-[160px]">{file.name}</span>
            <button
              onClick={() => setFile(null)}
              disabled={busy}
              className="hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Message input row */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 h-9 w-9 rounded-full hover:bg-muted"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Input
          placeholder={
            selectedStudentName
              ? `Message for ${selectedStudentName}...`
              : "Type a message for the class..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={busy}
          className="rounded-full bg-muted/50 border-0 focus-visible:ring-1"
        />

        <Button
          type="button"
          size="icon"
          className="shrink-0 h-9 w-9 rounded-full"
          onClick={handleSend}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
