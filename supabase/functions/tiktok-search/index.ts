import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    if (!RAPIDAPI_KEY) {
      throw new Error("RAPIDAPI_KEY is not configured");
    }

    const { keyword, count = 10 } = await req.json();
    if (!keyword) {
      throw new Error("keyword is required");
    }

    const url = `https://tiktok-scraper7.p.rapidapi.com/feed/search?keywords=${encodeURIComponent(keyword)}&count=${count}&publish_time=7&sort_type=0`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "tiktok-scraper7.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("RapidAPI error:", response.status, text);
      throw new Error(`RapidAPI request failed [${response.status}]: ${text}`);
    }

    const data = await response.json();
    const videos: TikTokVideo[] = [];

    const items = data?.data?.videos || data?.data || [];

    for (const item of items) {
      try {
        const video: TikTokVideo = {
          videoId: item.video_id || item.id || `tt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          url: item.play || item.video_url || `https://www.tiktok.com/@${item.author?.unique_id || "user"}/video/${item.video_id || item.id}`,
          caption: item.title || item.desc || item.text || "",
          author: item.author?.unique_id ? `@${item.author.unique_id}` : item.author?.nickname ? `@${item.author.nickname}` : "@unknown",
          postedAt: item.create_time
            ? new Date(item.create_time * 1000).toISOString()
            : new Date().toISOString(),
          likes: item.digg_count ?? item.stats?.diggCount ?? item.likes ?? 0,
          comments: item.comment_count ?? item.stats?.commentCount ?? item.comments ?? 0,
          shares: item.share_count ?? item.stats?.shareCount ?? item.shares ?? 0,
        };
        if (video.caption) {
          videos.push(video);
        }
      } catch (e) {
        console.error("Error normalizing video item:", e);
      }
    }

    console.log(`TikTok search: "${keyword}" returned ${videos.length} videos`);

    return new Response(JSON.stringify({ videos }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("tiktok-search error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
