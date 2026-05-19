import type { SignalExplanation, SignalInput, SignalResult } from "@/types";

const SMA_EXPLANATION: SignalExplanation = {
  plain:
    "SMA stands for Simple Moving Average — the average of a stock's closing prices over a set window of time. This signal compares two of them — a shorter-term and a longer-term — and watches which is higher. When the shorter average rises above the longer one, the recent trend is outpacing the long-term baseline (a buy signal). When it falls below, the trend has turned negative (a sell signal).",
  example:
    "Imagine a stock's shorter-term average is $185 while its longer-term average is $175. Recent prices are tracking $10 higher than the long-term baseline — the trend is up. The wider that gap, the stronger the trend and the higher the confidence.",
  formula:
    "Confidence = min(1, |gap %| × 10), where gap % = (fast SMA − slow SMA) ÷ slow SMA. A 1% gap maps to 10% confidence; a 10% gap caps out at 100%.",
};

function sma(closes: number[], period: number): number {
  if (closes.length < period) return NaN;
  const slice = closes.slice(closes.length - period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function smaCrossoverSignal({ closes, params }: SignalInput): SignalResult {
  const { smaFast, smaSlow } = params;
  const fast = sma(closes, smaFast);
  const slow = sma(closes, smaSlow);
  const name = `Trend (${smaFast}/${smaSlow} SMA Crossover)`;

  if (!Number.isFinite(fast) || !Number.isFinite(slow)) {
    return {
      id: "sma-crossover",
      name,
      action: "HOLD",
      confidence: 0,
      summary: `Not enough history to compute the ${smaFast}/${smaSlow} crossover.`,
      details: { fastSMA: null, slowSMA: null },
      explanation: SMA_EXPLANATION,
    };
  }

  const gapPct = (fast - slow) / slow;
  const confidence = Math.min(1, Math.abs(gapPct) * 10);
  const action = gapPct > 0 ? "BUY" : "SELL";

  const summary =
    action === "BUY"
      ? `${smaFast}-period SMA (${fast.toFixed(2)}) is above the ${smaSlow}-period SMA (${slow.toFixed(
          2,
        )}) — trend is up.`
      : `${smaFast}-period SMA (${fast.toFixed(2)}) is below the ${smaSlow}-period SMA (${slow.toFixed(
          2,
        )}) — trend is down.`;

  return {
    id: "sma-crossover",
    name,
    action,
    confidence,
    summary,
    details: {
      fastSMA: Number(fast.toFixed(2)),
      slowSMA: Number(slow.toFixed(2)),
      gapPercent: Number((gapPct * 100).toFixed(2)),
    },
    explanation: SMA_EXPLANATION,
  };
}
