import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/ScoreBadge";
import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { useTrends, useTrendAction } from "@/hooks/useTrends";
import { useAddToWatchlist } from "@/hooks/useWatchlist";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bookmark,
  Star,
  EyeOff,
  Eye,
  Heart,
  MessageCircle,
  Search,
  Filter,
  Loader2,
  Download,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";

export default function Trends() {
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [maxScore, setMaxScore] = useState(100);
  const [mappedOnly, setMappedOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: trends, isLoading } = useTrends({
    minScore,
    maxScore,
    mappedOnly,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const trendAction = useTrendAction();
  const addToWatchlist = useAddToWatchlist();
  const navigate = useNavigate();

  const filteredTrends = (trends || []).filter((t: any) =>
    search
      ? t.primary_entity.toLowerCase().includes(search.toLowerCase()) ||
        t.summary?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  const exportCSV = () => {
    if (!filteredTrends.length) return;
    const headers = [
      "Brand",
      "Score",
      "Label",
      "Status",
      "Summary",
      "Ticker",
      "Videos",
      "Total Likes",
      "First Seen",
      "Last Seen",
    ];
    const rows = filteredTrends.map((t: any) => [
      t.primary_entity,
      t.score,
      t.label,
      t.status,
      `"${(t.summary || "").replace(/"/g, '""')}"`,
      t.company_matches?.[0]?.ticker || "",
      t.video_count,
      t.total_likes,
      t.first_seen,
      t.last_seen,
    ]);

    const csv = [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trends-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Trends</h1>
            <p className="text-sm text-muted-foreground">
              {filteredTrends.length} trend{filteredTrends.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search brands, products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Confidence Score</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono w-6">{minScore}</span>
                  <Slider
                    value={[minScore, maxScore]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={([min, max]) => {
                      setMinScore(min);
                      setMaxScore(max);
                    }}
                    className="flex-1"
                  />
                  <span className="text-xs font-mono w-6">{maxScore}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={mappedOnly}
                  onCheckedChange={setMappedOnly}
                  id="mapped"
                />
                <Label htmlFor="mapped" className="text-xs">
                  Mapped ticker only
                </Label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !filteredTrends.length ? (
              <div className="text-center py-12 text-muted-foreground">
                No trends match your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Brand/Product</TableHead>
                      <TableHead className="text-xs">Score</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Status</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Ticker</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Videos</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Freshness</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrends.map((trend: any) => {
                      const match = trend.company_matches?.[0];
                      return (
                        <TableRow
                          key={trend.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/trends/${trend.id}`)}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{trend.primary_entity}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {trend.summary}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <ScoreBadge score={trend.score} label={trend.label} />
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {trend.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {match ? (
                              <span className="font-mono text-xs text-primary">{match.ticker}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="text-xs font-mono">{trend.video_count}</span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <FreshnessIndicator date={trend.last_seen} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Save"
                                onClick={() => trendAction.mutate({ trendId: trend.id, action: "saved" })}
                              >
                                <Bookmark className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Shortlist"
                                onClick={() => trendAction.mutate({ trendId: trend.id, action: "shortlisted" })}
                              >
                                <Star className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Watch"
                                onClick={() =>
                                  addToWatchlist.mutate({ type: "brand", value: trend.primary_entity })
                                }
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
