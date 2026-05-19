import YahooFinance from "yahoo-finance2";
import type { HistoryResponse, PricePoint, Quote, Timeframe } from "@/types";

// v3 ships the constructor as the default export; instantiate once and reuse.
const yahooFinance = new YahooFinance();

interface RangeConfig {
  msBack: number;
  interval: "5m" | "15m" | "30m" | "1h" | "1d" | "1wk" | "1mo";
}

const TIMEFRAME_CONFIG: Record<Timeframe, RangeConfig> = {
  "1D":  { msBack:        1 * 24 * 60 * 60 * 1000,  interval: "5m"  },
  "1W":  { msBack:        7 * 24 * 60 * 60 * 1000,  interval: "30m" },
  "1M":  { msBack:       30 * 24 * 60 * 60 * 1000,  interval: "1d"  },
  "3M":  { msBack:       90 * 24 * 60 * 60 * 1000,  interval: "1d"  },
  "1Y":  { msBack:      365 * 24 * 60 * 60 * 1000,  interval: "1d"  },
  "5Y":  { msBack:  5 * 365 * 24 * 60 * 60 * 1000,  interval: "1wk" },
  "ALL": { msBack: 25 * 365 * 24 * 60 * 60 * 1000,  interval: "1mo" },
};

export async function fetchQuote(symbol: string): Promise<Quote> {
  const q: any = await yahooFinance.quote(symbol);
  return {
    symbol: q.symbol,
    name: q.longName || q.shortName || q.symbol,
    price: q.regularMarketPrice ?? 0,
    change: q.regularMarketChange ?? 0,
    changePercent: q.regularMarketChangePercent ?? 0,
    currency: q.currency ?? "USD",
    marketCap: q.marketCap ?? null,
    peRatio: q.trailingPE ?? null,
    dividendYield: q.dividendYield ?? null,
    fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? null,
    volume: q.regularMarketVolume ?? null,
    averageVolume: q.averageDailyVolume3Month ?? null,
    exchange: q.fullExchangeName ?? q.exchange ?? null,
  };
}

export async function fetchHistory(
  symbol: string,
  timeframe: Timeframe,
): Promise<HistoryResponse> {
  const cfg = TIMEFRAME_CONFIG[timeframe];
  const period2 = new Date();
  const period1 = new Date(Date.now() - cfg.msBack);

  const result: any = await yahooFinance.chart(symbol, {
    period1,
    period2,
    interval: cfg.interval,
  });

  const quotes: any[] = Array.isArray(result?.quotes) ? result.quotes : [];

  const points: PricePoint[] = quotes
    .map((row: any) => {
      const date: Date | undefined = row.date;
      const close: number | null = row.close;
      if (!date || close == null) return null;
      return { t: date.getTime(), c: close };
    })
    .filter((p): p is PricePoint => p !== null);

  return { symbol, timeframe, points };
}

/**
 * Always fetch a couple of years of daily closes for signal computation
 * (the 200-day SMA needs at least 200 trading days, so we pull ~3y to be safe).
 */
export async function fetchClosesForSignals(symbol: string): Promise<number[]> {
  const period2 = new Date();
  const period1 = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000);
  const result: any = await yahooFinance.chart(symbol, {
    period1,
    period2,
    interval: "1d",
  });
  const quotes: any[] = Array.isArray(result?.quotes) ? result.quotes : [];
  return quotes
    .map((row: any) => (typeof row.close === "number" ? row.close : null))
    .filter((c): c is number => c !== null);
}
