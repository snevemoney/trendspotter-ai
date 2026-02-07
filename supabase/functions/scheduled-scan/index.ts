import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- Mock data generation (mirrored from frontend) ---

const BRANDS = [
  { name: "Stanley", companies: [{ company: "Stanley Black & Decker", ticker: "SWK", exchange: "NYSE" }] },
  { name: "CeraVe", companies: [{ company: "L'Oréal", ticker: "OR.PA", exchange: "Euronext" }] },
  { name: "Dyson", companies: [] },
  { name: "Starbucks", companies: [{ company: "Starbucks Corporation", ticker: "SBUX", exchange: "NASDAQ" }] },
  { name: "Crocs", companies: [{ company: "Crocs, Inc.", ticker: "CROX", exchange: "NASDAQ" }] },
  { name: "Lululemon", companies: [{ company: "Lululemon Athletica", ticker: "LULU", exchange: "NASDAQ" }] },
  { name: "Drunk Elephant", companies: [{ company: "Shiseido", ticker: "4911.T", exchange: "TSE" }] },
  { name: "Sol de Janeiro", companies: [] },
  { name: "Rare Beauty", companies: [] },
  { name: "Olaplex", companies: [{ company: "Olaplex Holdings", ticker: "OLPX", exchange: "NASDAQ" }] },
  { name: "e.l.f. Cosmetics", companies: [{ company: "e.l.f. Beauty", ticker: "ELF", exchange: "NYSE" }] },
  { name: "Nike", companies: [{ company: "Nike, Inc.", ticker: "NKE", exchange: "NYSE" }] },
  { name: "Apple", companies: [{ company: "Apple Inc.", ticker: "AAPL", exchange: "NASDAQ" }] },
  { name: "Glossier", companies: [] },
  { name: "Rhode Skin", companies: [] },
  { name: "Skims", companies: [] },
  { name: "Ugg", companies: [{ company: "Deckers Outdoor", ticker: "DECK", exchange: "NYSE" }] },
  { name: "Trader Joe's", companies: [] },
  { name: "Alo Yoga", companies: [] },
  { name: "Beis Travel", companies: [] },
];

const AUTHORS = [
  "@skincarejunkie", "@beautyfinds101", "@trendspotter_",
  "@dealsqueen", "@tiktokmademe", "@viralbuys",
  "@stockpicks_", "@consumertrends", "@restockalert",
  "@theproductguru", "@fashionfinder", "@budgetbeauty",
];

const CAPTION_TEMPLATES = [
  "OMG the {brand} {product} is BACK IN STOCK! Run don't walk 🏃‍♀️",
  "This {brand} {product} is literally sold out everywhere and I found it!",
  "TikTok made me buy this {brand} {product} and I'm obsessed 😍",
  "Limited drop alert! {brand} just released a new {product} 🚨",
  "The viral {brand} {product} - is it worth the hype? Full review",
  "This {brand} {product} went viral and now it's impossible to find",
  "Restock alert! The {brand} {product} everyone's been waiting for",
  "{brand} {product} review - why everyone on TikTok is buying this",
  "Found the sold out {brand} {product} at my local store! 🎉",
  "This {brand} {product} is the best thing I've ever bought. Trust me.",
];

const PRODUCTS: Record<string, string[]> = {
  Stanley: ["Quencher tumbler", "IceFlow bottle", "Adventure flask"],
  CeraVe: ["moisturizing cream", "SA cleanser", "retinol serum"],
  Dyson: ["Airwrap", "Supersonic dryer", "V15 vacuum"],
  Starbucks: ["Stanley collab tumbler", "cold cup", "holiday cups"],
  Crocs: ["Classic Clog", "Echo Surge", "collaboration clogs"],
  Lululemon: ["Align leggings", "Belt Bag", "Scuba hoodie"],
  "Drunk Elephant": ["Protini moisturizer", "Bronzi drops", "baby facial"],
  "Sol de Janeiro": ["Bum Bum Cream", "Brazilian Mist", "body oil"],
  "Rare Beauty": ["Soft Pinch blush", "lip soufflé", "concealer"],
  Olaplex: ["No. 3 treatment", "bond smoother", "shampoo"],
  "e.l.f. Cosmetics": ["Power Grip primer", "Halo Glow", "lip oil"],
  Nike: ["Air Force 1", "Dunk Low", "Air Max 90"],
  Apple: ["AirPods Pro", "iPhone case", "Apple Watch band"],
  Glossier: ["Boy Brow", "Cloud Paint", "Balm Dotcom"],
  "Rhode Skin": ["Peptide lip tint", "Glazing Milk", "barrier cream"],
  Skims: ["Soft Lounge set", "Fits Everybody bra", "cozy knit"],
  Ugg: ["Ultra Mini boots", "Tazz slippers", "Classic Short"],
  "Trader Joe's": ["Everything Bagel seasoning", "chili crunch", "frozen meals"],
  "Alo Yoga": ["Airlift leggings", "Accolade hoodie", "sports bra"],
  "Beis Travel": ["Weekender bag", "cosmetic case", "carry-on roller"],
};

