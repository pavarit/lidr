import { NextResponse } from "next/server";
import { fetchHistory } from "@/lib/yahoo";
import type { Timeframe } from "@/types";

export const revalidate = 60;

const VALID: Timeframe[] = ["1D", "1W", "1M", "3M", "1Y", "5Y", "ALL"];

export async function GET(
  req: Request,
  { params }: { params: { ticker: string } },
) {
  const { searchParams } = new URL(req.url);
  const tfParam = (searchParams.get("range") ?? "1M").toUpperCase() as Timeframe;
  const timeframe: Timeframe = VALID.includes(tfParam) ? tfParam : "1M";

  try {
    const history = await fetchHistory(params.ticker.toUpperCase(), timeframe);
    return NextResponse.json(history);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch history" },
      { status: 500 },
    );
  }
}
