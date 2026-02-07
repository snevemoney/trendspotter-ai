import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { generateMockVideos, getBrandCompanyMatch } from "@/lib/mock-data";
import { calculateTrendScore } from "@/lib/scoring";
import { toast } from "@/hooks/use-toast";

export function useScan() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);

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

      // Get last scan to determine next keyword
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

      // Generate mock videos
      const mockVideos = generateMockVideos(keyword.keyword, 3 + Math.floor(Math.random() * 4));

      // Insert videos
      const videoInserts = mockVideos.map((v) => ({
        scan_id: scan.id,
        user_id: user.id,
        video_id: v.videoId,
        url: v.url,
        caption: v.caption,
        author: v.author,
        posted_at: v.postedAt.toISOString(),
        likes: v.likes,
        comments: v.comments,
        shares: v.shares,
        keyword: v.keyword,
      }));

      const { data: insertedVideos, error: videoError } = await supabase
        .from("videos")
        .insert(videoInserts)
        .select();

      if (videoError) throw videoError;

      // Extract entities and create/update trends
      for (const video of mockVideos) {
        const dbVideo = insertedVideos?.find((v) => v.video_id === video.videoId);
        if (!dbVideo) continue;

        // Insert extracted entity
        await supabase.from("extracted_entities").insert({
          video_id: dbVideo.id,
          user_id: user.id,
          entity_text: video.brand,
          entity_type: "brand" as const,
          confidence: 0.85 + Math.random() * 0.15,
        });

        // Check if trend already exists for this brand
        const { data: existingTrend } = await supabase
          .from("trend_items")
          .select("*")
          .eq("user_id", user.id)
          .ilike("primary_entity", video.brand)
          .maybeSingle();

        const companyMatch = getBrandCompanyMatch(video.brand);
        const videoCount = (existingTrend?.video_count || 0) + 1;

        const { score, label, signals } = calculateTrendScore({
          postedAt: video.postedAt,
          caption: video.caption,
          likes: video.likes,
          comments: video.comments,
          shares: video.shares,
          videoCount,
          hasCompanyMatch: !!companyMatch,
        });

        if (existingTrend) {
          // Update existing trend
          await supabase
            .from("trend_items")
            .update({
              score,
              label,
              signal_phrases: signals,
              last_seen: new Date().toISOString(),
              video_count: videoCount,
              total_likes: (existingTrend.total_likes || 0) + video.likes,
              total_comments: (existingTrend.total_comments || 0) + video.comments,
              total_shares: (existingTrend.total_shares || 0) + video.shares,
            })
            .eq("id", existingTrend.id);

          // Link video to trend
          await supabase.from("trend_video_links").insert({
            trend_id: existingTrend.id,
            video_id: dbVideo.id,
          });
        } else {
          // Create new trend
          const { data: newTrend } = await supabase
            .from("trend_items")
            .insert({
              user_id: user.id,
              primary_entity: video.brand,
              entity_type: "brand" as const,
              summary: `${video.brand} ${video.product} trending on TikTok via "${keyword.keyword}" keyword.`,
              score,
              label,
              signal_phrases: signals,
              video_count: 1,
              total_likes: video.likes,
              total_comments: video.comments,
              total_shares: video.shares,
            })
            .select()
            .single();

          if (newTrend) {
            // Link video
            await supabase.from("trend_video_links").insert({
              trend_id: newTrend.id,
              video_id: dbVideo.id,
            });

            // Auto-create company match if we have one
            if (companyMatch) {
              await supabase.from("company_matches").insert({
                trend_id: newTrend.id,
                user_id: user.id,
                company_name: companyMatch.company,
                ticker: companyMatch.ticker,
                exchange: companyMatch.exchange,
                match_confidence: 0.8 + Math.random() * 0.2,
                reasoning: `${video.brand} is a product/brand of ${companyMatch.company} (${companyMatch.ticker}).`,
                source: "mock",
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
          videos_found: mockVideos.length,
          entities_extracted: mockVideos.length,
          completed_at: new Date().toISOString(),
        })
        .eq("id", scan.id);

      toast({
        title: `Scan complete: "${keyword.keyword}"`,
        description: `Found ${mockVideos.length} videos with ${new Set(mockVideos.map((v) => v.brand)).size} brands.`,
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
