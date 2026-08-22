"use client";

import { useRef } from "react";
import { Camera, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoUploadSquareProps {
  photoUrl: string | null;
  name?: string;
  editable: boolean;
  uploading?: boolean;
  progress?: number; // 0-100, only shown while uploading
  onFileSelected: (file: File) => void;
  onRemove?: () => void; // shown as a small "x" badge when set and a photo is present
  removing?: boolean;
  size?: number; // px, default 128
  className?: string;
}

// A square, dashed-outline photo slot — read-only frame in view mode, a
// click-to-upload dropzone (with a live progress ring) in edit mode. Used at
// the top-right of the student dialog; kept generic enough to reuse anywhere
// else a profile photo is needed.
export function PhotoUploadSquare({
  photoUrl,
  name,
  editable,
  uploading = false,
  progress = 0,
  onFileSelected,
  onRemove,
  removing = false,
  size = 128,
  className,
}: PhotoUploadSquareProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    if (!editable || uploading || removing) return;
    fileInputRef.current?.click();
  }

  const ringStyle = uploading
    ? { background: `conic-gradient(var(--primary) ${progress * 3.6}deg, var(--muted) 0deg)` }
    : undefined;

  return (
    <div className={cn("relative flex flex-col items-center gap-1.5", className)} style={{ width: size }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          if (file) onFileSelected(file);
          e.target.value = "";
        }}
      />

      {editable && onRemove && photoUrl && !uploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          disabled={removing}
          title="Remove photo"
          className="absolute right-0 top-0 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={!editable || uploading || removing}
        title={editable ? "Upload photo" : undefined}
        className={cn(
          "group relative flex items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-muted/40 transition-colors",
          editable && !uploading && "cursor-pointer hover:border-primary/60 hover:bg-muted/60",
          !editable && "cursor-default border-muted-foreground/25"
        )}
        style={{ width: size, height: size }}
      >
        {removing ? (
          <span className="text-[11px] text-muted-foreground">Removing…</span>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full p-[3px] transition-[background]"
              style={ringStyle}
            >
              <div className="flex h-full w-full items-center justify-center rounded-full bg-popover text-[11px] font-medium">
                {progress}%
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground">Uploading…</span>
          </div>
        ) : photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={name || "Photo"} className="h-full w-full object-cover" />
        ) : (
          <User className="h-9 w-9 text-muted-foreground/60" />
        )}

        {editable && !uploading && (
          <div className="absolute inset-0 hidden items-center justify-center bg-black/40 group-hover:flex">
            <Camera className="h-6 w-6 text-white" />
          </div>
        )}
      </button>

      {editable && !uploading && (
        <span className="text-center text-[11px] leading-tight text-muted-foreground">
          {photoUrl ? "Tap to change" : "Tap to upload"}
          <br />
          Max 8MB
        </span>
      )}
    </div>
  );
}
