import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <div className="flex items-center gap-2 lg:hidden">
              <SidebarTrigger />
              <span className="text-sm font-medium">Social Arbitrage</span>
            </div>
            <div className="ml-auto">
              <NotificationBell />
            </div>
          </div>
          <div className="p-4 md:p-6">
            <div className="mb-4 rounded-md bg-muted/50 px-3 py-1.5 text-[11px] text-muted-foreground">
              ⚠ For research/education only. Not financial advice.
            </div>
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
