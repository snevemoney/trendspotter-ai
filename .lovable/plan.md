

# Trade Alert Notification System + Kalshi Verification

This plan covers three parts: (1) building a notification system that fires alerts when a trending product has a matching Kalshi market with high probability, (2) verifying the Predictions page loads correctly, and (3) testing the AI chat with prediction market queries.

---

## Part 1: Notification System for Social + Prediction Signal Overlap

### Database

Create a `notifications` table to store alerts:

```text
notifications
- id (uuid, PK)
- user_id (uuid, NOT NULL)
- type (text) -- e.g. "prediction_match", "high_blindspot", "trend_alert"
- title (text)
- message (text)
- trend_id (uuid, nullable, FK to trend_items)
- metadata (jsonb) -- stores ticker, probability, Kalshi event ticker, etc.
- read (boolean, default false)
- created_at (timestamptz)
```

RLS policies: users can only read/update their own notifications.

### Alert Generation Logic

After each scan completes (in both `useScan.ts` and `scheduled-scan`):

1. For each trend item that has a company match (ticker), call the `kalshi-markets` edge function to search for related events using the brand name and ticker.
2. If a matching Kalshi event is found with probability >= 65%, create a notification record:
   - Title: "Prediction Signal: [Brand] ([Ticker])"
   - Message: "[Brand] is trending on TikTok (score X) and Kalshi market '[market title]' is at Y% probability"
   - Metadata: `{ ticker, probability, kalshiEventTicker, trendScore, blindspotScore }`

This runs client-side for manual scans and server-side for scheduled scans.

### Notification Bell + Dropdown (Frontend)

Create `src/components/NotificationBell.tsx`:
- Bell icon in the sidebar header (or top-right of AppLayout)
- Unread count badge (red dot with number)
- Click opens a dropdown/popover showing recent notifications
- Each notification is clickable -- navigates to the relevant trend detail page
- "Mark all as read" button
- Notifications sorted by created_at DESC, limit 20

Create `src/hooks/useNotifications.ts`:
- `useNotifications()` -- fetches unread + recent notifications
- `useMarkAsRead()` -- marks notification(s) as read
- `useUnreadCount()` -- returns count of unread notifications (for badge)

### Notifications Page

Create `src/pages/Notifications.tsx`:
- Full list of all notifications with pagination
- Filter by type (prediction match, blindspot, etc.)
- Mark individual or all as read
- Add to sidebar navigation and App.tsx routes

### Real-time Updates

Enable realtime on the `notifications` table so the bell icon updates instantly when a scheduled scan generates a new alert (without page refresh).

---

## Part 2: Verify Predictions Page

After implementation, navigate to `/predictions` and confirm:
- Markets load from Kalshi API
- Search input filters markets correctly
- Category buttons filter by category
- Event cards show probability bars, volume, and close dates
- Expanding a card shows all sub-markets

## Part 3: Verify AI Chat with Predictions

Test these prompts in the AI chat:
- "what does the market think?"
- "show me Kalshi predictions"
- Confirm the response includes prediction market data tables

---

## Technical Details

### Files to Create

- `supabase/migrations/[timestamp]_notifications.sql` -- notifications table + RLS + realtime
- `src/hooks/useNotifications.ts` -- queries + mutations for notifications
- `src/components/NotificationBell.tsx` -- bell icon with dropdown
- `src/pages/Notifications.tsx` -- full notifications page

### Files to Modify

- `src/hooks/useScan.ts` -- after scan completion, check for Kalshi matches and create notifications
- `supabase/functions/scheduled-scan/index.ts` -- same alert generation for automated scans
- `src/components/AppSidebar.tsx` -- add NotificationBell to header, add Notifications nav item
- `src/components/AppLayout.tsx` -- optionally place bell in top bar
- `src/App.tsx` -- add `/notifications` route
- `src/integrations/supabase/types.ts` -- auto-updated with new table

### Alert Matching Logic (in useScan.ts)

```typescript
// After scan completes, check for prediction matches
const trendTickers = [...new Set(companyMatches.map(m => m.ticker))];
for (const ticker of trendTickers) {
  const kalshiRes = await fetch(
    `${SUPABASE_URL}/functions/v1/kalshi-markets?action=events&search=${ticker}&limit=5&status=open`,
    { headers: { Authorization: `Bearer ${ANON_KEY}` } }
  );
  const kalshiData = await kalshiRes.json();
  const events = kalshiData?.events || [];
  for (const event of events) {
    const market = event.markets?.[0];
    const prob = market ? Math.round(market.last_price * 100) : 0;
    if (prob >= 65) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "prediction_match",
        title: `Prediction Signal: ${ticker}`,
        message: `${brandName} trending (score ${score}) + "${event.title}" at ${prob}% probability`,
        trend_id: trendId,
        metadata: { ticker, probability: prob, kalshiEvent: event.event_ticker }
      });
    }
  }
}
```

### Notification Bell Component

```typescript
// Unread count query with realtime subscription
const channel = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${user.id}`,
  }, () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  })
  .subscribe();
```

### Database Migration SQL

```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'prediction_match',
  title text NOT NULL,
  message text NOT NULL,
  trend_id uuid REFERENCES public.trend_items(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE INDEX idx_notifications_user_unread
  ON public.notifications(user_id, read)
  WHERE read = false;
```

