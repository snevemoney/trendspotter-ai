import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Local cache for fast lookups of well-known brands
const BRAND_CACHE: Record<string, { company: string; ticker: string; exchange: string }> = {
  "stanley": { company: "Stanley Black & Decker", ticker: "SWK", exchange: "NYSE" },
  "cerave": { company: "L'Oréal", ticker: "OR.PA", exchange: "Euronext" },
  "starbucks": { company: "Starbucks Corporation", ticker: "SBUX", exchange: "NASDAQ" },
  "crocs": { company: "Crocs, Inc.", ticker: "CROX", exchange: "NASDAQ" },
  "lululemon": { company: "Lululemon Athletica", ticker: "LULU", exchange: "NASDAQ" },
  "nike": { company: "Nike, Inc.", ticker: "NKE", exchange: "NYSE" },
  "apple": { company: "Apple Inc.", ticker: "AAPL", exchange: "NASDAQ" },
  "olaplex": { company: "Olaplex Holdings", ticker: "OLPX", exchange: "NASDAQ" },
  "e.l.f. cosmetics": { company: "e.l.f. Beauty", ticker: "ELF", exchange: "NYSE" },
  "elf": { company: "e.l.f. Beauty", ticker: "ELF", exchange: "NYSE" },
  "ugg": { company: "Deckers Outdoor", ticker: "DECK", exchange: "NYSE" },
  "hoka": { company: "Deckers Outdoor", ticker: "DECK", exchange: "NYSE" },
  "samsung": { company: "Samsung Electronics", ticker: "005930.KS", exchange: "KRX" },
  "sony": { company: "Sony Group", ticker: "SONY", exchange: "NYSE" },
  "google": { company: "Alphabet Inc.", ticker: "GOOGL", exchange: "NASDAQ" },
  "meta": { company: "Meta Platforms", ticker: "META", exchange: "NASDAQ" },
  "amazon": { company: "Amazon.com", ticker: "AMZN", exchange: "NASDAQ" },
  "microsoft": { company: "Microsoft Corp.", ticker: "MSFT", exchange: "NASDAQ" },
  "tesla": { company: "Tesla, Inc.", ticker: "TSLA", exchange: "NASDAQ" },
  "nvidia": { company: "NVIDIA Corp.", ticker: "NVDA", exchange: "NASDAQ" },
  "netflix": { company: "Netflix, Inc.", ticker: "NFLX", exchange: "NASDAQ" },
  "disney": { company: "Walt Disney Co.", ticker: "DIS", exchange: "NYSE" },
  "adidas": { company: "Adidas AG", ticker: "ADS.DE", exchange: "XETRA" },
  "coca-cola": { company: "Coca-Cola Co.", ticker: "KO", exchange: "NYSE" },
  "pepsi": { company: "PepsiCo, Inc.", ticker: "PEP", exchange: "NASDAQ" },
  "pepsico": { company: "PepsiCo, Inc.", ticker: "PEP", exchange: "NASDAQ" },
  "chipotle": { company: "Chipotle Mexican Grill", ticker: "CMG", exchange: "NYSE" },
  "mcdonald's": { company: "McDonald's Corp.", ticker: "MCD", exchange: "NYSE" },
  "mcdonalds": { company: "McDonald's Corp.", ticker: "MCD", exchange: "NYSE" },
  "target": { company: "Target Corp.", ticker: "TGT", exchange: "NYSE" },
  "walmart": { company: "Walmart Inc.", ticker: "WMT", exchange: "NYSE" },
  "costco": { company: "Costco Wholesale", ticker: "COST", exchange: "NASDAQ" },
  "robinhood": { company: "Robinhood Markets", ticker: "HOOD", exchange: "NASDAQ" },
  "coinbase": { company: "Coinbase Global", ticker: "COIN", exchange: "NASDAQ" },
  "airbnb": { company: "Airbnb, Inc.", ticker: "ABNB", exchange: "NASDAQ" },
  "spotify": { company: "Spotify Technology", ticker: "SPOT", exchange: "NYSE" },
  "peloton": { company: "Peloton Interactive", ticker: "PTON", exchange: "NASDAQ" },
  "garmin": { company: "Garmin Ltd.", ticker: "GRMN", exchange: "NYSE" },
  "roblox": { company: "Roblox Corp.", ticker: "RBLX", exchange: "NYSE" },
  "abercrombie": { company: "Abercrombie & Fitch", ticker: "ANF", exchange: "NYSE" },
  "on running": { company: "On Holding AG", ticker: "ONON", exchange: "NYSE" },
  "birkenstock": { company: "Birkenstock Holding", ticker: "BIRK", exchange: "NYSE" },
  "celsius": { company: "Celsius Holdings", ticker: "CELH", exchange: "NASDAQ" },
  "wayfair": { company: "Wayfair Inc.", ticker: "W", exchange: "NYSE" },
  "ralph lauren": { company: "Ralph Lauren Corp.", ticker: "RL", exchange: "NYSE" },
  "under armour": { company: "Under Armour", ticker: "UAA", exchange: "NYSE" },
  "paypal": { company: "PayPal Holdings", ticker: "PYPL", exchange: "NASDAQ" },
  "chewy": { company: "Chewy, Inc.", ticker: "CHWY", exchange: "NYSE" },
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { entities } = await req.json();
    if (!entities?.length) {
      return new Response(JSON.stringify({ mappings: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mappings: any[] = [];
    const uncached: string[] = [];

    // Check cache first
    for (const entity of entities) {
      const cached = BRAND_CACHE[entity.toLowerCase()];
      if (cached) {
        mappings.push({
          entity,
          company: cached.company,
          ticker: cached.ticker,
          exchange: cached.exchange,
          confidence: 0.95,
          reasoning: `Known brand-to-ticker mapping (cached).`,
          source: "cache",
        });
      } else {
        uncached.push(entity);
      }
    }

    // Use AI for uncached entities
    if (uncached.length > 0) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a financial analyst that maps consumer brands to their publicly-traded parent companies. If a brand is privately held or you're unsure, set ticker to null. Be accurate — wrong ticker mappings are worse than no mapping.`,
            },
            {
              role: "user",
              content: `For each brand/company below, identify the publicly-traded parent company, stock ticker symbol, and exchange. If the brand is private or you're not confident, set ticker to null.\n\nBrands: ${uncached.join(", ")}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "report_mappings",
                description: "Report brand-to-ticker mappings",
                parameters: {
                  type: "object",
                  properties: {
                    mappings: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          entity: { type: "string" },
                          company: { type: "string", description: "Parent company name, or the brand itself if self-listed" },
                          ticker: { type: "string", nullable: true, description: "Stock ticker or null if private" },
                          exchange: { type: "string", nullable: true, description: "Stock exchange (NYSE, NASDAQ, etc.) or null" },
                          confidence: { type: "number", description: "0-1 confidence" },
                          reasoning: { type: "string", description: "Brief explanation" },
                        },
                        required: ["entity", "company", "ticker", "exchange", "confidence", "reasoning"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["mappings"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "report_mappings" } },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("AI gateway error:", response.status, text);
        // Don't throw — we still have cached results
      } else {
        const result = await response.json();
        const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          try {
            const parsed = JSON.parse(toolCall.function.arguments);
            for (const m of parsed.mappings || []) {
              mappings.push({ ...m, source: "ai" });
            }
          } catch {
            console.error("Failed to parse AI ticker mappings");
          }
        }
      }
    }

    console.log(`Mapped ${mappings.length} entities (${mappings.length - uncached.length} cached, ${uncached.length} AI)`);

    return new Response(JSON.stringify({ mappings }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("map-ticker error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
