"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { TICKERS } from "@/lib/tickers";
import { Sidebar } from "@/components/Sidebar";
import { TickerDetail } from "@/components/TickerDetail";
import type { TickerMeta } from "@/types";

const STORAGE_KEY = "lidr.custom-tickers.v1";

export default function Home() {
  const [selected, setSelected] = useState<string>(TICKERS[0].symbol);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [customTickers, setCustomTickers] = useState<TickerMeta[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load saved watchlist from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCustomTickers(parsed);
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // Persist any changes back to localStorage, but skip the initial render
  // so we don't overwrite saved data with an empty array on first paint.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customTickers));
    } catch {
      // ignore quota errors
    }
  }, [customTickers, hydrated]);

  const handleAddCustom = useCallback((ticker: TickerMeta) => {
    setCustomTickers((prev) => {
      if (prev.some((t) => t.symbol === ticker.symbol)) return prev;
      return [...prev, ticker];
    });
    setSelected(ticker.symbol);
  }, []);

  const handleRemoveCustom = useCallback(
    (symbol: string) => {
      setCustomTickers((prev) => prev.filter((t) => t.symbol !== symbol));
      setSelected((cur) => (cur === symbol ? TICKERS[0].symbol : cur));
    },
    [],
  );

  // Chip strip: custom tickers first, then defaults, selected always included.
  const chipTickers = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const sym of [
      ...customTickers.map((t) => t.symbol),
      selected,
      ...TICKERS.map((t) => t.symbol),
    ]) {
      if (!seen.has(sym)) {
        seen.add(sym);
        result.push(sym);
      }
    }
    return result.slice(0, 14);
  }, [customTickers, selected]);

  return (
    <div className="min-h-screen flex">
      <Sidebar
        tickers={TICKERS}
        customTickers={customTickers}
        selected={selected}
        onSelect={setSelected}
        onAddCustom={handleAddCustom}
        onRemoveCustom={handleRemoveCustom}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main className="flex-1 min-w-0">
        {/* Mobile sticky header: full search bar + ticker chip strip (below lg) */}
        <div className="lg:hidden sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xl border-b border-surface-line px-3.5 pt-2.5 pb-2.5">
          {/* Search bar — opens sidebar drawer */}
          <button
            onClick={() => setMobileOpen(true)}
            className={clsx(
              "w-full flex items-center gap-2 h-9 px-3 rounded-xl",
              "bg-white/80 border border-surface-line text-ink-mute text-sm",
            )}
            aria-label="Search ticker or company"
          >
            <svg
              className="w-3.5 h-3.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="flex-1 text-left">Search ticker or company</span>
          </button>

          {/* Ticker chip strip */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
            {chipTickers.map((sym) => {
              const active = sym === selected;
              return (
                <button
                  key={sym}
                  onClick={() => setSelected(sym)}
                  className={clsx(
                    "shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                    active
                      ? "bg-ink text-white"
                      : "bg-white/70 text-ink-soft border border-surface-line",
                  )}
                >
                  {sym}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
          <TickerDetail symbol={selected} />
        </div>
      </main>
    </div>
  );
}
