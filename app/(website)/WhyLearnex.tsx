"use client";

import {
  GraduationCap,
  ClipboardCheck,
  Award,
  Users2,
  Laptop,
  Building,
  CheckCircle2,
} from "lucide-react";
import { useTilt } from "./hooks/useTilt";
import Reveal from "./Reveal";
import { DEFAULT_WHY_LEARNEX, type WhyLearnexItem } from "@/lib/sanity/queries";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ClipboardCheck,
  Users2,
  Award,
  GraduationCap,
  Laptop,
  Building,
};

function ReasonCard({ r }: { r: WhyLearnexItem }) {
  const { ref, style, onMouseMove, onMouseLeave } = useTilt({ max: 8, scale: 1.02 });
  const Icon = (r.iconName && ICON_MAP[r.iconName]) || CheckCircle2;

  return (
    <div
      ref={ref}
      style={style}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-white p-7 border border-[#E5EEF8] shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/15 hover:border-primary will-change-transform"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(220px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(30,95,168,0.12), transparent 70%)",
        }}
      />

      <div>
        <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-primary shadow-xs border border-[#E5EEF8] transition-all group-hover:border-primary/30 group-hover:bg-primary group-hover:text-white group-hover:-translate-y-0.5">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="relative mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
          {r.title}
        </h3>
        <p className="relative text-sm text-text-muted leading-relaxed">{r.desc}</p>
      </div>
    </div>
  );
}

export default function WhyLearnex({ initialItems }: { initialItems?: WhyLearnexItem[] }) {
  const reasons = initialItems && initialItems.length > 0 ? initialItems : DEFAULT_WHY_LEARNEX;

  return (
    <section id="why" className="bg-white px-5 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-[13px] font-semibold text-primary">
            Why Choose The Learnex Academy
          </span>
          <h2 className="font-display text-[26px] font-bold text-foreground md:text-[34px]">
            &ldquo;Learn, Evolve, Excel&rdquo;
          </h2>
          <p className="mt-3 text-text-muted">
            Join a dynamic learning community with expert teachers and modern facilities. We empower every student with knowledge, skills, and character for lifelong success.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {reasons.map((r, idx) => (
            <Reveal key={r.title} delay={idx * 80} className="h-full">
              <ReasonCard r={r} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
