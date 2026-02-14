import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/ScoreBadge";
import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { ScannerStatusCard } from "@/components/ScannerStatusCard";
import { BlindspotRadar } from "@/components/BlindspotRadar";
import { PredictionCard } from "@/components/PredictionCard";
import { TrendPredictionOverlap } from "@/components/TrendPredictionOverlap";
import { QuickScanDialog } from "@/components/QuickScanDialog";
import { useDashboardStats, useTrends, useTrendAction } from "@/hooks/useTrends";
import { useAddToWatchlist } from "@/hooks/useWatchlist";
import { useScan } from "@/hooks/useScan";
import { useKeywords, useAddKeyword } from "@/hooks/useKeywords";
import {
  TrendingUp,
  Tag,
  BarChart3,
  Zap,
  Play,
  Loader2,
  Bookmark,
  EyeOff,
  Star,
  Eye,
  ExternalLink,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

function KPICard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: any;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold font-mono mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats } = useDashboardStats();
  const { data: trends, isLoading } = useTrends();
  const { runScan, scanning } = useScan();
  const trendAction = useTrendAction();
  const addToWatchlist = useAddToWatchlist();
  const navigate = useNavigate();
  const { data: keywords } = useKeywords();
  const addKeyword = useAddKeyword();
  const [showQuickScan, setShowQuickScan] = useState(false);

  const activeKeywords = keywords?.filter((k) => k.active) ?? [];

  const handleRunScan = async () => {
    // Re-check active keywords from server to avoid stale cache
    const { data: freshKeywords } = await supabase
      .from("keywords")
      .select("id")
      .eq("user_id", user?.id ?? "")
      .eq("active", true)
      .limit(1);

    if (!freshKeywords?.length) {
      setShowQuickScan(true);
      return;
    }
    try {
      await runScan();
    } catch (error) {
      console.error("Error during scan:", error);
    }
  };

  const handleQuickScanSelect = async (keyword: string) => {
    setShowQuickScan(false);
    await addKeyword.mutateAsync(keyword);
    runScan(keyword);
  };

  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Real-time trend intelligence from TikTok
            </p>
          </div>
          <Button onClick={handleRunScan} disabled={scanning}>
            {scanning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {scanning ? "Scanning..." : "Run Scan"}
          </Button>
        </div>

        <QuickScanDialog
          open={showQuickScan}
          onOpenChange={setShowQuickScan}
          onSelectKeyword={handleQuickScanSelect}
        />

        {/* Scanner Status + Blindspot Radar + KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-4">
            <ScannerStatusCard />
            <BlindspotRadar />
            <PredictionCard />
          </div>
          <div className="md:col-span-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                title="Trends (24h)"
                value={stats?.trends24h ?? 0}
                icon={TrendingUp}
                subtitle={`${stats?.trends7d ?? 0} in 7d`}
              />
              <KPICard
                title="Brands Found"
                value={stats?.uniqueBrands ?? 0}
                icon={Tag}
              />
              <KPICard
                title="Mapped Tickers"
                value={stats?.mappedTickers ?? 0}
                icon={BarChart3}
              />
              <KPICard
                title="High Signal"
                value={stats?.highSignalCount ?? 0}
                icon={Zap}
                subtitle="Score ≥ 70"
              />
            </div>
            <TrendPredictionOverlap />
          </div>
        </div>

        {/* Trend Feed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Latest Trend Feed</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !trends?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No trends yet. Click "Run Scan" to start.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Brand/Product</TableHead>
                      <TableHead className="text-xs">Score</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Ticker</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Engagement</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Freshness</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trends.slice(0, 20).map((trend: any) => {
                      const match = trend.company_matches?.[0];
                      const userAction = trend.user_actions?.[0];

                      return (
                        <TableRow
                          key={trend.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/trends/${trend.id}`)}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{trend.primary_entity}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {trend.summary}
                              </p>
                              {userAction && (
                                <Badge variant="outline" className="mt-1 text-[10px]">
                                  {userAction.action}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <ScoreBadge score={trend.score} label={trend.label} />
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {match ? (
                              <span className="font-mono text-xs text-primary">
                                {match.ticker}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-0.5">
                                <Heart className="h-3 w-3" />
                                {formatNumber(trend.total_likes || 0)}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <MessageCircle className="h-3 w-3" />
                                {formatNumber(trend.total_comments || 0)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <FreshnessIndicator date={trend.last_seen} />
                          </TableCell>
                          <TableCell>
                            <div
                              className="flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Save"
                                onClick={() =>
                                  trendAction.mutate({ trendId: trend.id, action: "saved" })
                                }
                              >
                                <Bookmark className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Shortlist"
                                onClick={() =>
                                  trendAction.mutate({ trendId: trend.id, action: "shortlisted" })
                                }
                              >
                                <Star className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Add to Watchlist"
                                onClick={() =>
                                  addToWatchlist.mutate({
                                    type: "brand",
                                    value: trend.primary_entity,
                                  })
                                }
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Ignore"
                                onClick={() =>
                                  trendAction.mutate({ trendId: trend.id, action: "ignored" })
                                }
                              >
                                <EyeOff className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
