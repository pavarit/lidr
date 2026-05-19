"use client";

import { useCallback, useEffect, useState } from "react";
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
    setSelected(ticker.symbol); // auto-select the newly added ticker
  }, []);

  const handleRemoveCustom = useCallback(
    (symbol: string) => {
      setCustomTickers((prev) => prev.filter((t) => t.symbol !== symbol));
      // If they removed the currently-selected ticker, fall back to default.
      setSelected((cur) => (cur === symbol ? TICKERS[0].symbol : cur));
    },
    [],
  );

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
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 bg-surface-alt/90 backdrop-blur border-b border-surface-line px-4 h-12 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-sm text-ink-soft hover:text-ink"
            aria-label="Open ticker list"
          >
            ☰ Tickers
          </button>
          <div className="text-sm font-semibold text-ink">{selected}</div>
          <div className="w-12" />
        </div>

        <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
          <TickerDetail symbol={selected} />
        </div>
      </main>
    </div>
  );
}
