const courses = [
  {
    tag: "WEB DEVELOPMENT",
    title: "MERN Stack Foundations",
    desc: "Build and deploy full-stack apps from scratch.",
  },
  {
    tag: "DESIGN",
    title: "UI/UX Fundamentals",
    desc: "Design interfaces people actually enjoy using.",
  },
  {
    tag: "CAREER",
    title: "Freelancing Bootcamp",
    desc: "Get your first paid client project, step by step.",
  },
];

export default function Courses() {
  return (
    <section id="courses" className="px-5 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <span className="mb-3 inline-block rounded-full bg-bg-soft px-4 py-1.5 text-[13px] font-semibold text-primary">
            Programs
          </span>
          <h2 className="font-display text-[26px] font-bold md:text-[34px]">Popular courses</h2>
          <p className="mt-3 text-text-muted">Start with what fits your goals right now.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <div
              key={c.title}
              className="overflow-hidden rounded-2xl border border-[#E9F1FA] bg-white transition-all hover:-translate-y-1.5 hover:shadow-[0_16px_30px_rgba(30,95,168,0.1)]"
            >
              <div className="h-28 bg-gradient-to-br from-accent to-primary" />
              <div className="p-5">
                <div className="mb-1.5 text-xs font-semibold text-primary">{c.tag}</div>
                <h3 className="mb-2 text-[17px] font-semibold">{c.title}</h3>
                <p className="mb-3.5 text-sm text-text-muted">{c.desc}</p>
                <a href="#contact" className="text-sm font-semibold text-primary">
                  View course →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
