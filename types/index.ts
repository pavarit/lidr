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

export interface SignalExplanation {
  plain: string;    // plain-English description an average person can follow
  example: string;  // a concrete worked example
  formula: string;  // the math behind the action + confidence
}

export interface SignalResult {
  id: string;          // stable id, e.g. "sma-crossover"
  name: string;        // human-readable
  action: SignalAction;
  confidence: number;  // 0..1
  summary: string;     // one-line plain-English reasoning
  details: Record<string, number | string | null>; // raw values used to make the call
  explanation: SignalExplanation; // shown in the tooltip
}

export type SignalContext = "short" | "medium" | "long";

/**
 * Per-signal tunable parameters. Each context picks a different set
 * of these so the same family of signals can adapt to the timeframe
 * the user is looking at.
 */
export interface SignalParams {
  smaFast: number;
  smaSlow: number;
  rsiPeriod: number;
  rsiOversold: number;
  rsiOverbought: number;
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  bollingerPeriod: number;
  bollingerStdDev: number;
  breakoutDays: number;
  volumeAvgDays: number;
  volumeMultiplier: number;
}

/** Input bundle passed to every signal function. */
export interface SignalInput {
  closes: number[];
  volumes: number[];
  params: SignalParams;
}

export interface SignalsResponse {
  symbol: string;
  generatedAt: number;
  context: SignalContext;
  contextLabel: string; // user-facing label, e.g. "Short-term · ~1 month outlook"
  signals: SignalResult[];
}
