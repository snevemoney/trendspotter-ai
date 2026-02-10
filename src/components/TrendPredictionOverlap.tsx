import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTrends } from "@/hooks/useTrends";
import { useKalshiEvents, KalshiEvent } from "@/hooks/useKalshiMarkets";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, TrendingUp, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface OverlapItem {
  brand: string;
  ticker: string;
  trendScore: number;
  blindspotScore: number;
  kalshiProb: number;
  overlapScore: number;
  marketTitle: string;
  trendId: string;
}

export function TrendPredictionOverlap() {
  const { user } = useAuth();
  const { data: trends } = useTrends();
  const navigate = useNavigate();

  // Get company matches for tickers
  const { data: companyMatches } = useQuery({
    queryKey: ["company-matches-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_matches")
        .select("trend_id, ticker, company_name")
        .eq("user_id", user!.id)
        .not("ticker", "is", null);
      return data || [];
    },
    enabled: !!user,
  });

  // Build search terms from trending entities and their tickers
  const searchTerms = [
    ...new Set([
      ...(trends || []).map((t: any) => t.primary_entity?.toLowerCase()).filter(Boolean),
      ...(companyMatches || []).map((m) => m.company_name?.toLowerCase()).filter(Boolean),
      ...(companyMatches || []).map((m) => m.ticker?.toLowerCase()).filter(Boolean),
    ]),
  ];

  // Search Kalshi with broader terms - use entity names not just tickers
  const { data: kalshiEvents, isLoading: kalshiLoading } = useKalshiEvents({
    search: searchTerms.slice(0, 10).join(" "),
    limit: 50,
  });

  // Build overlap data
  const overlaps: OverlapItem[] = [];

  if (trends && kalshiEvents && kalshiEvents.length > 0) {
    const trendList = trends as any[];
    
    for (const trend of trendList) {
      const entity = trend.primary_entity?.toLowerCase() || "";
      if (!entity) continue;

      // Find company match for this trend (if any)
      const match = (companyMatches || []).find((m) => m.trend_id === trend.id);

      // Try to match against any Kalshi event using entity name, ticker, or company name
      const matchingEvent = kalshiEvents.find((ev) => {
        const title = (ev.title || "").toLowerCase();
        const subtitle = (ev.sub_title || "").toLowerCase();
        const combined = title + " " + subtitle;

        // Check entity name
        if (entity.length > 2 && combined.includes(entity)) return true;
        // Check ticker
        if (match?.ticker && combined.includes(match.ticker.toLowerCase())) return true;
        // Check company name
        if (match?.company_name && combined.includes(match.company_name.toLowerCase())) return true;
        // Check if any word in the event title matches the entity
        const entityWords = entity.split(/\s+/).filter((w: string) => w.length > 3);
        if (entityWords.some((w: string) => combined.includes(w))) return true;

        return false;
      });

      if (!matchingEvent) continue;

      const market = matchingEvent.markets?.[0];
      const prob = market ? Math.round((market.last_price || 0) * 100) : 50; // Default 50% if no market data

      const overlapScore = Math.round(
        (trend.score || 0) * 0.35 +
        (trend.blindspot_score || 0) * 0.25 +
        prob * 0.4
      );

      const ticker = match?.ticker || entity.toUpperCase().slice(0, 4);

      overlaps.push({
        brand: trend.primary_entity,
        ticker,
        trendScore: trend.score || 0,
        blindspotScore: trend.blindspot_score || 0,
        kalshiProb: prob,
        overlapScore,
        marketTitle: matchingEvent.title,
        trendId: trend.id,
      });
    }
  }

  // Deduplicate by ticker and sort by overlap score
  const seen = new Set<string>();
  const uniqueOverlaps = overlaps
    .filter((o) => {
      if (seen.has(o.ticker)) return false;
      seen.add(o.ticker);
      return true;
    })
    .sort((a, b) => b.overlapScore - a.overlapScore)
    .slice(0, 8);

  const getBarColor = (score: number) => {
    if (score >= 70) return "hsl(var(--chart-1))";
    if (score >= 50) return "hsl(var(--chart-2))";
    if (score >= 30) return "hsl(var(--chart-3))";
    return "hsl(var(--chart-4))";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as OverlapItem;
    return (
      <div className="bg-popover border rounded-lg p-3 shadow-lg text-xs space-y-1.5">
        <p className="font-semibold text-sm">{d.brand} ({d.ticker})</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <span className="text-muted-foreground">Trend Score</span>
          <span className="font-mono text-right">{d.trendScore}/100</span>
          <span className="text-muted-foreground">Blindspot</span>
          <span className="font-mono text-right">{d.blindspotScore}/100</span>
          <span className="text-muted-foreground">Kalshi Prob</span>
          <span className="font-mono text-right">{d.kalshiProb}%</span>
          <span className="text-muted-foreground font-semibold">Overlap</span>
          <span className="font-mono text-right font-semibold">{d.overlapScore}</span>
        </div>
        <p className="text-muted-foreground pt-1 border-t">{d.marketTitle}</p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Target className="h-4 w-4 text-primary" />
            Social + Prediction Overlap
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {uniqueOverlaps.length} match{uniqueOverlaps.length !== 1 ? "es" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {kalshiLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : uniqueOverlaps.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <TrendingUp className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
            <p className="text-xs">No trend-prediction overlaps found yet.</p>
            <p className="text-[10px] mt-0.5">Run scans to build trend data.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={uniqueOverlaps}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="ticker"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.5)" }} />
                <Bar dataKey="overlapScore" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {uniqueOverlaps.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={getBarColor(entry.overlapScore)}
                      className="cursor-pointer"
                      onClick={() => navigate(`/trends/${entry.trendId}`)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Top overlaps list */}
            <div className="space-y-1.5">
              {uniqueOverlaps.slice(0, 4).map((o) => (
                <button
                  key={o.ticker}
                  onClick={() => navigate(`/trends/${o.trendId}`)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-semibold text-primary">{o.ticker}</span>
                    <span className="text-xs text-muted-foreground truncate">{o.brand}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-muted-foreground">
                      T:{o.trendScore} B:{o.blindspotScore} K:{o.kalshiProb}%
                    </span>
                    <Badge
                      variant={o.overlapScore >= 60 ? "default" : "secondary"}
                      className="text-[10px] font-mono px-1.5"
                    >
                      {o.overlapScore}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
