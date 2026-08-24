const stats = [
  { value: "PG – Uni & CA", label: "Complete Academic Scope" },
  { value: "100%", label: "Conceptual Clarity Focus" },
  { value: "Board & Cambridge", label: "Specialized Faculty" },
  { value: "Top Results", label: "Proven Academic Success" },
];

export default function Stats() {
  return (
    <section id="about" className="bg-bg-soft px-5 py-12 md:px-6 md:py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 text-center md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-white/60 border border-slate-200/60 shadow-2xs backdrop-blur-xs">
            <h3 className="font-display text-[22px] font-bold text-primary sm:text-[26px] md:text-[28px]">{s.value}</h3>
            <p className="mt-1 text-[13px] font-medium text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
