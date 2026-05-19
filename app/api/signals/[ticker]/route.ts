import { NextResponse } from "next/server";
import { fetchClosesForSignals } from "@/lib/yahoo";
import { runAllSignals } from "@/lib/signals";
import type { SignalsResponse } from "@/types";

// Signals only change on new daily closes — cache for a while.
export const revalidate = 300;

export async function GET(
  _req: Request,
  { params }: { params: { ticker: string } },
) {
  const symbol = params.ticker.toUpperCase();
  try {
    const closes = await fetchClosesForSignals(symbol);
    const signals = runAllSignals(closes);
    const body: SignalsResponse = {
      symbol,
      generatedAt: Date.now(),
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
