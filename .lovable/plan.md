

# Smart Scan: Remove Keyword Prerequisite

## Problem

Currently, clicking "Run Scan" with no keywords shows a red error toast ("No keywords - Add keywords in Settings first") and does nothing. Users must navigate to Settings to manually add keywords before scanning, which is a bad first-run experience.

## Solution

Replace the "Run Scan" button with a smarter flow that works in three ways:

1. **Has keywords**: Works as before -- picks the next keyword in rotation and scans.
2. **No keywords**: Instead of erroring, show a dialog/popover that lets the user:
   - **Type a custom keyword** to scan immediately
   - **Pick from top suggestions** pulled from the keyword library (e.g., 8-10 popular ones like "nike", "starbucks", "airpods", "lululemon")
   - The chosen keyword gets auto-saved to their keywords list so future scans rotate through it

## UI Design

Replace the single "Run Scan" button with logic that:
- If keywords exist: button works immediately (no change)
- If no keywords: clicking "Run Scan" opens a **Dialog** with:
  - A text input ("Type a keyword to scan...")
  - A grid of suggestion chips from the keyword library (curated popular picks)
  - Clicking a chip or pressing Enter on the input starts the scan with that keyword (and saves it)

## Changes

### 1. Create `src/components/QuickScanDialog.tsx`
- New dialog component with:
  - Search input for custom keyword
  - Grid of ~12 popular keyword suggestions as clickable chips (curated from the library)
  - On selection: saves keyword to DB via `useAddKeyword`, then triggers scan
- Popular suggestions: hand-picked recognizable brands from the library (e.g., "nike", "apple", "starbucks", "lululemon", "cerave", "airpods", "stanley cup", "crumbl cookies", "shein haul", "protein coffee", "skincare routine", "gym shark")

### 2. Update `src/hooks/useScan.ts`
- Add an optional `keywordOverride` parameter to `runScan(keyword?: string)`
- If `keywordOverride` is provided, use it directly instead of querying the keywords table
- Remove the error toast for "No keywords" -- the UI handles this case now

### 3. Update `src/pages/Index.tsx` (Dashboard)
- Import `QuickScanDialog` and `useKeywords`
- When "Run Scan" is clicked:
  - If user has active keywords: run scan normally
  - If no active keywords: open the QuickScanDialog
- Dialog's onSelect callback: saves keyword + calls `runScan(selectedKeyword)`

## Technical Details

```text
QuickScanDialog props:
  - open: boolean
  - onOpenChange: (open: boolean) => void
  - onSelectKeyword: (keyword: string) => void

Dashboard flow:
  1. User clicks "Run Scan"
  2. Check keywords count
  3. If > 0: runScan() as normal
  4. If 0: setShowQuickScan(true)
  5. User picks/types keyword in dialog
  6. Save keyword to DB (useAddKeyword)
  7. runScan(keyword) with override
  8. Dialog closes

useScan changes:
  - runScan(keywordOverride?: string)
  - If override provided, create scan record with that keyword directly
  - Skip keyword rotation logic when override is used
```

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/QuickScanDialog.tsx` | New -- dialog with keyword input + suggestion chips |
| `src/hooks/useScan.ts` | Add optional keyword override parameter to `runScan` |
| `src/pages/Index.tsx` | Add dialog trigger when no keywords exist on scan click |

