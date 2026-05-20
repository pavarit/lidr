# CLAUDE.md

This file orients any AI assistant (Claude Code, Claude Cowork, etc.) joining this project. Read it before doing anything else. Then keep it current — see "Maintenance Instructions" at the bottom.

> **Sibling project: `lidr-ml`** (Python ML/backtesting pipeline) — local `C:\Users\smnk1\Claude\Projects\lidr-ml`, GitHub https://github.com/pavarit/lidr-ml. It turns this project's signals into calibrated BUY/HOLD/SELL recommendations and feeds them back via a JSON artifact. If you're making changes that cross the boundary between the two (the signal logic, the `/api/signals/[ticker]` integration, the artifact schema), read lidr-ml's CLAUDE.md first.

## Project Goal

lidr is a signal-driven robo-advisor — a web app that recommends **BUY / HOLD / SELL** actions on a watchlist of stocks and ETFs based on technical signals computed from daily price data. Started as a personal-use prototype with an explicit path to sharing with others. Cost-effectiveness was a stated requirement: the entire stack runs free for personal use, with no paid data sources or API keys.

## Stack

- **Frontend + backend in one app**: Next.js 14 (App Router) + TypeScript (strict).
- **Styling**: Tailwind CSS with a custom Apple-leaning color palette (`tailwind.config.ts`).
- **Animation**: Framer Motion (fluid layout-id transitions, mount/exit animations).
- **Charting**: Recharts (area chart with timeframe selector).
- **Market data**: `yahoo-finance2` v3 — requires the `new YahooFinance()` instantiation pattern (v2's default singleton was removed).
- **Persistence (client-side)**: `localStorage` for the user's custom watchlist. Key: `lidr.custom-tickers.v1`.
- **Deployment**: Vercel free tier — **live at https://lidr-eta.vercel.app/**.
- **Hosting repo**: https://github.com/pavarit/lidr

## Commands

```bash
npm run dev        # start dev server → http://localhost:3000
npm run build      # production build (run before deploying)
npm run lint       # ESLint (Next.js built-in config)
npm run typecheck  # tsc --noEmit (no test suite exists yet)
```

There are no automated tests. Type checking and linting are the only static-analysis gates.

## Data Flow

A user click on a ticker triggers three parallel fetches from `components/TickerDetail.tsx`:

1. `/api/quote/[ticker]` → `lib/yahoo.ts::fetchQuote()` — current price + stats
2. `/api/history/[ticker]?range=` → `lib/yahoo.ts::fetchHistory()` — OHLCV series for the chart
3. `/api/signals/[ticker]?context=` → `lib/yahoo.ts::fetchSignalSeries()` (always 3 years of daily closes) → `lib/signals/index.ts::runAllSignals()` → individual signal files

When the user changes the timeframe, `contextForTimeframe()` (`lib/signals/config.ts`) remaps it to a context string, and only the signals fetch is re-issued with the new context. The chart fetch also re-issues with the new `range=` param.

TypeScript path alias `@/` resolves to the project root (set in `tsconfig.json`).

## Current State

- Local dev: `npm install && npm run dev` → http://localhost:3000
- Working directory: `C:\Users\smnk1\Claude\Projects\lidr` (deliberately outside OneDrive — see Key Decisions)
- GitHub repo pushed and current
- Deployed and live at https://lidr-eta.vercel.app/ — every `git push` to `main` auto-deploys a new build
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

1. **Incorporate the UI update from Claude Design** (active — see Active Task). Ask Boon where the Claude Design output is before touching `components/`. Keep changes scoped to the visual layer unless the design implies new data dependencies.
2. **Add a `robots.txt` or simple password gate** before sharing the Vercel URL widely. The deployed site is currently publicly indexable by anyone with the link.
3. **Migrate to Next 16.** Main work: update `params` to `Promise<...>` and `await` it in the four route handlers under `app/api/*/route.ts`. Worth doing before the project gets serious traffic so we're on an actively-developed major version.
4. **Add auth + backend** (NextAuth + Supabase free tier are the discussed options) so the watchlist can sync across devices instead of being per-browser `localStorage`.
5. **Backtest the signals + build an ML ensemble model** — IN PROGRESS as the sibling project `lidr-ml` (local: `C:\Users\smnk1\Claude\Projects\lidr-ml`, GitHub: https://github.com/pavarit/lidr-ml). Python-first pipeline that ports each TS signal to Python, trains an ensemble model (stacked base learners over the six signals) to produce calibrated BUY/HOLD/SELL recommendations, and backtests with walk-forward / expanding-window CV from pre-2008 to today. The pipeline emits a versioned JSON artifact (predictions + calibrated confidences); the natural integration seam back into lidr is `/api/signals/[ticker]`, which can read the artifact directly (cheap) or proxy to a Python service later (item 7). Goal is to replace the current heuristic confidences with empirically calibrated probabilities.
6. **Add fundamental signals** (earnings momentum, P/E percentile vs own history). Requires a paid data source — not on the immediate path.
7. **Add a Python FastAPI microservice for computation-heavy work.** Decision: keep Next.js for the full frontend and as a thin API gateway; add Python as a separate service at the signals/computation layer when needed. The natural seam is `/api/signals/[ticker]` — Next.js can proxy to the Python service for heavy calls while simple signals stay in JS. Deploy the Python service on Railway or Render free tier alongside the Vercel frontend. Trigger: once `lidr-ml` (item 5) has a model worth serving live. Until then, lidr-ml writes a static artifact that lidr reads — no service needed.

## Active Task

Mobile UI improvements are now implemented (see 2026-05-20 Recent Changes entry). No active implementation task. Next priority is Next Up #2 (robots.txt or password gate before wider sharing).

The lidr-ml sibling project (Next Up #5) is now scaffolded, verified, and pushed to its own GitHub repo. Ongoing ML iteration happens there, not here, until the bridge step (Next Up #5 → wiring the JSON artifact into `/api/signals/[ticker]`) is reached.

<!-- When a task ships or pauses, replace the section above with `_Nothing currently in-flight._`
     (plus the explanatory comment from git history). Keep the description tight: what is being
     built, where it was left off, and any mid-flight decisions the next session needs to know. -->

## Recent Changes

### 2026-05-20 — Mobile UI redesign (Option D from Claude Design)

Implemented the mobile UI improvements from a Claude Design handoff bundle. The design session had identified six core problems on phone: recommendations buried below chart + stats, no quick ticker-switching, cramped timeframe pill, tall redundant signal cards with no aggregate view, and a wasteful mobile top bar. Option D ("One screen") was the chosen direction after two rounds of iteration. Changes are purely additive for mobile (`xl:hidden` hides the new layout on desktop, `hidden xl:grid` keeps the existing two-column desktop layout untouched). Three files changed: `app/globals.css` (added `.no-scrollbar` utility), `app/page.tsx` (replaced the `☰ Tickers` + symbol bar with a full-width search bar that opens the sidebar drawer, plus a horizontal chip strip showing all custom tickers and first 14 defaults for one-tap switching), and `components/TickerDetail.tsx` (added mobile-specific layout with compact hero + consensus pill, chart, compact signal rows with tap-to-expand summary, and a tap-to-expand stats disclosure row). The consensus is computed client-side from the signals array — majority action wins, score is average confidence. Production build (`next build`) passes; TypeScript clean. Local preview is broken on this Windows machine due to a Next.js 14 + Windows path issue: `next dev` with no existing cache returns 404 for all routes (no compilation occurs), and `next start` renders dynamically with dev-mode CSS paths that don't exist in the production build. Vercel auto-deploy on push is the intended verification path.

### 2026-05-19 (later) — Scaffolded `lidr-ml` sibling project

Stood up `lidr-ml` at `C:\Users\smnk1\Claude\Projects\lidr-ml` as the home for the backtesting + ML model work that's been on the roadmap. Scaffolding done in Cowork; ongoing iteration moves to Claude Code. Layout is a standard `src/`-layout Python package with a config-driven pipeline: YAML files in `configs/` define an experiment (date range, signals, model, backtest method), one CLI command runs the full pipeline end-to-end and drops a timestamped HTML report into `reports/`. The stub includes one signal (SMA crossover, ported from `lib/signals/sma.ts` as a parity reference), one base model (logistic regression), an expanding-window walk-forward backtest, and a yfinance loader with a synthetic-data fallback so the pipeline runs offline for development. Rationale for the separate project vs. a folder inside lidr: keeps Python/Node tooling cleanly apart, lets the model iterate on its own cadence, and integration via a JSON artifact (consumed by `/api/signals/[ticker]`) avoids any need for a running Python service until the FastAPI-service roadmap item is triggered. Updated the backtesting and FastAPI-service roadmap items to reflect the new project and its integration plan.

### 2026-05-19 — Deployed to Vercel, WSL migration, docs cleanup

Deployed lidr to Vercel free tier — live at https://lidr-eta.vercel.app/. Auto-deploy from `main` is wired up via the GitHub integration; no env vars or paid services needed. Boon also migrated his terminal workflow from PowerShell to WSL (Ubuntu) — installed nvm + Node LTS, GitHub CLI, and reauthed in Linux. Project still lives at `/mnt/c/Users/smnk1/Claude/Projects/lidr` (`/mnt/c/...` is how WSL exposes the Windows drive); first `npm install` rebuilt `node_modules` for Linux binaries. Trimmed overlap between README.md and CLAUDE.md: README now focuses on human onboarding (setup, run, deploy, how-to) and CLAUDE.md is the single source of truth for folder structure, decisions, and roadmap. Also brought the README's "What's in this prototype" and "How to add a new signal" sections up to date with the six signals, search/watchlist, and tooltips that were added the day before. The `wslu` package (which provides `wslview` for opening URLs from Linux in the Windows browser) couldn't be installed on this Ubuntu image after trying universe + the official PPA — `cmd.exe /c start <url>` is the fallback shortcut. Not blocking anything; revisit if it ever matters.

### 2026-05-18 — Initial build, signal expansion, ticker search

Scaffolded the project from scratch and shipped through a full first-version arc in one session. Built the base Next.js 14 + Tailwind + TypeScript app with two starter signals (50/200 SMA, 14-day RSI), then expanded to six signals (added MACD, Bollinger Bands, period-high/low breakout, and volume-confirmed breakout) with context-aware parameters that scale with the chart timeframe. Added Apple-style tooltips on each signal card showing plain-English explanation, a worked example, and the confidence formula. Added "Created by Boon Boonyasirichok" attribution. Added a sidebar search box backed by `/api/search` (yahoo-finance2's `search()`) and a "Watching" section for custom tickers persisted to `localStorage`. Pushed to GitHub.

Notable issues worked through: PowerShell execution policy required `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`; yahoo-finance2 v2→v3 breaking changes (removed `suppressNotices`, requires `new YahooFinance()` instantiation) caused all API endpoints to 500; Windows file locking plus OneDrive sync was breaking Next.js hot-reload and corrupting builds (project was moved out of OneDrive to `C:\Users\smnk1\Claude\Projects\lidr`); GitHub email privacy rejected the initial push and required switching to the noreply email format. None of these are likely to recur given the fixes in place. Not yet deployed to Vercel.

## Maintenance Instructions

If you (a future AI assistant joining this project) make meaningful changes, also update this file in the same session.

- **Keep evergreen sections current and accurate.** Project Goal, Stack, Current State, Key Decisions, and Next Up should reflect reality at all times. If your work invalidates a fact in any of these sections, update it before ending the session.
- **Append a dated entry to Recent Changes for each session that produces real changes.** Use a `### YYYY-MM-DD — short title` header followed by a paragraph (not a bullet list) describing what was done and why. Include any decisions made or rationale that future-Claude would benefit from knowing.
- **Archive when Recent Changes exceeds 10 entries.** Fold the oldest 5 entries into a single section titled `## Archived Summary` at the bottom of the file (do not delete them). The archive must preserve decisions, rationale, and context that might still matter — compress narratives, not insights. Do not reduce it to a bare list of dates; capture *what* changed and *why* it mattered enough to remember.
