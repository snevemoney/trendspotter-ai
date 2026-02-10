import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SIGNAL_PHRASES = [
  "sold out", "restock", "back in stock", "limited", "drop",
  "tiktok made me buy", "run don't walk", "viral", "trending",
  "out of stock", "restocked", "limited edition",
];

const WELL_KNOWN_TICKERS = [
  "AAPL", "NKE", "SBUX", "AMZN", "GOOGL", "META", "MSFT", "TSLA",
  "GOOG", "NVDA", "JPM", "V", "WMT", "DIS", "KO", "PEP", "MCD",
  "COST", "HD", "TGT", "LULU",
];
const FOREIGN_EXCHANGES = ["Euronext", "TSE", "LSE", "HKEX", "SSE", "ASX"];

function calculateBlindspotScore(input: {
  ticker?: string | null; exchange?: string | null;
  totalLikes: number; videoCount: number; hoursOld: number;
}): { blindspotScore: number } {
  if (!input.ticker) return { blindspotScore: 0 };
  let s = 0;
  const isWellKnown = WELL_KNOWN_TICKERS.includes(input.ticker.toUpperCase());
  if (!isWellKnown && input.totalLikes > 100000) s += 30;
  else if (!isWellKnown && input.totalLikes > 10000) s += 20;
  else if (!isWellKnown && input.totalLikes > 1000) s += 10;
  if (input.exchange && FOREIGN_EXCHANGES.includes(input.exchange)) s += 25;
  else if (!isWellKnown) s += 15;
  if (input.hoursOld <= 24) s += 20;
  else if (input.hoursOld <= 72) s += 15;
  else if (input.hoursOld <= 168) s += 8;
  if (input.videoCount >= 5) s += 20;
  else if (input.videoCount >= 3) s += 12;
  else if (input.videoCount >= 2) s += 5;
  return { blindspotScore: Math.min(100, Math.max(0, s)) };
}

function calculateTrendScore(input: {
  postedAt: Date; caption: string; likes: number; comments: number;
  shares: number; videoCount: number; hasCompanyMatch: boolean;
}) {
  let score = 0;
  const signals: string[] = [];
  const now = new Date();
  const hoursAgo = (now.getTime() - input.postedAt.getTime()) / 3600000;
  const daysAgo = hoursAgo / 24;

  if (hoursAgo <= 24) { score += 25; signals.push("posted today"); }
  else if (daysAgo <= 3) { score += 20; signals.push("posted this week"); }
  else if (daysAgo <= 7) { score += 12; signals.push("posted within 7 days"); }
  else { score += 3; }

  const captionLower = input.caption.toLowerCase();
  const foundPhrases = SIGNAL_PHRASES.filter((p) => captionLower.includes(p));
  if (foundPhrases.length > 0) {
    score += Math.min(20, foundPhrases.length * 7);
    signals.push(...foundPhrases.map((p) => `"${p}"`));
  }

  const engagementTotal = input.likes + input.comments * 3 + input.shares * 5;
  if (engagementTotal > 500000) { score += 25; signals.push("viral engagement"); }
  else if (engagementTotal > 100000) { score += 20; signals.push("high engagement"); }
  else if (engagementTotal > 10000) { score += 12; signals.push("moderate engagement"); }
  else if (engagementTotal > 1000) { score += 5; }

  if (input.videoCount >= 5) { score += 15; signals.push("mentioned in 5+ videos"); }
  else if (input.videoCount >= 3) { score += 10; signals.push("mentioned in 3+ videos"); }
  else if (input.videoCount >= 2) { score += 5; signals.push("mentioned in 2 videos"); }

  if (input.hasCompanyMatch) { score += 15; signals.push("maps to public company"); }

  score = Math.min(100, Math.max(0, score));
  const label = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  return { score, label, signals };
}

