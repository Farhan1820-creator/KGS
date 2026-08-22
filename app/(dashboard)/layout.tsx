import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { PushNotificationManager } from "@/components/layout/PushNotificationManager";
import { auth } from "@/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role ?? "";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <PushNotificationManager />
        <Sidebar role={role} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopHeader />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}
