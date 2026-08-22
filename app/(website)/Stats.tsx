const stats = [
  { value: "1,200+", label: "Students Taught" },
  { value: "18", label: "Courses Offered" },
  { value: "4.8/5", label: "Average Rating" },
  { value: "3", label: "Years Running" },
];

export default function Stats() {
  return (
    <section id="about" className="bg-bg-soft px-5 py-12 md:px-6 md:py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 text-center md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <h3 className="font-display text-[26px] font-bold text-primary md:text-[32px]">{s.value}</h3>
            <p className="mt-1 text-[13px] text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
