import { sanityClient, isSanityConfigured } from "./client";
import { urlForImage } from "./image";

// ==========================================
// 1. HERO SLIDES
// ==========================================
export interface HeroSlideData {
  image: string;
  badge: string;
  title: string;
  desc: string;
  caption: string;
}

export const DEFAULT_HERO_SLIDES: HeroSlideData[] = [
  {
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop",
    badge: "ADMISSION OPEN — Multan Campuses",
    title: "Morning Early Foundation to Intermediate & CA",
    desc: "Join a dynamic learning community with expert teachers and modern facilities. We empower every student with knowledge, skills, and character.",
    caption: "Morning Early Foundation Classes",
  },
  {
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop",
    badge: "O Level & Intermediate (FSc / ICS / I.Com)",
    title: "Daily, Weekly & Monthly Testing Excellence",
    desc: "In-depth conceptual mastery for Cambridge O Level, FSc Pre-Medical & Pre-Engineering, ICS, and I.Com with disciplined progress tracking.",
    caption: "Cambridge & College Board Excellence",
  },
  {
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop",
    badge: "CA Subjects & ICAP PRC Coaching",
    title: "Accounting, Quantitative Methods & Economics",
    desc: "Rigorous exam preparation for ICAP Chartered Accountancy modules led by experienced professional accountants and educators.",
    caption: "Chartered Accountancy Coaching",
  },
  {
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2070&auto=format&fit=crop",
    badge: "Practical Digital & Communication Skills",
    title: "Canva, MS Office, AI Presentation & English",
    desc: "Hands-on masterclasses in Canva Graphic Design, Microsoft Office Suite, Modern AI Presentations, and Spoken English fluency.",
    caption: "Digital & Language Masterclasses",
  },
];

export async function fetchHeroSlides(): Promise<HeroSlideData[]> {
  if (!isSanityConfigured || !sanityClient) return DEFAULT_HERO_SLIDES;
  try {
    const query = `*[_type == "heroSlide"] | order(order asc) {
      _id,
      title,
      badge,
      desc,
      caption,
      image,
      "imageAssetUrl": image.asset->url,
      imageUrl
    }`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slides = await sanityClient.fetch<any[]>(query, {}, { next: { revalidate: 60 } });
    if (slides && slides.length > 0) {
      return slides.map((s, idx) => ({
        title: s.title || "",
        badge: s.badge || "ADMISSION OPEN",
        desc: s.desc || "",
        caption: s.caption || s.title || "",
        image:
          (s.image ? urlForImage(s.image) : null) ||
          s.imageAssetUrl ||
          s.imageUrl ||
          DEFAULT_HERO_SLIDES[idx % DEFAULT_HERO_SLIDES.length].image,
      }));
    }
  } catch (err) {
    console.warn("Sanity fetchHeroSlides failed, using fallback:", err);
  }
  return DEFAULT_HERO_SLIDES;
}

// ==========================================
// 2. WHY LEARNEX (USPS)
// ==========================================
export interface WhyLearnexItem {
  title: string;
  desc: string;
  iconName?: string;
}

export const DEFAULT_WHY_LEARNEX: WhyLearnexItem[] = [
  {
    title: "Daily, Weekly & Monthly Tests",
    desc: "Structured assessment routine with continuous evaluation, Board & Cambridge style mock exams, and instant parent feedback.",
    iconName: "ClipboardCheck",
  },
  {
    title: "Expert & Experienced Faculty",
    desc: "Qualified subject specialists dedicated to concept building and exam techniques across Board, Cambridge, and ICAP standards.",
    iconName: "Users2",
  },
  {
    title: "Professional Educators",
    desc: "Passionate mentors who provide individualized learning strategies to empower students for lifelong academic and career success.",
    iconName: "Award",
  },
  {
    title: "PG to Intermediate & CA Scope",
    desc: "Seamless learning ladder from Morning Early Foundation classes, O Level, and FSc/ICS/I.Com up to Chartered Accountancy (PRC).",
    iconName: "GraduationCap",
  },
  {
    title: "Practical AI & Digital Skills",
    desc: "Specialized labs for Canva Designing, Microsoft Office Suite, Modern AI Presentation Tools, and Spoken English fluency.",
    iconName: "Laptop",
  },
  {
    title: "Two Convenient Multan Branches",
    desc: "State-of-the-art campuses located near Bloomfield Hall Junior School and Jatoi Street near Model Town T-Chowk, Multan.",
    iconName: "Building",
  },
];

