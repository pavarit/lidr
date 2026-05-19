# CLAUDE.md

This file orients any AI assistant (Claude Code, Claude Cowork, etc.) joining this project. Read it before doing anything else. Then keep it current — see "Maintenance Instructions" at the bottom.

## Project Goal

lidr is a signal-driven robo-advisor — a web app that recommends **BUY / HOLD / SELL** actions on a watchlist of stocks and ETFs based on technical signals computed from daily price data. Started as a personal-use prototype with an explicit path to sharing with others. Cost-effectiveness was a stated requirement: the entire stack runs free for personal use, with no paid data sources or API keys.

## Stack

- **Frontend + backend in one app**: Next.js 14 (App Router) + TypeScript (strict).
- **Styling**: Tailwind CSS with a custom Apple-leaning color palette (`tailwind.config.ts`).
- **Animation**: Framer Motion (fluid layout-id transitions, mount/exit animations).
- **Charting**: Recharts (area chart with timeframe selector).
- **Market data**: `yahoo-finance2` v3 — requires the `new YahooFinance()` instantiation pattern (v2's default singleton was removed).
- **Persistence (client-side)**: `localStorage` for the user's custom watchlist. Key: `lidr.custom-tickers.v1`.
- **Deployment target**: Vercel free tier (not yet deployed as of last entry).
- **Hosting repo**: https://github.com/pavarit/lidr

## Current State

- Local dev: `npm install && npm run dev` → http://localhost:3000
- Working directory: `C:\Users\smnk1\Claude\Projects\lidr` (deliberately outside OneDrive — see Key Decisions)
- GitHub repo pushed and current
- Not yet deployed to Vercel
- **Six signals running**: SMA crossover, RSI, MACD, Bollinger Bands, period-high/low breakout, volume-confirmed breakout
- **Context-aware parameters**: every signal's lookback windows scale with the chart timeframe being viewed (short / medium / long contexts defined in `lib/signals/config.ts`)
- **20 default tickers**: 10 ETFs (broad market + major sectors) + 10 popular individual stocks. Defined in `lib/tickers.ts`.
- **Custom watchlist**: users can search Yahoo's universe and add tickers; list persists per-browser-per-machine via `localStorage`. A "Watching" section appears above ETFs/Stocks in the sidebar when non-empty.
- **Apple-style UI**: frosted-glass cards, system font stack, fluid spring transitions; responsive down to mobile width with a collapsible sidebar.
- **Signal tooltips**: each signal card has an `i` icon that expands an inline explanation with plain English, a worked example, and the confidence formula.
- **API routes**: `/api/quote/[ticker]`, `/api/history/[ticker]?range=`, `/api/signals/[ticker]?context=`, `/api/search?q=`.

### Folder map

```
app/                     pages + API routes (App Router)
  api/
    quote/[ticker]/      current price + key stats
    history/[ticker]/    price series for a timeframe
    signals/[ticker]/    runs all signals for a context
    search/              ticker search (Yahoo)
  layout.tsx, page.tsx, globals.css
components/              all React UI
  Sidebar.tsx, SearchBox.tsx, TickerDetail.tsx,
  PriceChart.tsx, TimeFrameSelector.tsx, BasicInfo.tsx,
  SignalCard.tsx
lib/
  tickers.ts             the 20-ticker default watchlist
  yahoo.ts               Yahoo Finance helpers (quote, history, fetchSignalSeries)
  signals/
    config.ts            params per context + timeframe → context mapping
    index.ts             runAllSignals() — registry
    sma.ts, rsi.ts, macd.ts, bollinger.ts, breakout.ts, volume.ts
types/
  index.ts               shared TypeScript types
```

## Key Decisions

Things that might surprise future-Claude. Keep these in mind before changing related code.

- **Pinned to Next 14, not 15/16.** Next 16 made App Router route handler `params` async, which would break the four files under `app/api/*/route.ts`. Migration is on Next Up but explicitly deferred until before public launch.
- **Project lives outside OneDrive deliberately.** OneDrive sync interfered with Next.js's file watcher (broke hot-reload, served stale compiled code from `.next/`) and locked files mid-build. If a future move is ever proposed, keep it out of OneDrive paths.
- **Signals are pluggable by design.** Each is a pure function `(SignalInput) → SignalResult` in `lib/signals/`. Adding a new one requires only: a new file, plus one line in the `runAllSignals` array in `lib/signals/index.ts`. The route and UI need zero changes.
- **Signal context system.** Three contexts: `short` (1M chart view), `medium` (3M view), `long` (every other timeframe — 1D, 1W, 1Y, 5Y, ALL). Each has a `SignalParams` set in `lib/signals/config.ts`. Mapping is `contextForTimeframe()`. The frontend refetches signals when the user changes timeframe.
- **Confidence values are heuristics, NOT probabilities.** They're normalized strength scores ranging 0–1 based on how far past a threshold the signal is. The UI footer is honest about this; do not present them as calibrated probabilities. Real probabilities would require backtesting (Level 2 from prior discussion: empirical win rates from historical data).
- **Custom watchlist is per-browser-per-machine.** No cross-device sync. Multi-device sync requires auth + a backend, which is a separate roadmap item (Next Up #4).
- **yahoo-finance2 v3 quirks to remember**:
  - Default export is the `YahooFinance` *class*, not a singleton. Always: `const yahooFinance = new YahooFinance()`.
  - `suppressNotices()` no longer exists. Don't reintroduce it; it'll crash all API routes.
  - Methods used: `search()`, `quote()`, `chart()`.
- **Yahoo is unofficial.** No API key needed but data center IPs can be rate-limited. If after Vercel deploy all three endpoints (`/api/quote`, `/api/history`, `/api/signals`) start 500ing in production while working locally, that's the most likely cause. Rotating user agents or switching to a paid source (Polygon, Finnhub) are the workarounds.
- **GitHub commits use the noreply email** (`...@users.noreply.github.com`), not personal email. GitHub email privacy protection is on; commits authored with the personal email will be rejected on push.
- **API caching at the route level.** Each `app/api/*/route.ts` exports `revalidate` (30s for quotes, 60s for history, 300s for signals, 60s for search). To make a route live, set to 0.

## Next Up

In rough priority order:

1. **Deploy to Vercel.** "Continue with GitHub" → import `pavarit/lidr` → click Deploy. Free tier, no env vars needed.
2. **Add a `robots.txt` or simple password gate** before sharing the Vercel URL widely.
3. **Migrate to Next 16** before going public. Main work: update `params` to `Promise<...>` and `await` it in the four route handlers under `app/api/*/route.ts`.
4. **Add auth + backend** (NextAuth + Supabase free tier are the discussed options) so the watchlist can sync across devices.
5. **Backtest the signals** against historical data to produce calibrated confidence values (Level 2). Good Python-first project since the user has a Python analytics background.
6. **Add fundamental signals** (earnings momentum, P/E percentile vs own history). Requires a paid data source — not on the immediate path.

## Recent Changes

### 2026-05-18 — Initial build, signal expansion, ticker search

Scaffolded the project from scratch and shipped through a full first-version arc in one session. Built the base Next.js 14 + Tailwind + TypeScript app with two starter signals (50/200 SMA, 14-day RSI), then expanded to six signals (added MACD, Bollinger Bands, period-high/low breakout, and volume-confirmed breakout) with context-aware parameters that scale with the chart timeframe. Added Apple-style tooltips on each signal card showing plain-English explanation, a worked example, and the confidence formula. Added "Created by Boon Boonyasirichok" attribution. Added a sidebar search box backed by `/api/search` (yahoo-finance2's `search()`) and a "Watching" section for custom tickers persisted to `localStorage`. Pushed to GitHub.

Notable issues worked through: PowerShell execution policy required `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`; yahoo-finance2 v2→v3 breaking changes (removed `suppressNotices`, requires `new YahooFinance()` instantiation) caused all API endpoints to 500; Windows file locking plus OneDrive sync was breaking Next.js hot-reload and corrupting builds (project was moved out of OneDrive to `C:\Users\smnk1\Claude\Projects\lidr`); GitHub email privacy rejected the initial push and required switching to the noreply email format. None of these are likely to recur given the fixes in place. Not yet deployed to Vercel.

## Maintenance Instructions

If you (a future AI assistant joining this project) make meaningful changes, also update this file in the same session.

- **Keep evergreen sections current and accurate.** Project Goal, Stack, Current State, Key Decisions, and Next Up should reflect reality at all times. If your work invalidates a fact in any of these sections, update it before ending the session.
- **Append a dated entry to Recent Changes for each session that produces real changes.** Use a `### YYYY-MM-DD — short title` header followed by a paragraph (not a bullet list) describing what was done and why. Include any decisions made or rationale that future-Claude would benefit from knowing.
- **Archive when Recent Changes exceeds 10 entries.** Fold the oldest 5 entries into a single section titled `## Archived Summary` at the bottom of the file (do not delete them). The archive must preserve decisions, rationale, and context that might still matter — compress narratives, not insights. Do not reduce it to a bare list of dates; capture *what* changed and *why* it mattered enough to remember.