// --- Main handler ---

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, cycles_per_keyword");

    if (profilesError) throw profilesError;
    if (!profiles?.length) {
      return new Response(JSON.stringify({ message: "No users found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const profile of profiles) {
      const userId = profile.user_id;
      const cyclesPerKeyword = profile.cycles_per_keyword || 12;

      const { data: keywords, error: kwErr } = await supabase
        .from("keywords")
        .select("*")
        .eq("user_id", userId)
        .eq("active", true)
        .order("sort_order");

      if (kwErr || !keywords?.length) continue;

      let current = keywords.find((k: any) => k.is_current);
      if (!current) {
        current = keywords[0];
        await supabase
          .from("keywords")
          .update({ is_current: true, cycles_completed: 0 })
          .eq("id", current.id);
      }

      // Create scan record
      const { data: scan, error: scanErr } = await supabase
        .from("scans")
        .insert({
          user_id: userId,
          keyword_id: current.id,
          keyword_text: current.keyword,
          mode: "recent",
          status: "running",
        })
        .select()
        .single();

      if (scanErr) { console.error("Scan insert error:", scanErr); continue; }

      // Step 1: Call tiktok-search edge function
      const tiktokRes = await fetch(`${supabaseUrl}/functions/v1/tiktok-search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword: current.keyword, count: 10 }),
      });

      const tiktokData = await tiktokRes.json();
      const videos = tiktokData?.videos || [];

      if (!videos.length) {
        await supabase.from("scans").update({
          status: "completed",
          videos_found: 0,
          entities_extracted: 0,
          completed_at: new Date().toISOString(),
        }).eq("id", scan.id);
        continue;
      }

      // Step 2: Insert videos
      const videoInserts = videos.map((v: any) => ({
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
        keyword: current.keyword,
      }));

      const { data: insertedVideos, error: videoErr } = await supabase
        .from("videos")
        .insert(videoInserts)
        .select();

      if (videoErr) { console.error("Video insert error:", videoErr); continue; }

      // Step 3: Extract entities via AI
      const captions = videos.map((v: any) => v.caption).filter(Boolean);
      let entities: any[] = [];
      try {
        const entityRes = await fetch(`${supabaseUrl}/functions/v1/extract-entities`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ captions }),
        });
        const entityData = await entityRes.json();
        entities = entityData?.entities || [];
      } catch (e) {
        console.error("Entity extraction error:", e);
      }

      // Step 4: Map brands to tickers via AI
      const brandEntities = entities.filter((e: any) => e.type === "brand");
      const uniqueBrands = [...new Set(brandEntities.map((e: any) => e.text))];
      let tickerMappings: any[] = [];

      if (uniqueBrands.length > 0) {
        try {
          const tickerRes = await fetch(`${supabaseUrl}/functions/v1/map-ticker`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceRoleKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ entities: uniqueBrands }),
          });
          const tickerData = await tickerRes.json();
          tickerMappings = tickerData?.mappings || [];
        } catch (e) {
          console.error("Ticker mapping error:", e);
        }
      }

      const tickerMap = new Map<string, any>();
      for (const m of tickerMappings) {
        tickerMap.set(m.entity.toLowerCase(), m);
      }

      // Step 5: Create/update trends
      for (const entity of brandEntities) {
        const video = videos[entity.captionIndex];
        if (!video) continue;

        const dbVideo = insertedVideos?.find((v: any) => v.video_id === video.videoId);
        if (!dbVideo) continue;

        await supabase.from("extracted_entities").insert({
          video_id: dbVideo.id,
          user_id: userId,
          entity_text: entity.text,
          entity_type: "brand",
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
          ticker: mapping?.ticker, exchange: mapping?.exchange,
          totalLikes: video.likes + (existingTrend?.total_likes || 0),
          videoCount, hoursOld,
        });

        if (existingTrend) {
          await supabase
            .from("trend_items")
            .update({
              score, label, signal_phrases: signals,
              blindspot_score: blindspotScore,
              last_seen: new Date().toISOString(),
              video_count: videoCount,
              total_likes: (existingTrend.total_likes || 0) + video.likes,
              total_comments: (existingTrend.total_comments || 0) + video.comments,
              total_shares: (existingTrend.total_shares || 0) + video.shares,
            })
            .eq("id", existingTrend.id);

          await supabase.from("trend_video_links").insert({
            trend_id: existingTrend.id, video_id: dbVideo.id,
          });
        } else {
          const { data: newTrend } = await supabase
            .from("trend_items")
            .insert({
              user_id: userId,
              primary_entity: entity.text,
              entity_type: "brand",
              summary: `${entity.text} trending on TikTok via "${current.keyword}" keyword.`,
              score, label, signal_phrases: signals,
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
              trend_id: newTrend.id, video_id: dbVideo.id,
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
          status: "completed",
          videos_found: videos.length,
          entities_extracted: brandEntities.length,
          completed_at: new Date().toISOString(),
        })
        .eq("id", scan.id);

      // Handle rotation
      const newCycles = (current.cycles_completed || 0) + 1;

      if (newCycles >= cyclesPerKeyword) {
        await supabase
          .from("keywords")
          .update({ is_current: false, cycles_completed: 0 })
          .eq("id", current.id);

        const currentIndex = keywords.findIndex((k: any) => k.id === current.id);
        const nextIndex = (currentIndex + 1) % keywords.length;
        const nextKeyword = keywords[nextIndex];

        await supabase
          .from("keywords")
          .update({ is_current: true, cycles_completed: 0 })
          .eq("id", nextKeyword.id);

        results.push({
          userId,
          keyword: current.keyword,
          videosFound: videos.length,
          brandsDetected: uniqueBrands.length,
          rotatedTo: nextKeyword.keyword,
        });
      } else {
        await supabase
          .from("keywords")
          .update({ cycles_completed: newCycles })
          .eq("id", current.id);

        results.push({
          userId,
          keyword: current.keyword,
          videosFound: videos.length,
          brandsDetected: uniqueBrands.length,
          cycle: `${newCycles}/${cyclesPerKeyword}`,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Scheduled scan error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
