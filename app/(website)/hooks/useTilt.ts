"use client";

import { useRef, useState, useCallback } from "react";

type TiltOptions = {
  max?: number;   // max tilt in degrees
  scale?: number; // hover scale
};

/**
 * Lightweight 3D tilt effect on mouse move — no dependencies.
 * Usage: const { ref, style, onMouseMove, onMouseLeave } = useTilt();
 *        <div ref={ref} style={style} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
 */
export function useTilt({ max = 10, scale = 1.03 }: TiltOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)",
  });

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;  // 0 -> 1
      const y = (e.clientY - rect.top) / rect.height;  // 0 -> 1
      const rotateY = (x - 0.5) * max * 2;
      const rotateX = (0.5 - y) * max * 2;

      setStyle({
        transform: `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
        transition: "transform 60ms linear",
        // dynamic glow follows the cursor
        "--glow-x": `${x * 100}%`,
        "--glow-y": `${y * 100}%`,
      } as React.CSSProperties);
    },
    [max, scale]
  );

  const onMouseLeave = useCallback(() => {
    setStyle({
      transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)",
      transition: "transform 400ms cubic-bezier(0.22, 1, 0.36, 1)",
    });
  }, []);

  return { ref, style, onMouseMove, onMouseLeave };
}
