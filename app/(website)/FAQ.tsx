"use client";

import { useState } from "react";
import { ChevronDown, MessageSquareQuote } from "lucide-react";
import { cn } from "@/lib/utils";
import Reveal from "./Reveal";
import { DEFAULT_FAQS, type FAQItem } from "@/lib/sanity/queries";

export default function FAQ({ initialFaqs }: { initialFaqs?: FAQItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = initialFaqs && initialFaqs.length > 0 ? initialFaqs : DEFAULT_FAQS;

  const toggleFAQ = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="bg-white px-5 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-4xl">
        {/* Section Header */}
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-[13px] font-semibold text-primary">
            Frequently Asked Questions
          </span>
          <h2 className="font-display text-[26px] font-bold text-foreground md:text-[36px] leading-tight">
            Clear Answers to Help You Choose with Confidence
          </h2>
          <p className="mt-3.5 text-base text-text-muted leading-relaxed">
            Have questions regarding our Multan branches, Morning Early Foundation classes, test sessions, or courses? We have you covered.
          </p>
        </Reveal>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <Reveal key={idx} delay={idx * 60}>
                <div
                  className={cn(
                    "overflow-hidden rounded-2xl border transition-all duration-300 bg-white",
                    isOpen
                      ? "border-primary/50 shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                      : "border-[#E5EEF8] hover:border-primary/30 hover:shadow-xs"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleFAQ(idx)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors sm:p-6 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 flex-1">
                      <span className="flex-shrink-0 text-base sm:text-xl font-extrabold text-primary">
                        {String(idx + 1).padStart(2, "0")}.
                      </span>
                      <span className="text-base font-semibold text-foreground sm:text-lg leading-snug">
                        {faq.question}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300",
                        isOpen
                          ? "rotate-180 bg-primary text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </button>

                  <div
                    id={`faq-answer-${idx}`}
                    className={cn(
                      "grid transition-all duration-300 ease-in-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-slate-100 bg-slate-50/50 px-5 pb-6 pt-4 text-sm text-slate-700 leading-relaxed sm:px-6 sm:text-[15px] pl-11 sm:pl-14">
                        <p>{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Reassurance Prompt */}
        <Reveal className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center">
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <MessageSquareQuote className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950 sm:text-base">
                  Have more questions or need fee details?
                </h4>
                <p className="text-xs text-emerald-800 sm:text-sm">
                  Our Multan academic counselors are ready to help you on WhatsApp.
                </p>
              </div>
            </div>
            <a
              href="https://wa.me/923166581934?text=Hello%20The%20Learnex%20Academy%2C%20I%20have%20questions%20regarding%20Admissions."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors sm:text-sm"
            >
              WhatsApp: 0316-6581934
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
