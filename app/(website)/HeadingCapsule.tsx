"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type HeadingCapsuleProps = {
  children: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "primary" | "light" | "white" | "dark";
  className?: string;
  delay?: number; // ms
};

/**
 * Modern masked heading capsule with animated border mask & shimmer glow.
 * Reveals with smooth scale & mask clip on scroll.
 */
export default function HeadingCapsule({
  children,
  icon: Icon = Sparkles,
  variant = "primary",
  className,
  delay = 0,
}: HeadingCapsuleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const variantStyles = {
    primary:
      "bg-primary/10 text-primary border-primary/20 hover:border-primary/40 shadow-xs",
    light:
      "bg-white/85 text-primary border-primary/25 shadow-xs backdrop-blur-md",
    white:
      "bg-white/20 text-white border-white/30 shadow-md backdrop-blur-md",
    dark:
      "bg-slate-900/80 text-sky-400 border-sky-500/30 shadow-lg backdrop-blur-md",
  };

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(10px) scale(0.95)",
        transition: `all 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
      className={cn("mb-3.5 inline-flex items-center justify-center", className)}
    >
      <div
        className={cn(
          "group relative inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[12px] sm:text-[13px] font-semibold tracking-wide uppercase transition-all duration-300",
          variantStyles[variant]
        )}
      >
        {/* Animated moving shimmer mask overlay */}
        <span
          className="pointer-events-none absolute inset-0 rounded-full overflow-hidden"
          aria-hidden="true"
        >
          <span className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </span>

        {/* Pulsing indicator dot or Icon */}
        <span className="relative flex h-2 w-2 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
        </span>

        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-90 transition-transform duration-300 group-hover:rotate-12" />}

        <span className="relative z-10">{children}</span>
      </div>
    </div>
  );
}
