# lidr

A clean, signal-driven robo-advisor prototype that recommends **buy / hold / sell** actions on a curated list of ETFs and individual stocks.

Built to be cheap to run, fast to iterate on, and easy to grow into a real product.

**Live demo:** https://lidr-eta.vercel.app/

---

## What's in this prototype

- **20 default tickers** out of the box — 10 broad/sector ETFs (VTI, VOO, QQQ, SPY, IWM, VEA, VWO, XLK, XLF, XLE) and 10 popular individual stocks (AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, BRK-B, JPM, V).
- **Ticker search** — search and add any equity or ETF Yahoo knows about to a custom watchlist; the list persists per browser via `localStorage`.
- **Live price chart** with selectable timeframes (1D, 1W, 1M, 3M, 1Y, 5Y, ALL).
- **Key stats** at a glance (market cap, P/E, dividend yield, 52-week range, volume, exchange).
- **Six signals** computed on the server from daily closes, with parameters that adapt to the chart timeframe (short / medium / long context):
  - **SMA Crossover** — classic trend / "golden cross" signal
  - **RSI** — momentum / mean-reversion
  - **MACD** — trend-following momentum via convergence/divergence of two EMAs
  - **Bollinger Bands** — volatility-adjusted mean reversion
  - **Period-high/low breakout** — momentum on new range extremes (52-week default)
  - **Volume-confirmed breakout** — combines price extremes with above-average volume
- **Signal tooltips** — every card has an info icon that expands a plain-English explanation, a worked example, and the confidence formula.
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

## Deploying your own copy

> The canonical lidr is already deployed at <https://lidr-eta.vercel.app/>. The steps below are for **forks** — anyone who wants their own copy running on their own Vercel account.

### Push your fork to GitHub

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

### Deploy to Vercel (one-click hosting)

1. Push your fork to GitHub (above).
2. Go to <https://vercel.com/new>, import the repo.
3. Accept defaults — Vercel auto-detects Next.js.
4. Click **Deploy**.

You'll get a public URL (e.g. `lidr.vercel.app`). Free tier is plenty for personal use. After the first deploy, every `git push` to `main` auto-deploys a new build via the Vercel GitHub integration — no manual step.

---

## How to add a new signal

1. Create `lib/signals/<your-signal>.ts` exporting a function `(input: SignalInput) => SignalResult`. `SignalInput` gives you `closes`, `volumes`, and `params` (the context-tuned lookback windows from `lib/signals/config.ts`).
2. Add it to the array in `lib/signals/index.ts`.
3. **If your signal needs a new tunable parameter** (e.g. a custom lookback window), also: (a) add the field to the `SignalParams` interface in `types/index.ts`, and (b) add a value for it under each of the three contexts (`short` / `medium` / `long`) in `lib/signals/config.ts`.

The signal will appear in the right-hand panel automatically across all three contexts. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full procedure, type shapes, and confidence convention.

> Note: most new-signal exploration happens in the sibling [`lidr-ml`](https://github.com/pavarit/lidr-ml) project, which is where backtesting + calibrated probabilities live. Signals get prototyped and validated there before potentially being added here.

---

## How to add a new ticker

Edit `lib/tickers.ts` and add an entry to either the `ETFS` or `STOCKS` array. The sidebar reflects it on the next reload.

---

## More context

For the detailed folder structure, design decisions, current roadmap, and recent change log, see [`CLAUDE.md`](CLAUDE.md).

---

## Disclaimer

This is a prototype for personal/educational use. Technical signals are not financial advice. Don't risk real money on it without understanding what each signal does and doesn't measure.
