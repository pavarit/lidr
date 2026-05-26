"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import type {
  HistoryResponse,
  Quote,
  SignalAction,
  SignalResult,
  SignalsResponse,
  Timeframe,
} from "@/types";
import { contextForTimeframe } from "@/lib/signals/config";
import { PriceChart } from "./PriceChart";
import { TimeFrameSelector } from "./TimeFrameSelector";
import { BasicInfo } from "./BasicInfo";
import { SignalCard } from "./SignalCard";

interface Props {
  symbol: string;
}

const MOBILE_ACTION: Record<SignalAction, { dot: string; text: string; bg: string }> = {
  BUY:  { dot: "bg-bull",     text: "text-bull",     bg: "bg-bull/10"     },
  SELL: { dot: "bg-bear",     text: "text-bear",     bg: "bg-bear/10"     },
  HOLD: { dot: "bg-neutral_", text: "text-neutral_", bg: "bg-neutral_/10" },
};

export function TickerDetail({ symbol }: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [showConsensusInfo, setShowConsensusInfo] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [signals, setSignals] = useState<SignalsResponse | null>(null);
  const [chartLoading, setChartLoading] = useState(false);

  const context = useMemo(() => contextForTimeframe(timeframe), [timeframe]);

  useEffect(() => {
    setQuote(null);
    setHistory(null);
    setSignals(null);
  }, [symbol]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const qRes = await fetch(`/api/quote/${symbol}`).then((r) => r.json());
        if (!cancelled && !qRes.error) setQuote(qRes);
      } catch {
        // swallow
      }
    })();
    return () => { cancelled = true; };
  }, [symbol]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sRes = await fetch(
          `/api/signals/${symbol}?context=${context}`,
        ).then((r) => r.json());
        if (!cancelled && !sRes.error) setSignals(sRes);
      } catch {
        // swallow
      }
    })();
    return () => { cancelled = true; };
  }, [symbol, context]);

  useEffect(() => {
    let cancelled = false;
    setChartLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/history/${symbol}?range=${timeframe}`,
        ).then((r) => r.json());
        if (cancelled) return;
        if (!res.error) setHistory(res);
      } catch {
        // swallow
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [symbol, timeframe]);

  const change = quote?.change ?? 0;
  const changePct = quote?.changePercent ?? 0;
  const isUp = change >= 0;

  const consensus = useMemo(() => {
    if (!signals?.signals?.length) return null;
    const sigs = signals.signals;
    const counts = { BUY: 0, HOLD: 0, SELL: 0 } as Record<SignalAction, number>;
    let totalConf = 0;
    for (const s of sigs) {
      counts[s.action]++;
      totalConf += s.confidence;
    }
    const action = (["BUY", "SELL", "HOLD"] as const).reduce((a, b) =>
      counts[a] >= counts[b] ? a : b,
    );
    return { action, score: totalConf / sigs.length, ...counts };
  }, [signals]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={symbol}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* ── Mobile / tablet layout (below xl) ─────────────────── */}
        <div className="xl:hidden space-y-4">
          {/* Compact hero: symbol · name · price · change · consensus pill */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {/* Ticker symbol — same size as price */}
              <div className="text-[26px] font-bold text-ink leading-none tracking-tight">
                {symbol}
              </div>
              {/* Full company name — always its own line, truncated if long */}
              <div className="text-xs text-ink-mute truncate mt-0.5">
                {quote?.name ?? ""}
              </div>
              {/* Price + change */}
              <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
                <span className="text-[26px] font-bold text-ink tabular-nums leading-none">
                  {quote ? `$${quote.price.toFixed(2)}` : "—"}
                </span>
                {quote && (
                  <span
                    className={clsx(
                      "text-sm font-semibold tabular-nums",
                      isUp ? "text-bull" : "text-bear",
                    )}
                  >
                    {isUp ? "+" : ""}
                    {change.toFixed(2)} ({isUp ? "+" : ""}
                    {changePct.toFixed(2)}%)
                  </span>
                )}
              </div>
            </div>

            {/* Consensus pill — tap to see how it's calculated */}
            {consensus && (
              <button
                onClick={() => setShowConsensusInfo(true)}
                className={clsx(
                  "px-3 py-2 rounded-xl flex flex-col items-center shrink-0 min-w-[62px]",
                  "active:opacity-70 transition-opacity",
                  MOBILE_ACTION[consensus.action].bg,
                )}
              >
                <span
                  className={clsx(
                    "text-sm font-bold tracking-wide",
                    MOBILE_ACTION[consensus.action].text,
                  )}
                >
                  {consensus.action}
                </span>
                <span className="text-[10px] text-ink-mute tabular-nums mt-0.5">
                  {Math.round(consensus.score * 100)}%
                </span>
              </button>
            )}
          </div>

          {/* Chart */}
          <div className="card rounded-xl2 p-3">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-medium text-ink">Price</span>
              <div className="overflow-x-auto no-scrollbar">
                <TimeFrameSelector value={timeframe} onChange={setTimeframe} />
              </div>
            </div>
            <PriceChart
              points={history?.points ?? []}
              timeframe={timeframe}
              loading={chartLoading && !history}
            />
          </div>

          {/* Signals */}
          <div>
            <div className="flex justify-between items-baseline mb-2 px-0.5">
              <span className="text-sm font-semibold text-ink">Signals</span>
              {consensus && (
                <span className="text-[10px] text-ink-mute tabular-nums">
                  <b className="text-bull">{consensus.BUY}</b> buy ·{" "}
                  <b className="text-neutral_">{consensus.HOLD}</b> hold ·{" "}
                  <b className="text-bear">{consensus.SELL}</b> sell
                </span>
              )}
            </div>

            {!signals ? (
              <div className="card rounded-xl2 p-4 text-sm text-ink-mute">
                Computing signals…
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={signals.context}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="card rounded-xl2 overflow-hidden divide-y divide-black/[0.05]"
                >
                  {signals.signals.map((sig) => (
                    <MobileSignalRow key={sig.id} signal={sig} />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Stats disclosure */}
          <MobileStatsDisclosure quote={quote} />

          {/* Footer */}
          <p className="text-[10px] text-ink-mute px-0.5 leading-relaxed pb-2">
            Signals are technical, not financial advice. They use historical price
            data and simple indicators. Created by Boon Boonyasirichok.
          </p>

          {/* Consensus info modal */}
          <AnimatePresence>
            {showConsensusInfo && consensus && (
              <>
                {/* Backdrop */}
                <motion.div
                  key="consensus-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/40 z-50"
                  onClick={() => setShowConsensusInfo(false)}
                />
                {/* Bottom sheet */}
                <motion.div
                  key="consensus-sheet"
                  initial={{ y: 48, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 48, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="fixed inset-x-0 bottom-0 z-50 px-3 pb-8"
                >
                  <div className="card rounded-2xl p-5">
                    {/* Sheet header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="text-sm font-semibold text-ink">
                          Overall recommendation
                        </div>
                        <div className="text-[11px] text-ink-mute mt-0.5">
                          How this is calculated
                        </div>
                      </div>
                      <button
                        onClick={() => setShowConsensusInfo(false)}
                        className="w-6 h-6 rounded-full bg-surface-alt flex items-center justify-center text-ink-mute text-sm shrink-0"
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>

                    {/* Verdict banner */}
                    <div
                      className={clsx(
                        "px-4 py-3 rounded-xl mb-4 flex items-center justify-between",
                        MOBILE_ACTION[consensus.action].bg,
                      )}
                    >
                      <span
                        className={clsx(
                          "text-base font-bold tracking-wide",
                          MOBILE_ACTION[consensus.action].text,
                        )}
                      >
                        {consensus.action}
                      </span>
                      <span
                        className={clsx(
                          "text-sm font-semibold tabular-nums",
                          MOBILE_ACTION[consensus.action].text,
                        )}
                      >
                        {Math.round(consensus.score * 100)}% confidence
                      </span>
                    </div>

                    {/* Explanation */}
                    <div className="space-y-2.5 text-[12.5px] text-ink-soft leading-relaxed">
                      <p>
                        <span className="font-semibold text-ink">Action — </span>
                        Majority vote across all {signals?.signals.length ?? 6} signals.{" "}
                        <span className="text-bull font-medium">{consensus.BUY} BUY</span>
                        {" · "}
                        <span className="text-neutral_ font-medium">{consensus.HOLD} HOLD</span>
                        {" · "}
                        <span className="text-bear font-medium">{consensus.SELL} SELL</span>
                        {" — so the overall call is "}
                        <span className={clsx("font-semibold", MOBILE_ACTION[consensus.action].text)}>
                          {consensus.action}
                        </span>.
                      </p>
                      <p>
                        <span className="font-semibold text-ink">Confidence — </span>
                        Average of each signal&apos;s confidence score (0 = no conviction, 100% = maximum).
                      </p>
                    </div>

                    {/* Per-signal breakdown */}
                    {signals && (
                      <div className="mt-4 pt-4 border-t border-black/[0.06]">
                        <div className="text-[10.5px] uppercase tracking-wider text-ink-mute font-medium mb-2.5">
                          Signal breakdown
                        </div>
                        <div className="space-y-2">
                          {signals.signals.map((sig) => {
                            const s = MOBILE_ACTION[sig.action];
                            const pct = Math.round(sig.confidence * 100);
                            return (
                              <div key={sig.id} className="flex items-center gap-2">
                                <div
                                  className={clsx("w-0.5 h-4 rounded-full shrink-0", s.dot)}
                                />
                                <span className="text-[12px] text-ink-soft flex-1 truncate">
                                  {sig.name}
                                </span>
                                <span
                                  className={clsx(
                                    "text-[11px] font-semibold shrink-0",
                                    s.text,
                                  )}
                                >
                                  {sig.action}
                                </span>
                                <span className="text-[10px] text-ink-mute tabular-nums w-7 text-right shrink-0">
                                  {pct}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-ink-mute mt-4 leading-snug">
                      Confidence scores are heuristic strength indicators, not calibrated
                      probabilities. Not financial advice.
                    </p>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* ── Desktop two-column layout (xl+) ───────────────────── */}
        <div className="hidden xl:grid xl:grid-cols-[1fr_22rem] gap-6">
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
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold text-ink">Recommendations</h2>
              <span className="text-[11px] text-ink-mute">
                {signals
                  ? `updated ${new Date(signals.generatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
                  : ""}
              </span>
            </div>

            <AnimatePresence mode="wait">
              {signals && (
                <motion.div
                  key={signals.context}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.2 }}
                  className="text-[11px] text-ink-mute px-1 -mt-2"
                >
                  {signals.contextLabel} · matches the chart timeframe
                </motion.div>
              )}
            </AnimatePresence>

            {!signals && (
              <div className="card rounded-xl2 p-4 text-sm text-ink-mute">
                Computing signals…
              </div>
            )}

            {signals?.signals.map((sig) => (
              <SignalCard key={sig.id} signal={sig} />
            ))}

            <div className="text-[11px] text-ink-mute leading-snug px-1 pt-2 space-y-1.5">
              <p>
                Signals are technical, not financial advice. They use historical
                price data from Yahoo Finance and simple indicators (SMA crossover,
                RSI, MACD, Bollinger Bands, breakout, volume confirmation).
              </p>
              <p>Created by Boon Boonyasirichok.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Mobile-only sub-components ────────────────────────────────────────────────

function MobileSignalRow({ signal }: { signal: SignalResult }) {
  const style = MOBILE_ACTION[signal.action];
  const pct = Math.round(signal.confidence * 100);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
      >
        {/* Thin color bar */}
        <div
          className={clsx("w-0.5 self-stretch rounded-full shrink-0", style.dot)}
        />
        {/* Name + confidence bar */}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-ink leading-snug">
            {signal.name}
          </div>
          <div className="mt-1.5 h-[3px] bg-surface-alt rounded-full overflow-hidden">
            <div
              className={clsx("h-full rounded-full", style.dot)}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {/* Action + confidence % */}
        <div className="text-right shrink-0 min-w-[52px]">
          <div
            className={clsx(
              "text-[11px] font-bold tracking-wide",
              style.text,
            )}
          >
            {signal.action}
          </div>
          <div className="text-[10px] text-ink-mute tabular-nums mt-0.5">
            {pct}%
          </div>
        </div>
      </button>

      {/* Expandable summary */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="exp"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-3 text-[11.5px] text-ink-soft leading-snug">
              {signal.summary}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileStatsDisclosure({ quote }: { quote: Quote | null }) {
  const [open, setOpen] = useState(false);
  if (!quote) return null;

  const mktCap = fmtBig(quote.marketCap);
  const pe = quote.peRatio != null ? quote.peRatio.toFixed(2) : "—";
  const vol = fmtBig(quote.volume);

  return (
    <div className="card rounded-xl2 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <div className="text-[12.5px] font-semibold text-ink">Key stats</div>
          <div className="text-[10.5px] text-ink-mute mt-0.5 tabular-nums">
            {mktCap} · P/E {pe} · Vol {vol}
          </div>
        </div>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.18 }}
          className="text-ink-mute text-base font-medium"
        >
          ›
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="stats"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 pb-4 pt-1 border-t border-black/[0.05]">
              {[
                { label: "Market Cap",    value: fmtBig(quote.marketCap) },
                { label: "P/E (TTM)",     value: quote.peRatio != null ? quote.peRatio.toFixed(2) : "—" },
                { label: "Div Yield",     value: fmtPct(quote.dividendYield) },
                { label: "52w High",      value: fmtMoney(quote.fiftyTwoWeekHigh) },
                { label: "52w Low",       value: fmtMoney(quote.fiftyTwoWeekLow) },
                { label: "Volume",        value: fmtBig(quote.volume) },
                { label: "Avg Vol (3M)",  value: fmtBig(quote.averageVolume) },
                { label: "Exchange",      value: quote.exchange ?? "—" },
              ].map((it) => (
                <div key={it.label}>
                  <dt className="text-[10px] text-ink-mute">{it.label}</dt>
                  <dd className="text-[12px] font-medium text-ink mt-0.5 tabular-nums">
                    {it.value}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function fmtBig(n: number | null): string {
  if (n == null) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return n.toLocaleString();
}

function fmtMoney(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  const pct = Math.abs(n) < 1 ? n * 100 : n;
  return `${pct.toFixed(2)}%`;
}
