import { cn } from "@/lib/utils";
import { getScoreColor } from "@/lib/scoring";

interface ScoreBadgeProps {
  score: number;
  label: "low" | "medium" | "high";
  className?: string;
  showScore?: boolean;
}

export function ScoreBadge({ score, label, className, showScore = true }: ScoreBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold font-mono",
        getScoreColor(label),
        className
      )}
    >
      {showScore && <span>{score}</span>}
      <span className="capitalize">{label}</span>
    </span>
  );
}
