"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import type { SignalResult } from "@/types";

interface Props {
  signal: SignalResult;
}

const ACTION_STYLES: Record<SignalResult["action"], { dot: string; text: string; bg: string }> = {
  BUY:  { dot: "bg-bull",     text: "text-bull",     bg: "bg-bull/10"     },
  SELL: { dot: "bg-bear",     text: "text-bear",     bg: "bg-bear/10"     },
  HOLD: { dot: "bg-neutral_", text: "text-neutral_", bg: "bg-neutral_/10" },
};

export function SignalCard({ signal }: Props) {
  const style = ACTION_STYLES[signal.action];
  const confidencePct = Math.round(signal.confidence * 100);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="card rounded-xl2 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-ink-mute font-medium">
              Signal
            </div>
            <div className="text-sm font-semibold text-ink mt-0.5 flex items-center gap-1.5">
              <span className="truncate">{signal.name}</span>
              <button
                onClick={() => setShowInfo((v) => !v)}
                aria-label={showInfo ? "Hide explanation" : "Show explanation"}
                aria-expanded={showInfo}
                className={clsx(
                  "shrink-0 w-4 h-4 inline-flex items-center justify-center rounded-full",
                  "text-[10px] font-semibold transition-colors",
                  showInfo
                    ? "bg-ink text-white"
                    : "bg-surface-alt text-ink-mute hover:bg-surface-line hover:text-ink",
                )}
              >
                i
              </button>
            </div>
          </div>
        </div>
        <div
          className={clsx(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0",
            style.bg,
            style.text,
          )}
        >
          <span className={clsx("w-1.5 h-1.5 rounded-full", style.dot)} />
          {signal.action}
        </div>
      </div>

      <p className="text-sm text-ink-soft mt-3 leading-snug">{signal.summary}</p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-ink-mute mb-1">
          <span>Confidence</span>
          <span>{confidencePct}%</span>
        </div>
        <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidencePct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={clsx("h-full rounded-full", style.dot)}
          />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {showInfo && (
          <motion.div
            key="info"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-black/5 space-y-3">
              <ExplanationBlock
                label="How it works"
                body={signal.explanation.plain}
              />
              <ExplanationBlock
                label="Example"
                body={signal.explanation.example}
              />
              <ExplanationBlock
                label="Confidence formula"
                body={signal.explanation.formula}
                mono
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ExplanationBlock({
  label,
  body,
  mono = false,
}: {
  label: string;
  body: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-mute font-medium mb-1">
        {label}
      </div>
      <p
        className={clsx(
          "text-xs leading-relaxed text-ink-soft",
          mono && "font-mono text-[11px]",
        )}
      >
        {body}
      </p>
    </div>
  );
}