const SIGNAL_PHRASES = [
  "sold out", "restock", "back in stock", "limited", "drop",
  "tiktok made me buy", "run don't walk", "viral", "trending",
  "out of stock", "restocked", "limited edition",
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMockVideos(keyword: string, count: number) {
  const videos = [];
  for (let i = 0; i < count; i++) {
    const brand = randomItem(BRANDS);
    const products = PRODUCTS[brand.name] || ["product"];
    const product = randomItem(products);
    const template = randomItem(CAPTION_TEMPLATES);
    const caption = template.replace("{brand}", brand.name).replace("{product}", product);
    const hoursAgo = randomInt(1, 168);
    const postedAt = new Date(Date.now() - hoursAgo * 3600000);
    const isViral = Math.random() > 0.7;
    const baseLikes = isViral ? randomInt(50000, 2000000) : randomInt(500, 50000);
    videos.push({
      videoId: `tt_${Date.now()}_${randomInt(100000, 999999)}`,
      url: `https://www.tiktok.com/@${randomItem(AUTHORS).slice(1)}/video/${randomInt(7000000000, 7999999999)}`,
      caption,
      author: randomItem(AUTHORS),
      postedAt,
      likes: baseLikes,
      comments: Math.round(baseLikes * (randomInt(1, 8) / 100)),
      shares: Math.round(baseLikes * (randomInt(1, 5) / 100)),
      keyword,
      brand: brand.name,
      product,
    });
  }
  return videos;
}

function getBrandCompanyMatch(brandName: string) {
  const brand = BRANDS.find((b) => b.name.toLowerCase() === brandName.toLowerCase());
  return brand?.companies?.[0] || null;
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

    // Get all users with active keywords
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

      // Get active keywords for this user
      const { data: keywords, error: kwErr } = await supabase
        .from("keywords")
        .select("*")
        .eq("user_id", userId)
        .eq("active", true)
        .order("sort_order");

      if (kwErr || !keywords?.length) continue;

      // Find current keyword
      let current = keywords.find((k: any) => k.is_current);

      if (!current) {
        // No current keyword set — pick the first one
        current = keywords[0];
        await supabase
          .from("keywords")
          .update({ is_current: true, cycles_completed: 0 })
          .eq("id", current.id);
      }

      // Run the scan for this keyword
      const mockVideos = generateMockVideos(current.keyword, 3 + Math.floor(Math.random() * 4));

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

      // Insert videos
      const videoInserts = mockVideos.map((v) => ({
        scan_id: scan.id,
        user_id: userId,
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

      const { data: insertedVideos, error: videoErr } = await supabase
        .from("videos")
        .insert(videoInserts)
        .select();

      if (videoErr) { console.error("Video insert error:", videoErr); continue; }

      // Extract entities and create/update trends
      for (const video of mockVideos) {
        const dbVideo = insertedVideos?.find((v: any) => v.video_id === video.videoId);
        if (!dbVideo) continue;

        await supabase.from("extracted_entities").insert({
          video_id: dbVideo.id,
          user_id: userId,
          entity_text: video.brand,
          entity_type: "brand",
          confidence: 0.85 + Math.random() * 0.15,
        });

        const { data: existingTrend } = await supabase
          .from("trend_items")
          .select("*")
          .eq("user_id", userId)
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
          await supabase
            .from("trend_items")
            .update({
              score, label, signal_phrases: signals,
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
              primary_entity: video.brand,
              entity_type: "brand",
              summary: `${video.brand} ${video.product} trending on TikTok via "${current.keyword}" keyword.`,
              score, label, signal_phrases: signals,
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

            if (companyMatch) {
              await supabase.from("company_matches").insert({
                trend_id: newTrend.id,
                user_id: userId,
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
          status: "completed",
          videos_found: mockVideos.length,
          entities_extracted: mockVideos.length,
          completed_at: new Date().toISOString(),
        })
        .eq("id", scan.id);

      // Handle rotation: increment cycles_completed
      const newCycles = (current.cycles_completed || 0) + 1;

      if (newCycles >= cyclesPerKeyword) {
        // Rotate to next keyword
        await supabase
          .from("keywords")
          .update({ is_current: false, cycles_completed: 0 })
          .eq("id", current.id);

        // Find next keyword in sort order
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
          videosFound: mockVideos.length,
          rotatedTo: nextKeyword.keyword,
        });
      } else {
        // Increment cycle count
        await supabase
          .from("keywords")
          .update({ cycles_completed: newCycles })
          .eq("id", current.id);

        results.push({
          userId,
          keyword: current.keyword,
          videosFound: mockVideos.length,
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
