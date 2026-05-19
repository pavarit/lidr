import { NextResponse } from "next/server";
import { fetchSignalSeries } from "@/lib/yahoo";
import { runAllSignals } from "@/lib/signals";
import { CONTEXT_LABEL } from "@/lib/signals/config";
import type { SignalContext, SignalsResponse } from "@/types";

// Signals only change on new daily closes — cache for a while.
export const revalidate = 300;

const VALID_CONTEXTS: SignalContext[] = ["short", "medium", "long"];

export async function GET(
  req: Request,
  { params }: { params: { ticker: string } },
) {
  const symbol = params.ticker.toUpperCase();
  const { searchParams } = new URL(req.url);
  const rawCtx = (searchParams.get("context") ?? "long").toLowerCase() as SignalContext;
  const context: SignalContext = VALID_CONTEXTS.includes(rawCtx) ? rawCtx : "long";

  try {
    const { closes, volumes } = await fetchSignalSeries(symbol);
    const signals = runAllSignals(closes, volumes, context);
    const body: SignalsResponse = {
      symbol,
      generatedAt: Date.now(),
      context,
      contextLabel: CONTEXT_LABEL[context],
      signals,
    };
    return NextResponse.json(body);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to compute signals" },
      { status: 500 },
    );
  }
}
