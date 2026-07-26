"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, Settings, ChevronLeft, ChevronRight, LogOut, BookOpen, X, BlocksIcon } from "lucide-react";
import { useSidebar } from "./sidebar-context";

const links = [
  { href: "/", label: "Dashboard", icon: BlocksIcon },
  { href: "/students", label: "Students", icon: GraduationCap },
  { href: "/teachers", label: "Teachers", icon: Users },
  { href: "/diary", label: "Diary", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* backdrop — mobile only, closes the drawer on tap */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "h-screen fixed md:sticky top-0 z-50 border-r bg-background transition-all duration-200 flex flex-col",
          "w-60 md:w-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "md:w-16" : "md:w-60"
        )}
      >
        <div className="flex items-center justify-between p-3 border-b">
          {!collapsed && <span className="font-semibold text-sm">School Admin</span>}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  collapsed && "md:justify-center md:px-0"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={cn(collapsed && "md:hidden")}>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm w-full text-left text-red-500 hover:bg-red-500/10 transition-colors",
              collapsed && "md:justify-center md:px-0"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={cn(collapsed && "md:hidden")}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
