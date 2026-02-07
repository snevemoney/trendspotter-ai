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
