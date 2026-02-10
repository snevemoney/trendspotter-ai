import { Bell } from "lucide-react";
import { useNotifications, useUnreadCount, useMarkAsRead } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
  const { data: notifications } = useNotifications(10);
  const { data: unreadCount } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const navigate = useNavigate();

  const handleClick = (notif: any) => {
    if (!notif.read) {
      markAsRead.mutate([notif.id]);
    }
    if (notif.trend_id) {
      navigate(`/trends/${notif.trend_id}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {(unreadCount ?? 0) > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
              {unreadCount! > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">Notifications</span>
          {(unreadCount ?? 0) > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6"
              onClick={() => markAsRead.mutate("all")}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-72">
          {!notifications?.length ? (
            <p className="text-xs text-muted-foreground text-center py-6">No notifications yet</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-3 py-2.5 border-b last:border-0 hover:bg-muted/50 transition-colors ${
                  !n.read ? "bg-primary/5" : ""
                }`}
              >
                <p className="text-xs font-medium leading-tight">{n.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </button>
            ))
          )}
        </ScrollArea>
        <div className="border-t px-3 py-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-7"
            onClick={() => navigate("/notifications")}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
