import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if called with a specific user_id (manual trigger) or run for all users (cron)
    let targetUserIds: string[] = [];
    
    const authHeader = req.headers.get("Authorization");
    const body = await req.json().catch(() => ({}));
    
    if (body.user_id) {
      targetUserIds = [body.user_id];
    } else {
      // Get all users
      const { data: profiles } = await supabase.from("profiles").select("user_id");
      targetUserIds = (profiles || []).map((p: any) => p.user_id);
    }

    if (!targetUserIds.length) {
      return new Response(JSON.stringify({ message: "No users found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];
    const now = new Date();
    const weekEnd = now.toISOString().split("T")[0];
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    for (const userId of targetUserIds) {
      // Get trends from last 7 days
      const { data: trends } = await supabase
        .from("trend_items")
        .select("*")
        .eq("user_id", userId)
        .gte("last_seen", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("score", { ascending: false });

      // Get company matches for these trends
      const trendIds = (trends || []).map((t: any) => t.id);
      const { data: companyMatches } = trendIds.length > 0
        ? await supabase
            .from("company_matches")
            .select("*")
            .eq("user_id", userId)
            .in("trend_id", trendIds)
        : { data: [] };

      // Get scan stats
      const { data: scans } = await supabase
        .from("scans")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const totalScans = scans?.length || 0;
      const totalVideos = (scans || []).reduce((sum: number, s: any) => sum + (s.videos_found || 0), 0);
      const totalEntities = (scans || []).reduce((sum: number, s: any) => sum + (s.entities_extracted || 0), 0);

      // Build top trends (top 10)
      const topTrends = (trends || []).slice(0, 10).map((t: any) => {
        const match = (companyMatches || []).find((m: any) => m.trend_id === t.id);
        return {
          entity: t.primary_entity,
          score: t.score,
          label: t.label,
          blindspot_score: t.blindspot_score,
          video_count: t.video_count,
          total_likes: t.total_likes,
          ticker: match?.ticker || null,
          company: match?.company_name || null,
        };
      });

      // Build top overlaps (trends with company matches and high scores)
      const topOverlaps = (trends || [])
        .filter((t: any) => {
          const match = (companyMatches || []).find((m: any) => m.trend_id === t.id);
          return match?.ticker;
        })
        .slice(0, 8)
        .map((t: any) => {
          const match = (companyMatches || []).find((m: any) => m.trend_id === t.id);
          return {
            entity: t.primary_entity,
            ticker: match?.ticker,
            company: match?.company_name,
            trend_score: t.score,
            blindspot_score: t.blindspot_score,
            overlap_score: Math.round((t.score || 0) * 0.35 + (t.blindspot_score || 0) * 0.25 + 50 * 0.4),
          };
        });

      const stats = {
        total_trends: (trends || []).length,
        high_confidence: (trends || []).filter((t: any) => t.label === "high").length,
        medium_confidence: (trends || []).filter((t: any) => t.label === "medium").length,
        low_confidence: (trends || []).filter((t: any) => t.label === "low").length,
        total_scans: totalScans,
        total_videos: totalVideos,
        total_entities: totalEntities,
        unique_tickers: [...new Set((companyMatches || []).map((m: any) => m.ticker).filter(Boolean))].length,
      };

      // Generate AI summary using Lovable AI
      let summary = "";
      try {
        const aiPrompt = `You are a trend analyst. Write a concise weekly report (3-4 paragraphs) summarizing social media consumer trends for stock research. Use a professional but engaging tone.

Data for this week (${weekStart} to ${weekEnd}):
- ${stats.total_trends} trends detected across ${totalScans} scans
- ${stats.high_confidence} high-confidence, ${stats.medium_confidence} medium, ${stats.low_confidence} low
- ${stats.unique_tickers} unique stock tickers identified
- ${totalVideos} videos analyzed

Top trending brands/entities:
${topTrends.slice(0, 5).map((t: any) => `- ${t.entity}${t.ticker ? ` (${t.ticker})` : ""}: score ${t.score}/100, ${t.video_count} videos, ${(t.total_likes || 0).toLocaleString()} likes`).join("\n")}

Top prediction overlaps:
${topOverlaps.slice(0, 5).map((o: any) => `- ${o.entity} (${o.ticker}): overlap score ${o.overlap_score}`).join("\n") || "None found this week."}

Write the report with these sections:
1. Overview of the week's social trends
2. Highlight standout brands and why they're notable for investors
3. Prediction overlap insights (if any)
4. Brief outlook / what to watch next week

Keep it under 400 words. Use bullet points where helpful.`;

        const aiRes = await fetch(`${supabaseUrl}/functions/v1/proxy/google/gemini-2.5-flash`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: aiPrompt }],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          summary = aiData.choices?.[0]?.message?.content || "";
        }
      } catch (aiErr) {
        console.error("AI summary generation failed:", aiErr);
      }

      if (!summary) {
        // Fallback summary
        const topBrand = topTrends[0];
        summary = `## Weekly Trend Report: ${weekStart} to ${weekEnd}\n\n`;
        summary += `This week, the scanner detected **${stats.total_trends} trends** across **${totalScans} scans**, analyzing **${totalVideos} videos**.\n\n`;
        summary += `### Top Trends\n`;
        summary += topTrends.slice(0, 5).map((t: any) => 
          `- **${t.entity}**${t.ticker ? ` (${t.ticker})` : ""} — Score: ${t.score}/100, ${t.video_count} videos`
        ).join("\n");
        summary += `\n\n### Prediction Overlaps\n`;
        if (topOverlaps.length > 0) {
          summary += topOverlaps.slice(0, 3).map((o: any) =>
            `- **${o.entity}** (${o.ticker}) — Overlap score: ${o.overlap_score}`
          ).join("\n");
        } else {
          summary += "No prediction overlaps detected this week.";
        }
        summary += `\n\n### Stats\n- ${stats.high_confidence} high-confidence signals\n- ${stats.unique_tickers} unique tickers mapped\n- ${stats.total_scans} total scans completed`;
      }

      // Upsert report (one per user per week)
      const { data: existing } = await supabase
        .from("weekly_reports")
        .select("id")
        .eq("user_id", userId)
        .eq("week_start", weekStart)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("weekly_reports")
          .update({
            summary,
            top_overlaps: topOverlaps,
            top_trends: topTrends,
            stats,
            status: "completed",
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("weekly_reports").insert({
          user_id: userId,
          week_start: weekStart,
          week_end: weekEnd,
          summary,
          top_overlaps: topOverlaps,
          top_trends: topTrends,
          stats,
          status: "completed",
        });
      }

      results.push({ userId, trends: stats.total_trends, overlaps: topOverlaps.length });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Weekly report error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
