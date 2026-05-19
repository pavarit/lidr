import type { SignalResult } from "@/types";
import { smaCrossoverSignal } from "./sma";
import { rsiSignal } from "./rsi";

/**
 * Run all enabled signals against a close-price series.
 * Add new signals here as you build them out.
 */
export function runAllSignals(closes: number[]): SignalResult[] {
  return [smaCrossoverSignal(closes), rsiSignal(closes)];
}
