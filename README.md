# lidr

[![CI](https://github.com/pavarit/lidr/actions/workflows/ci.yml/badge.svg)](https://github.com/pavarit/lidr/actions/workflows/ci.yml)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/deployed-Vercel-black?logo=vercel)](https://lidr-eta.vercel.app/)
[![License: PolyForm Noncommercial](https://img.shields.io/badge/license-PolyForm--Noncommercial%201.0.0-blue.svg)](LICENSE)

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

## Data flow

```
TickerDetail.tsx (browser)
   │
   │ on click / timeframe change: three parallel fetches
   ▼
┌──────────────────────────────────────────────────────┐
│  Next.js API routes (app/api/*)                      │
│                                                       │
│  /api/quote/[ticker]              (revalidate 30 s)  │
│  /api/history/[ticker]?range=     (revalidate 60 s)  │
│  /api/signals/[ticker]?context=   (revalidate 300 s) │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
                 lib/yahoo.ts
              (fetchQuote / fetchHistory /
               fetchSignalSeries → ~3 yr daily closes)
                       │
                       ▼
                 Yahoo Finance
                       │  signal route only:
                       ▼
              lib/signals/index.ts
              runAllSignals(closes, volumes, context)
                       │
   ┌────────┬────────┬─┴──────┬─────────┬──────────┬─────────┐
   ▼        ▼        ▼        ▼         ▼          ▼         │
 sma.ts  rsi.ts  macd.ts  bollinger  breakout    volume.ts   │
                                                              │
                       returns SignalResult[] (action, ──────┘
                                               confidence,
                                               summary, ...)
```

`context` is one of `short` / `medium` / `long`, mapped from the chart timeframe by `contextForTimeframe()` in [`lib/signals/config.ts`](lib/signals/config.ts). Each context picks a different `SignalParams` block (lookback windows). When the user changes timeframe the frontend re-issues the signals and history fetches; the quote fetch stays cached for the same ticker.

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

## API reference

Four routes, all under `app/api/`. Each one returns JSON; each one declares a `revalidate` window (seconds) controlling Next.js's server-side cache. Errors return `{ error: string }` with a 500 status.

| Endpoint | Params | `revalidate` | Returns |
| --- | --- | --- | --- |
| `GET /api/quote/[ticker]` | path: `ticker` | `30` | `Quote` — price, change, market cap, P/E, dividend yield, 52-week range, volume, exchange. |
| `GET /api/history/[ticker]` | path: `ticker` · query: `range` (one of `1D`, `1W`, `1M`, `3M`, `1Y`, `5Y`, `ALL`) | `60` | `HistoryResponse` — `{ symbol, timeframe, points: [{ t, c }, ...] }`. Interval adapts to range (5m for `1D`, daily for `1M`/`3M`/`1Y`, weekly for `5Y`, monthly for `ALL`). |
| `GET /api/signals/[ticker]` | path: `ticker` · query: `context` (one of `short`, `medium`, `long`) | `300` | `SignalsResponse` — `{ symbol, generatedAt, context, contextLabel, signals: SignalResult[] }`. Always fetches ~3 years of daily closes server-side; runs every registered signal under the chosen context's parameter set. |
| `GET /api/search` | query: `q` | `60` | `{ results: TickerMeta[] }` — up to 8 equities or ETFs from Yahoo Finance's search. |

The signal context system is the mechanism that lets the same six signals adapt to whichever chart timeframe the user is viewing. Mapping rule ([`lib/signals/config.ts::contextForTimeframe`](lib/signals/config.ts)): `1M → short`, `3M → medium`, everything else (`1D`, `1W`, `1Y`, `5Y`, `ALL`) → `long`. Each context uses different lookback windows (e.g. SMA fast/slow: `10/20` short, `20/50` medium, `50/200` long). The frontend re-fetches signals whenever the user changes timeframe.

To make a route live (skip caching), set `revalidate = 0`. See [CONTRIBUTING.md → Adding an API route](CONTRIBUTING.md#adding-an-api-route).

## Signal types

Full shapes live in [`types/index.ts`](types/index.ts). Headline:

```ts
interface SignalInput {
  closes: number[];   // ~3 years of daily closes, newest at the end
  volumes: number[];  // index-aligned with closes; 0 on null
  params: SignalParams;  // 13 tunable lookback fields, see lib/signals/config.ts
}

interface SignalResult {
  id: string;                            // stable, e.g. "sma-crossover"
  name: string;                          // shown in the UI card title
  action: "BUY" | "HOLD" | "SELL";
  confidence: number;                    // 0..1; see CONTRIBUTING.md for the convention
  summary: string;                       // one-line plain-English reasoning
  details: Record<string, number | string | null>;  // raw values used
  explanation: { plain: string; example: string; formula: string };  // tooltip text
}
```

Adding a new signal: see [CONTRIBUTING.md → Adding a signal](CONTRIBUTING.md#adding-a-signal).

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

## Contributing

PRs and issues welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, the full signal-adding procedure with type shapes, the API-route conventions, and commit/PR rules.

## License

**[PolyForm Noncommercial 1.0.0](LICENSE)** — full text in the LICENSE file.

In plain English:

- ✅ Free to use, modify, and share for any **noncommercial** purpose — personal research, education, hobby projects, evaluation, work at a charitable / educational / public-research organization.
- ❌ **Commercial use requires a separate license** from the copyright holder. This includes running this code as a hosted service, embedding it in a product you sell, or otherwise using it as part of revenue-generating activity.

If you want to use lidr commercially, open a GitHub issue or contact the author directly to discuss licensing.

---

## Disclaimer

This is a prototype for personal/educational use. Technical signals are not financial advice. Don't risk real money on it without understanding what each signal does and doesn't measure.