export async function fetchWhyLearnex(): Promise<WhyLearnexItem[]> {
  if (!isSanityConfigured || !sanityClient) return DEFAULT_WHY_LEARNEX;
  try {
    const query = `*[_type == "whyLearnex"] | order(order asc) {
      title,
      desc,
      iconName
    }`;
    const data = await sanityClient.fetch<WhyLearnexItem[]>(query, {}, { next: { revalidate: 60 } });
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn("Sanity fetchWhyLearnex failed, using fallback:", err);
  }
  return DEFAULT_WHY_LEARNEX;
}

// ==========================================
// 3. COURSES / PROGRAMS
// ==========================================
export interface CourseProgramItem {
  title: string;
  subtitle: string;
  category: "School & O Level" | "College & Intermediate" | "Professional CA" | "Digital & Skill Courses";
  badge: string;
  tag: string;
  desc: string;
  features: string[];
  gradient?: string;
  badgeColor?: string;
  iconName?: string;
}

export const DEFAULT_COURSES: CourseProgramItem[] = [
  {
    category: "School & O Level",
    badge: "Morning Foundation",
    tag: "EARLY & SCHOOL SECTION",
    title: "PG to Intermediate & Matric",
    subtitle: "Morning Early Foundation Classes & Junior School",
    desc: "Nurturing conceptual clarity from Playgroup through primary, middle, and 9th/10th Board examinations with daily, weekly, and monthly tests.",
    iconName: "School",
    gradient: "from-emerald-500 to-teal-700",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    features: [
      "Morning Early Foundation Classes",
      "Conceptual learning & active memory drills",
      "Daily, Weekly & Monthly progress test sessions",
      "Science, Maths, English & Urdu specialized coaching",
    ],
  },
  {
    category: "School & O Level",
    badge: "Cambridge Stream",
    tag: "INTERNATIONAL CURRICULUM",
    title: "O Level / IGCSE",
    subtitle: "Cambridge International Education",
    desc: "Analytical syllabus coverage, extensive yearly/topical past-paper practice, and marking-scheme mastery led by Cambridge certified educators.",
    iconName: "BookOpen",
    gradient: "from-blue-600 to-indigo-700",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    features: [
      "Physics, Chemistry, Biology & Maths",
      "Pakistan Studies, Islamiat & Urdu",
      "Yearly & topical past-paper drilling",
      "Experienced Cambridge faculty",
    ],
  },
  {
    category: "College & Intermediate",
    badge: "College Stream",
    tag: "INTERMEDIATE COLLEGE",
    title: "FSc (Pre-Medical & Pre-Engineering)",
    subtitle: "11th & 12th Intermediate Science",
    desc: "High-yield Board preparation, conceptual physics, chemistry, biology, and maths coaching with full-length mock exams.",
    iconName: "GraduationCap",
    gradient: "from-indigo-600 to-violet-700",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    features: [
      "Pre-Med & Pre-Eng specialist teachers",
      "Formula & numerical mastery drills",
      "Chapter-wise and full-length Board mocks",
      "Entrance test foundations",
    ],
  },
  {
    category: "College & Intermediate",
    badge: "College Stream",
    tag: "INTERMEDIATE COLLEGE",
    title: "ICS & I.Com",
    subtitle: "Computer Science & Commerce Streams",
    desc: "Comprehensive coaching for ICS (Computer Science, Maths, Physics/Stats) and I.Com (Principles of Accounting, Banking, Economics).",
    iconName: "Building2",
    gradient: "from-cyan-600 to-blue-700",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    features: [
      "ICS: Programming, Logic Building, Computing Labs",
      "I.Com: Financial Accounting & Business Economics",
      "Board paper presentation & revision techniques",
      "Regular testing & parent feedback",
    ],
  },
  {
    category: "Professional CA",
    badge: "ICAP Professional",
    tag: "CHARTERED ACCOUNTANCY",
    title: "CA Subjects & PRC Modules",
    subtitle: "Accounting, Quantitative, Economics, Business",
    desc: "Complete coaching for ICAP PRC exams: Principles of Accounting, Quantitative Methods, Introduction to Economics, and Business Writing.",
    iconName: "Briefcase",
    gradient: "from-rose-600 to-red-700",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    features: [
      "Principles of Accounting & Finance",
      "Quantitative Methods & Statistics",
      "Business Writing & Economics",
      "Computer-based mock exams for ICAP test environment",
    ],
  },
  {
    category: "Digital & Skill Courses",
    badge: "Creative Skill",
    tag: "GRAPHIC DESIGN",
    title: "Canva Designing Masterclass",
    subtitle: "Branding, Social Media Creatives & Freelancing",
    desc: "Master Canva from scratch: create professional logos, social media posters, YouTube thumbnails, client branding decks, and marketing assets.",
    iconName: "Palette",
    gradient: "from-fuchsia-600 to-pink-600",
    badgeColor: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    features: [
      "Social media post & reel graphics",
      "Brand kits, color palettes & typography",
      "Marketing posters & event banners",
      "Hands-on portfolio creation & certification",
    ],
  },
  {
    category: "Digital & Skill Courses",
    badge: "Productivity Skill",
    tag: "OFFICE TOOLS",
    title: "MS Office Suite Course",
    subtitle: "Excel, Word, PowerPoint Mastery",
    desc: "Hands-on mastery of Advanced Excel (Formulas, Pivot Tables, Dashboards), professional Word report styling, and animated PowerPoint presentations.",
    iconName: "FileSpreadsheet",
    gradient: "from-sky-600 to-blue-700",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    features: [
      "MS Excel: Formulas, Functions, Pivot Tables & Charts",
      "MS Word: Corporate formatting & thesis styling",
      "MS PowerPoint: Executive pitch presentations",
      "Practical project evaluation & certification",
    ],
  },
  {
    category: "Digital & Skill Courses",
    badge: "Modern AI Skill",
    tag: "AI & SMART PRODUCTIVITY",
    title: "AI Presentation & Smart Tools",
    subtitle: "Generative AI Decks, Prompting & Next-Gen Presenting",
    desc: "Learn to build high-impact presentations in minutes using cutting-edge AI presentation tools, smart prompt engineering, and visual automation.",
    iconName: "Laptop",
    gradient: "from-violet-600 to-purple-700",
    badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
    features: [
      "AI presentation generators & prompt crafting",
      "Visual storytelling with AI imagery",
      "Fast-track deck creation for students & professionals",
      "Interactive presenting techniques",
    ],
  },
  {
    category: "Digital & Skill Courses",
    badge: "Communication Skill",
    tag: "LANGUAGE & FLUENCY",
    title: "English Classes (Spoken & Functional)",
    subtitle: "Grammar, Fluency, Vocabulary & Confidence",
    desc: "Build strong spoken fluency, master everyday conversational grammar, enhance writing skills, and gain confidence for interviews and exams.",
    iconName: "Languages",
    gradient: "from-teal-600 to-emerald-700",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    features: [
      "Spoken English fluency & pronunciation",
      "Grammar foundation & sentence structure",
      "Public speaking & stage confidence drills",
      "Interactive group discussions & role-plays",
    ],
  },
];

