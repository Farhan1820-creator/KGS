export default function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-16 text-center md:px-6 md:pb-24 md:pt-24">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,_var(--bg-soft)_0%,_transparent_70%)] md:h-96 md:w-96" />

      <span className="mb-6 inline-block rounded-full bg-bg-soft px-4 py-1.5 text-[13px] font-semibold tracking-wide text-primary">
        Now Enrolling — New Batches
      </span>

      <h1 className="font-display mx-auto max-w-3xl text-[32px] font-bold leading-tight md:text-[52px]">
        Learn skills that <span className="text-primary">open doors</span>, not just certificates
      </h1>

      <p className="mx-auto mt-5 max-w-xl text-[15px] text-text-muted md:text-[17px]">
        The Learnex Academy helps students build real, practical skills through guided courses and mentorship — at your own pace.
      </p>

      <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href="#courses"
          className="w-full max-w-xs rounded-full bg-primary px-8 py-3.5 text-center text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(30,95,168,0.25)] transition-transform hover:-translate-y-0.5 sm:w-auto"
        >
          Explore Courses
        </a>
        <a
          href="#contact"
          className="w-full max-w-xs rounded-full border border-[#DCE7F2] bg-white px-8 py-3.5 text-center text-[15px] font-semibold text-foreground transition-colors hover:border-primary sm:w-auto"
        >
          Book a Free Session
        </a>
      </div>
    </section>
  );
}
