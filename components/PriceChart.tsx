"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";
import type { PricePoint, Timeframe } from "@/types";

interface Props {
  points: PricePoint[];
  timeframe: Timeframe;
  loading?: boolean;
}

export function PriceChart({ points, timeframe, loading }: Props) {
  const data = useMemo(
    () => points.map((p) => ({ t: p.t, c: p.c })),
    [points],
  );

  const { isUp, color, gradientId } = useMemo(() => {
    if (data.length < 2) {
      return { isUp: true, color: "#0071e3", gradientId: "g-up" };
    }
    const up = data[data.length - 1].c >= data[0].c;
    return {
      isUp: up,
      color: up ? "#34c759" : "#ff3b30",
      gradientId: up ? "g-up" : "g-down",
    };
  }, [data]);

  if (loading || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-ink-mute text-sm">
        {loading ? "Loading chart…" : "No data."}
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="t"
            tickFormatter={(t: number) => formatTick(t, timeframe)}
            tick={{ fontSize: 11, fill: "#86868b" }}
            axisLine={false}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 11, fill: "#86868b" }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
          />
          <Tooltip
            cursor={{ stroke: "#d2d2d7" }}
            contentStyle={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid #d2d2d7",
              borderRadius: 10,
              fontSize: 12,
            }}
            labelFormatter={(t: number) => formatFullDate(t)}
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Close"]}
          />
          <Area
            type="monotone"
            dataKey="c"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive
            animationDuration={400}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatTick(t: number, tf: Timeframe): string {
  const d = new Date(t);
  if (tf === "1D") {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  if (tf === "1W" || tf === "1M") {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  if (tf === "3M" || tf === "1Y") {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function formatFullDate(t: number): string {
  return new Date(t).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
