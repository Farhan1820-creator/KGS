import Image from "next/image";

const footerLinks = [
  { label: "Courses", href: "#courses" },
  { label: "About", href: "#about" },
  { label: "Notes", href: "/notes" },
  { label: "Student Portal", href: "/login" },
  { label: "Contact", href: "#contact" },
  { label: "Instagram", href: "https://instagram.com" },
];

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-[#E5EEF7] px-5 pb-8 pt-10 md:px-6 md:pt-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <a href="#" className="flex items-center gap-2.5">
            <Image src="https://res.cloudinary.com/dggey8rb6/image/upload/v1787375492/logo.png" alt="The Learnex Academy logo" width={30} height={30} className="rounded-full" />
            <span className="font-display font-semibold">The Learnex Academy</span>
          </a>
          <div className="flex flex-wrap gap-5 text-sm text-text-muted">
            {footerLinks.map((l) => (
              <a key={l.label} href={l.href} className="hover:text-primary">
                {l.label}
              </a>
            ))}
          </div>
        </div>
        <p className="mt-8 text-center text-[13px] text-text-muted">
          © {new Date().getFullYear()} The Learnex Academy. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
