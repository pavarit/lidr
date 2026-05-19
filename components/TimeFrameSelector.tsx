"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import type { Timeframe } from "@/types";

const OPTIONS: Timeframe[] = ["1D", "1W", "1M", "3M", "1Y", "5Y", "ALL"];

interface Props {
  value: Timeframe;
  onChange: (tf: Timeframe) => void;
}

export function TimeFrameSelector({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center bg-surface-alt rounded-full p-1 text-xs">
      {OPTIONS.map((tf) => {
        const active = tf === value;
        return (
          <button
            key={tf}
            onClick={() => onChange(tf)}
            className={clsx(
              "relative px-3 py-1.5 rounded-full font-medium transition-colors",
              active ? "text-white" : "text-ink-soft hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId="tf-active"
                className="absolute inset-0 bg-ink rounded-full"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{tf}</span>
          </button>
        );
      })}
    </div>
  );
}
