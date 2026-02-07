import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from "@/hooks/useWatchlist";
import { useTrends } from "@/hooks/useTrends";
import { ScoreBadge } from "@/components/ScoreBadge";
import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { Eye, Plus, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Watchlist() {
  const { data: watchlist, isLoading } = useWatchlist();
  const { data: trends } = useTrends();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const navigate = useNavigate();

  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState<"brand" | "ticker">("brand");

  const handleAdd = () => {
    if (!newValue.trim()) return;
    addToWatchlist.mutate({ type: newType, value: newValue });
    setNewValue("");
  };

  // Find matching trends for watchlist items
  const matchingTrends = (trends || []).filter((t: any) => {
    return watchlist?.some((w) => {
      if (w.type === "brand") {
        return t.primary_entity.toLowerCase().includes(w.value.toLowerCase());
      }
      if (w.type === "ticker") {
        return t.company_matches?.some(
          (m: any) => m.ticker?.toLowerCase() === w.value.toLowerCase()
        );
      }
      return false;
    });
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Watchlist</h1>
          <p className="text-sm text-muted-foreground">
            Track brands and tickers across your trend data
          </p>
        </div>

        {/* Add to watchlist */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Select value={newType} onValueChange={(v: "brand" | "ticker") => setNewType(v)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brand">Brand</SelectItem>
                  <SelectItem value="ticker">Ticker</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder={newType === "brand" ? "e.g. Stanley" : "e.g. SBUX"}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="flex-1"
              />
              <Button onClick={handleAdd} disabled={addToWatchlist.isPending}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Watchlist items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" /> Watching ({watchlist?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !watchlist?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No items in your watchlist yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {watchlist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <Badge variant="outline" className="text-[10px]">
                      {item.type}
                    </Badge>
                    <span className="text-sm font-medium">{item.value}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFromWatchlist.mutate(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Matching trends */}
        {matchingTrends.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Matching Trends ({matchingTrends.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {matchingTrends.map((trend: any) => (
                <div
                  key={trend.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/trends/${trend.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <ScoreBadge score={trend.score} label={trend.label} />
                    <div>
                      <p className="text-sm font-medium">{trend.primary_entity}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {trend.summary}
                      </p>
                    </div>
                  </div>
                  <FreshnessIndicator date={trend.last_seen} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
