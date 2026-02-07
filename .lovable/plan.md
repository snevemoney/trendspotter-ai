

# Social Arbitrage Trend Scanner — Full MVP Plan

## Overview
A web app that simulates scanning TikTok for consumer/product trends, scores them, maps them to public companies using AI, and presents everything in a fast, data-dense dashboard for triage. Built with Lovable Cloud (Supabase backend) + Lovable AI.

---

## 1. Authentication & User Setup
- Email + password login/signup with Supabase Auth
- User profile with timezone and notification preferences
- Disclaimer banner: "For research/education only. Not financial advice."

## 2. Database Schema
Set up ~10 tables in Lovable Cloud:
- **profiles** — timezone, notification prefs
- **keywords** — rotating keyword list per user (default 6 preloaded)
- **scans** — scan log (timestamp, keyword used, mode, status)
- **videos** — simulated TikTok video data (video ID, URL, posted date, author, metrics, keyword)
- **extracted_entities** — brand/product names extracted from videos with confidence
- **trend_items** — aggregated trends with score (0–100), label (Low/Medium/High), summary
- **trend_video_links** — many-to-many linking trends to source videos
- **company_matches** — AI-suggested ticker/company mappings per trend
- **user_actions** — save/ignore/shortlist/archive actions with notes & tags
- **watchlist** — tracked brands and tickers per user

## 3. Simulated Data & Seed Engine
- Pre-populate realistic mock TikTok video data across the default 6 keywords
- Include varied brands (e.g., Stanley, CeraVe, Dyson, Starbucks, Crocs, etc.)
- Simulate engagement metrics (likes, comments, shares) and posting dates
- A "Run Scan" button that simulates a scan cycle: picks next keyword, generates new mock videos, runs entity extraction + scoring

## 4. Dashboard Page
- **Top KPI cards**: Trends detected (24h/7d), new brands found, mapped tickers, high-signal video count
- **Latest Trend Feed** — sortable table/card view showing:
  - Timestamp, keyword used, brand/product, confidence score badge (Low/Med/High)
  - Video metrics (likes/comments/shares), posted date (freshness highlighted)
  - Mapped company/ticker (if found)
  - Quick actions: Save, Ignore, Add to Watchlist, Open video link

## 5. Trends / Ideas List Page
- **Filters & sorting**: date range, keyword, confidence range, "mapped ticker only", "contains restock/sold out"
- Each trend opens a **Trend Detail** panel/page:
  - Extracted brands/products
  - AI-generated 3–5 bullet "why trending" summary (via Lovable AI)
  - Paraphrased user sentiment
  - Suggested public company matches ranked by confidence (via Lovable AI)
  - User notes + tags
  - Status workflow: New → Reviewing → Shortlisted → Archived

## 6. Trend Confidence Scoring (0–100)
Automatically calculated based on:
- **Freshness**: posted this week = big boost
- **Signal phrases**: "sold out", "restock", "back in stock", "limited", "drop"
- **Engagement velocity**: likes/comments ratio
- **Repetition**: same brand across multiple videos in 24–72h
- **Mapping quality**: confidently maps to a public company
- Labels: Low (0–39), Medium (40–69), High (70–100)

## 7. AI-Powered Features (Lovable AI)
- **Entity extraction**: Extract brand/product names from video captions
- **Trend summarization**: Generate concise 60-word trend summaries
- **Company matching**: Propose public company + ticker + reasoning
- **Deduplication**: Merge similar brand spellings (e.g., "Starbucks tumbler" vs "Starbucks cold cup")

## 8. Watchlist Page
- Add brands or tickers to watchlist
- View all trends matching watchlist items
- In-app toast notifications when a watchlist match is detected with high confidence

## 9. Settings Page
- **Keyword management**: Add/remove/reorder the rotating keyword list
- **Scan frequency**: Configurable (default 5 min, simulated)
- **Mode toggle**: "Uploaded this week" (default) vs "Popular videos"
- **Thresholds**: Minimum likes/comments, minimum confidence score
- **Notification preferences**: In-app alert settings for high-confidence trends

## 10. Digest Views & Export
- **Daily Digest**: Top 10 high-confidence trends from last 24h
- **Weekly Digest**: Top 25 trends + most repeated brands
- **CSV Export**: Export filtered trends with all metadata

## 11. Design & UX
- Modern, minimal, data-dense layout using sidebar navigation
- Mobile-responsive design
- Fast filtering and search with clear timestamps
- Freshness indicators (color-coded: today, this week, older)
- Clean card + table hybrid views for scanning lots of data quickly

## 12. Navigation Structure
Sidebar with: Dashboard, Trends, Watchlist, Daily Digest, Weekly Digest, Settings

