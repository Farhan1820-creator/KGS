"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Users,
  GraduationCap,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  BookOpen,
  X,
  BlocksIcon,
  Wallet,
  Receipt,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";

type LinkItem = {
  href: string;
  label: string;
  icon: typeof BlocksIcon;
  roles: string[];
  children?: { href: string; label: string }[];
};

const links: LinkItem[] = [
  { href: "/", label: "Dashboard", icon: BlocksIcon, roles: ["admin", "teacher", "student", "staff"] },
  { href: "/students", label: "Students", icon: GraduationCap, roles: ["admin"] },
  { href: "/teachers", label: "Teachers", icon: Users, roles: ["admin"] },
  { href: "/diary", label: "Diary", icon: BookOpen, roles: ["admin", "teacher", "student"] },
  {
    href: "/accounts",
    label: "Accounts",
    icon: Wallet,
    roles: ["admin"],
    children: [
      { href: "/accounts/fees", label: "Fees" },
      { href: "/accounts/expenses", label: "Expenses" },
      // { href: "/accounts/payroll", label: "Payroll" },          // Phase 3
    ],
  },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
  { href: "/payroll", label: "Payroll", icon: Wallet, roles: ["admin", "teacher", "staff"] },
];

interface SidebarProps {
  role: string;
}

export function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen } = useSidebar();
  const visibleLinks = links.filter((l) => l.roles.includes(role));
  const [openMenu, setOpenMenu] = useState<string | null>(
    visibleLinks.find((l) => l.children && pathname.startsWith(l.href))?.href ?? null
  );

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
          "w-64 md:w-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "md:w-16" : "md:w-64"
        )}
      >
        <div className="flex items-center justify-between p-3 border-b">
          {!collapsed && <span className="font-semibold text-sm">Kashmir Grammer School</span>}
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
          {visibleLinks.map(({ href, label, icon: Icon, children }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

            if (!children) {
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
            }

            const isOpen = collapsed ? active : openMenu === href;

            return (
              <div key={href}>
                <button
                  type="button"
                  onClick={() => {
                    if (collapsed) return; // collapsed rail: just navigate via children on hover-less setups
                    setOpenMenu((cur) => (cur === href ? null : href));
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors w-full",
                    active ? "bg-primary/10 text-foreground font-medium" : "hover:bg-muted",
                    collapsed && "md:justify-center md:px-0"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={cn("flex-1 text-left", collapsed && "md:hidden")}>{label}</span>
                  {!collapsed && (
                    <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
                  )}
                </button>

                {isOpen && (
                  <div className={cn("mt-1 space-y-1 pl-4", collapsed && "md:hidden")}>
                    {children.map((child) => {
                      const childActive = pathname.startsWith(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                            childActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                          )}
                        >
                          <Receipt className="h-3.5 w-3.5 shrink-0" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-2 border-t">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm w-full text-left text-destructive hover:bg-destructive/10 transition-colors",
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
