import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calculateTrendScore, calculateBlindspotScore } from "@/lib/scoring";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { checkPredictionAlerts } from "@/lib/prediction-alerts";

interface TikTokVideo {
  videoId: string;
  url: string;
  caption: string;
  author: string;
  postedAt: string;
  likes: number;
  comments: number;
  shares: number;
}

interface ExtractedEntity {
  text: string;
  type: "brand" | "product";
  confidence: number;
  captionIndex: number;
}

interface TickerMapping {
  entity: string;
  company: string;
  ticker: string | null;
  exchange: string | null;
  confidence: number;
  reasoning: string;
  source: string;
}

export function useScan() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const queryClient = useQueryClient();

  const runScan = useCallback(async () => {
    if (!user || scanning) return;
    setScanning(true);

    try {
      // Get next keyword in rotation
      const { data: keywords } = await supabase
        .from("keywords")
        .select("*")
        .eq("user_id", user.id)
        .eq("active", true)
        .order("sort_order");

      if (!keywords?.length) {
        toast({ title: "No keywords", description: "Add keywords in Settings first.", variant: "destructive" });
        return;
      }

      const { data: lastScan } = await supabase
        .from("scans")
        .select("keyword_text")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const lastKeyword = lastScan?.[0]?.keyword_text;
      const lastIndex = keywords.findIndex((k) => k.keyword === lastKeyword);
      const nextIndex = (lastIndex + 1) % keywords.length;
      const keyword = keywords[nextIndex];

      // Create scan record
      const { data: scan, error: scanError } = await supabase
        .from("scans")
        .insert({
          user_id: user.id,
          keyword_id: keyword.id,
          keyword_text: keyword.keyword,
          mode: "recent" as const,
          status: "running" as const,
        })
        .select()
        .single();

      if (scanError) throw scanError;

      // Step 1: Fetch real TikTok videos
      const { data: tiktokData, error: tiktokError } = await supabase.functions.invoke("tiktok-search", {
        body: { keyword: keyword.keyword, count: 10 },
      });

      if (tiktokError) throw new Error(`TikTok search failed: ${tiktokError.message}`);
      if (tiktokData?.error) throw new Error(`TikTok search error: ${tiktokData.error}`);

      const videos: TikTokVideo[] = tiktokData?.videos || [];

      if (!videos.length) {
        await supabase.from("scans").update({
          status: "completed" as const,
          videos_found: 0,
          entities_extracted: 0,
          completed_at: new Date().toISOString(),
        }).eq("id", scan.id);

        toast({ title: "Scan complete", description: `No videos found for "${keyword.keyword}".` });
        return;
      }

      // Step 2: Insert videos into DB
      const videoInserts = videos.map((v) => ({
        scan_id: scan.id,
        user_id: user.id,
        video_id: v.videoId,
        url: v.url,
        caption: v.caption,
        author: v.author,
        posted_at: v.postedAt,
        likes: v.likes,
        comments: v.comments,
        shares: v.shares,
        keyword: keyword.keyword,
      }));

      const { data: insertedVideos, error: videoError } = await supabase
        .from("videos")
        .insert(videoInserts)
        .select();

      if (videoError) throw videoError;

      // Step 3: Extract entities from captions using AI
      const captions = videos.map((v) => v.caption).filter(Boolean);
      const { data: entityData, error: entityError } = await supabase.functions.invoke("extract-entities", {
        body: { captions },
      });

      if (entityError) console.error("Entity extraction error:", entityError);
      const entities: ExtractedEntity[] = entityData?.entities || [];

      // Step 4: Get unique brand entities and map to tickers
      const brandEntities = entities.filter((e) => e.type === "brand");
      const uniqueBrands = [...new Set(brandEntities.map((e) => e.text))];

      let tickerMappings: TickerMapping[] = [];
      if (uniqueBrands.length > 0) {
        const { data: tickerData, error: tickerError } = await supabase.functions.invoke("map-ticker", {
          body: { entities: uniqueBrands },
        });
        if (tickerError) console.error("Ticker mapping error:", tickerError);
        tickerMappings = tickerData?.mappings || [];
      }

      // Build a lookup map: brand name -> ticker mapping
      const tickerMap = new Map<string, TickerMapping>();
      for (const m of tickerMappings) {
        tickerMap.set(m.entity.toLowerCase(), m);
      }

      // Step 5: Insert entities and create/update trends
      for (const entity of brandEntities) {
        const video = videos[entity.captionIndex];
        if (!video) continue;

        const dbVideo = insertedVideos?.find((v) => v.video_id === video.videoId);
        if (!dbVideo) continue;

        // Insert extracted entity
        await supabase.from("extracted_entities").insert({
          video_id: dbVideo.id,
          user_id: user.id,
          entity_text: entity.text,
          entity_type: "brand" as const,
          confidence: entity.confidence,
        });

        // Check existing trend
        const { data: existingTrend } = await supabase
          .from("trend_items")
          .select("*")
          .eq("user_id", user.id)
          .ilike("primary_entity", entity.text)
          .maybeSingle();

        const mapping = tickerMap.get(entity.text.toLowerCase());
        const videoCount = (existingTrend?.video_count || 0) + 1;

        const { score, label, signals } = calculateTrendScore({
          postedAt: new Date(video.postedAt),
          caption: video.caption,
          likes: video.likes,
          comments: video.comments,
          shares: video.shares,
          videoCount,
          hasCompanyMatch: !!(mapping?.ticker),
        });

        const hoursOld = (Date.now() - new Date(video.postedAt).getTime()) / 3600000;
        const { blindspotScore } = calculateBlindspotScore({
          score,
          ticker: mapping?.ticker,
          exchange: mapping?.exchange,
          companyName: mapping?.company,
          totalLikes: video.likes + (existingTrend?.total_likes || 0),
          videoCount,
          hoursOld,
        });

        if (existingTrend) {
          await supabase
            .from("trend_items")
            .update({
              score,
              label,
              signal_phrases: signals,
              blindspot_score: blindspotScore,
              last_seen: new Date().toISOString(),
              video_count: videoCount,
              total_likes: (existingTrend.total_likes || 0) + video.likes,
              total_comments: (existingTrend.total_comments || 0) + video.comments,
              total_shares: (existingTrend.total_shares || 0) + video.shares,
            })
            .eq("id", existingTrend.id);

          await supabase.from("trend_video_links").insert({
            trend_id: existingTrend.id,
            video_id: dbVideo.id,
          });
        } else {
          const { data: newTrend } = await supabase
            .from("trend_items")
            .insert({
              user_id: user.id,
              primary_entity: entity.text,
              entity_type: "brand" as const,
              summary: `${entity.text} trending on TikTok via "${keyword.keyword}" keyword.`,
              score,
              label,
              signal_phrases: signals,
              blindspot_score: blindspotScore,
              video_count: 1,
              total_likes: video.likes,
              total_comments: video.comments,
              total_shares: video.shares,
            })
            .select()
            .single();

          if (newTrend) {
            await supabase.from("trend_video_links").insert({
              trend_id: newTrend.id,
              video_id: dbVideo.id,
            });

            if (mapping?.ticker) {
              await supabase.from("company_matches").insert({
                trend_id: newTrend.id,
                user_id: user.id,
                company_name: mapping.company,
                ticker: mapping.ticker,
                exchange: mapping.exchange,
                match_confidence: mapping.confidence,
                reasoning: mapping.reasoning,
                source: mapping.source,
              });
            }
          }
        }
      }

      // Complete the scan
      await supabase
        .from("scans")
        .update({
          status: "completed" as const,
          videos_found: videos.length,
          entities_extracted: brandEntities.length,
          completed_at: new Date().toISOString(),
        })
        .eq("id", scan.id);

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
        title: `Scan complete: "${keyword.keyword}"`,
        description: `Found ${videos.length} videos with ${uniqueBrands.length} brands detected.`,
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
