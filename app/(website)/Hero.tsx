"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop",
    badge: "School, College & University Academics",
    title: "Excellence from PG to University & Professional CA",
    desc: "Premier coaching for Class PG–Matric, O Level, Intermediate (FSc, ICom, ICS), Bachelor degrees, and CA (PRC) with dedicated subject specialists.",
    caption: "Comprehensive Academic Pathways",
  },
  {
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop",
    badge: "Matric, O Level & Intermediate",
    title: "Top-Tier Board & Cambridge Preparation",
    desc: "In-depth conceptual mastery for Matric, O Level, FSc Pre-Medical & Pre-Engineering, ICS, and I.Com with regular test sessions.",
    caption: "Board & Cambridge Excellence",
  },
  {
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop",
    badge: "University & Professional Studies",
    title: "Bachelor Degree Support & CA (PRC) Coaching",
    desc: "Rigorous exam-focused preparation for CA (PRC) modules and undergraduate Bachelor students to achieve top academic ranks.",
    caption: "Higher Education & Professional CA",
  },
  {
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2070&auto=format&fit=crop",
    badge: "Practical Short Courses",
    title: "Master Canva Design & MS Office Suite",
    desc: "Hands-on practical training in Canva Graphic Design and Microsoft Office (Excel, Word, PowerPoint) to enhance essential digital skills.",
    caption: "Practical Digital Skill Courses",
  },
];

export default function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-advance slider every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  return (
    <section className="relative overflow-hidden px-5 py-12 text-center md:px-6 md:py-16 min-h-[calc(100vh-64px)] flex flex-col items-center justify-center">
      {/* Background Image Carousel */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              activeSlide === idx ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
            )}
            style={{ transitionProperty: "opacity, transform", transitionDuration: "1200ms" }}
          >
            <Image
              src={slide.image}
              alt={slide.caption}
              fill
              priority={idx === 0}
              className="object-cover object-center"
            />
          </div>
        ))}

        {/* Minimal Subtle Background Overlay */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
      </div>

      {/* Hero Content with Minimal Frosted Backdrop Overlay */}
      <div className="relative z-10 mx-auto w-full max-w-4xl my-auto">
        <div className="rounded-3xl border border-white/40 bg-white/60 p-6 sm:p-10 shadow-2xl backdrop-blur-md ring-1 ring-black/5">
          {/* Keyed container for Blur Reveal Animation */}
          <div key={activeSlide} className="animate-blur-reveal flex flex-col items-center">
            <span className="mb-4 inline-flex items-center rounded-full bg-white/80 px-4 py-1.5 text-[13px] font-semibold tracking-wide text-primary shadow-xs border border-primary/20 backdrop-blur-sm">
              {SLIDES[activeSlide].badge}
            </span>

            <h1 className="font-display mx-auto max-w-3xl text-[30px] font-bold leading-tight sm:text-[42px] md:text-[50px] text-foreground drop-shadow-xs">
              {activeSlide === 0 ? (
                <>
                  Excellence from <span className="text-primary">PG to University</span> & Professional CA
                </>
              ) : (
                SLIDES[activeSlide].title
              )}
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[15px] text-slate-800 font-medium sm:text-[17px] leading-relaxed">
              {SLIDES[activeSlide].desc}
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3.5 sm:flex-row w-full sm:w-auto">
              <a
                href="#courses"
                className="w-full max-w-xs rounded-full bg-primary px-8 py-3.5 text-center text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(30,95,168,0.3)] transition-transform hover:-translate-y-0.5 sm:w-auto"
              >
                Explore Courses
              </a>
              <Link
                href="/login"
                className="w-full max-w-xs inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-white/90 px-7 py-3.5 text-center text-[15px] font-semibold text-primary transition-all hover:bg-white hover:border-primary shadow-xs sm:w-auto"
              >
                <GraduationCap className="h-4.5 w-4.5" />
                Student Portal
              </Link>
            </div>
          </div>
        </div>

        {/* Slider Controls & Dots Indicator */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous slide"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/80 text-foreground hover:text-primary hover:bg-white transition-all shadow-md cursor-pointer backdrop-blur-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm border border-white/20">
            {SLIDES.map((slide, idx) => (
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
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/80 text-foreground hover:text-primary hover:bg-white transition-all shadow-md cursor-pointer backdrop-blur-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
