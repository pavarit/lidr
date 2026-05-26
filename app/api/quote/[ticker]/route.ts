import { NextResponse } from "next/server";
import { fetchQuote } from "@/lib/yahoo";

// Refresh quotes at most once per 30s on the server
export const revalidate = 30;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  try {
    const quote = await fetchQuote(ticker.toUpperCase());
    return NextResponse.json(quote);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch quote" },
      { status: 500 },
    );
  }
}
