"use client";

import { usePathname } from "next/navigation";
import { Menu, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSidebar } from "./sidebar-context";
import { useHeader } from "./header-context";
import { NotificationsDropdown } from "./NotificationsDropdown";

interface RouteHeaderMeta {
  prefix: string;
  title: string;
  description: string;
  category: string;
}

const ROUTE_CONFIGS: RouteHeaderMeta[] = [
  {
    prefix: "/dashboard/notes",
    title: "Notes & Study Materials",
    description: "Upload, manage, search, and download curriculum notes and learning resources.",
    category: "Academics",
  },
  {
    prefix: "/dashboard/test-reports",
    title: "Test Reports & Results",
    description: "Track and analyze student test scores, evaluations, and academic performance.",
    category: "Academics",
  },
  {
    prefix: "/dashboard",
    title: "Dashboard",
    description: "Live overview of academy operations, statistics, attendance, and tasks.",
    category: "Overview",
  },
  {
    prefix: "/students/attendance",
    title: "Student Attendance",
    description: "Record daily attendance, manage working day schedules, and monitor student presence.",
    category: "Administration",
  },
  {
    prefix: "/students",
    title: "Student Directory",
    description: "Manage student profiles, enrollments, credentials, fee structures, and class allocations.",
    category: "Administration",
  },
  {
    prefix: "/teachers",
    title: "Teachers Directory",
    description: "Manage teacher profiles, assigned subjects, credentials, and contact records.",
    category: "Administration",
  },
  {
    prefix: "/tasks",
    title: "Tasks & Assignments",
    description: "Create, assign, grade, and track student homework assignments and quest submissions.",
    category: "Academics",
  },
  {
    prefix: "/diary",
    title: "Class Diary",
    description: "Post daily class updates, announcements, homework instructions, and teacher notes.",
    category: "Classroom",
  },
  {
    prefix: "/accounts/fees",
    title: "Fee Management",
    description: "Track fee collection status, generate monthly vouchers, and manage fee structures.",
    category: "Accounts",
  },
  {
    prefix: "/accounts/expenses",
    title: "Expense Tracker",
    description: "Record operational expenditures, categorize utility bills, and monitor academy costs.",
    category: "Accounts",
  },
  {
    prefix: "/accounts",
    title: "Accounts & Finance",
    description: "Manage fees, revenue collections, and academy expenditures.",
    category: "Accounts",
  },
  {
    prefix: "/payroll/attendance",
    title: "Staff Attendance",
    description: "Track daily staff attendance logs, work hours, overtime, and leave history.",
    category: "Payroll",
  },
  {
    prefix: "/payroll",
    title: "Payroll Management",
    description: "Calculate staff salaries, allowances, deductions, and record payment disbursements.",
    category: "Payroll",
  },
  {
    prefix: "/settings",
    title: "System Settings",
    description: "Configure academy classes, sections, subjects, timings, holidays, and preferences.",
    category: "Settings",
  },
];

function getRouteMeta(pathname: string): RouteHeaderMeta {
  const match = ROUTE_CONFIGS.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  if (match) return match;

  // Fallback nicely formatted title from path
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] || "Dashboard";
  const formatted = lastSegment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    prefix: pathname,
    title: formatted,
    description: "Manage and oversee academy operations.",
    category: "System",
  };
}

export function TopHeader() {
  const pathname = usePathname();
  const { setMobileOpen } = useSidebar();
  let customHeader: { title?: string; description?: string; category?: string; badge?: string } = {};

  try {
    const headerContext = useHeader();
    customHeader = headerContext.header;
  } catch {
    // Provider not mounted (fallback to route meta)
  }

  const defaultMeta = getRouteMeta(pathname);
  const title = customHeader.title || defaultMeta.title;
  const description = customHeader.description || defaultMeta.description;
  const category = customHeader.category || defaultMeta.category;

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="min-h-16 border-b border-border/60 flex items-center justify-between px-4 sm:px-6 sticky top-0 bg-background/85 backdrop-blur-md z-30 transition-all duration-150">
      {/* Left: Mobile Menu & Page Meta */}
      <div className="flex items-center gap-3 min-w-0 flex-1 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0 -ml-1.5 h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground truncate">
              {title}
            </h1>
            {category && (
              <Badge
                variant="outline"
                className="hidden sm:inline-flex px-2 py-0.2 text-[10px] font-semibold uppercase tracking-wider text-primary border-primary/20 bg-primary/5"
              >
                {category}
              </Badge>
            )}
            {customHeader.badge && (
              <Badge variant="secondary" className="text-[11px] px-2 py-0.5">
                {customHeader.badge}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-xs sm:text-xs text-muted-foreground truncate max-w-xl font-normal leading-tight mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Right: Date & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-3">
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/40 bg-muted/30 text-xs text-muted-foreground font-medium">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span>{todayFormatted}</span>
        </div>

        <div className="h-4 w-px bg-border/60 hidden sm:block" />

        <NotificationsDropdown />
      </div>
    </header>
  );
}
