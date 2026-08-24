export default function CtaBanner() {
  return (
    <div className="mx-auto my-16 max-w-4xl rounded-3xl bg-gradient-to-br from-primary to-accent px-6 py-11 text-center text-white md:my-20 md:px-10 md:py-14 shadow-xl shadow-primary/20">
      <h2 className="font-display text-xl font-bold md:text-[30px]">
        Ready to Achieve Academic & Professional Excellence?
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-sm text-white/90 md:text-[15px] leading-relaxed">
        Enroll in School (PG–Matric), O Level, Intermediate, Bachelor support, CA (PRC), or master Canva & MS Office today.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
        <a
          href="#contact"
          className="rounded-full bg-white px-8 py-3.5 text-[15px] font-semibold text-primary shadow-md transition-all hover:bg-slate-50 hover:-translate-y-0.5"
        >
          Enroll Now
        </a>
        <a
          href="#courses"
          className="rounded-full border border-white/40 bg-white/10 backdrop-blur-sm px-7 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-white/20"
        >
          Explore All Programs
        </a>
      </div>
    </div>
  );
}
