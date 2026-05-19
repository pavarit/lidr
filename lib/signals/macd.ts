import type { SignalExplanation, SignalInput, SignalResult } from "@/types";

const MACD_EXPLANATION: SignalExplanation = {
  plain:
    "MACD stands for Moving Average Convergence Divergence — a trend-following momentum indicator. It tracks two exponential moving averages of price (a fast one and a slow one) and watches the gap between them. A second 'signal' line smooths that gap. When the MACD line crosses above its signal line, momentum is turning up (buy); when it crosses below, momentum is turning down (sell).",
  example:
    "Suppose the fast EMA is $182 and the slow EMA is $178. The MACD line is the gap: $4. If that gap has been growing recently (more than its smoothed average), the MACD line sits above the signal line — bullish. If the gap is shrinking faster than the smoothed average, MACD falls below signal — bearish.",
  formula:
    "MACD = fastEMA − slowEMA. Signal = EMA of MACD over N periods. Action is BUY when MACD > Signal, SELL when MACD < Signal. Confidence = min(1, |MACD − Signal| ÷ slowEMA × 100), so a separation of 1% of price caps out at 100% confidence.",
};

function ema(closes: number[], period: number): number[] {
  if (closes.length === 0 || period <= 0) return [];
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = closes[0];
  out.push(prev);
  for (let i = 1; i < closes.length; i++) {
    prev = closes[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

export function macdSignal({ closes, params }: SignalInput): SignalResult {
  const { macdFast, macdSlow, macdSignal: signalPeriod } = params;
  const name = `Momentum (MACD ${macdFast}/${macdSlow}/${signalPeriod})`;

  const minLen = macdSlow + signalPeriod + 5;
  if (closes.length < minLen) {
    return {
      id: "macd",
      name,
      action: "HOLD",
      confidence: 0,
      summary: "Not enough history yet to compute MACD.",
      details: { macd: null, signal: null, histogram: null },
      explanation: MACD_EXPLANATION,
    };
  }

  const fastE = ema(closes, macdFast);
  const slowE = ema(closes, macdSlow);
  const macdLine: number[] = fastE.map((v, i) => v - slowE[i]);
  const signalLine = ema(macdLine, signalPeriod);

  const lastMacd = macdLine[macdLine.length - 1];
  const lastSignal = signalLine[signalLine.length - 1];
  const lastSlow = slowE[slowE.length - 1];
  const histogram = lastMacd - lastSignal;

  const action: SignalResult["action"] = histogram > 0 ? "BUY" : "SELL";
  // Normalize the spread by price level so it's comparable across tickers.
  const spreadPct = Math.abs(histogram) / Math.max(1e-9, lastSlow);
  const confidence = Math.min(1, spreadPct * 100);

  const summary =
    action === "BUY"
      ? `MACD line (${lastMacd.toFixed(2)}) is above its signal line (${lastSignal.toFixed(2)}) — momentum is turning up.`
      : `MACD line (${lastMacd.toFixed(2)}) is below its signal line (${lastSignal.toFixed(2)}) — momentum is turning down.`;

  return {
    id: "macd",
    name,
    action,
    confidence,
    summary,
    details: {
      macd: Number(lastMacd.toFixed(3)),
      signal: Number(lastSignal.toFixed(3)),
      histogram: Number(histogram.toFixed(3)),
    },
    explanation: MACD_EXPLANATION,
  };
}
