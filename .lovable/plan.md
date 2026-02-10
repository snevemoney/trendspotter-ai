

# Prediction Markets Integration -- Kalshi Data Feed

## What This Adds

A prediction markets layer that connects your social trend data to real-world event betting markets on Kalshi. When your scanner detects a brand trending on TikTok, the app will automatically check if there are related prediction markets (e.g., "Will inflation exceed 3%?", "Will the Fed cut rates?") and surface them alongside your trend data. This creates a powerful signal: social buzz + market sentiment = better conviction.

---

## How It Works

### 1. Kalshi Markets Page (`/predictions`)

A new page accessible from the sidebar showing:
- Live prediction markets pulled from Kalshi's public API
- Categories relevant to your trading: Economics, Tech, Consumer, Entertainment
- Market price (interpreted as probability), volume, and close date
- Quick filters by category and search
- Click any market to see full details and orderbook depth

### 2. Trend-to-Prediction Matching

When viewing a trend detail page or the dashboard, the app will show related Kalshi markets:
- Example: "Starbucks" trending on TikTok --> show "Will SBUX exceed $X?" or related consumer sentiment markets
- Example: "Inflation" keywords in trends --> show Fed rate / CPI markets
- Matching is done by keyword overlap between trend entities and Kalshi event titles

### 3. AI Chat Enhancement

The AI assistant will be able to reference Kalshi prediction markets when analyzing trends:
- "What does Kalshi say about the economy right now?"
- "Are there any prediction markets related to my trending tickers?"
- Combined reports showing social signals + market probability for higher-conviction plays

### 4. Dashboard Prediction Card

A compact card on the dashboard showing 3-5 "hot" prediction markets that relate to your current trend data.

---

## Implementation Steps

### Step 1: Kalshi API Edge Function

Create `supabase/functions/kalshi-markets/index.ts`:
- Proxies requests to Kalshi's public API (`https://api.elections.kalshi.com/trade-api/v2`)
- No authentication needed -- Kalshi's market data endpoints are public
- Supports fetching:
  - Events list with filters (category, status)
  - Individual market details
  - Orderbook data for specific markets
- Caches results briefly to avoid hammering the API
- Returns cleaned, formatted data to the frontend

### Step 2: Predictions Page

Create `src/pages/Predictions.tsx`:
- Grid/list of active Kalshi markets
- Each card shows: Title, probability (yes price), volume, close date
- Category filter tabs (Economics, Tech, Consumer, Entertainment, Politics)
- Search bar to find specific markets
- Color-coded probability bars (green for high "yes", red for high "no")
- Click to expand for orderbook depth and event description

### Step 3: Prediction Matching Hook

Create `src/hooks/useKalshiMarkets.ts`:
- `useKalshiMarkets(filters)` -- fetches markets with optional category/search filters
- `useRelatedPredictions(trendEntity)` -- given a brand/product name, finds related Kalshi markets by keyword matching against event titles and descriptions
- Caching via React Query with 5-minute stale time

### Step 4: Dashboard Integration

Create `src/components/PredictionCard.tsx`:
- Queries Kalshi for markets related to the user's current trending tickers/brands
- Shows top 3-5 relevant markets with probability and volume
- "View All" link to the Predictions page

### Step 5: Trend Detail Enhancement

Update `src/pages/TrendDetail.tsx`:
- Add a "Related Predictions" section below the existing trend data
- Shows Kalshi markets that match the trend's entity name or mapped ticker
- Helps users see if the market agrees or disagrees with the social signal

### Step 6: AI Chat Integration

Update `supabase/functions/chat-assistant/index.ts`:
- Before responding, fetch relevant Kalshi markets based on the user's trending tickers
- Add prediction market data to the AI context
- System prompt instructions for generating combined reports:

```
## Prediction Market Signals
| Market | Probability | Volume | Closes |
|--------|-------------|--------|--------|
| Will CPI exceed 3% in March? | 72% Yes | $1.2M | Mar 15 |
| Will Fed cut rates in Q1? | 34% Yes | $890K | Mar 31 |

## Social + Prediction Overlap:
- Starbucks trending (160K views) + "Will SBUX beat Q1 earnings?" at 65% Yes
- Consumer spending signals align with CPI prediction markets
```

### Step 7: Navigation Update

- Add "Predictions" to the sidebar with a chart icon
- Add `/predictions` route to App.tsx

---

## Technical Details

### Kalshi API (No Auth Required)

The public endpoints we will use:
- `GET /trade-api/v2/events` -- List events with optional filters
- `GET /trade-api/v2/events/{event_ticker}` -- Get specific event
- `GET /trade-api/v2/markets` -- List markets
- `GET /trade-api/v2/markets/{ticker}` -- Get specific market
- `GET /trade-api/v2/markets/{ticker}/orderbook` -- Get orderbook

Base URL: `https://api.elections.kalshi.com/trade-api/v2`

All endpoints are public and require no API keys. The edge function proxies these to avoid CORS issues.

### Trend-to-Prediction Matching Logic

```typescript
function findRelatedMarkets(
  trendEntity: string,
  tickers: string[],
  kalshiEvents: KalshiEvent[]
): KalshiEvent[] {
  const searchTerms = [
    trendEntity.toLowerCase(),
    ...tickers.map(t => t.toLowerCase())
  ];
  return kalshiEvents.filter(event =>
    searchTerms.some(term =>
      event.title.toLowerCase().includes(term) ||
      event.sub_title?.toLowerCase().includes(term)
    )
  );
}
```

### File Changes Summary

**New Files:**
- `supabase/functions/kalshi-markets/index.ts` -- Edge function proxying Kalshi API
- `src/pages/Predictions.tsx` -- Predictions page
- `src/hooks/useKalshiMarkets.ts` -- Data fetching hooks
- `src/components/PredictionCard.tsx` -- Dashboard prediction card

**Modified Files:**
- `src/components/AppSidebar.tsx` -- Add "Predictions" nav item
- `src/App.tsx` -- Add `/predictions` route
- `src/pages/TrendDetail.tsx` -- Add related predictions section
- `src/pages/Index.tsx` -- Add PredictionCard to dashboard
- `supabase/functions/chat-assistant/index.ts` -- Add Kalshi context to AI
- `supabase/config.toml` -- Register kalshi-markets function

### No Database Changes Required

Kalshi data is fetched in real-time and cached client-side via React Query. No new tables are needed since we are reading public market data, not storing it.

