import { supabase } from "@/integrations/supabase/client";

interface TrendWithMatch {
  trendId: string;
  brandName: string;
  ticker: string;
  score: number;
  blindspotScore: number;
}

export async function checkPredictionAlerts(
  userId: string,
  trends: TrendWithMatch[]
) {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const uniqueTickers = [...new Set(trends.map((t) => t.ticker).filter(Boolean))];

  for (const ticker of uniqueTickers) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/kalshi-markets?action=events&search=${encodeURIComponent(ticker)}&limit=5&status=open`,
        {
          headers: {
            Authorization: `Bearer ${ANON_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) continue;
      const data = await res.json();
      const events = data?.events || [];

      for (const event of events) {
        const market = event.markets?.[0];
        const prob = market ? Math.round((market.last_price || 0) * 100) : 0;

        if (prob >= 65) {
          const trend = trends.find((t) => t.ticker === ticker);
          if (!trend) continue;

          // Check if we already sent this notification recently (within 24h)
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", userId)
            .eq("type", "prediction_match")
            .gte("created_at", new Date(Date.now() - 24 * 3600000).toISOString())
            .contains("metadata", { kalshiEvent: event.event_ticker } as any)
            .maybeSingle();

          if (existing) continue;

          await supabase.from("notifications").insert({
            user_id: userId,
            type: "prediction_match",
            title: `🎯 Prediction Signal: ${trend.brandName} (${ticker})`,
            message: `${trend.brandName} trending (score ${trend.score}) + "${event.title}" at ${prob}% probability`,
            trend_id: trend.trendId,
            metadata: {
              ticker,
              probability: prob,
              kalshiEvent: event.event_ticker,
              trendScore: trend.score,
              blindspotScore: trend.blindspotScore,
            },
          } as any);
        }
      }
    } catch (err) {
      console.error(`Prediction alert check failed for ${ticker}:`, err);
    }
  }
}
