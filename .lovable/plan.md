
# Replace Mock Data with Real Production Pipeline

## Overview

Currently, the entire scan pipeline is simulated: random brands are picked from a hardcoded list, fake engagement numbers are generated, and ticker mapping uses a static lookup table. This plan replaces all of that with:

1. **Real TikTok video data** via RapidAPI (TikTok Scraper API)
2. **AI-powered entity extraction** from real video captions using Gemini
3. **AI-powered ticker mapping** that dynamically identifies parent companies and stock tickers for any brand

---

## What Changes

### 1. New Edge Function: `tiktok-search` (real TikTok data)

A new backend function that calls the RapidAPI TikTok Scraper to search videos by keyword and return real video data (captions, likes, comments, shares, author, URL, posted date).

- Endpoint: `POST /functions/v1/tiktok-search`
- Input: `{ keyword: string, count: number }`
- Output: normalized array of video objects with real engagement data
- Uses `RAPIDAPI_KEY` secret (user will need to provide)

### 2. New Edge Function: `extract-entities` (AI entity extraction)

Replaces the hardcoded brand extraction. Takes an array of video captions and uses Gemini 2.5 Flash to extract brand/product entities with confidence scores.

- Endpoint: `POST /functions/v1/extract-entities`
- Input: `{ captions: string[] }`
- Output: `{ entities: [{ text, type, confidence, captionIndex }] }`
- Uses `LOVABLE_API_KEY` (already configured)

### 3. New Edge Function: `map-ticker` (AI ticker mapping)

Replaces the hardcoded BRANDS lookup. Takes a brand/company name and uses Gemini to identify the publicly-traded parent company, ticker symbol, and exchange.

- Endpoint: `POST /functions/v1/map-ticker`
- Input: `{ entities: string[] }`
- Output: `{ mappings: [{ entity, company, ticker, exchange, confidence, reasoning }] }`
- Uses `LOVABLE_API_KEY` (already configured)

### 4. Rewrite `src/hooks/useScan.ts` (client-side scan)

Replace `generateMockVideos()` and `getBrandCompanyMatch()` calls with:
1. Call `tiktok-search` edge function to get real videos
2. Insert real videos into the `videos` table
3. Call `extract-entities` to pull brands/products from real captions
4. Call `map-ticker` to dynamically map extracted entities to stock tickers
5. Create/update trend_items and company_matches with real data
6. The scoring pipeline (`calculateTrendScore`, `calculateBlindspotScore`) stays the same -- it already works on real metrics

### 5. Rewrite `supabase/functions/scheduled-scan/index.ts` (server-side cron scan)

Same changes as useScan.ts but server-side:
- Replace inline mock data generation with calls to `tiktok-search`, `extract-entities`, and `map-ticker`
- Remove the duplicated BRANDS, PRODUCTS, CAPTION_TEMPLATES, AUTHORS arrays
- Keep the keyword rotation and cycle management logic

### 6. Clean up `src/lib/mock-data.ts`

- Keep the BRANDS array as a **cache/fallback** for known brand-to-ticker mappings (fast lookups without AI call)
- Remove `generateMockVideos()`, `CAPTION_TEMPLATES`, `AUTHORS`, `PRODUCTS` 
- Rename `getBrandCompanyMatch()` to `getCachedBrandMatch()` to clarify it's a fast cache lookup, with the AI mapper as the primary source

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/tiktok-search/index.ts` | RapidAPI TikTok video search |
| `supabase/functions/extract-entities/index.ts` | AI entity extraction from captions |
| `supabase/functions/map-ticker/index.ts` | AI brand-to-ticker mapping |

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useScan.ts` | Replace mock pipeline with real API calls |
| `supabase/functions/scheduled-scan/index.ts` | Replace mock pipeline with real API calls |
| `src/lib/mock-data.ts` | Remove mock generators, keep brand cache |

## Files Unchanged

- `src/lib/scoring.ts` -- scoring logic works on real metrics already
- `src/lib/prediction-alerts.ts` -- already uses real Kalshi API
- `src/components/TrendPredictionOverlap.tsx` -- already reads from DB
- All UI components -- they read from the database, not from mock data

---

## Secret Required

The user will need to provide a **RapidAPI key** with a TikTok Scraper API subscription. Common options:

- "TikTok Scraper" by Premium APIs (rapidapi.com/premium-apis-oanor/api/tiktok-scraper20) -- has Search Videos endpoint
- "TikTok API" by omarmhaimdat (rapidapi.com/omarmhaimdat/api/tiktok-api6) -- well-established

The key will be stored as `RAPIDAPI_KEY` in backend secrets.

---

## Technical Details

### TikTok Search Edge Function

```text
Input: { keyword: "restock alert", count: 10 }

1. Call RapidAPI TikTok search endpoint:
   GET https://tiktok-scraper20.p.rapidapi.com/search/video
   ?query={keyword}&count={count}
   Headers: X-RapidAPI-Key, X-RapidAPI-Host

2. Normalize response into:
   [{
     videoId, url, caption, author,
     postedAt, likes, comments, shares
   }]

3. Return normalized array
```

### AI Entity Extraction

```text
Input: ["OMG the Stanley tumbler is back!", "CeraVe SA cleanser review"]

Prompt to Gemini 2.5 Flash:
  "Extract brand/product entities from these video captions.
   Return as JSON: [{ text, type: 'brand'|'product', confidence }]"

Uses tool calling for structured output.
```

### AI Ticker Mapping

```text
Input: ["Stanley", "CeraVe"]

Prompt to Gemini 2.5 Flash:
  "For each brand, identify the publicly-traded parent company,
   stock ticker, and exchange. Return as JSON."

Uses tool calling for structured output.
Includes a local cache check first (BRANDS array) to avoid
unnecessary AI calls for known brands.
```

### Updated Scan Flow

```text
User clicks "Run Scan"
  1. Get next keyword from rotation
  2. Create scan record (status: running)
  3. Call tiktok-search(keyword, count=10)  -- REAL videos
  4. Insert videos into DB
  5. Call extract-entities(captions)         -- AI extraction
  6. For each unique entity:
     a. Check local BRANDS cache first
     b. If not cached, call map-ticker(entity) -- AI mapping
  7. Create/update trend_items with real scores
  8. Create company_matches with real/AI mappings
  9. Complete scan, invalidate queries
  10. Check prediction alerts (unchanged)
```
