import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminDashboard from "@/app/(dashboard)/AdminDashboard";
import TeacherDashboard from "@/app/(dashboard)/TeacherDashboard";
import StudentDashboard from "@/app/(dashboard)/StudentDashboard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/log(in");
  }

  const role = session.user.role;

  if (role === "admin") return <AdminDashboard />;
  if (role === "teacher") return <TeacherDashboard />;
  if (role === "student") return <StudentDashboard />;

  redirect("/login");
}