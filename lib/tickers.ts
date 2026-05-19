import type { TickerMeta } from "@/types";

// 10 ETFs covering the broad market + major industries
const ETFS: TickerMeta[] = [
  { symbol: "VTI",  name: "Vanguard Total Stock Market ETF", category: "ETF" },
  { symbol: "VOO",  name: "Vanguard S&P 500 ETF",            category: "ETF" },
  { symbol: "QQQ",  name: "Invesco QQQ Trust (Nasdaq-100)",  category: "ETF" },
  { symbol: "SPY",  name: "SPDR S&P 500 ETF Trust",          category: "ETF" },
  { symbol: "IWM",  name: "iShares Russell 2000 ETF",        category: "ETF" },
  { symbol: "VEA",  name: "Vanguard FTSE Developed Markets", category: "ETF" },
  { symbol: "VWO",  name: "Vanguard FTSE Emerging Markets",  category: "ETF" },
  { symbol: "XLK",  name: "Technology Select Sector SPDR",   category: "ETF" },
  { symbol: "XLF",  name: "Financial Select Sector SPDR",    category: "ETF" },
  { symbol: "XLE",  name: "Energy Select Sector SPDR",       category: "ETF" },
];

// 10 of the most popular / widely-held individual stocks
const STOCKS: TickerMeta[] = [
  { symbol: "AAPL",  name: "Apple Inc.",              category: "Stock" },
  { symbol: "MSFT",  name: "Microsoft Corp.",         category: "Stock" },
  { symbol: "GOOGL", name: "Alphabet Inc. (Class A)", category: "Stock" },
  { symbol: "AMZN",  name: "Amazon.com Inc.",         category: "Stock" },
  { symbol: "NVDA",  name: "NVIDIA Corp.",            category: "Stock" },
  { symbol: "META",  name: "Meta Platforms Inc.",     category: "Stock" },
  { symbol: "TSLA",  name: "Tesla Inc.",              category: "Stock" },
  { symbol: "BRK-B", name: "Berkshire Hathaway B",    category: "Stock" },
  { symbol: "JPM",   name: "JPMorgan Chase & Co.",    category: "Stock" },
  { symbol: "V",     name: "Visa Inc.",               category: "Stock" },
];

export const TICKERS: TickerMeta[] = [...ETFS, ...STOCKS];

export function findTicker(symbol: string): TickerMeta | undefined {
  const upper = symbol.toUpperCase();
  return TICKERS.find((t) => t.symbol.toUpperCase() === upper);
}
