"use client";

import { useState } from "react";
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  Palette, 
  FileSpreadsheet, 
  Briefcase, 
  CheckCircle2, 
  ArrowRight,
  School,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

type Category = "All" | "School & O Level" | "Intermediate" | "University & CA" | "Skill Courses";

const categories: Category[] = [
  "All",
  "School & O Level",
  "Intermediate",
  "University & CA",
  "Skill Courses",
];

const programs = [
  {
    category: "School & O Level" as Category,
    badge: "Class PG – 10th",
    tag: "SCHOOL SECTION",
    title: "Class PG to Matric",
    subtitle: "Playgroup, Primary, Middle & Matriculation",
    desc: "Strong conceptual foundations for junior grades, plus rigorous Board examination preparation for 9th and 10th (Matric Science & Arts).",
    icon: School,
    gradient: "from-emerald-500 to-teal-700",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    features: [
      "Concept-building & active tutoring",
      "Regular testing & Board mock papers",
      "Science, Maths, English & Urdu coaching",
      "Individual student progress monitoring",
    ],
  },
  {
    category: "School & O Level" as Category,
    badge: "Cambridge System",
    tag: "INTERNATIONAL STREAM",
    title: "O Level / IGCSE",
    subtitle: "Cambridge Assessment International Education",
    desc: "Structured Cambridge syllabus coverage with an emphasis on analytical understanding, past paper practice, and official marking schemes.",
    icon: BookOpen,
    gradient: "from-blue-600 to-indigo-700",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    features: [
      "Physics, Chemistry, Biology & Maths",
      "Urdu, Islamiat & Pakistan Studies",
      "Extensive yearly & topical past paper practice",
      "Expert Cambridge-certified faculty",
    ],
  },
  {
    category: "Intermediate" as Category,
    badge: "HSSC College",
    tag: "COLLEGE SECTION",
    title: "FSc (Pre-Med & Pre-Eng)",
    subtitle: "11th & 12th Grade (Intermediate Science)",
    desc: "High-yield preparation for Board exams with conceptual depth to build a strong foundation for medical (MDCAT) and engineering (ECAT) admissions.",
    icon: GraduationCap,
    gradient: "from-indigo-600 to-violet-700",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    features: [
      "Specialized Pre-Medical & Pre-Engineering faculties",
      "Rigorous numerical, formula & theory drills",
      "Chapter-wise tests and full-length board mocks",
      "Concept-to-exam mapping techniques",
    ],
  },
  {
    category: "Intermediate" as Category,
    badge: "HSSC College",
    tag: "COLLEGE SECTION",
    title: "ICS & I.Com",
    subtitle: "Computer Science & Commerce Streams",
    desc: "Comprehensive coaching for Intermediate in Computer Science (ICS) and Commerce (I.Com) with practical application and exam mastery.",
    icon: Building2,
    gradient: "from-cyan-600 to-blue-700",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    features: [
      "ICS: Computer Science, Mathematics, Stats/Physics",
      "I.Com: Principles of Accounting, Banking, Economics",
      "Hands-on computing & financial record drills",
      "Exam revision notes & test sessions",
    ],
  },
  {
    category: "University & CA" as Category,
    badge: "University Level",
    tag: "HIGHER EDUCATION",
    title: "Bachelor Degree Students",
    subtitle: "Undergraduate Tutoring & Exam Prep",
    desc: "Academic support, semester exam preparation, and conceptual tutoring for BS, BBA, B.Com, Computer Science, and IT undergraduate students.",
    icon: Award,
    gradient: "from-amber-500 to-orange-600",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    features: [
      "Semester exam syllabus coverage",
      "Core computing, business & science courses",
      "Assignment, project & conceptual guidance",
      "Flexible schedule tailored for uni students",
    ],
  },
  {
    category: "University & CA" as Category,
    badge: "ICAP Certification",
    tag: "CHARTERED ACCOUNTANCY",
    title: "CA — PRC (All Modules)",
    subtitle: "Pre-Requisite Competency for CA",
    desc: "Complete coaching for ICAP PRC examinations: PRC-1 Business Writing, PRC-2 Quantitative Methods, PRC-3 Accounting, PRC-4 Economics, PRC-5 IBF.",
    icon: Briefcase,
    gradient: "from-rose-600 to-red-700",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    features: [
      "Complete coverage of all 5 PRC modules",
      "Senior CA educators with proven pass rates",
      "Computer-based mock testing environment",
      "Intensive conceptual drilling and Q&A",
    ],
  },
  {
    category: "Skill Courses" as Category,
    badge: "Short Course",
    tag: "CREATIVE & DIGITAL SKILLS",
    title: "Canva Graphic Design Course",
    subtitle: "Professional Graphics, Branding & Social Media",
    desc: "Learn to design stunning social media posts, corporate presentations, logos, posters, thumbnails, and marketing banners like a pro.",
    icon: Palette,
    gradient: "from-fuchsia-600 to-pink-600",
    badgeColor: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    features: [
      "Social media post & reel graphics design",
      "Business branding, color palettes & typography",
      "YouTube thumbnails & event posters",
      "Hands-on portfolio creation & certification",
    ],
  },
  {
    category: "Skill Courses" as Category,
    badge: "Short Course",
    tag: "PRODUCTIVITY & OFFICE SKILLS",
    title: "MS Office Suite Course",
    subtitle: "Excel, Word, PowerPoint & Workplace Productivity",
    desc: "Master essential software for academic research, corporate documentation, data analysis, and high-impact presentations.",
    icon: FileSpreadsheet,
    gradient: "from-sky-600 to-blue-700",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    features: [
      "MS Excel: Formulas, Functions, Data Tables, Charts",
      "MS Word: Professional formatting & report writing",
      "MS PowerPoint: Engaging animated presentations",
      "Practical workplace projects & certification",
    ],
  },
];

