"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import type {
  HistoryResponse,
  Quote,
  SignalsResponse,
  Timeframe,
} from "@/types";
import { PriceChart } from "./PriceChart";
import { TimeFrameSelector } from "./TimeFrameSelector";
import { BasicInfo } from "./BasicInfo";
import { SignalCard } from "./SignalCard";

interface Props {
  symbol: string;
}

export function TickerDetail({ symbol }: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [signals, setSignals] = useState<SignalsResponse | null>(null);
  const [chartLoading, setChartLoading] = useState(false);

  // Reset everything when ticker changes
  useEffect(() => {
    setQuote(null);
    setHistory(null);
    setSignals(null);
  }, [symbol]);

  // Fetch quote + signals on ticker change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [qRes, sRes] = await Promise.all([
          fetch(`/api/quote/${symbol}`).then((r) => r.json()),
          fetch(`/api/signals/${symbol}`).then((r) => r.json()),
        ]);
        if (cancelled) return;
        if (!qRes.error) setQuote(qRes);
        if (!sRes.error) setSignals(sRes);
      } catch {
        // swallow — UI handles empty state
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  // Fetch history whenever ticker or timeframe changes
  useEffect(() => {
    let cancelled = false;
    setChartLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/history/${symbol}?range=${timeframe}`).then(
          (r) => r.json(),
        );
        if (cancelled) return;
        if (!res.error) setHistory(res);
      } catch {
        // swallow
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol, timeframe]);

  const change = quote?.change ?? 0;
  const changePct = quote?.changePercent ?? 0;
  const isUp = change >= 0;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={symbol}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="grid grid-cols-1 xl:grid-cols-[1fr_22rem] gap-6"
      >
        {/* Main column */}
        <div className="space-y-6 min-w-0">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-mute font-medium">
              {symbol}
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink mt-1 truncate">
              {quote?.name ?? symbol}
            </h1>
            <div className="mt-3 flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-semibold text-ink tabular-nums">
                {quote ? `$${quote.price.toFixed(2)}` : "—"}
              </span>
              <span
                className={clsx(
                  "text-sm font-medium tabular-nums",
                  isUp ? "text-bull" : "text-bear",
                )}
              >
                {quote
                  ? `${isUp ? "+" : ""}${change.toFixed(2)} (${isUp ? "+" : ""}${changePct.toFixed(2)}%)`
                  : ""}
              </span>
            </div>
          </div>

          <div className="card rounded-xl2 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-sm font-medium text-ink">Price</div>
              <TimeFrameSelector value={timeframe} onChange={setTimeframe} />
            </div>
            <PriceChart
              points={history?.points ?? []}
              timeframe={timeframe}
              loading={chartLoading && !history}
            />
          </div>

          <BasicInfo quote={quote} />
        </div>

        {/* Right column: signals */}
        <div className="space-y-4 min-w-0">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-ink">Recommendations</h2>
            <span className="text-[11px] text-ink-mute">
              {signals
                ? `updated ${new Date(signals.generatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
                : ""}
            </span>
          </div>

          {!signals && (
            <div className="card rounded-xl2 p-4 text-sm text-ink-mute">
              Computing signals…
            </div>
          )}

          {signals?.signals.map((sig) => (
            <SignalCard key={sig.id} signal={sig} />
          ))}

          <div className="text-[11px] text-ink-mute leading-snug px-1 pt-2">
            Signals are technical, not financial advice. They use historical price data
            from Yahoo Finance and simple indicators (50/200 SMA crossover, 14-day RSI).
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
