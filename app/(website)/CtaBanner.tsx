export default function CtaBanner() {
  return (
    <div className="mx-auto my-16 max-w-4xl rounded-3xl bg-gradient-to-br from-primary to-accent px-6 py-11 text-center text-white md:my-20 md:px-10 md:py-14">
      <h2 className="font-display text-xl font-bold md:text-[28px]">Ready to start learning?</h2>
      <p className="mx-auto mt-2.5 max-w-md text-sm text-white/90 md:text-[15px]">
        Join The Learnex Academy and take your first real step today.
      </p>
      <a
        href="#contact"
        className="mt-6 inline-block rounded-full bg-white px-8 py-3.5 text-[15px] font-semibold text-primary transition-transform hover:-translate-y-0.5"
      >
        Join Now
      </a>
    </div>
  );
}
