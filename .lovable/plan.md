

# Always Show Related Prediction Events

## Problem

The `useRelatedPredictions` hook applies a strict client-side filter that removes events whose title/subtitle don't explicitly mention the entity, ticker, or company name. This causes the "Related Predictions" section on the Trend Detail page to often appear empty, even when Kalshi returned relevant results for the search query.

## Solution

Remove the client-side `select` filter from `useRelatedPredictions` so that all events returned by the Kalshi API search are displayed. The API search itself already provides relevance-based results since we pass the entity name as the search term.

## Changes

| File | Change |
|------|--------|
| `src/hooks/useKalshiMarkets.ts` | Remove the `select` function from `useRelatedPredictions` so all API-returned events are shown (capped at 5) |

## Technical Detail

In `useRelatedPredictions`, replace the current `select` function that filters by term matching with a simple slice:

```text
Before:
  select: (data) => {
    const events = (data?.events || []) as KalshiEvent[];
    const terms = [entity, ...(tickers || []), companyName]
      .filter(...)
      .map(t => t.toLowerCase());
    return events.filter(e => {
      const combined = `${e.title} ${e.sub_title || ""}`.toLowerCase();
      return terms.some(term => combined.includes(term));
    }).slice(0, 5);
  }

After:
  select: (data) => {
    const events = (data?.events || []) as KalshiEvent[];
    return events.slice(0, 5);
  }
```

The Kalshi API already performs server-side search relevance filtering via the `search` parameter, so the client-side filter was overly restrictive.

