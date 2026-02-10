import { differenceInDays, differenceInHours } from "date-fns";

const SIGNAL_PHRASES = [
  "sold out", "restock", "back in stock", "limited", "drop",
  "tiktok made me buy", "run don't walk", "viral", "trending",
  "out of stock", "restocked", "limited edition",
];

export interface ScoreInput {
  postedAt: Date;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  videoCount: number; // how many videos mention same brand in 24-72h
  hasCompanyMatch: boolean;
}

export function calculateTrendScore(input: ScoreInput): {
  score: number;
  label: "low" | "medium" | "high";
  signals: string[];
} {
  let score = 0;
  const signals: string[] = [];
  const now = new Date();

  // Freshness (0-25 points)
  const hoursAgo = differenceInHours(now, input.postedAt);
  const daysAgo = differenceInDays(now, input.postedAt);
  if (hoursAgo <= 24) {
    score += 25;
    signals.push("posted today");
  } else if (daysAgo <= 3) {
    score += 20;
    signals.push("posted this week");
  } else if (daysAgo <= 7) {
    score += 12;
    signals.push("posted within 7 days");
  } else {
    score += 3;
  }

  // Signal phrases (0-20 points)
  const captionLower = input.caption.toLowerCase();
  const foundPhrases = SIGNAL_PHRASES.filter((p) => captionLower.includes(p));
  if (foundPhrases.length > 0) {
    score += Math.min(20, foundPhrases.length * 7);
    signals.push(...foundPhrases.map((p) => `"${p}"`));
  }

  // Engagement velocity (0-25 points)
  const engagementTotal = input.likes + input.comments * 3 + input.shares * 5;
  if (engagementTotal > 500000) {
    score += 25;
    signals.push("viral engagement");
  } else if (engagementTotal > 100000) {
    score += 20;
    signals.push("high engagement");
  } else if (engagementTotal > 10000) {
    score += 12;
    signals.push("moderate engagement");
  } else if (engagementTotal > 1000) {
    score += 5;
  }

  // Repetition (0-15 points)
  if (input.videoCount >= 5) {
    score += 15;
    signals.push("mentioned in 5+ videos");
  } else if (input.videoCount >= 3) {
    score += 10;
    signals.push("mentioned in 3+ videos");
  } else if (input.videoCount >= 2) {
    score += 5;
    signals.push("mentioned in 2 videos");
  }

  // Company match quality (0-15 points)
  if (input.hasCompanyMatch) {
    score += 15;
    signals.push("maps to public company");
  }

  score = Math.min(100, Math.max(0, score));
  const label: "low" | "medium" | "high" =
    score >= 70 ? "high" : score >= 40 ? "medium" : "low";

  return { score, label, signals };
}

export function getScoreColor(label: "low" | "medium" | "high") {
  switch (label) {
    case "high": return "bg-score-high text-score-high-foreground";
    case "medium": return "bg-score-medium text-score-medium-foreground";
    case "low": return "bg-score-low text-score-low-foreground";
  }
}

export function getFreshnessColor(date: Date) {
  const daysAgo = differenceInDays(new Date(), date);
  if (daysAgo === 0) return "text-fresh-today";
  if (daysAgo <= 7) return "text-fresh-week";
  return "text-fresh-older";
}

// --- Blindspot Detection ---

const WELL_KNOWN_TICKERS = [
  "AAPL", "NKE", "SBUX", "AMZN", "GOOGL", "META", "MSFT", "TSLA",
  "GOOG", "NVDA", "JPM", "V", "WMT", "DIS", "KO", "PEP", "MCD",
  "COST", "HD", "TGT", "LULU",
];

const FOREIGN_EXCHANGES = ["Euronext", "TSE", "LSE", "HKEX", "SSE", "ASX"];

export interface BlindspotInput {
  score: number;
  ticker?: string | null;
  exchange?: string | null;
  companyName?: string | null;
  totalLikes: number;
  videoCount: number;
  hoursOld: number;
}

export function calculateBlindspotScore(input: BlindspotInput): {
  blindspotScore: number;
  reason: string;
} {
  // Must have a ticker to be a blindspot opportunity
  if (!input.ticker) {
    return { blindspotScore: 0, reason: "No ticker mapped" };
  }

  let bsScore = 0;
  const reasons: string[] = [];

  // 1. Engagement vs name recognition (0-30 pts)
  const isWellKnown = WELL_KNOWN_TICKERS.includes(input.ticker.toUpperCase());
  const engagementTotal = input.totalLikes;

  if (!isWellKnown && engagementTotal > 100000) {
    bsScore += 30;
    reasons.push("high engagement, lesser-known ticker");
  } else if (!isWellKnown && engagementTotal > 10000) {
    bsScore += 20;
    reasons.push("moderate engagement, lesser-known ticker");
  } else if (!isWellKnown && engagementTotal > 1000) {
    bsScore += 10;
    reasons.push("some engagement, lesser-known ticker");
  } else if (isWellKnown) {
    bsScore += 0;
    reasons.push("well-known ticker");
  }

  // 2. Company obscurity (0-30 pts)
  const isForeignExchange = input.exchange && FOREIGN_EXCHANGES.includes(input.exchange);
  if (isForeignExchange) {
    bsScore += 25;
    reasons.push(`foreign listing (${input.exchange})`);
  } else if (!isWellKnown) {
    bsScore += 15;
    reasons.push("under-the-radar company");
  }

  // 3. Recency (0-20 pts)
  if (input.hoursOld <= 24) {
    bsScore += 20;
    reasons.push("just emerging");
  } else if (input.hoursOld <= 72) {
    bsScore += 15;
    reasons.push("recently emerged");
  } else if (input.hoursOld <= 168) {
    bsScore += 8;
  }

  // 4. Trend acceleration (0-20 pts)
  if (input.videoCount >= 5) {
    bsScore += 20;
    reasons.push("rapid multi-video trend");
  } else if (input.videoCount >= 3) {
    bsScore += 12;
    reasons.push("accelerating trend");
  } else if (input.videoCount >= 2) {
    bsScore += 5;
  }

  bsScore = Math.min(100, Math.max(0, bsScore));

  return {
    blindspotScore: bsScore,
    reason: reasons.slice(0, 3).join(", "),
  };
}
