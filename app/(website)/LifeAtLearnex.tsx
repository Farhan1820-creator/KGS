"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Reveal from "./Reveal";
import { DEFAULT_LIFE_AT_LEARNEX, type LifeAtLearnexItem } from "@/lib/sanity/queries";

export default function LifeAtLearnex({ initialSlides }: { initialSlides?: LifeAtLearnexItem[] }) {
  const slides = initialSlides && initialSlides.length > 0 ? initialSlides : DEFAULT_LIFE_AT_LEARNEX;
  const [active, setActive] = useState(0);

  // Auto-advance every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  function next() {
    setActive((prev) => (prev + 1) % slides.length);
  }

  function prev() {
    setActive((prev) => (prev - 1 + slides.length) % slides.length);
  }

  return (
    <section id="life-at-learnex" className="bg-primary px-5 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <Reveal className="mx-auto mb-10 max-w-xl text-center">
          <span className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1.5 text-[13px] font-semibold text-white border border-white/25">
            Campus & Academic Environment — Multan
          </span>
          <h2 className="font-display text-[26px] font-bold text-white md:text-[36px] leading-tight">
            Life at Learnex
          </h2>
          <p className="mt-3 text-white/80">
            A glimpse into our classrooms, digital skill labs, and disciplined testing environment in Model Town, Multan.
          </p>
        </Reveal>

        {/* Slider */}
        <Reveal className="relative mx-auto max-w-5xl">
          <div className="relative h-[420px] sm:h-[540px] md:h-[640px] lg:h-[700px] w-full overflow-hidden rounded-3xl border border-white/20 shadow-2xl shadow-black/20 bg-slate-900">
            {slides.map((slide, idx) => (
              <div
                key={idx}
                className={cn(
                  "absolute inset-0 transition-opacity duration-700 ease-in-out",
                  active === idx ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              >
                <Image
                  src={slide.image}
                  alt={slide.caption}
                  fill
                  priority={idx === 0}
                  className="object-cover object-center"
                  sizes="(max-width: 1280px) 100vw, 1024px"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 sm:p-6">
                  <p className="text-sm font-medium text-white sm:text-base">{slide.caption}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Dots */}
          <div className="mt-5 flex items-center justify-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActive(idx)}
                aria-label={`Go to photo ${idx + 1}`}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300 cursor-pointer",
                  active === idx ? "w-8 bg-white" : "w-2.5 bg-white/40 hover:bg-white/60"
                )}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
