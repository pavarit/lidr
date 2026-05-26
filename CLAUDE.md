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

See [README.md → Run it locally](README.md#run-it-locally) for the canonical scripts. Targets: `npm run dev` / `build` / `start` / `lint` / `typecheck`. No `test` script (no test suite — `typecheck + lint + build` are the only gates; CI runs all three on every push). TypeScript path alias `@/` resolves to the project root (set in `tsconfig.json`).

## Data Flow

See [README.md → Data flow](README.md#data-flow) for the request diagram and the contextForTimeframe mapping. This section previously held the narrative version; it's been folded into README so there's one source of truth.

## Current State

- Local dev: `npm install && npm run dev` → http://localhost:3000
- Working directory: `C:\Users\smnk1\Claude\Projects\lidr` (deliberately outside OneDrive — see Key Decisions)
- GitHub repo pushed and current
- Deployed and live at https://lidr-eta.vercel.app/ — every `git push` to `main` auto-deploys a new build
- **Six signals running**: SMA crossover, RSI, MACD, Bollinger Bands, period-high/low breakout, volume-confirmed breakout
- **Context-aware parameters**: every signal's lookback windows scale with the chart timeframe being viewed (short / medium / long contexts defined in `lib/signals/config.ts`)
- **20 default tickers**: 10 ETFs (broad market + major sectors) + 10 popular individual stocks. Defined in `lib/tickers.ts`.
- **Custom watchlist**: users can search Yahoo's universe and add tickers; list persists per-browser-per-machine via `localStorage`. A "Watching" section appears above ETFs/Stocks in the sidebar when non-empty.
- **Apple-style UI**: frosted-glass cards, system font stack, fluid spring transitions; responsive down to mobile width with a collapsible sidebar. Mobile has a dedicated one-screen layout (below `xl`) with ticker chip strip, compact signal rows, consensus pill, and collapsible stats.
- **Signal tooltips**: each signal card has an `i` icon that expands an inline explanation with plain English, a worked example, and the confidence formula. On mobile, tapping the consensus pill opens a bottom sheet showing the majority-vote logic and per-signal breakdown.
- **`robots.txt`** in place — search engines are blocked from indexing the site.
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

## Conventions (read before writing code)

- **Next.js 14 + TypeScript (strict).** Path alias `@/` resolves to the project root (set in `tsconfig.json`). ESLint runs via Next's built-in config.
- **Type-check + lint before claiming work is done.** `npm run typecheck && npm run lint`. There is no automated test suite; these are the only gates.
- **Signals are pure functions**: `(input: SignalInput) => SignalResult` in `lib/signals/`. Adding a new signal: create the file, then add one line to the `runAllSignals` array in `lib/signals/index.ts`. UI and route handlers need zero changes. Verify by tapping a ticker — no auto test.
- **yahoo-finance2 v3 usage rules**: always instantiate (`const yahooFinance = new YahooFinance()`); never call `suppressNotices()` (removed in v3 — will crash all API routes). Methods used: `search()`, `quote()`, `chart()`.
- **Every `app/api/*/route.ts` exports `revalidate`.** Current values: 30s for quotes, 60s for history, 300s for signals, 60s for search. Set to `0` to make a route live.
- **Git commits use the GitHub noreply email** (`...@users.noreply.github.com`), not personal email. GitHub email privacy is on; pushes authored with the personal email are rejected.

See **Gotchas** below for the past failures that motivated several of these rules.

## Key Decisions

Strategic forks in the road — *why we chose X over Y*. For procedural rules see Conventions; for things that bit us see Gotchas.

- **Pinned to Next 14, not 15/16.** Next 16 made App Router route handler `params` async, which would break the four files under `app/api/*/route.ts`. Migration is on Next Up but explicitly deferred until before public launch.
- **Signals are pluggable by design.** Each is a pure function in `lib/signals/`; the registry + UI know nothing about specific signals. Made adding RSI / MACD / Bollinger / breakout / volume to the original SMA-only build cheap, and will make consuming `lidr-ml`'s artifact cheap when that bridge lands.
- **Signal context system.** Three contexts: `short` (1M chart view), `medium` (3M view), `long` (every other timeframe — 1D, 1W, 1Y, 5Y, ALL). Each has a `SignalParams` set in `lib/signals/config.ts`. Mapping is `contextForTimeframe()`. The frontend refetches signals when the user changes timeframe.
- **Confidence values are heuristics, NOT probabilities.** Normalized strength scores ranging 0–1 based on how far past a threshold the signal is. The UI footer is honest about this; do not present them as calibrated probabilities. Replacing them with empirically calibrated probabilities is the entire point of `lidr-ml`.
- **Custom watchlist is per-browser-per-machine.** No cross-device sync. Chose simplicity over auth + backend for the prototype phase; multi-device sync is Next Up #2.
- **Per-route caching, not a central cache.** Each route handler picks its own `revalidate`. Trade-off: more flexibility, slightly more places to look when investigating a stale value.

## Gotchas

Non-obvious things that bit us. Each entry earned its place by causing a real problem.

- **OneDrive sync breaks Next.js.** Sync interferes with the file watcher (kills hot-reload), holds locks mid-compile, and serves stale `.next/` builds. The project lives at `C:\Users\smnk1\Claude\Projects\lidr` *deliberately* outside any OneDrive path — do not move it back, even if a future tidy-up thinks the location looks ad-hoc.
- **yahoo-finance2 v3 silently broke v2 code.** v2's default singleton was removed (`new YahooFinance()` is now required) and `suppressNotices()` was deleted. v2-style code does not warn — it crashes all API routes at request time. Bit us on the initial deploy.
- **Yahoo Finance is unofficial — data-center IPs may be rate-limited.** If all three production endpoints (`/api/quote`, `/api/history`, `/api/signals`) start 500ing on Vercel while localhost is fine, that's the most likely cause. Workarounds: rotate user agents, or fall back to a paid source (Polygon, Finnhub).
- **GitHub email privacy rejects pushes with the personal email.** Use the `...@users.noreply.github.com` form on every commit. The initial push to GitHub bounced for this reason.
- **Next 14 + Windows native: `next dev` returns 404 for all routes on a clean start.** No compilation occurs in dev mode without an existing `.next/` cache; `next start` then renders dynamically with dev-mode CSS paths that don't exist in the production build. Vercel auto-deploy is the verification path when on Windows native. Less urgent now that the workflow has moved to WSL — but if you're back on PowerShell for any reason, this will resurface.
- **PowerShell execution policy blocks npm scripts on a fresh Windows install.** First-time setup needs `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`. Not relevant in WSL.

## Next Up

**Current strategic focus (set 2026-05-21):** the active priority is item #3 — proving the ML model in `lidr-ml` has a real edge over buy-and-hold. Until that's true, the website items below are deliberately parked: they're about *sharing* and *upkeep*, not about the core question of whether the recommendations are any good. In particular, item #5 (the FastAPI service) stays gated on `lidr-ml` producing a model worth serving live. See `lidr-ml`'s CLAUDE.md for the detailed model-side roadmap.

In rough priority order:

1. **Migrate to Next 16.** Main work: update `params` to `Promise<...>` and `await` it in the four route handlers under `app/api/*/route.ts`. Worth doing before the project gets serious traffic so we're on an actively-developed major version.
2. **Add auth + backend** (NextAuth + Supabase free tier are the discussed options) so the watchlist can sync across devices instead of being per-browser `localStorage`.
3. **Backtest the signals + build an ML ensemble model** — IN PROGRESS as the sibling project `lidr-ml` (local: `C:\Users\smnk1\Claude\Projects\lidr-ml`, GitHub: https://github.com/pavarit/lidr-ml). Python-first pipeline that ports each TS signal to Python, trains an ensemble model (stacked base learners over the six signals) to produce calibrated BUY/HOLD/SELL recommendations, and backtests with walk-forward / expanding-window CV from pre-2008 to today. The pipeline emits a versioned JSON artifact (predictions + calibrated confidences); the natural integration seam back into lidr is `/api/signals/[ticker]`, which can read the artifact directly (cheap) or proxy to a Python service later (item 5). Goal is to replace the current heuristic confidences with empirically calibrated probabilities.
4. **Add fundamental signals** (earnings momentum, P/E percentile vs own history). Requires a paid data source — not on the immediate path.
5. **Add a Python FastAPI microservice for computation-heavy work.** Decision: keep Next.js for the full frontend and as a thin API gateway; add Python as a separate service at the signals/computation layer when needed. The natural seam is `/api/signals/[ticker]` — Next.js can proxy to the Python service for heavy calls while simple signals stay in JS. Deploy the Python service on Railway or Render free tier alongside the Vercel frontend. Trigger: once `lidr-ml` (item 3) has a model worth serving live. Until then, lidr-ml writes a static artifact that lidr reads — no service needed.
6. **Add a password gate** when sharing the URL more widely. `robots.txt` is already in place to block search indexing. For access control, the recommended approach is Next.js middleware + a simple login page with the password stored as a Vercel environment variable (one-time friction, cookie-based). Deliberately deferred — no urgency at current demo scale.

## Active Task

_Nothing currently in-flight._

The lidr-ml sibling project (Next Up #3) is scaffolded and pushed to its own GitHub repo. Ongoing ML iteration happens there, not here, until the bridge step (wiring the JSON artifact into `/api/signals/[ticker]`) is reached.

## Recent Changes

### 2026-05-26 — README/CLAUDE.md split + data flow diagram (Batch 5 of 5)

Final batch in the drift-fix arc. README is now the public face; CLAUDE.md is leaner and Claude-focused.

- **README** gained a **Data flow** section with an ASCII diagram showing the three parallel fetches from `TickerDetail.tsx` → API routes → `lib/yahoo.ts` → Yahoo + signal computation. Mirrors lidr-ml's Architecture diagram style. Includes the contextForTimeframe rule inline.
- **CLAUDE.md "Commands"** trimmed to a one-liner pointing at README's Run-it-locally section (canonical home). Kept the path-alias detail and the no-test-suite framing since they're Claude-facing context.
- **CLAUDE.md "Data Flow"** also trimmed — the narrative version was duplicating what the README diagram now shows. Single source of truth in README.

Net effect across the 5-batch arc: every public-facing contract is in README/CONTRIBUTING (API endpoints + revalidate values, signal type shapes, multi-file signal-add procedure, license, contribution rules); LICENSE + CONTRIBUTING + CI workflow + badge row exist; "good next signals" suggestions point at lidr-ml (where backtesting lives) instead of a stale list; Push/Deploy sections reframed as fork-targeted; data flow diagram in README. CLAUDE.md retains: Project Goal, Stack, trimmed Commands/Data-Flow pointers, Current State, Folder map, Conventions, Key Decisions, Gotchas, Next Up, Active Task, Recent Changes, Maintenance Instructions.

### 2026-05-26 — Drift-fix pass on README (Batch 1 of 5)

First batch in a drift-fix arc mirroring the one applied to `lidr-ml` earlier today.

- **README "How to add a new signal"** — was incomplete. Said "create file, add line to index.ts, that's it." Reality: if the new signal needs a tunable param, you also have to extend the `SignalParams` interface in `types/index.ts` AND add a value under each of the three contexts in `lib/signals/config.ts`. Section now lists the multi-file case explicitly, points at CONTRIBUTING.md for the full procedure, and replaces the stale "good next signals to try" list (which suggested signals that have already shipped) with a pointer to `lidr-ml` since most signal exploration has moved there.
- **README "Push to GitHub" / "Deploy to Vercel"** — was framed as generic onboarding boilerplate, implying lidr was never deployed. Merged into a single **"Deploying your own copy"** section explicitly addressed at *forks*, with a callout that the canonical lidr is already live at `lidr-eta.vercel.app`. Also surfaced that every `git push` to `main` on a connected Vercel deploy auto-deploys (previously only documented in CLAUDE.md).
- **Verified all four API route `revalidate` values** against the route handlers themselves. CLAUDE.md Conventions' "30s for quotes, 60s for history, 300s for signals, 60s for search" matches reality exactly. No change needed.

Remaining batches: LICENSE + CONTRIBUTING + badges (B2), API + type-shape reference in README (B3), CI workflow (B4), README/CLAUDE.md split + data flow diagram (B5).

### 2026-05-26 — Adopt Conventions + Gotchas; partition for one-fact-one-place

Restructured CLAUDE.md to match the partition rule applied to `lidr-ml`'s file the same day. Added two new sections: **Conventions** (procedural rules — Next 14 + strict TS, the typecheck-and-lint-only gate, the signal-pluggability rule for adding new signals, yahoo-finance2 v3 usage, per-route `revalidate`, noreply-email-on-commits) and **Gotchas** (things that bit us — OneDrive breaking Next.js, the silent v2→v3 yahoo-finance2 break, Yahoo's rate-limits on data-center IPs, GitHub email privacy rejecting personal-email pushes, Next 14 + Windows-native dev-server quirks, PowerShell execution policy). Trimmed **Key Decisions** from 10 items to 6 — kept only the *why we chose X over Y* items (Next 14 pin, pluggable signals as a design choice, signal context system, confidence-as-heuristic acknowledgment, per-browser watchlist, per-route caching). Rules moved to Conventions; warnings moved to Gotchas. Each fact now appears once with cross-references replacing the duplicates. Added the one-fact-one-place rule to Maintenance Instructions. No code changes.

### 2026-05-21 — Roadmap framing: focus on proving the ML edge

Planning-only change, no code. Boon confirmed the near-term goal is to prove `lidr-ml`'s model beats buy-and-hold before any serving/integration work. Added a "Current strategic focus" note at the top of Next Up making explicit that the website items here are parked behind that goal, and that the FastAPI service (#5) stays gated on `lidr-ml` producing a model worth serving live. The detailed reprioritization lives in `lidr-ml`'s CLAUDE.md, which was reordered the same day to put its cross-run results log first, then the signal-porting and model-building sequence, with the serving/integration chain gated behind an actual edge.

### 2026-05-20 — Mobile UI polish, robots.txt, housekeeping

Followed up on the mobile redesign with three refinements to `components/TickerDetail.tsx`: ticker symbol font size raised to match the price (`text-[26px]`), full company name moved to its own line (fixing the flex-wrap gap that caused extra spacing on long names like VTI), and the consensus pill made tappable — it now opens a bottom-sheet modal explaining the majority-vote action and average-confidence calculation, with a per-signal breakdown. Added `public/robots.txt` disallowing all crawlers (`User-agent: * / Disallow: /`) to keep the site out of search indexes while it remains a personal demo. Discussed password gate options (Vercel built-in Pro-only, Next.js middleware + login page, or secret-URL approach); deliberately deferred — no urgency at current demo scale, `robots.txt` is sufficient for now. Renumbered Next Up accordingly.

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

- **Keep evergreen sections current and accurate.** Project Goal, Stack, Data Flow, Current State, Conventions, Key Decisions, Gotchas, and Next Up should reflect reality at all times. If your work invalidates a fact in any of these sections, update it before ending the session.
- **Each fact lives in one section.** Conventions = the rule. Key Decisions = why we chose X over Y. Gotchas = what bit us. If you find yourself writing the same fact in two places, pick the canonical home and cross-reference from the other.
- **Append a dated entry to Recent Changes for each session that produces real changes.** Use a `### YYYY-MM-DD — short title` header followed by a paragraph (not a bullet list) describing what was done and why. Include any decisions made or rationale that future-Claude would benefit from knowing.
- **Archive when Recent Changes exceeds 10 entries.** Fold the oldest 5 entries into a single section titled `## Archived Summary` at the bottom of the file (do not delete them). The archive must preserve decisions, rationale, and context that might still matter — compress narratives, not insights. Do not reduce it to a bare list of dates; capture *what* changed and *why* it mattered enough to remember.
