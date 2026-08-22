"use client";

import Image from "next/image";
import { useState } from "react";

const navLinks = [
  { label: "Courses", href: "#courses" },
  { label: "Why Us", href: "#why" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
  { label: "Notes", href: "/notes" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#E5EEF8] bg-[#FAFCFF]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 md:px-6">
        <a href="#" className="flex items-center gap-2.5">
          <Image src="https://res.cloudinary.com/dggey8rb6/image/upload/v1787375492/logo.png" alt="The Learnex Academy logo" width={34} height={34} className="rounded-full" />
          <span className="font-display text-base font-semibold md:text-lg">The Learnex Academy</span>
        </a>

        <div className="hidden items-center gap-8 text-[15px] font-medium text-text-muted md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-primary">
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="#contact"
          className="hidden rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 md:inline-block"
        >
          Enroll Now
        </a>

        <button
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span className={`h-0.5 w-6 bg-foreground transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-6 bg-foreground transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-6 bg-foreground transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-1 border-t border-[#E5EEF7] bg-[#FAFCFF] px-5 pb-5 pt-2 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-text-muted hover:bg-bg-soft hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-primary px-5 py-2.5 text-center text-sm font-semibold text-white"
          >
            Enroll Now
          </a>
        </div>
      )}
    </nav>
  );
}
