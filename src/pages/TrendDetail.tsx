import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/ScoreBadge";
import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { useTrendDetail, useTrendAction } from "@/hooks/useTrends";
import { useAddToWatchlist } from "@/hooks/useWatchlist";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  Star,
  Archive,
  EyeOff,
  Eye,
  ExternalLink,
  Heart,
  MessageCircle,
  Share2,
  Loader2,
  Building2,
  TrendingUp,
  BarChart3,
  Clock,
} from "lucide-react";
import { useRelatedPredictions } from "@/hooks/useKalshiMarkets";
import { format } from "date-fns";

export default function TrendDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: trend, isLoading } = useTrendDetail(id);
  const trendAction = useTrendAction();
  const addToWatchlist = useAddToWatchlist();
  const [notes, setNotes] = useState("");

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!trend) {
    return (
      <AppLayout>
        <div className="text-center py-20 text-muted-foreground">Trend not found.</div>
      </AppLayout>
    );
  }

  const match = trend.company_matches?.[0];
  const videos = trend.trend_video_links?.map((link: any) => link.videos).filter(Boolean) || [];
  const { data: relatedPredictions } = useRelatedPredictions(
    trend.primary_entity,
    match?.ticker ? [match.ticker] : []
  );

  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{trend.primary_entity}</h1>
              <ScoreBadge score={trend.score} label={trend.label} />
              <Badge variant="outline" className="capitalize text-xs">
                {trend.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{trend.summary}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => trendAction.mutate({ trendId: trend.id, action: "saved" })}
          >
            <Bookmark className="h-4 w-4 mr-1" /> Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => trendAction.mutate({ trendId: trend.id, action: "shortlisted" })}
          >
            <Star className="h-4 w-4 mr-1" /> Shortlist
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              addToWatchlist.mutate({ type: "brand", value: trend.primary_entity })
            }
          >
            <Eye className="h-4 w-4 mr-1" /> Watch
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => trendAction.mutate({ trendId: trend.id, action: "archived" })}
          >
            <Archive className="h-4 w-4 mr-1" /> Archive
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => trendAction.mutate({ trendId: trend.id, action: "ignored" })}
          >
            <EyeOff className="h-4 w-4 mr-1" /> Ignore
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stats card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <Heart className="h-4 w-4 mx-auto text-muted-foreground" />
                  <p className="text-lg font-bold font-mono">
                    {formatNumber(trend.total_likes || 0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Likes</p>
                </div>
                <div className="text-center">
                  <MessageCircle className="h-4 w-4 mx-auto text-muted-foreground" />
                  <p className="text-lg font-bold font-mono">
                    {formatNumber(trend.total_comments || 0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Comments</p>
                </div>
                <div className="text-center">
                  <Share2 className="h-4 w-4 mx-auto text-muted-foreground" />
                  <p className="text-lg font-bold font-mono">
                    {formatNumber(trend.total_shares || 0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Shares</p>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Videos</span>
                  <span className="font-mono">{trend.video_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">First seen</span>
                  <FreshnessIndicator date={trend.first_seen} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last seen</span>
                  <FreshnessIndicator date={trend.last_seen} />
                </div>
              </div>
              {trend.signal_phrases?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Signals</p>
                  <div className="flex flex-wrap gap-1">
                    {trend.signal_phrases.map((s: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Match */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Company Match
              </CardTitle>
            </CardHeader>
            <CardContent>
              {match ? (
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">{match.company_name}</p>
                    <p className="text-lg font-mono font-bold text-primary">
                      {match.ticker}
                      <span className="text-xs text-muted-foreground ml-1">{match.exchange}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${(match.match_confidence || 0.5) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {((match.match_confidence || 0.5) * 100).toFixed(0)}% — {match.source}
                    </p>
                  </div>
                  {match.reasoning && (
                    <p className="text-xs text-muted-foreground">{match.reasoning}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No public company match found for this trend.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Related Predictions */}
        {relatedPredictions && relatedPredictions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Related Predictions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {relatedPredictions.map((event) => {
                const topMarket = event.markets?.[0];
                const probability = topMarket ? Math.round(topMarket.last_price * 100) : null;
                return (
                  <div key={event.event_ticker} className="p-3 rounded-lg bg-muted/30 space-y-1">
                    <p className="text-sm font-medium leading-tight">{event.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {probability !== null && (
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-mono ${
                            probability >= 70 ? "bg-green-500/10 text-green-600" : probability <= 30 ? "bg-red-500/10 text-red-600" : ""
                          }`}
                        >
                          {probability}% Yes
                        </Badge>
                      )}
                      {topMarket?.volume != null && (
                        <span>Vol: {topMarket.volume.toLocaleString()}</span>
                      )}
                      {topMarket?.close_time && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {format(new Date(topMarket.close_time), "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Source Videos */}
        {videos.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Source Videos ({videos.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {videos.map((video: any) => (
                <div
                  key={video.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{video.author}</p>
                    <p className="truncate">{video.caption}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Heart className="h-3 w-3" />
                        {formatNumber(video.likes || 0)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MessageCircle className="h-3 w-3" />
                        {formatNumber(video.comments || 0)}
                      </span>
                      {video.posted_at && (
                        <FreshnessIndicator date={video.posted_at} />
                      )}
                    </div>
                  </div>
                  {video.url && (
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              placeholder="Add your research notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <Button
              size="sm"
              onClick={() => {
                trendAction.mutate({
                  trendId: trend.id,
                  action: "saved",
                  notes,
                });
              }}
            >
              Save Notes
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
