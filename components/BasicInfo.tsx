import type { Quote } from "@/types";

interface Props {
  quote: Quote | null;
}

export function BasicInfo({ quote }: Props) {
  if (!quote) {
    return (
      <div className="card rounded-xl2 p-5 text-sm text-ink-mute">
        Loading info…
      </div>
    );
  }

  const items: Array<{ label: string; value: string }> = [
    { label: "Market Cap", value: fmtBig(quote.marketCap) },
    { label: "P/E (TTM)", value: fmtNum(quote.peRatio, 2) },
    { label: "Dividend Yield", value: fmtPercent(quote.dividendYield) },
    { label: "52w High", value: fmtMoney(quote.fiftyTwoWeekHigh) },
    { label: "52w Low", value: fmtMoney(quote.fiftyTwoWeekLow) },
    { label: "Volume", value: fmtBig(quote.volume) },
    { label: "Avg Volume (3M)", value: fmtBig(quote.averageVolume) },
    { label: "Exchange", value: quote.exchange ?? "—" },
  ];

  return (
    <div className="card rounded-xl2 p-5">
      <div className="text-xs uppercase tracking-wider text-ink-mute font-medium mb-3">
        Key Stats
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
        {items.map((it) => (
          <div key={it.label}>
            <dt className="text-[11px] text-ink-mute">{it.label}</dt>
            <dd className="text-sm font-medium text-ink mt-0.5">{it.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function fmtBig(n: number | null): string {
  if (n == null) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3)  return n.toLocaleString();
  return n.toString();
}

function fmtNum(n: number | null, digits = 2): string {
  if (n == null) return "—";
  return n.toFixed(digits);
}

function fmtMoney(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtPercent(n: number | null): string {
  if (n == null) return "—";
  // Yahoo returns dividendYield as a fraction in many cases (e.g. 0.0123 = 1.23%)
  // and sometimes as a percent already. Use a sane heuristic.
  const pct = Math.abs(n) < 1 ? n * 100 : n;
  return `${pct.toFixed(2)}%`;
}
