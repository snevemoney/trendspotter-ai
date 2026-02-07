import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useScannerStatus } from "@/hooks/useScannerStatus";
import { Radio, Clock, RotateCw, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function ScannerStatusCard() {
  const { data: status, isLoading } = useScannerStatus();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const cycleProgress = status.cyclesPerKeyword > 0
    ? Math.round((status.cyclesCompleted / status.cyclesPerKeyword) * 100)
    : 0;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          Auto-Scanner Active
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        {/* Current Keyword */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Radio className="h-3.5 w-3.5" />
            <span>Scanning</span>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {status.currentKeyword || "initializing..."}
          </Badge>
        </div>

        {/* Cycle Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <RotateCw className="h-3 w-3" />
              <span>Cycle Progress</span>
            </div>
            <span className="font-mono">
              {status.cyclesCompleted}/{status.cyclesPerKeyword}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${cycleProgress}%` }}
            />
          </div>
        </div>

        {/* Last Scan & Frequency */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            <span>Last scan</span>
          </div>
          <span>
            {status.lastScanAt
              ? formatDistanceToNow(new Date(status.lastScanAt), { addSuffix: true })
              : "never"}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Frequency</span>
          <span>every {status.scanFrequencyMinutes} min</span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Keywords</span>
          <span>{status.totalActiveKeywords} active</span>
        </div>
      </CardContent>
    </Card>
  );
}
