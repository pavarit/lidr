import type { SignalResult } from "@/types";

/**
 * Simple moving average over the last `period` closes.
 * Returns NaN if there aren't enough points.
 */
function sma(closes: number[], period: number): number {
  if (closes.length < period) return NaN;
  const slice = closes.slice(closes.length - period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/**
 * 50/200 SMA crossover ("Golden Cross" / "Death Cross").
 *
 * BUY  : 50-day SMA above 200-day SMA (bullish trend).
 * SELL : 50-day SMA below 200-day SMA (bearish trend).
 * HOLD : not enough data.
 *
 * Confidence scales with the absolute gap between the two SMAs,
 * normalized by the slower SMA. Capped at 1.
 */
export function smaCrossoverSignal(closes: number[]): SignalResult {
  const fast = sma(closes, 50);
  const slow = sma(closes, 200);

  if (!Number.isFinite(fast) || !Number.isFinite(slow)) {
    return {
      id: "sma-crossover",
      name: "Trend (50/200 SMA Crossover)",
      action: "HOLD",
      confidence: 0,
      summary: "Not enough history yet to compute the 50/200 crossover.",
      details: { fastSMA: null, slowSMA: null },
    };
  }

  const gapPct = (fast - slow) / slow; // positive = bullish
  const confidence = Math.min(1, Math.abs(gapPct) * 10); // 10% gap -> full confidence
  const action = gapPct > 0 ? "BUY" : "SELL";

  const summary =
    action === "BUY"
      ? `50-day SMA (${fast.toFixed(2)}) is above the 200-day SMA (${slow.toFixed(
          2,
        )}) — long-term trend is up.`
      : `50-day SMA (${fast.toFixed(2)}) is below the 200-day SMA (${slow.toFixed(
          2,
        )}) — long-term trend is down.`;

  return {
    id: "sma-crossover",
    name: "Trend (50/200 SMA Crossover)",
    action,
    confidence,
    summary,
    details: {
      fastSMA: Number(fast.toFixed(2)),
      slowSMA: Number(slow.toFixed(2)),
      gapPercent: Number((gapPct * 100).toFixed(2)),
    },
  };
}
