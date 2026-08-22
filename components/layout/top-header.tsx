"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "./sidebar-context";

import { NotificationsDropdown } from "./NotificationsDropdown";

const titles: Record<string, string> = {
  "/students": "Students",
  "/teachers": "Teachers",
  "/settings": "Settings",
  "/diary": "Diary",
};

export function TopHeader() {
  const pathname = usePathname();
  const { setMobileOpen } = useSidebar();
  const title = titles[pathname] ?? "Dashboard";

  return (
    <header className="h-14 border-b flex items-center px-4 md:px-6 sticky top-0 bg-background z-30">
      <div className="flex-1 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden -ml-2"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      <h1 className="text-2xl font-semibold truncate text-primary absolute left-1/2 -translate-x-1/2">{title}</h1>
      <div className="flex-1 flex justify-end">
        <NotificationsDropdown />
      </div>
    </header>
  );
}
