import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export function useTrends(filters?: {
  dateRange?: { from: Date; to: Date };
  keyword?: string;
  minScore?: number;
  maxScore?: number;
  mappedOnly?: boolean;
  status?: string;
  blindspotsOnly?: boolean;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["trends", user?.id, filters],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from("trend_items")
        .select("*, company_matches(*), user_actions(*)")
        .eq("user_id", user.id)
        .order("last_seen", { ascending: false });

      if (filters?.minScore !== undefined) {
        query = query.gte("score", filters.minScore);
      }
      if (filters?.maxScore !== undefined) {
        query = query.lte("score", filters.maxScore);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.dateRange?.from) {
        query = query.gte("last_seen", filters.dateRange.from.toISOString());
      }
      if (filters?.dateRange?.to) {
        query = query.lte("last_seen", filters.dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = data || [];

      if (filters?.mappedOnly) {
        results = results.filter(
          (t: any) => t.company_matches && t.company_matches.length > 0
        );
      }

      if (filters?.blindspotsOnly) {
        results = results.filter((t: any) => (t.blindspot_score || 0) >= 40);
      }

      return results;
    },
    enabled: !!user,
  });
}

export function useTrendDetail(trendId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["trend-detail", trendId],
    queryFn: async () => {
      if (!trendId || !user) return null;
      const { data, error } = await supabase
        .from("trend_items")
        .select("*, company_matches(*), user_actions(*), trend_video_links(*, videos(*))")
        .eq("id", trendId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!trendId && !!user,
  });
}

export function useTrendAction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      trendId,
      action,
      notes,
      tags,
    }: {
      trendId: string;
      action: "saved" | "ignored" | "shortlisted" | "archived";
      notes?: string;
      tags?: string[];
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Upsert user action
      const { error: actionError } = await supabase.from("user_actions").upsert(
        {
          trend_id: trendId,
          user_id: user.id,
          action,
          notes: notes || null,
          tags: tags || [],
        },
        { onConflict: "trend_id,user_id" }
      );

      // Update trend status
      const statusMap: Record<string, string> = {
        saved: "reviewing",
        shortlisted: "shortlisted",
        archived: "archived",
        ignored: "archived",
      };

      await supabase
        .from("trend_items")
        .update({ status: statusMap[action] })
        .eq("id", trendId);

      if (actionError) throw actionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trends"] });
      queryClient.invalidateQueries({ queryKey: ["trend-detail"] });
    },
  });
}

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [trends24h, trends7d, allTrends, matches, highSignal] = await Promise.all([
        supabase
          .from("trend_items")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("last_seen", twentyFourHoursAgo.toISOString()),
        supabase
          .from("trend_items")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("last_seen", sevenDaysAgo.toISOString()),
        supabase
          .from("trend_items")
          .select("primary_entity")
          .eq("user_id", user.id),
        supabase
          .from("company_matches")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("trend_items")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("score", 70),
      ]);

      const uniqueBrands = new Set(allTrends.data?.map((t) => t.primary_entity)).size;

      return {
        trends24h: trends24h.count || 0,
        trends7d: trends7d.count || 0,
        uniqueBrands,
        mappedTickers: matches.count || 0,
        highSignalCount: highSignal.count || 0,
      };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}
