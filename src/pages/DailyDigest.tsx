import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreBadge } from "@/components/ScoreBadge";
import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { useTrends } from "@/hooks/useTrends";
import { Calendar, Loader2, Heart, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { subDays } from "date-fns";

export default function DailyDigest() {
  const now = new Date();
  const { data: trends, isLoading } = useTrends({
    dateRange: { from: subDays(now, 1), to: now },
  });
  const navigate = useNavigate();

  const topTrends = (trends || [])
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 10);

  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Daily Digest</h1>
            <p className="text-sm text-muted-foreground">
              Top 10 high-confidence trends from the last 24 hours
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !topTrends.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No trends found in the last 24 hours. Run a scan first!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {topTrends.map((trend: any, i: number) => {
              const match = trend.company_matches?.[0];
              return (
                <Card
                  key={trend.id}
                  className="cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => navigate(`/trends/${trend.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <span className="text-2xl font-bold font-mono text-muted-foreground/30 min-w-[2rem] text-right">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{trend.primary_entity}</h3>
                          <ScoreBadge score={trend.score} label={trend.label} />
                          {match && (
                            <span className="font-mono text-xs text-primary">
                              {match.ticker}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {trend.summary}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {formatNumber(trend.total_likes || 0)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {formatNumber(trend.total_comments || 0)}
                          </span>
                          <span>{trend.video_count} video{trend.video_count !== 1 ? "s" : ""}</span>
                          <FreshnessIndicator date={trend.last_seen} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
