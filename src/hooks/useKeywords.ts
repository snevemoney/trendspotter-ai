import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export function useKeywords() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["keywords", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("keywords")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useAddKeyword() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyword: string) => {
      if (!user) throw new Error("Not authenticated");
      const { data: existing } = await supabase
        .from("keywords")
        .select("sort_order")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;
      const { error } = await supabase.from("keywords").insert({
        user_id: user.id,
        keyword: keyword.trim().toLowerCase(),
        sort_order: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      toast({ title: "Keyword added" });
    },
  });
}

export function useDeleteKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("keywords").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      toast({ title: "Keyword removed" });
    },
  });
}

export function useToggleKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("keywords").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
    },
  });
}
