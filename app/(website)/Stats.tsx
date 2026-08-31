import Reveal from "./Reveal";
import { DEFAULT_STATS, type StatItem } from "@/lib/sanity/queries";

export default function Stats({ initialStats }: { initialStats?: StatItem[] }) {
  const stats = initialStats && initialStats.length > 0 ? initialStats : DEFAULT_STATS;

  return (
    <section id="about" className="bg-white px-5 py-12 md:px-6 md:py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 text-center md:grid-cols-4 items-stretch">
        {stats.map((s, idx) => (
          <Reveal key={s.label} delay={idx * 80} className="h-full">
            <div className="h-full flex flex-col justify-center p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/40">
              <h3 className="font-display text-[20px] font-bold text-primary sm:text-[24px] md:text-[26px]">{s.value}</h3>
              <p className="mt-1.5 text-[13px] font-medium text-text-muted">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
