import type { SignalResult } from "@/types";

/**
 * 14-day RSI using Wilder's smoothing method.
 * Returns NaN if there isn't enough data.
 */
function rsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return NaN;

  let gains = 0;
  let losses = 0;

  // Seed averages with the first `period` deltas.
  for (let i = 1; i <= period; i++) {
    const delta = closes[i] - closes[i - 1];
    if (delta >= 0) gains += delta;
    else losses -= delta;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Wilder smoothing for the rest.
  for (let i = period + 1; i < closes.length; i++) {
    const delta = closes[i] - closes[i - 1];
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? -delta : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * RSI mean-reversion signal.
 *
 * BUY  : RSI < 30 (oversold)
 * SELL : RSI > 70 (overbought)
 * HOLD : otherwise
 *
 * Confidence scales linearly with how far past the threshold we are.
 */
export function rsiSignal(closes: number[]): SignalResult {
  const value = rsi(closes, 14);

  if (!Number.isFinite(value)) {
    return {
      id: "rsi-14",
      name: "Momentum (RSI 14)",
      action: "HOLD",
      confidence: 0,
      summary: "Not enough history yet to compute RSI.",
      details: { rsi: null },
    };
  }

  let action: SignalResult["action"] = "HOLD";
  let confidence = 0;
  let summary = `RSI is ${value.toFixed(1)} — neutral momentum.`;

  if (value < 30) {
    action = "BUY";
    confidence = Math.min(1, (30 - value) / 20); // RSI 10 -> full confidence
    summary = `RSI is ${value.toFixed(1)} — oversold. Mean reversion to the upside is statistically more likely.`;
  } else if (value > 70) {
    action = "SELL";
    confidence = Math.min(1, (value - 70) / 20); // RSI 90 -> full confidence
    summary = `RSI is ${value.toFixed(1)} — overbought. A pullback is statistically more likely.`;
  }

  return {
    id: "rsi-14",
    name: "Momentum (RSI 14)",
    action,
    confidence,
    summary,
    details: { rsi: Number(value.toFixed(2)) },
  };
}
