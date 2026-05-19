import type { SignalExplanation, SignalInput, SignalResult } from "@/types";

const BOLLINGER_EXPLANATION: SignalExplanation = {
  plain:
    "Bollinger Bands wrap the price chart with two volatility-adjusted lines: an upper band (recent average + 2 standard deviations) and a lower band (recent average − 2 standard deviations). When price punches above the upper band it's statistically far from its norm and may be overextended (sell). When it falls below the lower band it's similarly stretched to the downside (buy). Unlike RSI, the bands widen and narrow with volatility, so they adapt to each stock's character.",
  example:
    "Suppose a stock's 20-day average is $100 and prices have been moving with a standard deviation of $3. The upper band sits at $106, the lower at $94. If the stock trades at $107, it's punched through the upper band — historically unusual — suggesting a pullback may be coming. At $93 the same logic flips bullish.",
  formula:
    "Middle = N-period SMA. Upper = Middle + K × stdev. Lower = Middle − K × stdev (typically K=2). Action is SELL above upper, BUY below lower. Confidence = min(1, how far past the band in stdev units ÷ 1). One full extra stdev outside = 100% confidence.",
};

function meanStd(slice: number[]): { mean: number; std: number } {
  const n = slice.length;
  const mean = slice.reduce((a, b) => a + b, 0) / n;
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  return { mean, std: Math.sqrt(variance) };
}

export function bollingerSignal({ closes, params }: SignalInput): SignalResult {
  const { bollingerPeriod, bollingerStdDev } = params;
  const name = `Volatility (Bollinger ${bollingerPeriod}/${bollingerStdDev}σ)`;

  if (closes.length < bollingerPeriod + 1) {
    return {
      id: "bollinger",
      name,
      action: "HOLD",
      confidence: 0,
      summary: "Not enough history yet to compute Bollinger Bands.",
      details: { upper: null, middle: null, lower: null, price: null },
      explanation: BOLLINGER_EXPLANATION,
    };
  }

  const window = closes.slice(closes.length - bollingerPeriod);
  const { mean, std } = meanStd(window);
  const upper = mean + bollingerStdDev * std;
  const lower = mean - bollingerStdDev * std;
  const price = closes[closes.length - 1];

  let action: SignalResult["action"] = "HOLD";
  let confidence = 0;
  let summary = `Price ($${price.toFixed(2)}) is inside the bands — neutral.`;

  if (price > upper) {
    action = "SELL";
    const extraStd = std > 0 ? (price - upper) / std : 0;
    confidence = Math.min(1, extraStd);
    summary = `Price ($${price.toFixed(2)}) is above the upper band ($${upper.toFixed(2)}) — overextended.`;
  } else if (price < lower) {
    action = "BUY";
    const extraStd = std > 0 ? (lower - price) / std : 0;
    confidence = Math.min(1, extraStd);
    summary = `Price ($${price.toFixed(2)}) is below the lower band ($${lower.toFixed(2)}) — stretched to the downside.`;
  }

  return {
    id: "bollinger",
    name,
    action,
    confidence,
    summary,
    details: {
      price: Number(price.toFixed(2)),
      upper: Number(upper.toFixed(2)),
      middle: Number(mean.toFixed(2)),
      lower: Number(lower.toFixed(2)),
    },
    explanation: BOLLINGER_EXPLANATION,
  };
}