export async function fetchCourses(): Promise<CourseProgramItem[]> {
  if (!isSanityConfigured || !sanityClient) return DEFAULT_COURSES;
  try {
    const query = `*[_type == "course"] | order(order asc) {
      title,
      subtitle,
      category,
      badge,
      tag,
      desc,
      features,
      gradient,
      badgeColor,
      iconName
    }`;
    const data = await sanityClient.fetch<CourseProgramItem[]>(query, {}, { next: { revalidate: 60 } });
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn("Sanity fetchCourses failed, using fallback:", err);
  }
  return DEFAULT_COURSES;
}

// ==========================================
// 4. STATS COUNTERS
// ==========================================
export interface StatItem {
  value: string;
  label: string;
}

export const DEFAULT_STATS: StatItem[] = [
  { value: "PG – Intermediate", label: "Early Foundation to College & CA" },
  { value: "Daily, Weekly, Monthly", label: "Disciplined Testing System" },
  { value: "Expert Faculty", label: "Professional Subject Specialists" },
  { value: "2 Branches in Multan", label: "Model Town & T-Chowk Campuses" },
];

export async function fetchStats(): Promise<StatItem[]> {
  if (!isSanityConfigured || !sanityClient) return DEFAULT_STATS;
  try {
    const query = `*[_type == "stat"] | order(order asc) {
      value,
      label
    }`;
    const data = await sanityClient.fetch<StatItem[]>(query, {}, { next: { revalidate: 60 } });
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn("Sanity fetchStats failed, using fallback:", err);
  }
  return DEFAULT_STATS;
}

// ==========================================
// 5. FAQS
// ==========================================
export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

