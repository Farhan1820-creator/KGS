"use client";

import { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

export default function CinematicVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <section className="px-5 py-12 md:px-6 md:py-16 bg-gradient-to-b from-white to-bg-soft/40">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mx-auto mb-10 max-w-xl text-center">
          <span className="mb-3 inline-flex items-center rounded-full bg-bg-soft px-4 py-1.5 text-[13px] font-semibold text-primary border border-primary/10">
            Campus & Academic Environment
          </span>
          <h2 className="font-display text-[26px] font-bold md:text-[34px]">
            A Glimpse into Life at Learnex
          </h2>
          <p className="mt-3 text-text-muted">
            Explore our conceptual classrooms, computer skill labs, and dedicated study environment.
          </p>
        </div>

        {/* Full-width Cinematic Video Container */}
        <div className="group relative overflow-hidden rounded-3xl border border-[#DCE7F2] bg-slate-950 shadow-2xl shadow-slate-300/60 aspect-video max-h-[560px] w-full flex items-center justify-center">
          {/* 
            VIDEO SOURCE:
            You can replace the 'src' below with your own custom video URL (e.g. Cloudinary, S3, YouTube embed, or self-hosted mp4).
          */}
          <video
            ref={videoRef}
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
            poster="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2070&auto=format&fit=crop"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="h-full w-full object-cover"
            onClick={togglePlay}
          />

          {/* Cinematic Top/Bottom Gradient Overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

          {/* Central Play/Pause Watermark Button on Hover */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause video" : "Play video"}
            className="absolute z-20 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-white/30 cursor-pointer active:scale-95"
          >
            {isPlaying ? (
              <Pause className="h-7 w-7 sm:h-8 sm:w-8 fill-white" />
            ) : (
              <Play className="h-7 w-7 sm:h-8 sm:w-8 fill-white translate-x-0.5" />
            )}
          </button>

          {/* Bottom Controls Bar */}
          <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between p-4 sm:p-6 text-white bg-gradient-to-t from-black/80 to-transparent">
            <div>
              <p className="text-xs sm:text-sm font-semibold tracking-wide text-white/90">
                The Learnex Academy — Academic & Skill Environment
              </p>
              <p className="text-[11px] sm:text-xs text-white/60">
                From School & College to University, CA (PRC) & Practical Skill Labs
              </p>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label="Fullscreen"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              >
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
