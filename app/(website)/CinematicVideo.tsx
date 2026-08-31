"use client";

import Reveal from "./Reveal";

export default function CinematicVideo() {
  return (
    <section id="campus" className="px-5 py-14 md:px-6 md:py-20 bg-white">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <Reveal className="mx-auto mb-10 max-w-xl text-center">
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-[13px] font-semibold text-primary border border-primary/20">
            Campus & Academic Environment — Multan
          </span>
          <h2 className="font-display text-[26px] font-bold text-foreground md:text-[34px]">
            A Glimpse into Life at The Learnex Academy
          </h2>
          <p className="mt-3 text-text-muted">
            Explore our conceptual classrooms, digital skill labs, and disciplined testing environment in Model Town, Multan.
          </p>
        </Reveal>

        {/* Autoplaying Cinematic Video Container */}
        <div className="group relative overflow-hidden rounded-3xl border border-[#DCE7F2] bg-slate-950 shadow-2xl shadow-slate-200 aspect-video max-h-[560px] w-full flex items-center justify-center">
          <iframe
            src="https://www.youtube-nocookie.com/embed/ScMzIvxBSi4?autoplay=1&mute=1&loop=1&playlist=ScMzIvxBSi4&controls=1&rel=0&modestbranding=1"
            title="The Learnex Academy Campus & Academic Environment"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full border-0 object-cover"
          />
        </div>
      </div>
    </section>
  );
}
