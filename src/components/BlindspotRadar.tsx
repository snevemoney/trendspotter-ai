import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radar, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function BlindspotRadar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: blindspots } = useQuery({
    queryKey: ["blindspot-radar", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("trend_items")
        .select("id, primary_entity, blindspot_score, total_likes, video_count, company_matches(ticker, exchange, company_name)")
        .eq("user_id", user.id)
        .gte("blindspot_score", 40)
        .order("blindspot_score", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    if (score >= 50) return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
  };

  if (!blindspots?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Radar className="h-4 w-4 text-amber-400" />
          Blindspot Radar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {blindspots.map((item: any) => {
          const match = item.company_matches?.[0];
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/trends/${item.id}`)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">{item.primary_entity}</span>
                  {match?.ticker && (
                    <span className="text-xs font-mono text-primary">{match.ticker}</span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {formatNumber(item.total_likes || 0)} likes · {item.video_count || 0} videos
                  {match?.exchange && match.exchange !== "NYSE" && match.exchange !== "NASDAQ"
                    ? ` · ${match.exchange}`
                    : ""}
                </p>
              </div>
              <Badge variant="outline" className={`text-[10px] shrink-0 ${getScoreColor(item.blindspot_score)}`}>
                {item.blindspot_score}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
