

# Blindspot Detection -- Finding Hidden Stock Signals

## The Concept

"Blindspots" are stocks connected to products that are blowing up on TikTok but **not yet on Wall Street's radar**. The scanner already captures consumer trends and maps them to tickers -- this feature adds a layer of intelligence that specifically highlights the **overlooked** opportunities.

## What Changes

### 1. Blindspot Score (new metric per trend)

Add a "blindspot score" alongside the existing confidence score. A trend is a "blindspot" when:
- **High social engagement** (lots of TikTok views/likes) but the mapped ticker is **not a major household name** (not AAPL, NKE, etc.)
- **No mainstream news coverage** -- smaller-cap or lesser-known parent companies (e.g., Olaplex/OLPX, Deckers/DECK, e.l.f./ELF)
- **Rising fast** -- appeared recently with accelerating engagement
- **Mapped to a public company** -- must have a tradeable ticker

The blindspot score will be calculated in the scoring utility and stored on each trend item.

### 2. Dashboard "Blindspot Radar" Card

A new card on the Dashboard (next to Scanner Status) that highlights the top 3-5 blindspot trends:
- Shows brand name, ticker, blindspot score, and a short reason like "Parent company under-the-radar, 250K TikTok engagement"
- Visual indicator (radar/eye icon) to distinguish from regular trends
- Click to navigate to trend detail

### 3. AI Chat Blindspot Analysis

Enhance the chat-assistant system prompt so the AI can:
- Respond to prompts like "show me blindspots" or "what's hiding in the data?"
- Cross-reference trends to identify which mapped tickers are lesser-known vs. household names
- Provide a structured "Blindspot Report" format:

```
## Blindspot Radar
| Brand | Ticker | Blindspot Score | Why It's Hidden |
|-------|--------|-----------------|-----------------|
| Olaplex | OLPX | 85 | Hair care viral on TikTok, stock down 40% YTD |
| e.l.f. | ELF | 78 | Budget beauty dominating Gen Z, often overlooked |

## Under-the-Radar Connections:
- Ugg boots trending -> parent company **DECK** (Deckers) rarely in headlines
- Drunk Elephant -> owned by **Shiseido (4911.T)**, foreign listing = invisible to US traders
```

### 4. Trends Page Blindspot Filter

Add a "Blindspots Only" toggle to the Trends page filters that shows only trends with a high blindspot score, giving a focused view of hidden opportunities.

---

## Implementation Steps

### Step 1: Blindspot Scoring Logic

Update `src/lib/scoring.ts` to add a `calculateBlindspotScore()` function:
- **Engagement vs. name recognition** (0-30 pts): High engagement + non-mega-cap parent = more points
- **Company obscurity** (0-30 pts): Foreign exchanges, small-cap, or lesser-known parent companies score higher
- **Recency** (0-20 pts): Newer trends score higher (just emerging = bigger blindspot)
- **Trend acceleration** (0-20 pts): Multiple videos in short timeframe suggests rapid growth

Maintain a list of "well-known" tickers (AAPL, NKE, SBUX, etc.) that score LOW on blindspot since everyone already watches these.

### Step 2: Database -- Add blindspot_score column

Add a `blindspot_score` integer column to `trend_items` table (default 0). This gets populated during scan alongside the existing confidence score.

### Step 3: Update Scan Logic

Update both `useScan.ts` (manual scans) and `scheduled-scan` (auto scans) to calculate and store the blindspot score when processing each trend.

### Step 4: Blindspot Radar Component

Create `src/components/BlindspotRadar.tsx`:
- Queries top trends ordered by `blindspot_score DESC`
- Displays as a compact card on Dashboard
- Shows ticker, brand, score, and a one-line explanation
- Radar/target icon for visual identity

### Step 5: Update Dashboard Layout

Add the BlindspotRadar card to `Index.tsx`, positioned prominently in the KPI area or as a standalone section below the scanner status.

### Step 6: Trends Page Filter

Add a "Blindspots" toggle to `Trends.tsx` that filters to `blindspot_score >= 60`.

### Step 7: Enhance AI Chat

Update `chat-assistant/index.ts` system prompt to:
- Include blindspot scores in the context data
- Add instructions for generating blindspot reports
- Recognize queries about "hidden", "blindspot", "under the radar", "overlooked" stocks

---

## Technical Details

### Blindspot Scoring Function (`src/lib/scoring.ts`)

```typescript
const WELL_KNOWN_TICKERS = [
  "AAPL", "NKE", "SBUX", "AMZN", "GOOGL", "META", "MSFT", "TSLA"
];

function calculateBlindspotScore(input: {
  score: number;           // existing confidence score
  ticker?: string;
  exchange?: string;
  companyName?: string;
  totalLikes: number;
  videoCount: number;
  hoursOld: number;
}): { blindspotScore: number; reason: string }
```

### Database Migration
```sql
ALTER TABLE trend_items ADD COLUMN blindspot_score integer DEFAULT 0;
```

### Files Modified
- `src/lib/scoring.ts` -- Add blindspot scoring function
- `src/hooks/useScan.ts` -- Calculate and store blindspot score during scans
- `supabase/functions/scheduled-scan/index.ts` -- Same for automated scans
- `src/components/BlindspotRadar.tsx` -- New component
- `src/pages/Index.tsx` -- Add BlindspotRadar to dashboard
- `src/pages/Trends.tsx` -- Add blindspot filter toggle
- `supabase/functions/chat-assistant/index.ts` -- Enhanced system prompt with blindspot context
- `src/hooks/useTrends.ts` -- Support blindspot filtering
- Database migration for the new column

