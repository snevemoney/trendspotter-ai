

# AI Chat Feature -- Scan Intelligence Assistant

## What This Adds

An AI-powered chat interface, accessible from the sidebar, where you can interact with your scan data in real-time. Inspired by the OpenClaw reference screenshots, the chat will produce structured scan reports showing hot products, ticker signals, related searches, and rotation status -- all formatted with tables and sections like the examples you shared.

---

## How It Works

### Chat Page (`/chat`)
A new page with a conversational interface where you can:
- Ask the AI to summarize the latest scan results
- Request specific analysis ("show me high-signal brands from today")
- Get formatted scan reports that mirror the OpenClaw style:
  - Header with scan completion status and keyword rotation info
  - "Hot Products Found" table with Product / Views / Signal columns
  - "Ticker Signals" section listing mapped tickers with reasoning
  - "Related Searches" showing cross-references
  - Entry count and rotation status footer

### AI Backend (Edge Function)
A new backend function (`chat-assistant`) that:
1. Receives user messages along with conversation history
2. Queries the database for relevant scan data, trends, company matches, and keyword rotation state
3. Sends everything to Lovable AI (using `google/gemini-2.5-flash`) with a system prompt that instructs it to format responses in the OpenClaw style
4. Returns a markdown-formatted response rendered in the chat UI

### Chat Message Persistence
A new `chat_messages` table stores conversation history so you can revisit past sessions:
- `id`, `user_id`, `role` (user/assistant), `content`, `created_at`
- RLS policies so only your messages are visible

---

## UI Design

The chat interface will be:
- Clean, dark-themed, matching the existing app aesthetic
- Message bubbles with markdown rendering (tables, bold, lists)
- A text input bar at the bottom with Send button
- Auto-scroll to latest message
- Loading indicator while AI responds
- Accessible from the sidebar as "AI Chat" with a message icon

---

## Implementation Steps

### 1. Database Migration
Create a `chat_messages` table:
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `role` (text: "user" or "assistant")
- `content` (text)
- `created_at` (timestamptz)
- RLS policies for user-scoped read/write

### 2. Backend Function: `chat-assistant`
New edge function at `supabase/functions/chat-assistant/index.ts`:
- Accepts POST with `{ message, conversationHistory }` 
- Queries the user's latest data from the database:
  - Recent scans (last scan details, keyword, rotation state)
  - Top trending products (sorted by score)
  - Company/ticker matches
  - Keyword rotation state (current keyword, cycle progress)
- Builds a system prompt that instructs the AI to:
  - Format output like the OpenClaw examples (scan header, product table, ticker signals, related searches)
  - Use markdown tables for structured data
  - Include engagement metrics formatted as K/M
  - Show rotation status when relevant
- Calls Lovable AI (`google/gemini-2.5-flash`) with the context + conversation history
- Returns the AI response

### 3. Frontend Components

**New Files:**
- `src/pages/Chat.tsx` -- Main chat page with message list and input
- `src/hooks/useChat.ts` -- Hook for sending messages, loading history, managing state
- `src/components/ChatMessage.tsx` -- Individual message component with markdown rendering

**Modified Files:**
- `src/components/AppSidebar.tsx` -- Add "AI Chat" nav item
- `src/App.tsx` -- Add `/chat` route
- `supabase/config.toml` -- Register `chat-assistant` function

### 4. Message Rendering
- Use `react-markdown` to render AI responses with proper tables, bold text, bullet lists
- Style tables to match the dark theme
- Copy-to-clipboard button on AI messages (matching the OpenClaw screenshots)

---

## Technical Details

### System Prompt Strategy
The AI will receive a carefully crafted system prompt that includes:
- Current scanner state (active keyword, cycle count, rotation status)
- Recent trend data pre-formatted for easy reference
- Instructions to format responses like:

```
# Social Arbitrage Scan Complete
Keyword: `sold out everywhere` (cycle 12/12 -> rotating to `they keep selling out`)

## Hot Products Found:
| Product | Views | Signal |
|---------|-------|--------|
| Starbucks Limited Cups | 160K | People lined up at doors before open |
| Labubu (Pop Mart) | 109K + 145K | TWO viral videos, collectibles still dominating |

## Ticker Signals:
- **SBUX** -- Seasonal cup hype massive (160K views)
- **NFLX** -- Bridgerton IP driving merch

## Related Searches:
- PS5 still selling out -> SONY
- Alani energy drinks selling out -> watch for acquisition

Logged 11 entries to brands.csv. Keyword rotated for next cycle.
```

### Edge Function Data Flow
```
User message
  -> chat-assistant edge function
    -> Query DB for context (trends, scans, tickers, rotation state)
    -> Build system prompt + user message + history
    -> Call Lovable AI (gemini-2.5-flash)
    -> Return formatted response
  -> Display in chat UI with markdown rendering
```

### Dependencies
- `react-markdown` -- for rendering AI responses with tables and formatting

