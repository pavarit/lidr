import type { SignalContext, SignalParams, Timeframe } from "@/types";

/**
 * Parameter sets per context. Each set keeps the same signal *family*
 * but tunes the lookback windows to the timeframe the user is viewing.
 *
 * "long" is the classic textbook setup. "medium" and "short" scale the
 * lookbacks down so the signals respond on the right time horizon.
 */
export const PARAMS_BY_CONTEXT: Record<SignalContext, SignalParams> = {
  long: {
    smaFast: 50,
    smaSlow: 200,
    rsiPeriod: 14,
    rsiOversold: 30,
    rsiOverbought: 70,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
    bollingerPeriod: 20,
    bollingerStdDev: 2,
    breakoutDays: 252, // ~52 weeks of trading
    volumeAvgDays: 50,
    volumeMultiplier: 1.5,
  },
  medium: {
    smaFast: 20,
    smaSlow: 50,
    rsiPeriod: 9,
    rsiOversold: 30,
    rsiOverbought: 70,
    macdFast: 6,
    macdSlow: 13,
    macdSignal: 5,
    bollingerPeriod: 10,
    bollingerStdDev: 2,
    breakoutDays: 63, // ~13 weeks (one quarter)
    volumeAvgDays: 20,
    volumeMultiplier: 1.5,
  },
  short: {
    smaFast: 10,
    smaSlow: 20,
    rsiPeriod: 5,
    rsiOversold: 30,
    rsiOverbought: 70,
    macdFast: 3,
    macdSlow: 10,
    macdSignal: 3,
    bollingerPeriod: 5,
    bollingerStdDev: 2,
    breakoutDays: 21, // ~4 weeks
    volumeAvgDays: 10,
    volumeMultiplier: 1.5,
  },
};

/**
 * Map the chart timeframe the user is viewing → the context we should
 * use to compute signals. Intraday and long-horizon views both get the
 * long context (daily-close signals don't help on intraday views, and
 * matching the long-horizon view is the natural fit).
 */
export function contextForTimeframe(tf: Timeframe): SignalContext {
  switch (tf) {
    case "1M":
      return "short";
    case "3M":
      return "medium";
    case "1D":
    case "1W":
    case "1Y":
    case "5Y":
    case "ALL":
    default:
      return "long";
  }
}

export const CONTEXT_LABEL: Record<SignalContext, string> = {
  short: "Short-term · ~1 month outlook",
  medium: "Medium-term · ~3 month outlook",
  long: "Long-term · ~1 year outlook",
};
