"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, X, Loader2, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { toast } from "sonner";

export async function downloadImageFile(url: string, defaultFilename = "task-image.jpg") {
  const toastId = toast.loading("Downloading image...");
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch image");
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    toast.success("Image downloaded successfully!", { id: toastId });
  } catch (err) {
    console.error("Image download error:", err);
    // Fallback: open in new tab
    window.open(url, "_blank");
    toast.info("Opening image in new tab", { id: toastId });
  }
}

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  title?: string;
  filename?: string;
}

export function ImagePreviewDialog({
  open,
  onOpenChange,
  imageUrl,
  title = "Attachment Preview",
  filename = "task-attachment.jpg",
}: ImagePreviewDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!imageUrl) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    await downloadImageFile(imageUrl, filename);
    setIsDownloading(false);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) handleReset();
        onOpenChange(val);
      }}
    >
      <DialogContent className="w-[95vw] max-w-4xl p-0 bg-slate-950/95 border-slate-800 text-white overflow-hidden shadow-2xl backdrop-blur-md">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
          <div className="min-w-0 flex-1 pr-3">
            <DialogTitle className="text-sm sm:text-base font-semibold text-slate-100 truncate">
              {title}
            </DialogTitle>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Zoom Controls */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
              className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-[11px] font-mono text-slate-400 w-9 text-center hidden sm:inline-block">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            {/* Rotate Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleRotate}
              className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800"
              title="Rotate 90°"
            >
              <RotateCw className="h-4 w-4" />
            </Button>

            {/* Open in New Tab Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => window.open(imageUrl, "_blank")}
              className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800"
              title="Open full image in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>

            {/* Download Button */}
            <Button
              type="button"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="h-8 gap-1.5 bg-primary text-white hover:bg-primary/90 text-xs font-semibold shadow-xs"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>

        {/* Main Image Display Area */}
        <div className="relative flex items-center justify-center p-3 sm:p-6 min-h-[50vh] max-h-[78vh] overflow-auto bg-black/50 select-none">
          <img
            src={imageUrl}
            alt={title}
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              transition: "transform 0.2s ease-out",
            }}
            className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-2xl origin-center"
          />
        </div>

        {/* Bottom Helper Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-slate-900/60 text-[11px] text-slate-400">
          <span className="truncate">Use toolbar controls to zoom, rotate, or download.</span>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={handleReset}
            className="h-auto p-0 text-primary text-[11px]"
          >
            Reset View
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
