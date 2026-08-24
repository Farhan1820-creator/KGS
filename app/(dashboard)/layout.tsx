import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { HeaderProvider } from "@/components/layout/header-context";
import { PushNotificationManager } from "@/components/layout/PushNotificationManager";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, students, teachers } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role ?? "";

  let userImage: string | null = null;
  if (session?.user?.id) {
    const userId = Number(session.user.id);
    if (role === "student") {
      const student = await db.query.students.findFirst({
        where: eq(students.userId, userId),
        columns: { photoUrl: true },
      });
      userImage = student?.photoUrl ?? null;
    } else if (role === "teacher") {
      const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.userId, userId),
        columns: { photoUrl: true },
      });
      userImage = teacher?.photoUrl ?? null;
    }

    if (!userImage) {
      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { image: true },
      });
      userImage = dbUser?.image ?? null;
    }
  }

  return (
    <SidebarProvider>
      <HeaderProvider>
        <div className="flex min-h-screen bg-background text-foreground">
          <PushNotificationManager />
          <Sidebar
            role={role}
            user={{
              name: session?.user?.name ?? undefined,
              email: session?.user?.email ?? undefined,
              image: userImage,
            }}
          />
          <div className="flex-1 flex flex-col min-w-0">
            <TopHeader />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
          <Toaster />
        </div>
      </HeaderProvider>
    </SidebarProvider>
  );
}
