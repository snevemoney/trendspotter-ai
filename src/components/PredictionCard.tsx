import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useKalshiEvents, KalshiEvent } from "@/hooks/useKalshiMarkets";
import { BarChart3, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PredictionCard() {
  const { data: events, isLoading } = useKalshiEvents({ limit: 5 });
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Prediction Markets
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/predictions")}>
            View All <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !events?.length ? (
          <p className="text-xs text-muted-foreground text-center py-4">No active prediction markets found</p>
        ) : (
          events.slice(0, 5).map((event) => {
            const topMarket = event.markets?.[0];
            const probability = topMarket ? Math.round(topMarket.last_price * 100) : null;

            return (
              <div key={event.event_ticker} className="p-2 rounded-lg bg-muted/30 space-y-1">
                <p className="text-xs font-medium leading-tight line-clamp-2">{event.title}</p>
                <div className="flex items-center gap-2">
                  {probability !== null && (
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-mono ${
                        probability >= 70
                          ? "bg-green-500/10 text-green-600"
                          : probability <= 30
                          ? "bg-red-500/10 text-red-600"
                          : ""
                      }`}
                    >
                      {probability}% Yes
                    </Badge>
                  )}
                  {topMarket?.volume != null && (
                    <span className="text-[10px] text-muted-foreground">
                      Vol: {topMarket.volume.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
