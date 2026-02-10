import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KalshiEvent {
  event_ticker: string;
  title: string;
  sub_title?: string;
  category?: string;
  markets?: KalshiMarket[];
  mutually_exclusive?: boolean;
}

export interface KalshiMarket {
  ticker: string;
  title?: string;
  subtitle?: string;
  event_ticker: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  volume: number;
  volume_24h?: number;
  open_interest?: number;
  close_time?: string;
  status?: string;
  result?: string;
  yes_sub_title?: string;
  no_sub_title?: string;
}

async function fetchKalshi(params: Record<string, string>) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kalshi-markets`;
  const searchParams = new URLSearchParams(params);

  const res = await fetch(`${url}?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error("Failed to fetch Kalshi data");
  return res.json();
}

export function useKalshiEvents(filters?: { search?: string; category?: string; limit?: number }) {
  return useQuery({
    queryKey: ["kalshi-events", filters],
    queryFn: () =>
      fetchKalshi({
        action: "events",
        search: filters?.search || "",
        category: filters?.category || "",
        limit: String(filters?.limit || 20),
        status: "open",
      }),
    staleTime: 5 * 60 * 1000,
    select: (data) => (data?.events || []) as KalshiEvent[],
  });
}

export function useKalshiMarkets(filters?: { search?: string; eventTicker?: string; limit?: number }) {
  return useQuery({
    queryKey: ["kalshi-markets", filters],
    queryFn: () =>
      fetchKalshi({
        action: "markets",
        search: filters?.search || "",
        ticker: filters?.eventTicker || "",
        limit: String(filters?.limit || 20),
        status: "open",
      }),
    staleTime: 5 * 60 * 1000,
    select: (data) => (data?.markets || []) as KalshiMarket[],
  });
}

export function useRelatedPredictions(entity?: string, tickers?: string[], companyName?: string) {
  return useQuery({
    queryKey: ["kalshi-related", entity, tickers, companyName],
    queryFn: () =>
      fetchKalshi({
        action: "events",
        search: entity || "",
        limit: "20",
        status: "open",
      }),
    enabled: !!entity,
    staleTime: 5 * 60 * 1000,
    select: (data) => {
      const events = (data?.events || []) as KalshiEvent[];
      return events.slice(0, 5);
    },
  });
}
