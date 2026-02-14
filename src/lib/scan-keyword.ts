import { supabase } from "@/integrations/supabase/client";
import { calculateTrendScore, calculateBlindspotScore } from "@/lib/scoring";

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

interface ScanResult {
  videosFound: number;
  brandsDetected: number;
}

export async function scanSingleKeyword(
  userId: string,
  keywordText: string,
  keywordId: string | null
): Promise<ScanResult> {
  // Create scan record
  const { data: scan, error: scanError } = await supabase
    .from("scans")
    .insert({
      user_id: userId,
      keyword_id: keywordId,
      keyword_text: keywordText,
      mode: "recent" as const,
      status: "running" as const,
    })
    .select()
    .single();

  if (scanError) throw scanError;

  try {
    // Step 1: Fetch TikTok videos
    const { data: tiktokData, error: tiktokError } = await supabase.functions.invoke("tiktok-search", {
      body: { keyword: keywordText, count: 10 },
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
      return { videosFound: 0, brandsDetected: 0 };
    }

    // Step 2: Insert videos
    const videoInserts = videos.map((v) => ({
      scan_id: scan.id,
      user_id: userId,
      video_id: v.videoId,
      url: v.url,
      caption: v.caption,
      author: v.author,
      posted_at: v.postedAt,
      likes: v.likes,
      comments: v.comments,
      shares: v.shares,
      keyword: keywordText,
    }));

    const { data: insertedVideos, error: videoError } = await supabase
      .from("videos")
      .insert(videoInserts)
      .select();

    if (videoError) throw videoError;

    // Step 3: Extract entities
    const captions = videos.map((v) => v.caption).filter(Boolean);
    const { data: entityData, error: entityError } = await supabase.functions.invoke("extract-entities", {
      body: { captions },
    });

    if (entityError) console.error("Entity extraction error:", entityError);
    const entities: ExtractedEntity[] = entityData?.entities || [];

    // Step 4: Map tickers
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

      await supabase.from("extracted_entities").insert({
        video_id: dbVideo.id,
        user_id: userId,
        entity_text: entity.text,
        entity_type: "brand" as const,
        confidence: entity.confidence,
      });

      const { data: existingTrend } = await supabase
        .from("trend_items")
        .select("*")
        .eq("user_id", userId)
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
            user_id: userId,
            primary_entity: entity.text,
            entity_type: "brand" as const,
            summary: `${entity.text} trending on TikTok via "${keywordText}" keyword.`,
            score,
            label,
            signal_phrases: signals,
            blindspot_score: blindspotScore,
            video_count: 1,
            total_likes: video.likes,
            total_comments: video.comments,
            total_shares: video.shares,
            source_keyword: keywordText,
          } as any)
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
              user_id: userId,
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

    return { videosFound: videos.length, brandsDetected: uniqueBrands.length };
  } catch (err) {
    // Mark scan as failed
    await supabase.from("scans").update({
      status: "failed" as const,
      completed_at: new Date().toISOString(),
    }).eq("id", scan.id);
    throw err;
  }
}
