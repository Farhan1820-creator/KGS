const reasons = [
  {
    icon: "📘",
    title: "Structured Courses",
    desc: "Step-by-step paths designed by working professionals, not generic playlists.",
  },
  {
    icon: "💡",
    title: "Real Mentorship",
    desc: "Get feedback on your actual work, not just quizzes and certificates.",
  },
  {
    icon: "🚪",
    title: "Career-Ready Skills",
    desc: "Every course is built around what employers are actually hiring for.",
  },
];

export default function WhyLearnex() {
  return (
    <section id="why" className="bg-white px-5 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <span className="mb-3 inline-block rounded-full bg-bg-soft px-4 py-1.5 text-[13px] font-semibold text-primary">
            Why Learnex
          </span>
          <h2 className="font-display text-[26px] font-bold md:text-[34px]">
            Built for people who actually want to learn
          </h2>
          <p className="mt-3 text-text-muted">No fluff, no filler — just structured learning that gets you job-ready.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r) => (
            <div key={r.title} className="rounded-2xl bg-bg-soft p-7 transition-transform hover:-translate-y-1.5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[22px]">
                {r.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{r.title}</h3>
              <p className="text-sm text-text-muted">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
