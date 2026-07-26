"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Send, X, Loader2 } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { createDiaryEntry } from "./diary-actions";

interface DiaryComposerProps {
  classId: string; // currently selected class — entry always goes to this class
}

export function DiaryComposer({ classId }: DiaryComposerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  const busy = uploading || sending;

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
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="border-t p-3 space-y-2">
      {file && (
        <div className="flex items-center gap-2 text-sm bg-muted rounded-md px-3 py-1.5 w-fit">
          <span className="truncate max-w-[200px]">{file.name}</span>
          <button onClick={() => setFile(null)} disabled={busy}>
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
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
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Input
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={busy}
        />

        <Button type="button" size="icon" onClick={handleSend} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
