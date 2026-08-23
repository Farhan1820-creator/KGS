import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminDashboard from "@/app/(dashboard)/dashboard/AdminDashboard";
import TeacherDashboard from "@/app/(dashboard)/dashboard/TeacherDashboard";
import StudentDashboard from "@/app/(dashboard)/dashboard/StudentDashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;

  const role = session.user.role;
  if (role === "admin") return <AdminDashboard name={session.user.name ?? ""} searchParams={resolvedSearchParams} />;
  if (role === "teacher") return <TeacherDashboard name={session.user.name ?? ""} />;
  if (role === "student") return <StudentDashboard name={session.user.name ?? ""} />;
  if (role === "staff") return <TeacherDashboard name={session.user.name ?? ""} />;

  redirect("/login");
}