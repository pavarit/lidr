"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import type { TickerMeta } from "@/types";

interface Props {
  /** Symbols already in the user's watchlist or default list — used to disable "Add". */
  existingSymbols: Set<string>;
  onAdd: (ticker: TickerMeta) => void;
}

export function SearchBox({ existingSymbols, onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TickerMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Debounced search — wait 300ms after the user stops typing.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`).then(
          (r) => r.json(),
        );
        if (!res.error) setResults(res.results ?? []);
      } catch {
        // ignore — empty results state will render
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Click-outside to close the dropdown.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-mute pointer-events-none"
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
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="Search ticker or company…"
          className={clsx(
            "w-full pl-9 pr-8 py-2 text-sm rounded-lg",
            "bg-white/80 backdrop-blur border border-surface-line",
            "text-ink placeholder:text-ink-mute",
            "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50",
            "transition-shadow",
          )}
        />
        {query.length > 0 && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 inline-flex items-center justify-center rounded-full text-ink-mute hover:text-ink hover:bg-surface-alt text-xs"
          >
            ×
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={clsx(
              "absolute z-50 left-0 right-0 mt-1",
              "bg-white/95 backdrop-blur-xl rounded-lg shadow-lg ring-1 ring-black/5",
              "max-h-72 overflow-y-auto",
            )}
          >
            {loading && (
              <div className="px-3 py-2 text-xs text-ink-mute">Searching…</div>
            )}
            {!loading && results.length === 0 && (
              <div className="px-3 py-2 text-xs text-ink-mute">No matches.</div>
            )}
            {!loading &&
              results.map((r) => {
                const exists = existingSymbols.has(r.symbol);
                return (
                  <button
                    key={r.symbol}
                    onClick={() => {
                      if (exists) return;
                      onAdd(r);
                      setQuery("");
                      setResults([]);
                      setOpen(false);
                    }}
                    disabled={exists}
                    className={clsx(
                      "w-full text-left px-3 py-2 flex items-baseline justify-between gap-3",
                      "transition-colors",
                      exists
                        ? "cursor-default text-ink-mute"
                        : "hover:bg-surface-alt text-ink",
                    )}
                  >
                    <span className="flex items-baseline gap-2 min-w-0">
                      <span className="font-medium text-sm shrink-0">
                        {r.symbol}
                      </span>
                      <span className="text-[11px] text-ink-mute truncate">
                        {r.name}
                      </span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-ink-mute shrink-0">
                      {exists ? "added" : r.category}
                    </span>
                  </button>
                );
              })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
