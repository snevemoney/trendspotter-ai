import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calculateTrendScore, calculateBlindspotScore } from "@/lib/scoring";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { checkPredictionAlerts } from "@/lib/prediction-alerts";
import { scanSingleKeyword } from "@/lib/scan-keyword";

export function useScan() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const queryClient = useQueryClient();

  const runScan = useCallback(async (keywordOverride?: string) => {
    if (!user || scanning) return;
    setScanning(true);

    try {
      let keywordsToScan: { keyword: string; keywordId: string | null }[] = [];

      if (keywordOverride) {
        keywordsToScan = [{ keyword: keywordOverride, keywordId: null }];
      } else {
        // Get ALL active keywords
        const { data: keywords } = await supabase
          .from("keywords")
          .select("*")
          .eq("user_id", user.id)
          .eq("active", true)
          .order("sort_order");

        if (!keywords?.length) return;

        const currentCycle = cycleCount;
        
        // Filter by tier: high=every cycle, medium=every 2nd, low=every 3rd
        const eligible = keywords.filter((k) => {
          if (k.tier === "high") return true;
          if (k.tier === "medium") return currentCycle % 2 === 0;
          return currentCycle % 3 === 0; // low tier
        });

        // Always scan at least high-tier; if none eligible, scan all high
        const toScan = eligible.length > 0 ? eligible : keywords.filter((k) => k.tier === "high");

        keywordsToScan = toScan.map((k) => ({
          keyword: k.keyword,
          keywordId: k.id,
        }));

        setCycleCount((c) => c + 1);
      }

      // Scan keywords in batches to respect API rate limits
      const CONCURRENCY = 3;
      const results: PromiseSettledResult<{ videosFound: number; brandsDetected: number }>[] = [];

      for (let i = 0; i < keywordsToScan.length; i += CONCURRENCY) {
        const batch = keywordsToScan.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.allSettled(
          batch.map(({ keyword, keywordId }) =>
            scanSingleKeyword(user.id, keyword, keywordId)
          )
        );
        results.push(...batchResults);
      }

      // Aggregate results
      let totalVideos = 0;
      let totalBrands = 0;
      let successCount = 0;
      let failCount = 0;

      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          totalVideos += result.value.videosFound;
          totalBrands += result.value.brandsDetected;
          successCount++;
        } else {
          failCount++;
          if (result.status === "rejected") {
            console.error("Keyword scan failed:", result.reason);
          }
        }
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["trends"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["scanner-status"] });

      // Check prediction alerts
      try {
        const { data: trendMatches } = await supabase
          .from("company_matches")
          .select("trend_id, company_name, ticker, trend_items!inner(score, blindspot_score, primary_entity)")
          .eq("user_id", user.id)
          .not("ticker", "is", null);

        if (trendMatches?.length) {
          const alertData = trendMatches.map((m: any) => ({
            trendId: m.trend_id,
            brandName: m.trend_items?.primary_entity || m.company_name,
            ticker: m.ticker,
            score: m.trend_items?.score || 0,
            blindspotScore: m.trend_items?.blindspot_score || 0,
          }));
          await checkPredictionAlerts(user.id, alertData);
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
        }
      } catch (alertErr) {
        console.error("Prediction alert check error:", alertErr);
      }

      toast({
        title: `Scan complete: ${successCount}/${keywordsToScan.length} keywords`,
        description: `Found ${totalVideos} videos with ${totalBrands} brands detected.${failCount > 0 ? ` ${failCount} keywords failed.` : ""}`,
      });
    } catch (err: any) {
      console.error("Scan error:", err);
      toast({
        title: "Scan failed",
        description: err.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  }, [user, scanning]);

  return { runScan, scanning };
}
