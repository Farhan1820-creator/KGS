"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  ListTodo,
  GraduationCap,
  Users,
  BookOpen,
  Wallet,
  Receipt,
  CreditCard,
  FileText,
  Award,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  X,
  Sparkles,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";

type LinkItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
  section?: "Overview" | "Academics" | "Administration" | "Finance" | "System";
  children?: { href: string; label: string; roles?: string[] }[];
};

const links: LinkItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "teacher", "student", "staff"],
    section: "Overview",
  },
  {
    href: "/tasks",
    label: "Tasks & Homework",
    icon: ListTodo,
    roles: ["admin", "teacher", "student"],
    section: "Academics",
  },
  {
    href: "/dashboard/notes",
    label: "Study Notes",
    icon: FileText,
    roles: ["admin", "teacher", "student", "staff"],
    section: "Academics",
  },
  {
    href: "/diary",
    label: "Class Diary",
    icon: BookOpen,
    roles: ["admin", "teacher", "student"],
    section: "Academics",
  },
  {
    href: "/dashboard/test-reports",
    label: "Test Reports",
    icon: Award,
    roles: ["admin", "teacher"],
    section: "Academics",
  },
  {
    href: "/students",
    label: "Students",
    icon: GraduationCap,
    roles: ["admin", "teacher"],
    section: "Administration",
    children: [
      { href: "/students", label: "Directory", roles: ["admin"] },
      { href: "/students/attendance", label: "Attendance", roles: ["admin", "teacher"] },
    ],
  },
  {
    href: "/teachers",
    label: "Teachers",
    icon: Users,
    roles: ["admin"],
    section: "Administration",
  },
  {
    href: "/accounts",
    label: "Accounts",
    icon: Wallet,
    roles: ["admin"],
    section: "Finance",
    children: [
      { href: "/accounts/fees", label: "Fees Management" },
      { href: "/accounts/expenses", label: "Expenses Tracker" },
    ],
  },
  {
    href: "/payroll",
    label: "Payroll",
    icon: CreditCard,
    roles: ["admin", "teacher", "staff"],
    section: "Finance",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    roles: ["admin"],
    section: "System",
  },
];

interface SidebarProps {
  role: string;
  user?: {
    name?: string;
    email?: string;
  };
}

export function Sidebar({ role, user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen } = useSidebar();
  const visibleLinks = links.filter((l) => l.roles.includes(role));

  const [openMenu, setOpenMenu] = useState<string | null>(
    visibleLinks.find((l) => l.children && pathname.startsWith(l.href))?.href ?? null
  );

  // Close mobile sidebar automatically on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, setMobileOpen]);

  // Group links by section for visual structure
  const sections = Array.from(new Set(visibleLinks.map((l) => l.section || "General")));

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : role.slice(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 md:hidden animate-in fade-in-0"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Aside */}
      <aside
        className={cn(
          "fixed md:sticky top-0 z-50 h-screen flex flex-col justify-between border-r border-border/70 bg-card text-card-foreground shadow-xl md:shadow-none transition-all duration-300 ease-in-out select-none",
          "w-72 md:w-64 max-w-[85vw]",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed && "md:w-20"
        )}
      >
        {/* Top Brand Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/60 bg-muted/20">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 min-w-0 group"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs group-hover:scale-105 transition-transform">
              <Image
                src="https://res.cloudinary.com/dggey8rb6/image/upload/v1787375492/logo.png"
                alt="Learnex Logo"
                width={28}
                height={28}
                className="rounded-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
              <Sparkles className="h-4 w-4 text-primary absolute -bottom-1 -right-1" />
            </div>

            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-foreground tracking-tight truncate leading-tight">
                  The Learnex
                </span>
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider truncate leading-tight mt-0.5">
                  Academy Portal
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>

          {/* Mobile Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Navigation Menu */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {sections.map((sectionName) => {
            const sectionLinks = visibleLinks.filter((l) => (l.section || "General") === sectionName);

            return (
              <div key={sectionName} className="space-y-1">
                {/* Section Header Label (Desktop Expanded & Mobile) */}
                {!collapsed && (
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    {sectionName}
                  </div>
                )}

                {sectionLinks.map(({ href, label, icon: Icon, children }) => {
                  const isMainActive =
                    href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

                  // Simple Link (No Submenu)
                  if (!children) {
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        title={collapsed ? label : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 outline-none",
                          isMainActive
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-bold"
                            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground active:scale-[0.98]",
                          collapsed && "md:justify-center md:px-0 md:h-11 md:w-11 md:mx-auto"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", isMainActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                        
                        <span className={cn("truncate flex-1 text-[13px]", collapsed && "md:hidden")}>
                          {label}
                        </span>

                        {isMainActive && !collapsed && (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground/90 shrink-0" />
                        )}
                      </Link>
                    );
                  }

                  // Expandable Menu with Children
                  const isSubOpen = collapsed ? isMainActive : openMenu === href;

                  return (
                    <div key={href} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (collapsed) {
                            setCollapsed(false);
                            setOpenMenu(href);
                            return;
                          }
                          setOpenMenu((cur) => (cur === href ? null : href));
                        }}
                        title={collapsed ? label : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 w-full outline-none",
                          isMainActive
                            ? "bg-primary/10 text-primary font-bold border border-primary/20"
                            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground active:scale-[0.98]",
                          collapsed && "md:justify-center md:px-0 md:h-11 md:w-11 md:mx-auto"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", isMainActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                        
                        <span className={cn("truncate flex-1 text-left text-[13px]", collapsed && "md:hidden")}>
                          {label}
                        </span>

                        {!collapsed && (
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                              isSubOpen && "rotate-180 text-foreground"
                            )}
                          />
                        )}
                      </button>

                      {/* Sub-menu items */}
                      {isSubOpen && (
                        <div className={cn("pl-4 pr-1 py-1 space-y-1 border-l-2 border-border/60 ml-5 my-1", collapsed && "md:hidden")}>
                          {children
                            .filter((child) => !child.roles || child.roles.includes(role))
                            .map((child) => {
                              const childActive =
                                pathname === child.href ||
                                (child.href !== "/students" && child.href !== "/accounts" && pathname.startsWith(child.href));

                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={() => setMobileOpen(false)}
                                  className={cn(
                                    "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                                    childActive
                                      ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "h-1.5 w-1.5 rounded-full shrink-0",
                                      childActive ? "bg-primary-foreground" : "bg-muted-foreground/50"
                                    )}
                                  />
                                  <span className="truncate">{child.label}</span>
                                </Link>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Profile & Logout Bottom Bar */}
        <div className="p-3 border-t border-border/60 bg-muted/15 space-y-2">
          {/* User Preview */}
          <div
            className={cn(
              "flex items-center gap-3 p-2 rounded-xl bg-background/60 border border-border/50 shadow-2xs",
              collapsed && "md:justify-center md:p-1.5"
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-xs text-primary-foreground shadow-2xs">
              {initials}
            </div>

            {!collapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-foreground truncate leading-tight">
                  {user?.name || "Logged In"}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge
                    variant="outline"
                    className="px-1.5 py-0 text-[10px] font-bold uppercase tracking-wider text-primary border-primary/30 bg-primary/5"
                  >
                    {role}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Logout Action */}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title={collapsed ? "Logout" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold w-full text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-[0.98] transition-all outline-none",
              collapsed && "md:justify-center md:px-0"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={cn(collapsed && "md:hidden")}>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
