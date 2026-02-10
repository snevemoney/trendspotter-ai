import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KALSHI_BASE = "https://api.elections.kalshi.com/trade-api/v2";

// Simple in-memory cache (edge functions are short-lived, so this is per-invocation)
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute

async function kalshiFetch(path: string, params?: Record<string, string>) {
  const url = new URL(`${KALSHI_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
    }
  }

  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const res = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Kalshi API error [${res.status}]: ${text}`);
    throw new Error(`Kalshi API returned ${res.status}`);
  }

  const data = await res.json();
  cache.set(cacheKey, { data, ts: Date.now() });
  return data;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "events";
    const search = url.searchParams.get("search") || "";
    const category = url.searchParams.get("category") || "";
    const ticker = url.searchParams.get("ticker") || "";
    const limit = url.searchParams.get("limit") || "20";
    const status = url.searchParams.get("status") || "open";

    let result: any;

    switch (action) {
      case "events": {
        const params: Record<string, string> = { limit, status };
        if (search) params.search = search;
        if (category) params.series_ticker = category;
        result = await kalshiFetch("/events", params);
        break;
      }
      case "event": {
        if (!ticker) throw new Error("ticker required for event action");
        result = await kalshiFetch(`/events/${ticker}`);
        break;
      }
      case "markets": {
        const params: Record<string, string> = { limit, status };
        if (search) params.search = search;
        if (ticker) params.event_ticker = ticker;
        result = await kalshiFetch("/markets", params);
        break;
      }
      case "market": {
        if (!ticker) throw new Error("ticker required for market action");
        result = await kalshiFetch(`/markets/${ticker}`);
        break;
      }
      case "orderbook": {
        if (!ticker) throw new Error("ticker required for orderbook action");
        result = await kalshiFetch(`/markets/${ticker}/orderbook`);
        break;
      }
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("kalshi-markets error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
