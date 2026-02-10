import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get auth user from JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { message, conversationHistory } = await req.json();

    // --- Gather context from DB ---

    // 1. Current keyword rotation state
    const { data: keywords } = await supabase
      .from("keywords")
      .select("keyword, is_current, cycles_completed, active, sort_order")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("sort_order");

    const currentKeyword = keywords?.find((k: any) => k.is_current);

    // 2. Profile settings
    const { data: profile } = await supabase
      .from("profiles")
      .select("cycles_per_keyword, scan_frequency_minutes")
      .eq("user_id", user.id)
      .single();

    // 3. Recent scans (last 5)
    const { data: recentScans } = await supabase
      .from("scans")
      .select("keyword_text, status, videos_found, entities_extracted, created_at, completed_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // 4. Top trending items (last 50 by score)
    const { data: trends } = await supabase
      .from("trend_items")
      .select("primary_entity, entity_type, score, label, signal_phrases, total_likes, total_comments, total_shares, video_count, summary, first_seen, last_seen, blindspot_score")
      .eq("user_id", user.id)
      .order("score", { ascending: false })
      .limit(50);

    // 5. Company/ticker matches
    const { data: companyMatches } = await supabase
      .from("company_matches")
      .select("company_name, ticker, exchange, match_confidence, reasoning, trend_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    // 6. Watchlist
    const { data: watchlist } = await supabase
      .from("watchlist")
      .select("type, value")
      .eq("user_id", user.id);

    // --- Build context string ---
    const cyclesPerKeyword = profile?.cycles_per_keyword || 12;
    const scanFreq = profile?.scan_frequency_minutes || 5;

    let contextBlock = `## Scanner State\n`;
    if (currentKeyword) {
      contextBlock += `- Active keyword: \`${currentKeyword.keyword}\`\n`;
      contextBlock += `- Cycle progress: ${currentKeyword.cycles_completed || 0}/${cyclesPerKeyword}\n`;
      contextBlock += `- Scan frequency: every ${scanFreq} minutes\n`;
    }
    if (keywords?.length) {
      contextBlock += `- Keyword rotation queue: ${keywords.map((k: any) => k.keyword).join(" → ")}\n`;
    }

    if (recentScans?.length) {
      contextBlock += `\n## Recent Scans\n`;
      for (const scan of recentScans) {
        contextBlock += `- "${scan.keyword_text}" at ${scan.created_at} — ${scan.videos_found || 0} videos, ${scan.entities_extracted || 0} entities (${scan.status})\n`;
      }
    }

    if (trends?.length) {
      contextBlock += `\n## Current Trend Data (${trends.length} items, sorted by score)\n`;
      contextBlock += `| Brand/Product | Score | Blindspot | Views (likes) | Signal Phrases | Videos |\n`;
      contextBlock += `|---|---|---|---|---|---|\n`;
      for (const t of trends.slice(0, 25)) {
        const signals = t.signal_phrases?.join(", ") || "—";
        contextBlock += `| ${t.primary_entity} | ${t.score}/100 (${t.label}) | ${t.blindspot_score || 0}/100 | ${formatNumber(t.total_likes || 0)} likes, ${formatNumber(t.total_comments || 0)} comments | ${signals} | ${t.video_count || 0} |\n`;
      }

      // Blindspot highlights
      const blindspots = trends.filter((t: any) => (t.blindspot_score || 0) >= 40).sort((a: any, b: any) => (b.blindspot_score || 0) - (a.blindspot_score || 0));
      if (blindspots.length > 0) {
        contextBlock += `\n## Blindspot Opportunities (${blindspots.length} items with score ≥ 40)\n`;
        for (const b of blindspots.slice(0, 10)) {
          contextBlock += `- **${b.primary_entity}** — Blindspot ${b.blindspot_score}/100, ${formatNumber(b.total_likes || 0)} likes, ${b.video_count || 0} videos\n`;
        }
      }
    }

    if (companyMatches?.length) {
      contextBlock += `\n## Ticker Matches\n`;
      // Deduplicate by ticker
      const seenTickers = new Set<string>();
      for (const m of companyMatches) {
        if (m.ticker && !seenTickers.has(m.ticker)) {
          seenTickers.add(m.ticker);
          contextBlock += `- **${m.ticker}** (${m.exchange}) — ${m.company_name}: ${m.reasoning}\n`;
        }
      }
    }

    if (watchlist?.length) {
      contextBlock += `\n## User's Watchlist\n`;
      const brands = watchlist.filter((w: any) => w.type === "brand").map((w: any) => w.value);
      const tickers = watchlist.filter((w: any) => w.type === "ticker").map((w: any) => w.value);
      if (brands.length) contextBlock += `- Brands: ${brands.join(", ")}\n`;
      if (tickers.length) contextBlock += `- Tickers: ${tickers.join(", ")}\n`;
    }

    // --- System prompt ---
    const systemPrompt = `You are the Social Arbitrage Scan Intelligence Assistant. You help users analyze TikTok trend data for consumer-to-stock market signal detection, with special expertise in finding "blindspots" — stocks connected to viral products that are NOT on Wall Street's radar.

You have access to the user's real-time scan data below. Use it to answer questions, generate reports, and provide insights.

BLINDSPOT DETECTION:
- A "blindspot" is a stock/ticker connected to a viral consumer trend that most traders overlook
- High blindspot scores (60+) mean: lesser-known ticker + high social engagement + recent trend acceleration
- Well-known mega-caps (AAPL, NKE, SBUX, MSFT, etc.) score LOW because everyone already watches them
- Foreign-listed parent companies (e.g., Shiseido 4911.T owning Drunk Elephant) are prime blindspots
- When asked about blindspots, "what's hiding", "under the radar", or "overlooked" stocks, generate a Blindspot Report

BLINDSPOT REPORT FORMAT:
## 🔍 Blindspot Radar
| Brand | Ticker | Blindspot Score | Why It's Hidden |
|-------|--------|-----------------|-----------------|
| Brand Name | TICK | 85 | Reason it's overlooked |

## Under-the-Radar Connections:
- Trending product → parent company **TICK** — why it's invisible to most traders

FORMAT RULES:
- When presenting scan results or summaries, format them like professional scan reports
- Use markdown tables for product/trend data with columns: Product | Views | Signal
- Use bullet points with **bold tickers** for ticker signals
- Include a "Related Searches" section when connecting trends
- Show keyword rotation status when relevant
- Format engagement numbers as K/M (e.g., 150K, 1.2M)
- Be concise but thorough
- When asked for a scan report or summary, use this format:

# Social Arbitrage Scan Complete
Keyword: \`keyword_name\` (cycle X/Y)

## Hot Products Found:
| Product | Views | Signal |
|---------|-------|--------|
| Product Name | 150K | Signal description |

## Ticker Signals:
- **TICK** — Reasoning (engagement stats)

## Related Searches:
- Connection → Implication

Entry count and rotation status footer.

IMPORTANT:
- Only reference data that actually exists in the context below
- If no data exists yet, say so and suggest running a scan
- Be actionable — suggest what to watch, what looks hot, what's cooling off
- Mention if items on the user's watchlist are trending
- Proactively highlight blindspot opportunities when relevant

---

${contextBlock}`;

    // --- Build messages ---
    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: message },
    ];

    // --- Call Lovable AI with streaming ---
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in your workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error: any) {
    console.error("chat-assistant error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
