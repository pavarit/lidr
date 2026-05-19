# lidr

A clean, signal-driven robo-advisor prototype that recommends **buy / hold / sell** actions on a curated list of ETFs and individual stocks.

Built to be cheap to run, fast to iterate on, and easy to grow into a real product.

---

## What's in this prototype

- **20 tickers** out of the box — 10 broad/sector ETFs (VTI, VOO, QQQ, SPY, IWM, VEA, VWO, XLK, XLF, XLE) and 10 popular individual stocks (AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, BRK-B, JPM, V).
- **Live price chart** with selectable timeframes (1D, 1W, 1M, 3M, 1Y, 5Y, ALL).
- **Key stats** at a glance (market cap, P/E, dividend yield, 52-week range, volume, exchange).
- **Two starter signals** computed on the server from daily closes:
  - **50/200 SMA Crossover** — classic trend / "golden cross" signal.
  - **14-day RSI** — momentum / mean-reversion signal.
- **Apple-style UI** — frosted cards, system font stack, fluid Framer Motion transitions.
- **Responsive** — works on phone and desktop with a collapsible sidebar.

---

## Tech stack

- **Next.js 14** (App Router) + **TypeScript** — frontend, API routes, and server-side signal computation in a single deployable unit.
- **Tailwind CSS** + **Framer Motion** — minimal, Apple-leaning visual language with fluid transitions.
- **Recharts** — clean, themeable price charts.
- **yahoo-finance2** — free, no-API-key access to Yahoo Finance quotes and historical data.
- **Vercel** (recommended hosting) — free for personal use, one-command deploys.

Cost to run for personal use: **\$0**.

---

## Run it locally

```bash
# from the project root
npm install
npm run dev
```

Open <http://localhost:3000>.

The first page load may take a few seconds while Yahoo Finance is queried for quote/history/signals. Subsequent loads are cached (30s for quotes, 60s for history, 5m for signals).

---

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial prototype: signal-driven robo-advisor"

# Create the repo on github.com first, then:
git remote add origin git@github.com:<your-username>/lidr.git
git branch -M main
git push -u origin main
```

Or with the GitHub CLI:

```bash
gh repo create lidr --private --source=. --remote=origin --push
```

---

## Deploy to Vercel (one-click hosting)

1. Push to GitHub (above).
2. Go to <https://vercel.com/new>, import the repo.
3. Accept defaults — Vercel auto-detects Next.js.
4. Click **Deploy**.

You'll get a public URL (e.g. `lidr.vercel.app`). Free tier is plenty for personal use.

---

## Project structure

```
app/
  api/
    quote/[ticker]/route.ts      — current price + key stats
    history/[ticker]/route.ts    — OHLC series for a given timeframe
    signals/[ticker]/route.ts    — runs all signals on daily closes
  layout.tsx
  page.tsx                       — landing page (sidebar + main panel)
  globals.css

components/
  Sidebar.tsx                    — left ticker list (ETFs + Stocks sections)
  TickerDetail.tsx               — orchestrates fetch + layout
  PriceChart.tsx                 — Recharts area chart
  TimeFrameSelector.tsx          — segmented control for 1D…ALL
  BasicInfo.tsx                  — market cap, P/E, etc.
  SignalCard.tsx                 — recommendation card per signal

lib/
  tickers.ts                     — the 20-ticker watchlist
  yahoo.ts                       — Yahoo Finance helper (quotes, history, closes)
  signals/
    sma.ts                       — 50/200 SMA crossover
    rsi.ts                       — 14-day RSI
    index.ts                     — runAllSignals()

types/
  index.ts                       — shared TS types

```

---

## How to add a new signal

1. Create `lib/signals/<your-signal>.ts` that exports a function `(closes: number[]) => SignalResult`.
2. Add it to the array in `lib/signals/index.ts`.
3. That's it — it'll appear in the right-hand panel automatically.

Good next signals to try: **MACD**, **Bollinger Bands**, **52-week breakout**, **earnings drift**.

---

## How to add a new ticker

Edit `lib/tickers.ts` and add an entry to either the `ETFS` or `STOCKS` array. The sidebar reflects it on the next reload.

---

## Roadmap ideas

- User accounts + per-user watchlists (Supabase or NextAuth + Postgres).
- Fundamental signals (earnings surprise, analyst revisions) — requires a paid data source (Polygon, Finnhub, IEX).
- Alerts when a signal flips for a ticker on your watchlist (cron + email/SMS).
- Backtesting view: "if you'd followed this signal for the last 5 years…"
- Portfolio mode: aggregate recommendations across the holdings you actually own.

---

## Disclaimer

This is a prototype for personal/educational use. Technical signals are not financial advice. Don't risk real money on it without understanding what each signal does and doesn't measure.
