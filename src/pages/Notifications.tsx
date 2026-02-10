import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications, useMarkAsRead } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";

export default function Notifications() {
  const { data: notifications, isLoading } = useNotifications(100);
  const markAsRead = useMarkAsRead();
  const navigate = useNavigate();

  const unread = notifications?.filter((n) => !n.read) || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unread.length} unread alert{unread.length !== 1 ? "s" : ""}
            </p>
          </div>
          {unread.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAsRead.mutate("all")}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="text-center py-12 text-muted-foreground text-sm">Loading...</p>
            ) : !notifications?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No notifications yet.</p>
                <p className="text-xs mt-1">Run a scan to generate prediction alerts.</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 ${!n.read ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{n.title}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {n.type.replace("_", " ")}
                        </Badge>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!n.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Mark as read"
                          onClick={() => markAsRead.mutate([n.id])}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {n.trend_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="View trend"
                          onClick={() => navigate(`/trends/${n.trend_id}`)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
