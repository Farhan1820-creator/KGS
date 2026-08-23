import { auth } from "@/auth";
import { NextResponse } from "next/server";

const ROUTE_ROLES: { prefix: string; roles: string[] }[] = [
  { prefix: "/students/attendance", roles: ["admin", "teacher"] },
  { prefix: "/students",  roles: ["admin"] },
  { prefix: "/teachers",  roles: ["admin"] },
  { prefix: "/accounts",  roles: ["admin"] },
  { prefix: "/settings",  roles: ["admin"] },
  { prefix: "/payroll",   roles: ["admin", "teacher", "staff"] },
  { prefix: "/diary",     roles: ["admin", "teacher", "student"] },
  { prefix: "/tasks",     roles: ["admin", "teacher", "student"] },
  { prefix: "/dashboard/notes", roles: ["admin", "teacher", "staff"] },
  { prefix: "/dashboard/test-reports", roles: ["admin", "teacher", "student", "staff"] },
  { prefix: "/dashboard", roles: ["admin", "teacher", "student", "staff"] },
];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === "/login";
  const isOnboarding = pathname === "/onboarding";
  const isNotesPortal = pathname === "/notes";

  const role = req.auth?.user?.role ?? "";
  const studentStatus = req.auth?.user?.studentStatus;

  // ── Universal Auth (/login) ──────────────────

  // /login: if already logged in → send to notes portal (for website students) or dashboard
  if (isLoginPage && isLoggedIn) {
    if (role === "student" && studentStatus === "website") {
      return NextResponse.redirect(new URL("/notes", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // /notes + /onboarding: require auth → redirect to /login if not logged in
  if (isNotesPortal || isOnboarding) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.url));
    
    // Non-students visiting /notes should be redirected to /dashboard/notes (their management portal)
    if (role !== "student") {
      return NextResponse.redirect(new URL("/dashboard/notes", req.url));
    }
    
    // Only website students are allowed in onboarding specifically
    if (isOnboarding && studentStatus !== "website") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  }

  // ── Dashboard routes ─────────────────────────────────────────────────────

  const isDashboardRoute =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/students") ||
    pathname.startsWith("/teachers") ||
    pathname.startsWith("/accounts") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/payroll") ||
    pathname.startsWith("/diary") ||
    pathname.startsWith("/tasks");

  if (!isLoggedIn && !isLoginPage && isDashboardRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Website students (studentStatus="website") must not access the dashboard
  if (isLoggedIn && isDashboardRoute && role === "student" && studentStatus === "website") {
    return NextResponse.redirect(new URL("/notes", req.url));
  }

  // Role-based check for dashboard routes
  if (isLoggedIn && isDashboardRoute) {
    const match = ROUTE_ROLES.find((r) => pathname.startsWith(r.prefix));
    if (match && !match.roles.includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/dashboard",
    "/students/:path*",
    "/teachers/:path*",
    "/accounts/:path*",
    "/settings/:path*",
    "/payroll/:path*",
    "/diary/:path*",
    "/tasks/:path*",
    "/tasks",
    "/login", 
    "/notes", 
    "/onboarding"
  ],
};