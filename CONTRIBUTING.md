# Contributing

Thanks for looking. lidr is a personal-research prototype; PRs and issues are welcome but expect opinionated review against the rules below. The sibling project [`lidr-ml`](https://github.com/pavarit/lidr-ml) is where backtesting and calibrated probabilities live — if your change is about *signal quality* rather than the website, that's usually the right repo.

## Development setup

```bash
git clone https://github.com/pavarit/lidr.git
cd lidr
npm install
npm run dev          # http://localhost:3000
```

Recommended environment: WSL, macOS, or Linux. Windows-native works but the Next 14 dev server has [a 404-on-clean-start quirk and a PowerShell ExecutionPolicy gate](CLAUDE.md#gotchas) — see CLAUDE.md if you hit either.

Before opening a PR:

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
npm run build        # full production build
```

There is **no automated test suite**. `typecheck` + `lint` + `build` are the only gates. This is deliberate while lidr is a small prototype — the signal logic that needs real testing lives in `lidr-ml`, which has a proper pytest + accuracy + lookahead-safety harness.

## Adding a signal

A signal is a pure function `(input: SignalInput) => SignalResult` in `lib/signals/`. See [types/index.ts](types/index.ts) for the full shapes. Quick summary:

```ts
interface SignalInput {
  closes: number[];   // newest closes at the end
  volumes: number[];  // same index alignment as closes; 0 on null
  params: SignalParams;
}

interface SignalResult {
  id: string;                            // stable, kebab-case
  name: string;                          // shown in the UI card title
  action: "BUY" | "HOLD" | "SELL";
  confidence: number;                    // 0..1
  summary: string;                       // one-line plain English
  details: Record<string, number | string | null>;
  explanation: { plain, example, formula };
}
```

### Steps

1. **Implement** `lib/signals/<your-signal>.ts`. Pattern: read params, compute, return a `SignalResult`. If you don't have enough history to compute, return `action: "HOLD"` with `confidence: 0` and a summary explaining why — never throw.
2. **Register** by adding it to the array returned by `runAllSignals` in `lib/signals/index.ts`.
3. **If your signal needs a new tunable parameter** (e.g. an ATR period):
   - Add the field to `SignalParams` in `types/index.ts`.
   - Add a value under **each** of `short`, `medium`, and `long` in the `PARAMS_BY_CONTEXT` map in `lib/signals/config.ts`. (The three contexts tune lookbacks to the chart timeframe — 1M → short, 3M → medium, everything else → long.)
4. **Sanity-check by hand**: `npm run dev`, tap a few tickers, confirm your signal shows BUY/HOLD/SELL with reasonable confidence and that the tooltip renders your `explanation`.

There's no automated lookahead test in this repo (the corresponding test lives in `lidr-ml` for the ported Python version). If your signal will eventually be ported to `lidr-ml`, write the lookahead test there.

### Confidence convention

Confidence is always `0..1`. The convention across existing signals: take a continuous distance-from-threshold, normalize to a scale where "interesting" values map to ~0.5 and "extreme" values cap at 1.0. Document the exact formula in your signal's `explanation.formula`. Examples in [sma.ts](lib/signals/sma.ts), [rsi.ts](lib/signals/rsi.ts), [bollinger.ts](lib/signals/bollinger.ts).

## Adding an API route

All routes live under `app/api/<name>/route.ts` and follow the same pattern (see [route.ts:1-30](app/api/quote/[ticker]/route.ts) for a small example):

- Export a `GET` (or `POST`) handler that returns `NextResponse.json(...)`.
- **Export `revalidate`** — every route in this repo declares a cache window in seconds. Current values: 30 (quote), 60 (history), 300 (signals), 60 (search). Set `revalidate = 0` to make a route live (no caching).
- Wrap the data fetch in `try/catch` and return `NextResponse.json({ error: ... }, { status: 500 })` on failure — never let an exception bubble.
- Validate query params explicitly. Use the `Timeframe` / `SignalContext` union types in `types/index.ts` for whitelists.

## Adding a ticker to the defaults

Edit [`lib/tickers.ts`](lib/tickers.ts) and add an entry to either the `ETFS` or `STOCKS` array. The sidebar reflects it on the next reload. Users can also add their own via the search box; their list persists per-browser in `localStorage` under the key `lidr.custom-tickers.v1`.

## Commit + PR conventions

- Branch off `main`. PRs target `main`.
- Commit messages: short imperative title, blank line, then prose. Wrap at ~72 chars.
- Use the GitHub `...@users.noreply.github.com` email form — GitHub email-privacy rejects pushes with personal emails (see CLAUDE.md Gotchas).
- Each commit should pass `npm run typecheck && npm run lint && npm run build`.
- For meaningful changes, append a dated entry to [CLAUDE.md](CLAUDE.md) → **Recent Changes** (one paragraph, what + why).

## Deploying your own copy

See [README.md → Deploying your own copy](README.md#deploying-your-own-copy).

## License of contributions

By opening a pull request, you agree that your contribution is licensed under the same [PolyForm Noncommercial 1.0.0](LICENSE) terms as the rest of the project. If you need different terms for a specific contribution, raise it in the PR description so we can discuss before merging.

## Where to start reading

1. `README.md` — what + why + how to run
2. `CLAUDE.md` → **Conventions** and **Key Decisions** — the rules and the reasoning
3. `app/api/signals/[ticker]/route.ts` → `lib/signals/index.ts` → individual signal files — the path a signal request takes
4. `CLAUDE.md` → **Next Up** — what's worth working on
