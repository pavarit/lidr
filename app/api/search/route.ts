import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import type { TickerMeta } from "@/types";

const yahooFinance = new YahooFinance();

// Cache identical search queries briefly to be nice to Yahoo.
export const revalidate = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const raw: any = await yahooFinance.search(q, { quotesCount: 8, newsCount: 0 });
    const quotes: any[] = Array.isArray(raw?.quotes) ? raw.quotes : [];

    // Keep only equities and ETFs; trim to what the UI needs.
    const results: TickerMeta[] = quotes
      .filter(
        (q: any) =>
          q?.symbol &&
          (q.quoteType === "EQUITY" || q.quoteType === "ETF"),
      )
      .map((q: any) => ({
        symbol: String(q.symbol).toUpperCase(),
        name: q.longname || q.shortname || q.symbol,
        category: q.quoteType === "ETF" ? "ETF" : "Stock",
      }));

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Search failed" },
      { status: 500 },
    );
  }
}
