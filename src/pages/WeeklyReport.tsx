import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import {
  FileText,
  Loader2,
  RefreshCw,
  TrendingUp,
  Target,
  BarChart3,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface WeeklyReport {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  summary: string | null;
  top_overlaps: any[];
  top_trends: any[];
  stats: Record<string, number>;
  status: string;
  created_at: string;
}

export default function WeeklyReport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ["weekly-reports", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_reports")
        .select("*")
        .eq("user_id", user!.id)
        .order("week_start", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data || []) as WeeklyReport[];
    },
    enabled: !!user,
  });

  const generateReport = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weekly-report`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: user!.id }),
        }
      );
      if (!res.ok) throw new Error("Failed to generate report");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-reports"] });
      toast({ title: "Weekly report generated!" });
    },
    onError: () => {
      toast({ title: "Failed to generate report", variant: "destructive" });
    },
  });

  const latestReport = reports?.[0];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Weekly Report</h1>
              <p className="text-sm text-muted-foreground">
                AI-generated summary of trend-prediction overlaps
              </p>
            </div>
          </div>
          <Button
            onClick={() => generateReport.mutate()}
            disabled={generateReport.isPending}
          >
            {generateReport.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Generate Report
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !latestReport ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No reports generated yet.</p>
              <p className="text-xs mt-1">Click "Generate Report" to create your first weekly summary.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats row */}
            {latestReport.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  icon={TrendingUp}
                  label="Trends"
                  value={latestReport.stats.total_trends || 0}
                />
                <StatCard
                  icon={Target}
                  label="High Confidence"
                  value={latestReport.stats.high_confidence || 0}
                />
                <StatCard
                  icon={BarChart3}
                  label="Tickers Mapped"
                  value={latestReport.stats.unique_tickers || 0}
                />
                <StatCard
                  icon={Calendar}
                  label="Scans"
                  value={latestReport.stats.total_scans || 0}
                />
              </div>
            )}

            {/* Top overlaps */}
            {latestReport.top_overlaps?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Top Prediction Overlaps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {latestReport.top_overlaps.map((o: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">
                            {o.ticker}
                          </span>
                          <span className="text-sm">{o.entity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            T:{o.trend_score} B:{o.blindspot_score}
                          </span>
                          <Badge
                            variant={o.overlap_score >= 60 ? "default" : "secondary"}
                            className="text-xs font-mono"
                          >
                            {o.overlap_score}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Summary */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">AI Summary</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(latestReport.week_start), "MMM d")} –{" "}
                    {format(new Date(latestReport.week_end), "MMM d, yyyy")}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{latestReport.summary || "No summary available."}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Top trends */}
            {latestReport.top_trends?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Top Trends This Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {latestReport.top_trends.map((t: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold font-mono text-muted-foreground/30 w-6 text-right">
                            {i + 1}
                          </span>
                          <div>
                            <span className="text-sm font-medium">{t.entity}</span>
                            {t.ticker && (
                              <span className="ml-2 font-mono text-xs text-primary">
                                {t.ticker}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {t.video_count} vids
                          </span>
                          <Badge
                            variant={
                              t.label === "high"
                                ? "default"
                                : t.label === "medium"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {t.score}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Previous reports */}
            {reports && reports.length > 1 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Previous Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {reports.slice(1).map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between px-3 py-2 rounded hover:bg-muted/30 text-sm"
                      >
                        <span>
                          {format(new Date(r.week_start), "MMM d")} –{" "}
                          {format(new Date(r.week_end), "MMM d, yyyy")}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {(r.stats as any)?.total_trends || 0} trends
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {r.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className="h-5 w-5 text-primary flex-shrink-0" />
        <div>
          <p className="text-2xl font-bold font-mono">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
