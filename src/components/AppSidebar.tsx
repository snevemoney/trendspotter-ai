import {
  LayoutDashboard,
  TrendingUp,
  Eye,
  Calendar,
  CalendarDays,
  Settings,
  LogOut,
  Zap,
  MessageSquare,
  BarChart3,
  Bell,
  FileText,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "AI Chat", icon: MessageSquare, path: "/chat" },
  { title: "Trends", icon: TrendingUp, path: "/trends" },
  { title: "Predictions", icon: BarChart3, path: "/predictions" },
  { title: "Notifications", icon: Bell, path: "/notifications" },
  { title: "Watchlist", icon: Eye, path: "/watchlist" },
  { title: "Daily Digest", icon: Calendar, path: "/daily-digest" },
  { title: "Weekly Digest", icon: CalendarDays, path: "/weekly-digest" },
  { title: "Weekly Report", icon: FileText, path: "/weekly-report" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-sidebar-primary" />
          <div>
            <h1 className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">
              Social Arbitrage
            </h1>
            <p className="text-[10px] text-sidebar-foreground uppercase tracking-widest">
              Trend Scanner
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                    className="text-sm"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs text-sidebar-foreground/60 truncate">
            {user?.email}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
