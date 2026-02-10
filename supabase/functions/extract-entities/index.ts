import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { captions } = await req.json();
    if (!captions?.length) {
      return new Response(JSON.stringify({ entities: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const numberedCaptions = captions
      .map((c: string, i: number) => `[${i}] ${c}`)
      .join("\n");

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
            content: `You are a brand/product entity extractor for social media captions. Extract recognizable brand names and specific product names. Ignore generic words. Only extract entities you are confident about.`,
          },
          {
            role: "user",
            content: `Extract brand and product entities from these TikTok video captions:\n\n${numberedCaptions}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_entities",
              description: "Report extracted brand/product entities from video captions",
              parameters: {
                type: "object",
                properties: {
                  entities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "The brand or product name" },
                        type: { type: "string", enum: ["brand", "product"] },
                        confidence: { type: "number", description: "0-1 confidence score" },
                        captionIndex: { type: "integer", description: "Index of the caption this entity was found in" },
                      },
                      required: ["text", "type", "confidence", "captionIndex"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["entities"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_entities" } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error [${response.status}]`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    let entities: any[] = [];

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        entities = parsed.entities || [];
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    console.log(`Extracted ${entities.length} entities from ${captions.length} captions`);

    return new Response(JSON.stringify({ entities }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("extract-entities error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
