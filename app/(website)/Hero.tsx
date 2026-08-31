"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { GraduationCap, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import MagneticButton from "./MagneticButton";
import { DEFAULT_HERO_SLIDES, type HeroSlideData } from "@/lib/sanity/queries";

export default function Hero({ initialSlides }: { initialSlides?: HeroSlideData[] }) {
  const slides = initialSlides && initialSlides.length > 0 ? initialSlides : DEFAULT_HERO_SLIDES;
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-advance slider every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative overflow-hidden px-5 py-12 text-center md:px-6 md:py-16 min-h-[calc(100vh-64px)] flex flex-col items-center justify-center">
      {/* Background Image Carousel */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {slides.map((slide, idx) => {
          const isActive = activeSlide === idx;
          // Alternate the pan direction per slide so consecutive slides
          // don't all drift the same way — reads as more cinematic.
          const panTo = idx % 2 === 0 ? "translate-x-[-2.5%] translate-y-[-1.5%]" : "translate-x-[2.5%] translate-y-[1.5%]";

          return (
            <div
              key={idx}
              className={cn(
                "absolute inset-0 transition-opacity ease-in-out",
                isActive ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
              style={{ transitionDuration: "1200ms" }}
            >
              {/* Inner layer does the slow zoom + slide (Ken Burns) while
                  this slide is active; snaps back instantly (duration-0)
                  once it's inactive so it's ready to replay next time. */}
              <div
                className={cn(
                  "absolute inset-0 transition-transform ease-out will-change-transform",
                  isActive ? `scale-110 ${panTo}` : "scale-100 translate-x-0 translate-y-0"
                )}
                style={{ transitionDuration: isActive ? "6000ms" : "0ms" }}
              >
                <Image
                  src={slide.image}
                  alt={slide.caption}
                  fill
                  priority={idx === 0}
                  className="object-cover object-center"
                />
              </div>
            </div>
          );
        })}

        {/* Dark Cinematic Background Overlay for High Readability */}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/60" />
      </div>

      {/* Hero Content - Clean text over background with high contrast */}
      <div className="relative z-10 mx-auto w-full max-w-5xl my-auto">
        {/* Keyed container for Blur Reveal Animation */}
        <div key={activeSlide} className="animate-blur-reveal flex flex-col items-center">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-md px-4 py-1.5 text-[12px] sm:text-[13px] font-bold tracking-wider text-white border border-white/25 shadow-sm">
              {slides[activeSlide]?.badge}
            </span>
          </div>

          <h1 className="font-display mx-auto max-w-4xl text-[32px] font-extrabold leading-[1.18] sm:text-[44px] md:text-[54px] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] tracking-tight">
            {slides[activeSlide]?.title}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-[16px] text-slate-100 font-normal sm:text-[18px] md:text-[19px] leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {slides[activeSlide]?.desc}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row w-full sm:w-auto">
            <MagneticButton
              href="#courses"
              strength={0.3}
              className="w-full max-w-xs inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-center text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:bg-primary/90 border border-primary/40 sm:w-auto"
            >
              <BookOpen className="h-4.5 w-4.5" />
              Explore Courses
            </MagneticButton>
            <MagneticButton
              as={Link}
              href="/login"
              strength={0.3}
              className="w-full max-w-xs inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/15 backdrop-blur-md px-7 py-3.5 text-center text-[15px] font-semibold text-white hover:bg-white/25 hover:border-white/60 shadow-[0_8px_20px_rgba(0,0,0,0.3)] sm:w-auto transition-all"
            >
              <GraduationCap className="h-4.5 w-4.5" />
              Student Portal
            </MagneticButton>
          </div>
        </div>

        {/* Slider Controls & Dots Indicator */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous slide"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white hover:bg-black/70 hover:border-white/60 transition-all shadow-md cursor-pointer backdrop-blur-md"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-sm">
            {slides.map((slide, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300 cursor-pointer",
                  activeSlide === idx
                    ? "w-8 bg-white shadow-xs"
                    : "w-2.5 bg-white/40 hover:bg-white/70"
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white hover:bg-black/70 hover:border-white/60 transition-all shadow-md cursor-pointer backdrop-blur-md"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
