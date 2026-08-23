import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { HeaderProvider } from "@/components/layout/header-context";
import { PushNotificationManager } from "@/components/layout/PushNotificationManager";
import { auth } from "@/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role ?? "";

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
