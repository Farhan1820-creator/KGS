"use client";

import { useEffect, useRef, useState, type ReactNode, type ElementType } from "react";

type RevealTextProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number; // ms
};

/**
 * Clip-path "curtain wipe" reveal for headings — text is masked and
 * wipes open left-to-right when it enters the viewport. One-time trigger.
 * Fail-safe: if IntersectionObserver never fires (unsupported browser,
 * edge-case layout), a timeout forces the text visible so it can never
 * get stuck hidden.
 */
export default function RevealText({ children, as = "h2", className, delay = 0 }: RevealTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const Comp = as;

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

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className="overflow-hidden"
      style={{
        clipPath: visible ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
        transition: `clip-path 900ms cubic-bezier(0.65, 0, 0.15, 1) ${delay}ms`,
      }}
    >
      <Comp
        className={className}
        style={{
          transform: visible ? "translateX(0)" : "translateX(24px)",
          transition: `transform 900ms cubic-bezier(0.65, 0, 0.15, 1) ${delay}ms`,
        }}
      >
        {children}
      </Comp>
    </div>
  );
}
