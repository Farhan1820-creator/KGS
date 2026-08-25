import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
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
  const userId = session.user.id ? Number(session.user.id) : null;
  let userImage: string | null = null;
  if (userId) {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { image: true },
    });
    userImage = dbUser?.image ?? null;
  }

  if (role === "admin") return <AdminDashboard name={session.user.name ?? ""} image={userImage} searchParams={resolvedSearchParams} />;
  if (role === "teacher") return <TeacherDashboard name={session.user.name ?? ""} image={userImage} />;
  if (role === "student") return <StudentDashboard name={session.user.name ?? ""} />;
  if (role === "staff") return <TeacherDashboard name={session.user.name ?? ""} image={userImage} />;

  redirect("/login");
}