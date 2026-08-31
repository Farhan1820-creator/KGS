"use client";

import { useState } from "react";
import {
  GraduationCap,
  BookOpen,
  Palette,
  FileSpreadsheet,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  School,
  Building2,
  Laptop,
  Languages,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTilt } from "./hooks/useTilt";
import Reveal from "./Reveal";
import { DEFAULT_COURSES, type CourseProgramItem } from "@/lib/sanity/queries";

type Category = "All" | "School & O Level" | "College & Intermediate" | "Professional CA" | "Digital & Skill Courses";

const categories: Category[] = [
  "All",
  "School & O Level",
  "College & Intermediate",
  "Professional CA",
  "Digital & Skill Courses",
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  School,
  BookOpen,
  GraduationCap,
  Building2,
  Briefcase,
  Palette,
  FileSpreadsheet,
  Laptop,
  Languages,
};

function ProgramCard({ p }: { p: CourseProgramItem }) {
  const { ref, style, onMouseMove, onMouseLeave } = useTilt({ max: 6, scale: 1.02 });
  const Icon = (p.iconName && ICON_MAP[p.iconName]) || BookOpen;

  return (
    <div
      ref={ref}
      style={style}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[#E5EEF8] bg-white transition-shadow duration-300 hover:shadow-[0_16px_35px_rgba(30,95,168,0.12)] hover:border-primary/40 will-change-transform"
    >
      <div>
        <div className={cn("relative h-24 bg-gradient-to-r p-4 flex items-center justify-between text-white", p.gradient || "from-blue-600 to-indigo-700")}>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <Icon className="h-5 w-5" />
          </div>
          <span className="rounded-full bg-black/20 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold tracking-wide text-white border border-white/20">
            {p.badge}
          </span>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="mb-1 text-[11px] font-bold tracking-wider text-primary uppercase">
            {p.tag}
          </div>
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
            {p.title}
          </h3>
          <p className="text-xs font-medium text-slate-500 mb-2.5">{p.subtitle}</p>
          <p className="text-sm text-text-muted leading-relaxed mb-4 min-h-[44px]">{p.desc}</p>

          {p.features && p.features.length > 0 && (
            <div className="space-y-2 border-t border-slate-100 pt-3.5 mb-4">
              {p.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative border-t border-slate-100 bg-slate-50/50 p-4 mt-auto">
        <a
          href="#contact"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-all group-hover:gap-2.5"
        >
          Enroll / Inquire for Admission
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </div>
  );
}

export default function Courses({ initialCourses }: { initialCourses?: CourseProgramItem[] }) {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const programs = initialCourses && initialCourses.length > 0 ? initialCourses : DEFAULT_COURSES;

  const filteredPrograms =
    activeCategory === "All" ? programs : programs.filter((p) => p.category === activeCategory);

  return (
    <section id="courses" className="px-5 py-16 md:px-6 md:py-24 bg-white">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-[13px] font-semibold text-primary border border-primary/20">
            ADMISSION OPEN — Multan Campuses
          </span>
          <h2 className="font-display text-[28px] font-bold text-foreground md:text-[38px] leading-tight">
            Academic & Skill Programs
          </h2>
          <p className="mt-3.5 text-base text-text-muted leading-relaxed">
            Morning Early Foundation classes, Cambridge O Level, Intermediate, CA modules, and practical digital & communication skills.
          </p>
        </Reveal>

        <Reveal className="mb-12 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer",
                activeCategory === cat
                  ? "bg-primary text-white shadow-md shadow-primary/25 scale-105"
                  : "bg-white text-text-muted border border-border/70 hover:border-primary/40 hover:text-primary hover:bg-slate-50 hover:-translate-y-0.5"
              )}
            >
              {cat}
            </button>
          ))}
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {filteredPrograms.map((p, idx) => (
            <Reveal key={p.title} delay={(idx % 3) * 80} className="h-full">
              <ProgramCard p={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
