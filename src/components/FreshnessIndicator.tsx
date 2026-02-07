import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { getFreshnessColor } from "@/lib/scoring";

interface FreshnessIndicatorProps {
  date: Date | string;
  className?: string;
}

export function FreshnessIndicator({ date, className }: FreshnessIndicatorProps) {
  const d = typeof date === "string" ? new Date(date) : date;
  const color = getFreshnessColor(d);

  return (
    <span className={cn("text-xs font-mono", color, className)} title={format(d, "PPpp")}>
      {formatDistanceToNow(d, { addSuffix: true })}
    </span>
  );
}