export default function Courses() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const filteredPrograms =
    activeCategory === "All"
      ? programs
      : programs.filter((p) => p.category === activeCategory);

  return (
    <section id="courses" className="px-5 py-16 md:px-6 md:py-24 bg-[#FAFCFF]">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-[13px] font-semibold text-primary">
            Our Academic & Skill Programs
          </span>
          <h2 className="font-display text-[28px] font-bold text-foreground md:text-[38px] leading-tight">
            Comprehensive Education for Every Stage
          </h2>
          <p className="mt-3.5 text-base text-text-muted leading-relaxed">
            From early school years to university degrees, professional CA, and high-demand practical digital courses.
          </p>
        </div>

        {/* Category Filters */}
        <div className="mb-12 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer",
                activeCategory === cat
                  ? "bg-primary text-white shadow-md shadow-primary/25 scale-105"
                  : "bg-white text-text-muted border border-border/70 hover:border-primary/40 hover:text-primary hover:bg-bg-soft"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredPrograms.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E5EEF8] bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_35px_rgba(30,95,168,0.12)] hover:border-primary/40"
              >
                <div>
                  {/* Card Header Gradient Banner */}
                  <div className={cn("relative h-24 bg-gradient-to-r p-4 flex items-center justify-between text-white", p.gradient)}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-black/20 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold tracking-wide text-white border border-white/20">
                      {p.badge}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <div className="mb-1 text-[11px] font-bold tracking-wider text-primary uppercase">
                      {p.tag}
                    </div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mb-2.5">
                      {p.subtitle}
                    </p>
                    <p className="text-sm text-text-muted leading-relaxed mb-4">
                      {p.desc}
                    </p>

                    {/* Features List */}
                    <div className="space-y-2 border-t border-slate-100 pt-3.5 mb-4">
                      {p.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:gap-2 transition-all"
                  >
                    Enroll / Inquire Now
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
