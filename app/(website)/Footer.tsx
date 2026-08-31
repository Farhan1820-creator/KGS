import Image from "next/image";
import Link from "next/link";
import { GraduationCap, MapPin, Phone, Clock } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#E5EEF8] bg-white px-5 pt-14 pb-8 md:px-6 md:pt-16 text-slate-700">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 pb-12 border-b border-slate-100">
          {/* Brand Col (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="https://res.cloudinary.com/dggey8rb6/image/upload/v1787375492/logo.png"
                alt="The Learnex Academy Crest Logo"
                width={38}
                height={38}
                className="rounded-full"
              />
              <div>
                <span className="font-display text-lg font-bold text-foreground block">
                  The Learnex Academy
                </span>
                <span className="text-[11px] font-semibold text-primary block">
                  &ldquo;Learn, Evolve, Excel&rdquo;
                </span>
              </div>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed">
              Join a dynamic learning community with expert teachers and modern facilities. We empower every student with the knowledge, skills, and character for lifelong success.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
              >
                <GraduationCap className="h-4 w-4" />
                Access Student & Parent Portal
              </Link>
            </div>
          </div>

          {/* Programs Col (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold tracking-wider text-foreground uppercase">
              Academic Tracks
            </h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li>
                <a href="#courses" className="hover:text-primary transition-colors">
                  Morning Early Foundation (PG–10th)
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-primary transition-colors">
                  Cambridge O Level / IGCSE
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-primary transition-colors">
                  FSc / ICS / I.Com Intermediate
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-primary transition-colors">
                  CA Subjects (Accounting / PRC)
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-primary transition-colors">
                  Canva Designing Masterclass
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-primary transition-colors">
                  MS Office Suite Course
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-primary transition-colors">
                  AI Presentation & English Classes
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold tracking-wider text-foreground uppercase">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li>
                <a href="#why" className="hover:text-primary transition-colors">
                  Why Learnex
                </a>
              </li>
              <li>
                <a href="#life-at-learnex" className="hover:text-primary transition-colors">
                  Life at Learnex
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-primary transition-colors">
                  Admissions FAQ
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-primary transition-colors">
                  Multan Campuses
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Portal Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Campus Info (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold tracking-wider text-foreground uppercase">
              Multan Campuses
            </h4>
            <div className="space-y-3 text-xs text-text-muted leading-relaxed">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block">Branch #1:</strong>
                  Near Bloomfield Hall Junior School, Model Town Branch, Multan
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block">Branch #2:</strong>
                  Jatoi Street, Near Model Town T-Chowk, Multan
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                <a href="tel:+923166581934" className="font-bold text-foreground hover:text-primary">
                  0316-6581934
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Mon – Sat: 8:00 AM – 9:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col items-center justify-between gap-4 text-xs text-text-muted sm:flex-row">
          <p>© {currentYear} The Learnex Academy Multan. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#courses" className="hover:text-primary transition-colors">
              Programs
            </a>
            <a href="#faq" className="hover:text-primary transition-colors">
              FAQs
            </a>
            <a href="#contact" className="hover:text-primary transition-colors">
              Admissions: 0316-6581934
            </a>
            <Link href="/login" className="hover:text-primary transition-colors">
              Student Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
