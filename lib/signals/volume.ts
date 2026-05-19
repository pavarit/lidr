import type { SignalExplanation, SignalInput, SignalResult } from "@/types";

const VOLUME_EXPLANATION: SignalExplanation = {
  plain:
    "This signal combines price breakouts with trading volume. The idea: a price move into new high/low territory is more meaningful when lots of shares are changing hands — that's real conviction from real money — than when volume is thin. A high-volume breakout above the recent range is a stronger buy; a high-volume breakdown below the range is a stronger sell. Quiet breakouts get faded by the market more often.",
  example:
    "Imagine a stock has averaged 10 million shares traded per day over the last 50 days, and is now pushing to a new 50-day high while trading 18 million shares today. Volume is 1.8× its average — well above the 1.5× threshold — and price is at a new high. That's a confirmed buy.",
  formula:
    "Check whether price is within 2% of the lookback high/low (same as breakout signal). If yes AND today's volume > volumeMultiplier × average volume → action fires. Confidence = min(1, (volume ÷ avgVolume − 1) ÷ 2), so 1× = 0% confidence, 3× = 100%.",
};

export function volumeSignal({ closes, volumes, params }: SignalInput): SignalResult {
  const { breakoutDays, volumeAvgDays, volumeMultiplier } = params;
  const name = `Volume Confirmation`;

  if (
    closes.length < breakoutDays ||
    volumes.length < volumeAvgDays ||
    volumes.length === 0
  ) {
    return {
      id: "volume",
      name,
      action: "HOLD",
      confidence: 0,
      summary: "Not enough data yet to compute volume confirmation.",
      details: {
        price: null,
        volume: null,
        avgVolume: null,
        volumeMultiple: null,
      },
      explanation: VOLUME_EXPLANATION,
    };
  }

  const priceWindow = closes.slice(closes.length - breakoutDays);
  const high = Math.max(...priceWindow);
  const low = Math.min(...priceWindow);
  const price = closes[closes.length - 1];

  const volWindow = volumes.slice(volumes.length - volumeAvgDays);
  const avgVolume = volWindow.reduce((a, b) => a + b, 0) / volWindow.length;
  const todayVolume = volumes[volumes.length - 1];
  const volMultiple = avgVolume > 0 ? todayVolume / avgVolume : 0;

  const THRESHOLD = 0.02;
  const nearHigh = (high - price) / high <= THRESHOLD;
  const nearLow = (price - low) / low <= THRESHOLD;
  const heavyVolume = volMultiple >= volumeMultiplier;

  let action: SignalResult["action"] = "HOLD";
  let confidence = 0;
  let summary = `Volume is ${volMultiple.toFixed(2)}× its ${volumeAvgDays}-day average — no confirmed breakout yet.`;

  if (nearHigh && heavyVolume) {
    action = "BUY";
    confidence = Math.min(1, (volMultiple - 1) / 2);
    summary = `Price is at a ${breakoutDays}-day high on ${volMultiple.toFixed(2)}× normal volume — confirmed breakout.`;
  } else if (nearLow && heavyVolume) {
    action = "SELL";
    confidence = Math.min(1, (volMultiple - 1) / 2);
    summary = `Price is at a ${breakoutDays}-day low on ${volMultiple.toFixed(2)}× normal volume — confirmed breakdown.`;
  } else if (nearHigh || nearLow) {
    summary = `Price is near a ${breakoutDays}-day extreme but volume (${volMultiple.toFixed(2)}× avg) doesn't confirm.`;
  }

  return {
    id: "volume",
    name,
    action,
    confidence,
    summary,
    details: {
      price: Number(price.toFixed(2)),
      volume: Math.round(todayVolume),
      avgVolume: Math.round(avgVolume),
      volumeMultiple: Number(volMultiple.toFixed(2)),
    },
    explanation: VOLUME_EXPLANATION,
  };
}
