

# Add "Why This Matters" Context to Trend-Prediction Overlaps

## Problem

Currently, when a trend matches a prediction market, users see the raw numbers (trend score, blindspot score, Kalshi probability) but no explanation of **why** the keyword/trend relates to the prediction or how to interpret it as a potential trade signal.

## Solution

Add AI-generated "connection rationale" that explains:
- Why the social trend (keyword) is relevant to the prediction market
- What the prediction market is betting on and how the trend supports/contradicts it
- A plain-English thesis statement (e.g., "TikTok virality for CeraVe skincare suggests rising consumer demand, which aligns with a Kalshi market betting L'Oreal stock rises above $450 this quarter")

## Changes

### 1. New Edge Function: `explain-overlap`

A lightweight AI call (Gemini 2.5 Flash) that takes a trend entity + keyword + prediction market title and returns a 2-3 sentence explanation.

- Input: `{ brand, keyword, trendScore, marketTitle, probability }`
- Output: `{ explanation: string }` -- a short human-readable thesis
- File: `supabase/functions/explain-overlap/index.ts`

### 2. Update `TrendPredictionOverlap.tsx` (Dashboard Widget)

- Add an expandable section under each overlap item that shows the AI explanation
- Lazy-load the explanation when user clicks/expands (to avoid unnecessary AI calls)
- Cache explanations in React Query so they don't re-fetch

### 3. Update `TrendDetail.tsx` (Related Predictions Section)

- Add a "Why this matters" blurb under each related prediction card
- Show how the scanned keyword connects the social trend to the market
- Include the keyword that triggered the trend discovery

### 4. Store keyword origin on trend_items

Currently `trend_items.summary` contains `"...via 'keyword' keyword"` as a string, but there's no structured `source_keyword` field. We'll add a `source_keyword` column so the UI can explicitly show which keyword surfaced the trend.

- Migration: `ALTER TABLE trend_items ADD COLUMN source_keyword text;`
- Update `useScan.ts` to populate this field when creating trends
- Display in TrendDetail and overlap widgets

---

## Technical Details

### Edge Function: `explain-overlap`

```text
Prompt to Gemini 2.5 Flash:
"You are a stock research analyst. A social media trend for '{brand}' 
was discovered via the keyword '{keyword}' with engagement score {trendScore}/100.
A prediction market asks: '{marketTitle}' with {probability}% 'Yes' probability.

In 2-3 sentences, explain:
1. How the social trend connects to this prediction
2. What the market is implying
3. Whether the trend supports or contradicts the market's view

Be specific and actionable. No disclaimers."
```

### UI: Overlap Widget (dashboard)

Each overlap item gets a collapsible "Why?" button that fetches the explanation on demand:

```text
[TSLA] Tesla    T:82 B:45 K:71%  [Score: 78]
  v "Why this matters"
  -----------------------------------------------
  TikTok keyword "ev charging" surfaced Tesla content 
  with viral engagement (82/100). Kalshi's market 
  "Will TSLA close above $280?" at 71% Yes aligns 
  with the social momentum suggesting sustained 
  consumer interest in EV infrastructure.
  -----------------------------------------------
```

### UI: Trend Detail Page

Under each Related Prediction card, add:

```text
[Related Prediction Card]
"Will AAPL stock rise 5% in Q1?" - 73% Yes
  
  Discovered via keyword: "iphone restock"
  
  This trend was found because TikTok users searching 
  "iphone restock" are showing high demand signals for 
  Apple products. The prediction market's 73% probability 
  suggests traders also expect upward price movement, 
  reinforcing the social signal.
```

### Data Flow

```text
1. User runs scan with keyword "skincare routine"
2. AI extracts "CeraVe" as brand entity
3. AI maps CeraVe -> L'Oreal (OR.PA)
4. trend_items row created with source_keyword = "skincare routine"
5. Dashboard overlap widget matches CeraVe trend to Kalshi market
6. User clicks "Why?" -> calls explain-overlap edge function
7. AI returns: "The keyword 'skincare routine' surfaced CeraVe 
   with high engagement, suggesting rising consumer demand for 
   L'Oreal's dermatology brands. The Kalshi market betting 
   L'Oreal rises 3% aligns with this demand signal."
```

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/explain-overlap/index.ts` | AI explanation generator |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/TrendPredictionOverlap.tsx` | Add expandable "Why?" for each overlap |
| `src/pages/TrendDetail.tsx` | Add explanation under Related Predictions |
| `src/hooks/useScan.ts` | Populate `source_keyword` on new trends |
| `supabase/config.toml` | Register new edge function |

## Database Migration

```sql
ALTER TABLE trend_items ADD COLUMN source_keyword text;
```

