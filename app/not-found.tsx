import Link from "next/link";
import { ArrowLeft, BookOpen, GraduationCap, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFCFF] px-5 py-16 text-center">
      <div className="mx-auto max-w-lg rounded-3xl border border-[#E5EEF8] bg-white p-8 sm:p-12 shadow-xl shadow-slate-200/50">
        <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold tracking-wider text-primary uppercase">
          Error 404 — Page Not Found
        </span>
        <h1 className="font-display mt-4 text-3xl font-bold text-foreground sm:text-4xl">
          Looks like this page took a study break!
        </h1>
        <p className="mt-3 text-sm text-text-muted sm:text-base leading-relaxed">
          The page you are looking for might have been moved, renamed, or is temporarily unavailable. Let us help you find what you need.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5"
          >
            Back to Homepage
          </Link>
          <Link
            href="/#courses"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-bg-soft hover:text-primary"
          >
            Browse Courses
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            Student Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
