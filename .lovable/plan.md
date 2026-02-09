

# Fixes for Scanner Issues Found During Testing

Two minor issues were discovered during end-to-end testing. Here is what needs to be fixed:

## Issue 1: Trend Feed Not Refreshing After Manual Scan

**Problem**: After clicking "Run Scan", the KPI cards update but the trend feed table still shows "No trends yet" until you manually refresh the page. This happens because the `useScan` hook doesn't invalidate the trends query cache after completing a scan.

**Fix**: In `src/hooks/useScan.ts`, add a call to `queryClient.invalidateQueries` after the scan completes to refresh the trends data, dashboard stats, and scanner status.

- Import `useQueryClient` from `@tanstack/react-query`
- After the scan completes successfully (before the toast), invalidate these query keys:
  - `["trends"]`
  - `["dashboard-stats"]`
  - `["scanner-status"]`

## Issue 2: Scanner Status Shows "initializing..." Until First Cron Run

**Problem**: When a new user signs up, none of their keywords have `is_current = true`, so the Scanner Status card shows "initializing..." until the cron job processes their account for the first time.

**Fix**: Update the database trigger that creates default keywords on signup to also mark the first keyword as `is_current = true`. This ensures the scanner status shows the correct keyword immediately.

- Modify the `handle_new_user` function (or equivalent trigger) to set `is_current = true` on the first keyword (sort_order = 0)
- Alternatively, update the `useScannerStatus` hook to fall back to showing the first keyword by sort order when no keyword has `is_current = true`

---

## Technical Details

### File Changes

**`src/hooks/useScan.ts`**
- Add `useQueryClient` import
- Get `queryClient` instance inside the hook
- After scan completion, call:
```typescript
queryClient.invalidateQueries({ queryKey: ["trends"] });
queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
queryClient.invalidateQueries({ queryKey: ["scanner-status"] });
```

**Database migration** (for the is_current fix)
- SQL to update the `handle_new_user` trigger function to set `is_current = true` on the first inserted keyword

**`src/hooks/useScannerStatus.ts`** (fallback approach)
- If no keyword has `is_current = true`, query the first active keyword by `sort_order` and display it as the current keyword

Both fixes are small, targeted changes that don't affect the overall architecture.
