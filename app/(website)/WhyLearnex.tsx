import { 
  GraduationCap, 
  BookCheck, 
  Lightbulb, 
  TrendingUp, 
  Users2, 
  Laptop
} from "lucide-react";

const reasons = [
  {
    icon: GraduationCap,
    title: "Complete Academic Spectrum",
    desc: "Seamless education from Class PG–Matric, O Level, College Intermediate (FSc, ICom, ICS), up to University Bachelors and CA (PRC).",
  },
  {
    icon: Users2,
    title: "Expert Subject Specialists",
    desc: "Qualified and dedicated instructors specialized in Board, Cambridge, ICAP (CA), and University exam standards.",
  },
  {
    icon: Laptop,
    title: "Practical In-Demand Skills",
    desc: "Dedicated hands-on short courses in Canva Graphic Design and MS Office (Excel, Word, PowerPoint) for digital proficiency.",
  },
  {
    icon: BookCheck,
    title: "Rigorous Test & Mock Sessions",
    desc: "Weekly chapter assessments, past-paper drills, and full-length exam simulations with detailed feedback.",
  },
  {
    icon: Lightbulb,
    title: "Conceptual Clarity First",
    desc: "Focus on understanding core fundamentals rather than rote memorization, ensuring high academic and entrance test performance.",
  },
  {
    icon: TrendingUp,
    title: "Tracked Student Progress",
    desc: "Continuous evaluation, transparent performance reporting, and dedicated mentorship for every student's growth.",
  },
];

export default function WhyLearnex() {
  return (
    <section id="why" className="bg-white px-5 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-[13px] font-semibold text-primary">
            Why Choose Us
          </span>
          <h2 className="font-display text-[26px] font-bold text-foreground md:text-[34px]">
            Built for Serious Academic & Skill Achievement
          </h2>
          <p className="mt-3 text-text-muted">
            From foundational school education to professional qualifications and digital software mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.title}
                className="group rounded-2xl bg-bg-soft/70 p-7 border border-[#E5EEF8] shadow-md shadow-slate-200/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/15 hover:border-primary hover:bg-white"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary shadow-xs border border-[#E5EEF8] group-hover:border-primary/30 group-hover:bg-primary group-hover:text-white transition-all">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {r.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">{r.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