export const DEFAULT_FAQS: FAQItem[] = [
  {
    category: "Multan Campuses",
    question: "Where are The Learnex Academy branches located in Multan?",
    answer:
      "We have two prime campuses in Multan: Branch #1 is located Near Bloomfield Hall Junior School Model Town Branch, Multan. Branch #2 is located at Jatoi Street Near Model Town T-Chowk, Multan.",
  },
  {
    category: "Admissions & Programs",
    question: "What classes and programs are open for admission?",
    answer:
      "Admissions are open for Morning Early Foundation Classes (PG to Intermediate), Cambridge O Level, College Intermediate (FSc Pre-Medical, Pre-Engineering, ICS, I.Com), CA Subjects (Accounting, Quantitative Methods, Economics, Business), along with practical short courses in Canva Designing, MS Office Suite, AI Presentation, and Spoken English.",
  },
  {
    category: "Testing & Evaluation",
    question: "How does the Daily, Weekly & Monthly test system work?",
    answer:
      "We follow a disciplined testing methodology comprising daily conceptual checks, weekly chapter assessments, and full-length monthly Board/Cambridge simulation exams. Test marks and attendance are updated on our student portal for transparent parent monitoring.",
  },
  {
    category: "Morning Foundation",
    question: "What are Morning Early Foundation Classes?",
    answer:
      "Morning Early Foundation Classes are designed for early learners from Playgroup to junior grades. Our expert educators focus on foundational cognitive skills, handwriting, mathematics concepts, phonics, and language fluency in a nurturing environment.",
  },
  {
    category: "Professional CA",
    question: "How do you prepare students for ICAP CA (PRC) subjects?",
    answer:
      "Our CA faculty includes qualified professionals teaching Principles of Accounting, Quantitative Methods, Business Writing, and Economics. We provide computer-based mock exams simulating the real ICAP examination software.",
  },
  {
    category: "Skills & Spoken English",
    question: "Are certificates provided for Canva, MS Office, AI Presentation & English classes?",
    answer:
      "Yes! Students receive verified certificates upon course completion along with practical portfolios ready for academic presentations, freelance work, or workplace tasks.",
  },
];

export async function fetchFAQs(): Promise<FAQItem[]> {
  if (!isSanityConfigured || !sanityClient) return DEFAULT_FAQS;
  try {
    const query = `*[_type == "faq"] | order(order asc) {
      question,
      answer,
      category
    }`;
    const data = await sanityClient.fetch<FAQItem[]>(query, {}, { next: { revalidate: 60 } });
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn("Sanity fetchFAQs failed, using fallback:", err);
  }
  return DEFAULT_FAQS;
}

// ==========================================
// 6. LIFE AT LEARNEX (CAMPUS GALLERY)
// ==========================================
export interface LifeAtLearnexItem {
  image: string;
  caption: string;
}

export const DEFAULT_LIFE_AT_LEARNEX: LifeAtLearnexItem[] = [
  {
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop",
    caption: "Focused classroom learning",
  },
  {
    image: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?q=80&w=2070&auto=format&fit=crop",
    caption: "Hands-on digital skill labs",
  },
  {
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2070&auto=format&fit=crop",
    caption: "Disciplined test environment",
  },
  {
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2069&auto=format&fit=crop",
    caption: "Collaborative student life",
  },
  {
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop",
    caption: "Dedicated faculty support",
  },
];

export async function fetchLifeAtLearnex(): Promise<LifeAtLearnexItem[]> {
  if (!isSanityConfigured || !sanityClient) return DEFAULT_LIFE_AT_LEARNEX;
  try {
    const query = `*[_type == "lifeAtLearnex"] | order(order asc) {
      _id,
      caption,
      image,
      "imageAssetUrl": image.asset->url,
      imageUrl
    }`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = await sanityClient.fetch<any[]>(query, {}, { next: { revalidate: 60 } });
    if (items && items.length > 0) {
      return items.map((it, idx) => ({
        caption: it.caption || "",
        image:
          (it.image ? urlForImage(it.image) : null) ||
          it.imageAssetUrl ||
          it.imageUrl ||
          DEFAULT_LIFE_AT_LEARNEX[idx % DEFAULT_LIFE_AT_LEARNEX.length].image,
      }));
    }
  } catch (err) {
    console.warn("Sanity fetchLifeAtLearnex failed, using fallback:", err);
  }
  return DEFAULT_LIFE_AT_LEARNEX;
}

