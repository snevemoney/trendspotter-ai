

# Fix: TikTok Video Links Not Working

## Problem

Clicking a source video link leads to a non-existent TikTok page. Two issues in the `tiktok-search` edge function cause this:

1. **Wrong URL field**: The `url` field prefers `item.play`, which is a direct MP4 file URL (e.g., `https://v16.tiktokcdn.com/...`), not a TikTok page link users can visit.
2. **Fake video IDs**: When `item.video_id` or `item.id` aren't found in the API response, a random ID is generated (`tt_1770686404992_256329`), making any constructed URL invalid.

## Root Cause

The RapidAPI "tiktok-scraper7" response likely uses different field names than what the code expects. The code never constructs a proper TikTok page URL from the real video ID and author handle.

## Solution

### 1. Update `supabase/functions/tiktok-search/index.ts`

- Add a temporary `console.log(JSON.stringify(items[0]))` to capture the actual API response shape (can be removed after verifying)
- Extract the real video ID from multiple possible fields: `item.video_id`, `item.id`, `item.aweme_id`
- Always construct the TikTok page URL as: `https://www.tiktok.com/@{author_handle}/video/{video_id}` instead of using `item.play`
- Only fall back to `item.play` if no real video ID is available (last resort)
- Skip videos that have no real video ID rather than inserting broken links

### 2. Clean up old broken data (optional)

Old videos with fake `tt_` prefixed IDs and broken URLs already exist in the database. These can be cleaned up with a database query to delete videos where `video_id LIKE 'tt_%'`, or they will naturally age out.

## Changes Summary

| File | Change |
|------|--------|
| `supabase/functions/tiktok-search/index.ts` | Fix URL construction to always build proper TikTok page URLs; add debug logging for API response shape; handle `aweme_id` field |

## Technical Detail

Updated video normalization logic:

```text
1. Extract real video ID:
   realId = item.video_id || item.aweme_id || item.id

2. Extract author handle:
   handle = item.author?.unique_id || item.author?.nickname

3. Build page URL (not play URL):
   if (realId && handle):
     url = "https://www.tiktok.com/@{handle}/video/{realId}"
   else:
     url = item.play  (fallback, at least links to something)

4. Skip video entirely if no realId (don't generate fake IDs)
```

This ensures every stored URL points to a real, visitable TikTok page.
