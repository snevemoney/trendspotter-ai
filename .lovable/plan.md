

# Fix: Related Predictions Showing Irrelevant Markets

## Problem

The `useRelatedPredictions` hook sends a combined search like `"Dollar Tree DLTR"` to Kalshi's API. Kalshi's search is fuzzy and broad -- it returns any event loosely related to any word in the query. This means a trend for "Tesla" returns markets about Elon Musk going to Mars, which has nothing to do with the keyword or brand trend.

## Root Cause

In `src/hooks/useKalshiMarkets.ts`, the `useRelatedPredictions` function:
1. Joins entity + ticker into one search string (e.g., `"Tesla TSLA"`)
2. Sends it as-is to Kalshi's `/events?search=...` endpoint
3. Returns whatever Kalshi gives back with **zero filtering**

Kalshi's search is associative -- it returns anything in the same topic neighborhood, not exact matches.

## Solution

Add **client-side relevance filtering** after fetching results from Kalshi. Only keep events whose title or subtitle explicitly mentions the brand name, company name, or ticker. This ensures "Will Elon go to Mars?" is dropped when the trend is about Tesla vehicles/stock.

## Changes

### 1. Update `useRelatedPredictions` in `src/hooks/useKalshiMarkets.ts`

- Search for the **entity name only** (not ticker + entity combined, which dilutes results)
- After receiving results, filter events so the title or subtitle must contain at least one of: the brand/entity name, the ticker symbol, or a significant word from the entity (4+ characters)
- This is the same filtering logic already used in `TrendPredictionOverlap.tsx` (the dashboard widget), which works correctly

### 2. Update `TrendPredictionOverlap.tsx` search query

- Currently searches with up to 10 terms joined together, which also causes irrelevant results
- Change to search per-entity or use stricter matching
- The widget already does client-side filtering (the `matchingEvent` logic), so main fix is ensuring the search query is more targeted

## Technical Details

Updated `useRelatedPredictions` function:

```text
function useRelatedPredictions(entity, tickers, companyName?)
  1. Search Kalshi for just the entity name (e.g., "Tesla")
  2. Filter results: event.title or event.sub_title must contain
     one of [entity, ticker, companyName] (case-insensitive)
  3. Return only matching events (max 5)
```

Filter logic (mirrors the working overlap widget):
```text
for each event from Kalshi:
  combined = (event.title + " " + event.sub_title).toLowerCase()
  keep if:
    - combined includes entity.toLowerCase(), OR
    - combined includes ticker.toLowerCase(), OR
    - combined includes companyName.toLowerCase()
  discard otherwise
```

This ensures "Will Elon Musk go to Mars?" is dropped because its title contains neither "Tesla", "TSLA", nor "Tesla Inc".

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useKalshiMarkets.ts` | Add client-side relevance filter to `useRelatedPredictions` select function |
| `src/pages/TrendDetail.tsx` | Pass company name to `useRelatedPredictions` for better matching |

