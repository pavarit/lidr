// Shared types for the robo-advisor

export type Timeframe = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y" | "ALL";

export type TickerCategory = "ETF" | "Stock";

export interface TickerMeta {
  symbol: string;
  name: string;
  category: TickerCategory;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  marketCap: number | null;
  peRatio: number | null;
  dividendYield: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  volume: number | null;
  averageVolume: number | null;
  exchange: string | null;
}

export interface PricePoint {
  t: number; // unix ms
  c: number; // close
}

export interface HistoryResponse {
  symbol: string;
  timeframe: Timeframe;
  points: PricePoint[];
}

export type SignalAction = "BUY" | "HOLD" | "SELL";

export interface SignalResult {
  id: string;          // stable id, e.g. "sma-crossover"
  name: string;        // human-readable
  action: SignalAction;
  confidence: number;  // 0..1
  summary: string;     // one-line plain-English reasoning
  details: Record<string, number | string | null>; // raw values used to make the call
}

export interface SignalsResponse {
  symbol: string;
  generatedAt: number;
  signals: SignalResult[];
}
