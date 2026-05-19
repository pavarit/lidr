"use client";

import { useState } from "react";
import { TICKERS } from "@/lib/tickers";
import { Sidebar } from "@/components/Sidebar";
import { TickerDetail } from "@/components/TickerDetail";

export default function Home() {
  const [selected, setSelected] = useState<string>(TICKERS[0].symbol);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <Sidebar
        tickers={TICKERS}
        selected={selected}
        onSelect={setSelected}
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
