import type { SignalExplanation, SignalInput, SignalResult } from "@/types";

const BREAKOUT_EXPLANATION: SignalExplanation = {
  plain:
    "A 'breakout' happens when a stock pushes to a new high (or low) it hasn't touched in a long time. Stocks making new long-term highs tend to keep climbing — this is well-documented momentum and is one of the few technical signals with strong academic support. Stocks making new long-term lows tend to keep falling. The signal goes BUY when price hits or near-misses the lookback-period high, and SELL when it hits or near-misses the low.",
  example:
    "If a stock has traded between $80 and $120 over the past year and the current price is $119.50, it's within 0.4% of its 52-week high — a near-breakout, bullish. If it falls to $80.50, it's near the 52-week low, bearish.",
  formula:
    "Compute the highest close and lowest close over the lookback window. distance-from-high = (high − price) ÷ high. Action is BUY when distance < 2%, SELL when (price − low) ÷ low < 2%. Confidence = 1 − distance/2% (closer to the extreme = higher confidence).",
};

export function breakoutSignal({ closes, params }: SignalInput): SignalResult {
  const { breakoutDays } = params;
  const name = `Breakout (${breakoutDays}-day high/low)`;

  if (closes.length < breakoutDays) {
    return {
      id: "breakout",
      name,
      action: "HOLD",
      confidence: 0,
      summary: `Not enough history yet to compute the ${breakoutDays}-day breakout.`,
      details: { high: null, low: null, price: null },
      explanation: BREAKOUT_EXPLANATION,
    };
  }

  const window = closes.slice(closes.length - breakoutDays);
  const high = Math.max(...window);
  const low = Math.min(...window);
  const price = closes[closes.length - 1];

  // "Near the high/low" = within this fraction of the extreme.
  const THRESHOLD = 0.02; // 2%
  const distFromHigh = (high - price) / high;
  const distFromLow = (price - low) / low;

  let action: SignalResult["action"] = "HOLD";
  let confidence = 0;
  let summary = `Price ($${price.toFixed(2)}) is in the middle of its ${breakoutDays}-day range ($${low.toFixed(2)}–$${high.toFixed(2)}).`;

  if (distFromHigh <= THRESHOLD) {
    action = "BUY";
    confidence = Math.min(1, 1 - distFromHigh / THRESHOLD);
    summary = `Price ($${price.toFixed(2)}) is near its ${breakoutDays}-day high ($${high.toFixed(2)}) — momentum breakout.`;
  } else if (distFromLow <= THRESHOLD) {
    action = "SELL";
    confidence = Math.min(1, 1 - distFromLow / THRESHOLD);
    summary = `Price ($${price.toFixed(2)}) is near its ${breakoutDays}-day low ($${low.toFixed(2)}) — momentum breakdown.`;
  }

  return {
    id: "breakout",
    name,
    action,
    confidence,
    summary,
    details: {
      price: Number(price.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      pctFromHigh: Number((distFromHigh * 100).toFixed(2)),
      pctFromLow: Number((distFromLow * 100).toFixed(2)),
    },
    explanation: BREAKOUT_EXPLANATION,
  };
}
