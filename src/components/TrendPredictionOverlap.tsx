import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTrends } from "@/hooks/useTrends";
import { useKalshiEvents } from "@/hooks/useKalshiMarkets";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, TrendingUp, Target, Lightbulb, ChevronDown } from "lucide-react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface OverlapItem {
  brand: string;
  ticker: string;
  trendScore: number;
  blindspotScore: number;
  kalshiProb: number;
  overlapScore: number;
  marketTitle: string;
  trendId: string;
  sourceKeyword?: string;
}

function OverlapExplanation({ item }: { item: OverlapItem }) {
  const [open, setOpen] = useState(false);

  const { data: explanation, isLoading } = useQuery({
    queryKey: ["explain-overlap", item.ticker, item.marketTitle],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("explain-overlap", {
        body: {
          brand: item.brand,
          keyword: item.sourceKeyword || undefined,
          trendScore: item.trendScore,
          marketTitle: item.marketTitle,
          probability: item.kalshiProb,
        },
      });
      if (error) throw error;
      return data?.explanation as string;
    },
    enabled: open,
    staleTime: 1000 * 60 * 30, // cache 30 min
  });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground">
          <Lightbulb className="h-3 w-3" />
          Why?
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1.5 p-2.5 rounded-md bg-muted/50 border text-xs leading-relaxed text-muted-foreground">
          {isLoading ? (
            <div className="flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Analyzing connection…
            </div>
          ) : explanation ? (
            <>
              {item.sourceKeyword && (
                <p className="text-[10px] text-primary/70 mb-1">
                  Discovered via keyword: "{item.sourceKeyword}"
                </p>
              )}
              <p>{explanation}</p>
            </>
          ) : (
            <p>Unable to generate explanation.</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TrendPredictionOverlap() {
  const { user } = useAuth();
  const { data: trends } = useTrends();
  const navigate = useNavigate();

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

  const searchTerms = [
    ...new Set([
      ...(trends || []).map((t: any) => t.primary_entity?.toLowerCase()).filter(Boolean),
      ...(companyMatches || []).map((m) => m.company_name?.toLowerCase()).filter(Boolean),
      ...(companyMatches || []).map((m) => m.ticker?.toLowerCase()).filter(Boolean),
    ]),
  ];

  const { data: kalshiEvents, isLoading: kalshiLoading } = useKalshiEvents({
    search: searchTerms.slice(0, 10).join(" "),
    limit: 50,
  });

  const overlaps: OverlapItem[] = [];

  if (trends && kalshiEvents && kalshiEvents.length > 0) {
    const trendList = trends as any[];

    for (const trend of trendList) {
      const entity = trend.primary_entity?.toLowerCase() || "";
      if (!entity) continue;

      const match = (companyMatches || []).find((m) => m.trend_id === trend.id);

      const matchingEvent = kalshiEvents.find((ev) => {
        const combined = ((ev.title || "") + " " + (ev.sub_title || "")).toLowerCase();
        if (entity.length > 2 && combined.includes(entity)) return true;
        if (match?.ticker && combined.includes(match.ticker.toLowerCase())) return true;
        if (match?.company_name && combined.includes(match.company_name.toLowerCase())) return true;
        const entityWords = entity.split(/\s+/).filter((w: string) => w.length > 3);
        if (entityWords.some((w: string) => combined.includes(w))) return true;
        return false;
      });

      if (!matchingEvent) continue;

      const market = matchingEvent.markets?.[0];
      const prob = market ? Math.round((market.last_price || 0) * 100) : 50;

      const overlapScore = Math.round(
        (trend.score || 0) * 0.35 +
        (trend.blindspot_score || 0) * 0.25 +
        prob * 0.4
      );

      overlaps.push({
        brand: trend.primary_entity,
        ticker: match?.ticker || entity.toUpperCase().slice(0, 4),
        trendScore: trend.score || 0,
        blindspotScore: trend.blindspot_score || 0,
        kalshiProb: prob,
        overlapScore,
        marketTitle: matchingEvent.title,
        trendId: trend.id,
        sourceKeyword: trend.source_keyword || undefined,
      });
    }
  }

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
              <BarChart data={uniqueOverlaps} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="ticker" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.5)" }} />
                <Bar dataKey="overlapScore" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {uniqueOverlaps.map((entry, i) => (
                    <Cell key={i} fill={getBarColor(entry.overlapScore)} className="cursor-pointer" onClick={() => navigate(`/trends/${entry.trendId}`)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="space-y-1">
              {uniqueOverlaps.slice(0, 4).map((o) => (
                <div key={o.ticker} className="space-y-0.5">
                  <button
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
                      <Badge variant={o.overlapScore >= 60 ? "default" : "secondary"} className="text-[10px] font-mono px-1.5">
                        {o.overlapScore}
                      </Badge>
                    </div>
                  </button>
                  <div className="pl-2">
                    <OverlapExplanation item={o} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
