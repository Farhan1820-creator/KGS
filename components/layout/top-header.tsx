"use client";

import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/students": "Students",
  "/teachers": "Teachers",
  "/settings": "Settings",
};

export function TopHeader() {
  const pathname = usePathname();
  const title = titles[pathname] ?? "Dashboard";

  return (
    <header className="h-14 border-b flex items-center px-4 md:px-6 sticky top-0 bg-background z-10">
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
