import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ScannerStatus {
  currentKeyword: string | null;
  cyclesCompleted: number;
  cyclesPerKeyword: number;
  lastScanAt: string | null;
  lastScanKeyword: string | null;
  totalActiveKeywords: number;
  scanFrequencyMinutes: number;
}

export function useScannerStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["scanner-status", user?.id],
    queryFn: async (): Promise<ScannerStatus> => {
      if (!user) throw new Error("Not authenticated");

      // Get current keyword
      const { data: currentKw } = await supabase
        .from("keywords")
        .select("keyword, cycles_completed")
        .eq("user_id", user.id)
        .eq("active", true)
        .eq("is_current", true)
        .maybeSingle();

      // Get active keyword count
      const { count: activeCount } = await supabase
        .from("keywords")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("active", true);

      // Get last scan
      const { data: lastScan } = await supabase
        .from("scans")
        .select("created_at, keyword_text")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get profile for settings
      const { data: profile } = await supabase
        .from("profiles")
        .select("scan_frequency_minutes, cycles_per_keyword")
        .eq("user_id", user.id)
        .single();

      return {
        currentKeyword: currentKw?.keyword || null,
        cyclesCompleted: currentKw?.cycles_completed || 0,
        cyclesPerKeyword: profile?.cycles_per_keyword || 12,
        lastScanAt: lastScan?.created_at || null,
        lastScanKeyword: lastScan?.keyword_text || null,
        totalActiveKeywords: activeCount || 0,
        scanFrequencyMinutes: profile?.scan_frequency_minutes || 5,
      };
    },
    enabled: !!user,
    refetchInterval: 30000, // refresh every 30s
  });
}
