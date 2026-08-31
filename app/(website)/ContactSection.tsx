"use client";

import { useState } from "react";
import {
  MapPin,
  Phone,
  Clock,
  Send,
  MessageCircle,
  CheckCircle2,
  Building,
} from "lucide-react";
import Reveal from "./Reveal";

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    branch: "Branch #1 (Near Bloomfield Hall Junior School, Model Town, Multan)",
    course: "Morning Early Foundation Classes (PG - 10th)",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const whatsappText = `*Admission Inquiry - The Learnex Academy Multan*%0A%0A*Name:* ${formData.name}%0A*Phone:* ${formData.phone}%0A*Selected Branch:* ${formData.branch}%0A*Course / Program:* ${formData.course}%0A*Message / Question:* ${formData.message || "Please provide admission and fee details."}`;
    const whatsappUrl = `https://wa.me/923166581934?text=${whatsappText}`;

    window.open(whatsappUrl, "_blank");
    setSubmitted(true);
  };

  return (
    <section id="contact" className="bg-white px-5 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-[13px] font-semibold text-primary border border-primary/20">
            ADMISSION OPEN — Morning Early Foundation & Regular Classes
          </span>
          <h2 className="font-display text-[26px] font-bold text-foreground md:text-[36px] leading-tight">
            Visit Our Multan Campuses or Connect Directly
          </h2>
          <p className="mt-3.5 text-base text-text-muted leading-relaxed">
            Call or WhatsApp us at <strong className="text-foreground">0316-6581934</strong> or visit either of our two convenient Model Town branches in Multan.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-stretch">
          {/* Multan Campuses Info (5 Cols) */}
          <Reveal className="lg:col-span-5 h-full">
            <div className="h-full flex flex-col justify-between rounded-3xl border border-[#E5EEF8] bg-white p-6 sm:p-8 shadow-sm">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Our Multan Branches
                </h3>

                <div className="space-y-6">
                  {/* Branch 1 */}
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-1">
                      <MapPin className="h-4 w-4 text-primary" />
                      Branch #1 (Model Town)
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      Near Bloomfield Hall Junior School
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">
                      Model Town Branch, Multan
                    </p>
                  </div>

                  {/* Branch 2 */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      <MapPin className="h-4 w-4 text-slate-700" />
                      Branch #2 (T-Chowk)
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      Jatoi Street, Near Model Town T-Chowk
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">
                      Model Town, Multan
                    </p>
                  </div>

                  {/* Direct Helpline */}
                  <div className="flex items-start gap-3.5 pt-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-muted uppercase">Official Call / WhatsApp Helpline</h4>
                      <a
                        href="tel:+923166581934"
                        className="text-base font-extrabold text-foreground hover:text-primary transition-colors"
                      >
                        0316-6581934
                      </a>
                    </div>
                  </div>

                  {/* Timings */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-muted uppercase">Classes & Office Timings</h4>
                      <p className="text-xs text-text-muted mt-0.5">
                        Morning Early Foundation & Evening Batches
                      </p>
                      <p className="text-xs font-semibold text-foreground">
                        Monday – Saturday: 8:00 AM – 9:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Action Button */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <a
                  href="https://wa.me/923166581934?text=Hello%20The%20Learnex%20Academy%20Multan%2C%20I%20would%20like%20information%20regarding%20Admissions%20and%20Courses."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2.5 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp Direct: 0316-6581934
                </a>
              </div>
            </div>
          </Reveal>

          {/* Inquiry / Booking Form (7 Cols) */}
          <Reveal className="lg:col-span-7 h-full">
            <div className="h-full flex flex-col justify-between rounded-3xl border border-[#E5EEF8] bg-white p-6 sm:p-10 shadow-sm">
              <div>
                <span className="inline-block rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary border border-primary/20 mb-2">
                  Fast-Track Admission Desk
                </span>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                  Book a Free Demo Class or Counseling
                </h3>
                <p className="text-sm text-text-muted mb-6">
                  Fill in your details to secure your seat. Our Multan admissions team will promptly guide you.
                </p>

                {submitted ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center animate-in fade-in-0 duration-300">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h4 className="text-lg font-bold text-emerald-950">Inquiry Sent via WhatsApp!</h4>
                    <p className="mt-1 text-sm text-emerald-800">
                      Your details have been routed to our Multan Admissions Team. We will contact you shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="mt-4 inline-block text-xs font-semibold text-emerald-800 underline hover:text-emerald-950 cursor-pointer"
                    >
                      Submit another inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="student-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Student / Parent Name *
                        </label>
                        <input
                          id="student-name"
                          type="text"
                          required
                          placeholder="e.g. Muhammad Ali"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full rounded-xl border border-border/80 bg-slate-50/50 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div>
                        <label htmlFor="student-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                          WhatsApp Number *
                        </label>
                        <input
                          id="student-phone"
                          type="tel"
                          required
                          placeholder="e.g. 0316 6581934"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full rounded-xl border border-border/80 bg-slate-50/50 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="branch-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Select Multan Branch *
                        </label>
                        <select
                          id="branch-select"
                          value={formData.branch}
                          onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                          className="w-full rounded-xl border border-border/80 bg-slate-50/50 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        >
                          <option value="Branch #1 (Near Bloomfield Hall Junior School, Model Town, Multan)">
                            Branch #1: Near Bloomfield Hall Junior School
                          </option>
                          <option value="Branch #2 (Jatoi Street, Near Model Town T-Chowk, Multan)">
                            Branch #2: Jatoi Street, Near T-Chowk
                          </option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="course-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Select Course / Program *
                        </label>
                        <select
                          id="course-select"
                          value={formData.course}
                          onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                          className="w-full rounded-xl border border-border/80 bg-slate-50/50 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        >
                          <option value="Morning Early Foundation Classes (PG - 10th)">Morning Early Foundation (PG – 10th)</option>
                          <option value="O Level / Cambridge Stream">O Level / Cambridge Classes</option>
                          <option value="FSc (Pre-Medical & Pre-Engineering)">FSc (Pre-Medical & Pre-Engineering)</option>
                          <option value="ICS & I.Com (Computing & Commerce)">ICS & I.Com</option>
                          <option value="CA Subjects (Accounting, Quantitative, Economics, Business)">CA Subjects / PRC Modules</option>
                          <option value="Canva Designing Masterclass">Canva Designing Course</option>
                          <option value="MS Office Productivity Suite">MS Office Suite Course</option>
                          <option value="AI Presentation & Smart Tools">AI Presentation Course</option>
                          <option value="Spoken & Functional English Classes">English Classes (Spoken & Grammar)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="student-message" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Your Questions or Notes (Optional)
                      </label>
                      <textarea
                        id="student-message"
                        rows={3}
                        placeholder="Ask about batch timings, morning foundation sessions, or test schedules..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full rounded-xl border border-border/80 bg-slate-50/50 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-primary/25 hover:bg-primary/95 transition-all cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                      Submit & Chat on WhatsApp (0316-6581934)
                    </button>
                  </form>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
