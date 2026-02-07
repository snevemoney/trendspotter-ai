

# Automated 5-Minute Scan with 1-Hour Keyword Rotation

## What Changes

Right now scanning is manual (button click). This plan adds a fully automated background scan that runs every 5 minutes, with each keyword getting 12 consecutive cycles (1 hour) before rotating to the next one.

### Rotation Logic

With 6 default keywords, a full rotation cycle looks like this:

```text
Keyword 1: "restock alert"        -> 12 scans (1 hour)
Keyword 2: "tiktok made me buy"   -> 12 scans (1 hour)
Keyword 3: "back in stock"        -> 12 scans (1 hour)
Keyword 4: "run don't walk"       -> 12 scans (1 hour)
Keyword 5: "sold out everywhere"  -> 12 scans (1 hour)
Keyword 6: "limited drop"         -> 12 scans (1 hour)
                                   = 6 hours total, then repeats
```

---

## Implementation Steps

### 1. Database: Add rotation tracking columns

Add two columns to the `keywords` table to track which keyword is currently active and how many cycles it has completed:

- `is_current` (boolean, default false) -- marks the active keyword
- `cycles_completed` (integer, default 0) -- counts scans done in current rotation (resets at 12)

Also add a `scan_rotation_state` table (or use the profiles table) to track the current rotation globally per user.

### 2. Backend Function: `scheduled-scan`

Create a new backend function at `supabase/functions/scheduled-scan/index.ts` that:

1. Fetches all users with active keywords
2. For each user:
   - Finds the current active keyword (where `is_current = true`)
   - If no keyword is current, picks the first one by sort order
   - Runs the scan logic (generate mock videos, extract entities, score trends -- same as the existing `useScan` hook but server-side)
   - Increments `cycles_completed` on the keyword
   - If `cycles_completed >= 12`, resets it to 0, sets `is_current = false`, and moves `is_current = true` to the next keyword in sort order
3. Logs the scan result

### 3. Cron Job: Run every 5 minutes

Set up a database cron job using `pg_cron` + `pg_net` to call the backend function every 5 minutes:

```text
Schedule: */5 * * * * (every 5 minutes)
Action: HTTP POST to the scheduled-scan function
```

### 4. Move scan logic to shared utility

Extract the core scan logic (mock video generation, entity extraction, trend scoring, DB writes) from the frontend `useScan` hook into a shared pattern that the backend function can also use. The frontend "Run Scan" button will remain for manual triggering.

### 5. Dashboard: Show scan status

Update the Dashboard to display:
- Current active keyword and its cycle count (e.g., "restock alert -- cycle 7/12")
- Time until next auto-scan
- Last scan timestamp
- A visual indicator showing the scanner is running automatically

### 6. Settings: Configurable rotation

The Settings page already has a scan frequency slider. We'll connect it so:
- Scan frequency controls the cron interval (stored in profile, used by the backend function)
- Add a "cycles per keyword" setting (default 12) so users can adjust how long each keyword runs

---

## Technical Details

### Backend Function (`scheduled-scan`)
- Reads all users from `profiles` table
- For each user, queries their active keywords ordered by `sort_order`
- Performs the same mock data generation + scoring pipeline currently in `useScan.ts`
- Uses the Supabase service role key (available in edge functions) to write data on behalf of users
- Handles rotation: after 12 cycles on a keyword, advances to the next

### Database Migration
```sql
-- Add rotation tracking to keywords
ALTER TABLE keywords ADD COLUMN is_current boolean DEFAULT false;
ALTER TABLE keywords ADD COLUMN cycles_completed integer DEFAULT 0;

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Cron Setup (via SQL, not migration)
```sql
SELECT cron.schedule(
  'scheduled-scan-every-5-min',
  '*/5 * * * *',
  $$ SELECT net.http_post(...) $$
);
```

### Frontend Changes
- `useScan.ts`: Keep for manual scans, but also add a query to show current rotation state
- `Index.tsx` (Dashboard): Add a small "Scanner Status" card showing active keyword + cycle progress
- `Settings.tsx`: Wire up the frequency slider and add cycles-per-keyword config

