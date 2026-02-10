import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKalshiEvents, KalshiEvent } from "@/hooks/useKalshiMarkets";
import { BarChart3, Search, Loader2, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Economics", value: "economics" },
  { label: "Tech", value: "tech" },
  { label: "Consumer", value: "consumer" },
  { label: "Entertainment", value: "entertainment" },
  { label: "Politics", value: "politics" },
];

export default function Predictions() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data: events, isLoading, refetch } = useKalshiEvents({
    search,
    category,
    limit: 40,
  });

  const handleSearch = () => {
    setSearch(searchInput);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Prediction Markets
          </h1>
          <p className="text-sm text-muted-foreground">
            Live prediction markets from Kalshi — see what the market thinks will happen
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search markets..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="max-w-sm"
            />
            <Button variant="outline" size="icon" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={category === cat.value ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => setCategory(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Markets Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !events?.length ? (
          <div className="text-center py-20 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No prediction markets found</p>
            <p className="text-xs mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <EventCard key={event.event_ticker} event={event} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function EventCard({ event }: { event: KalshiEvent }) {
  const [expanded, setExpanded] = useState(false);
  const topMarket = event.markets?.[0];
  const probability = topMarket ? Math.round(topMarket.last_price * 100) : null;

  return (
    <Card
      className="cursor-pointer hover:border-primary/30 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4 space-y-3">
        <div>
          <p className="font-medium text-sm leading-tight">{event.title}</p>
          {event.sub_title && (
            <p className="text-xs text-muted-foreground mt-1">{event.sub_title}</p>
          )}
        </div>

        {probability !== null && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Probability</span>
              <span
                className={`text-sm font-mono font-bold ${
                  probability >= 70
                    ? "text-green-600"
                    : probability <= 30
                    ? "text-red-600"
                    : "text-foreground"
                }`}
              >
                {probability}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  probability >= 70
                    ? "bg-green-500"
                    : probability <= 30
                    ? "bg-red-500"
                    : "bg-primary"
                }`}
                style={{ width: `${probability}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          {topMarket?.volume != null && (
            <span className="flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              Vol: {topMarket.volume.toLocaleString()}
            </span>
          )}
          {topMarket?.close_time && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              Closes: {format(new Date(topMarket.close_time), "MMM d")}
            </span>
          )}
          {event.category && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {event.category}
            </Badge>
          )}
        </div>

        {expanded && event.markets && event.markets.length > 1 && (
          <div className="border-t pt-2 mt-2 space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">All Markets</p>
            {event.markets.map((m) => (
              <div key={m.ticker} className="flex items-center justify-between text-xs">
                <span className="truncate flex-1 mr-2">{m.yes_sub_title || m.ticker}</span>
                <span className="font-mono font-medium">{Math.round(m.last_price * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
