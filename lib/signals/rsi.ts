import type { SignalExplanation, SignalInput, SignalResult } from "@/types";

const RSI_EXPLANATION: SignalExplanation = {
  plain:
    "RSI stands for Relative Strength Index — a momentum gauge that measures how lopsided recent up-days have been versus down-days, scaled to a value from 0 to 100. A value above 70 means the stock has rallied hard and may be overheated (sell). A value below 30 means it has fallen sharply and may be oversold (buy). Between 30 and 70 is neutral.",
  example:
    "If a stock had 12 up-days and 2 down-days in the recent window, RSI climbs toward 90 — overbought. If it had 12 down-days and 2 up-days, RSI falls toward 10 — oversold. The further past 30 or 70 the value gets, the stronger the signal.",
  formula:
    "Confidence = min(1, distance past the threshold ÷ 20). RSI of 20 (10 below the 30 threshold) maps to 50% confidence; RSI of 10 caps out at 100%. The sell side mirrors this: RSI 80 = 50%, RSI 90 = 100%.",
};

function rsi(closes: number[], period: number): number {
  if (closes.length < period + 1) return NaN;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const delta = closes[i] - closes[i - 1];
    if (delta >= 0) gains += delta;
    else losses -= delta;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;

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

export function rsiSignal({ closes, params }: SignalInput): SignalResult {
  const { rsiPeriod, rsiOversold, rsiOverbought } = params;
  const value = rsi(closes, rsiPeriod);
  const name = `Momentum (RSI ${rsiPeriod})`;

  if (!Number.isFinite(value)) {
    return {
      id: "rsi",
      name,
      action: "HOLD",
      confidence: 0,
      summary: "Not enough history yet to compute RSI.",
      details: { rsi: null },
      explanation: RSI_EXPLANATION,
    };
  }

  let action: SignalResult["action"] = "HOLD";
  let confidence = 0;
  let summary = `RSI is ${value.toFixed(1)} — neutral momentum.`;

  if (value < rsiOversold) {
    action = "BUY";
    confidence = Math.min(1, (rsiOversold - value) / 20);
    summary = `RSI is ${value.toFixed(1)} — oversold. Mean reversion to the upside is statistically more likely.`;
  } else if (value > rsiOverbought) {
    action = "SELL";
    confidence = Math.min(1, (value - rsiOverbought) / 20);
    summary = `RSI is ${value.toFixed(1)} — overbought. A pullback is statistically more likely.`;
  }

  return {
    id: "rsi",
    name,
    action,
    confidence,
    summary,
    details: { rsi: Number(value.toFixed(2)) },
    explanation: RSI_EXPLANATION,
  };
}
