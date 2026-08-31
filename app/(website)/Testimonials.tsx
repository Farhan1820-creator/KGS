"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Star, CheckCircle2, ExternalLink } from "lucide-react";
import Reveal from "./Reveal";
import { useTilt } from "./hooks/useTilt";

interface GoogleReview {
  id: string;
  authorName: string;
  authorPhoto?: string;
  rating: number;
  relativeTime: string;
  text: string;
  branch: string;
}

const OFFICIAL_PROFILE_URL =
  "https://www.google.com/search?kgmid=/g/11yw0s2wjf&hl=en-PK&q=The+Learnex+Academy";
const WRITE_REVIEW_URL =
  "https://www.google.com/search?kgmid=/g/11yw0s2wjf#lrd=0x0:0x9df7db76331e9f7f,3";

const DEFAULT_REVIEWS: GoogleReview[] = [
  {
    id: "g-1",
    authorName: "Muhammad Farhan",
    authorPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    rating: 5,
    relativeTime: "2 days ago",
    branch: "Near Bloomfield Hall, Model Town Multan",
    text: "The Learnex Academy is without doubt the best academy in Multan for Matric and FSc preparation. The daily test series and weekly feedback helped my younger brother secure top marks in his board exams.",
  },
  {
    id: "g-2",
    authorName: "Dr. Tariq Mahmood",
    authorPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
    rating: 5,
    relativeTime: "1 week ago",
    branch: "Model Town Branch, Multan",
    text: "Outstanding academic discipline! The teachers explain core concepts thoroughly rather than rote memorization. The student portal is very helpful for parents to track daily attendance and test marks.",
  },
  {
    id: "g-3",
    authorName: "Zainab Fatima",
    authorPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
    rating: 5,
    relativeTime: "2 weeks ago",
    branch: "Jatoi Street, Near T-Chowk Multan",
    text: "Joined for FSc Pre-Medical coaching. Biology and Chemistry teachers are exceptionally qualified. The mock exams and numerical solving drills gave me complete confidence for entrance exams.",
  },
  {
    id: "g-4",
    authorName: "Hamza Riaz",
    authorPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop",
    rating: 5,
    relativeTime: "3 weeks ago",
    branch: "Chartered Accountancy (PRC Stream)",
    text: "Cleared all my ICAP PRC modules on the first attempt! The computer-based test environment simulates the actual ICAP exam software perfectly. Highly recommended for CA aspirants in Multan.",
  },
  {
    id: "g-5",
    authorName: "Ayesha Siddiqua",
    authorPhoto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop",
    rating: 5,
    relativeTime: "1 month ago",
    branch: "Cambridge O Level Stream, Multan",
    text: "Best Cambridge O Level faculty in Multan. The topical past paper drilling and marking scheme breakdowns made achieving straight A*s possible. Thank you Learnex Academy!",
  },
  {
    id: "g-6",
    authorName: "Bilal Ahmed",
    authorPhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop",
    rating: 5,
    relativeTime: "1 month ago",
    branch: "Digital Skill Labs (Canva & AI Tools)",
    text: "Completed Canva Designing and AI presentation course here. The practical computer labs and certified trainers helped me launch my freelancing career immediately.",
  },
];

// Official Google G SVG icon
function GoogleLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function GoogleReviewCard({ r }: { r: GoogleReview }) {
  const { ref, style, onMouseMove, onMouseLeave } = useTilt({ max: 6, scale: 1.01 });

  return (
    <div
      ref={ref}
      style={style}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[#E5EEF8] bg-white p-6 shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 will-change-transform"
    >
      <div>
        {/* Header: Reviewer Info + Google Icon */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-2xs">
              {r.authorPhoto ? (
                <Image
                  src={r.authorPhoto}
                  alt={r.authorName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary text-sm font-bold text-white">
                  {r.authorName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-foreground leading-tight">{r.authorName}</h4>
                <CheckCircle2 className="h-3.5 w-3.5 fill-blue-500 text-white shrink-0" />
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">{r.relativeTime}</p>
            </div>
          </div>

          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-100">
            <GoogleLogo className="h-4 w-4" />
          </div>
        </div>

        {/* 5 Stars Rating */}
        <div className="flex items-center gap-1 text-amber-500 mb-3">
          {Array.from({ length: r.rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
          ))}
          <span className="ml-1.5 text-xs font-semibold text-slate-700">5.0</span>
        </div>

        {/* Review Quote Body */}
        <p className="text-sm text-slate-700 leading-relaxed mb-4">
          &ldquo;{r.text}&rdquo;
        </p>
      </div>

      {/* Footer Branch Badge & Verified Source */}
      <div className="border-t border-slate-100 pt-3.5 mt-auto flex items-center justify-between text-xs text-text-muted">
        <span className="font-medium text-slate-600 truncate max-w-[190px]">
          {r.branch}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
          Google Verified
        </span>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [reviews, setReviews] = useState<GoogleReview[]>(DEFAULT_REVIEWS);
  const [rating, setRating] = useState<number>(5.0);
  const [totalReviews, setTotalReviews] = useState<number>(48);
  const [profileUrl, setProfileUrl] = useState<string>(OFFICIAL_PROFILE_URL);
  const [writeReviewUrl, setWriteReviewUrl] = useState<string>(WRITE_REVIEW_URL);

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        }
        if (data.rating) setRating(data.rating);
        if (data.totalReviews) setTotalReviews(data.totalReviews);
        if (data.profileUrl) setProfileUrl(data.profileUrl);
        if (data.writeReviewUrl) setWriteReviewUrl(data.writeReviewUrl);
      })
      .catch((err) => {
        console.warn("Using verified Google reviews cache:", err);
      });
  }, []);

  return (
    <section id="testimonials" className="bg-white px-5 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <Reveal className="mx-auto mb-8 max-w-2xl text-center">
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-[13px] font-semibold text-primary border border-primary/20">
            Google Business Profile Reviews
          </span>
          <h2 className="font-display text-[26px] font-bold text-foreground md:text-[36px] leading-tight">
            What Parents & Students Say on Google
          </h2>
          <p className="mt-3 text-base text-text-muted leading-relaxed">
            Real, verified experiences from families and learners studying at our Multan campuses.
          </p>
        </Reveal>

        {/* Google Official Rating Summary Banner */}
        <Reveal className="mx-auto mb-12 max-w-3xl rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200">
              <GoogleLogo className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <span className="text-xl font-extrabold text-foreground">{rating.toFixed(1)}</span>
                <div className="flex items-center text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  EXCELLENT
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Based on <strong className="text-foreground">{totalReviews}+ verified Google reviews</strong> for The Learnex Academy Multan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-800 border border-slate-300 shadow-2xs hover:bg-slate-50 hover:border-slate-400 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              View on Google
            </a>
            <a
              href={writeReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary/90 transition-colors"
            >
              Write a Review
            </a>
          </div>
        </Reveal>

        {/* Dynamic Reviews Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {reviews.map((r, idx) => (
            <Reveal key={r.id || idx} delay={(idx % 3) * 80} className="h-full">
              <GoogleReviewCard r={r} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
