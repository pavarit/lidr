"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import type { TickerMeta } from "@/types";
import { SearchBox } from "./SearchBox";

interface Props {
  tickers: TickerMeta[];           // built-in defaults
  customTickers: TickerMeta[];     // user-added via search
  selected: string;
  onSelect: (symbol: string) => void;
  onAddCustom: (ticker: TickerMeta) => void;
  onRemoveCustom: (symbol: string) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  tickers,
  customTickers,
  selected,
  onSelect,
  onAddCustom,
  onRemoveCustom,
  mobileOpen,
  onMobileClose,
}: Props) {
  const etfs = tickers.filter((t) => t.category === "ETF");
  const stocks = tickers.filter((t) => t.category === "Stock");

  const existingSymbols = new Set<string>([
    ...tickers.map((t) => t.symbol),
    ...customTickers.map((t) => t.symbol),
  ]);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-40 w-72 shrink-0",
          "transition-transform duration-300 ease-out",
          "bg-surface-alt/95 backdrop-blur-xl border-r border-surface-line",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="h-full flex flex-col">
          <div className="px-6 pt-6 pb-3">
            <div className="text-lg font-semibold tracking-tight text-ink">lidr</div>
            <div className="text-xs text-ink-soft mt-0.5">
              signal-driven recommendations
            </div>
          </div>

          <div className="px-4 pb-3">
            <SearchBox existingSymbols={existingSymbols} onAdd={onAddCustom} />
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-6">
            {customTickers.length > 0 && (
              <Section
                title="Watching"
                items={customTickers}
                selected={selected}
                onSelect={(s) => {
                  onSelect(s);
                  onMobileClose();
                }}
                onRemove={onRemoveCustom}
              />
            )}
            <Section
              title="ETFs"
              items={etfs}
              selected={selected}
              onSelect={(s) => {
                onSelect(s);
                onMobileClose();
              }}
            />
            <Section
              title="Stocks"
              items={stocks}
              selected={selected}
              onSelect={(s) => {
                onSelect(s);
                onMobileClose();
              }}
            />
          </div>
        </div>
      </aside>
    </>
  );
}

function Section({
  title,
  items,
  selected,
  onSelect,
  onRemove,
}: {
  title: string;
  items: TickerMeta[];
  selected: string;
  onSelect: (s: string) => void;
  onRemove?: (s: string) => void;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <div className="px-3 pb-2 text-[11px] uppercase tracking-wider text-ink-mute font-medium">
        {title}
      </div>
      <ul className="space-y-0.5">
        {items.map((t) => {
          const isActive = t.symbol === selected;
          return (
            <li key={t.symbol} className="group relative">
              <button
                onClick={() => onSelect(t.symbol)}
                className={clsx(
                  "relative w-full text-left px-3 py-2 rounded-lg",
                  "transition-colors duration-150",
                  isActive
                    ? "bg-white text-ink shadow-sm"
                    : "text-ink-soft hover:bg-white/60 hover:text-ink",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg ring-1 ring-black/5"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative flex items-baseline justify-between gap-3">
                  <span className="font-medium text-sm">{t.symbol}</span>
                  <span
                    className={clsx(
                      "text-[11px] text-ink-mute truncate max-w-[10rem]",
                      onRemove && "group-hover:max-w-[7rem]",
                    )}
                  >
                    {t.name}
                  </span>
                </span>
              </button>
              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(t.symbol);
                  }}
                  aria-label={`Remove ${t.symbol}`}
                  className={clsx(
                    "absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5",
                    "inline-flex items-center justify-center rounded-full",
                    "text-ink-mute hover:text-ink hover:bg-surface-alt",
                    "opacity-0 group-hover:opacity-100 transition-opacity text-xs",
                  )}
                >
                  ×
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
