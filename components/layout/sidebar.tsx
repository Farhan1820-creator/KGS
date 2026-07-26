"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, Settings, ChevronLeft, ChevronRight, LogOut, BookOpen } from "lucide-react";

const links = [
  { href: "/students", label: "Students", icon: GraduationCap },
  { href: "/teachers", label: "Teachers", icon: Users },
  { href: "/diary", label: "Diary", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 border-r bg-background transition-all duration-200 flex flex-col",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center justify-between p-3 border-b">
        {!collapsed && <span className="font-semibold text-sm">School Admin</span>}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed((c) => !c)}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm w-full text-left text-red-500 hover:bg-red-500/10 transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
