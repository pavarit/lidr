import type { SignalContext, SignalInput, SignalResult } from "@/types";
import { PARAMS_BY_CONTEXT } from "./config";
import { smaCrossoverSignal } from "./sma";
import { rsiSignal } from "./rsi";
import { macdSignal } from "./macd";
import { bollingerSignal } from "./bollinger";
import { breakoutSignal } from "./breakout";
import { volumeSignal } from "./volume";

/**
 * Run every signal against the given price + volume series, using the
 * parameter set that matches the requested context.
 *
 * To add a new signal: write a function in lib/signals/<name>.ts that
 * takes a SignalInput and returns a SignalResult, then add it to the
 * array below. No other files need to change.
 */
export function runAllSignals(
  closes: number[],
  volumes: number[],
  context: SignalContext,
): SignalResult[] {
  const params = PARAMS_BY_CONTEXT[context];
  const input: SignalInput = { closes, volumes, params };

  return [
    smaCrossoverSignal(input),
    rsiSignal(input),
    macdSignal(input),
    bollingerSignal(input),
    breakoutSignal(input),
    volumeSignal(input),
  ];
}
