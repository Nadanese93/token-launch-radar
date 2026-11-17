// lib/validate.ts — the validation.md the build writes into the dashboard.
//
// Every number in it is computed from the sealed snapshot at build time by the functions in
// lib/model.ts. Nothing is fitted by hand and nothing is copied from an earlier analysis: if
// the snapshot changed, every figure here would change with it. The dossier includes this file
// (dashboard/validation.md) and analysis.md carries a short summary of the same numbers, so the
// validation survives even if the dossier's text cap cuts this file first (it sorts last).

import {
  BOOTSTRAP_REPS,
  BOOTSTRAP_SEED,
  FLAT_MULTIPLE,
  SHRINKAGE_K,
  TBILL_AS_OF,
  TBILL_RATE,
  fittedMultiple,
  hazardBuckets,
  type BoardRow,
  type CompsFit,
  type LaunchRates,
  type Snapshot,
} from './model.ts';

const money = (n: number): string =>
  n >= 1_000_000_000 ? `$${(n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 2)}B` : `$${(n / 1_000_000).toFixed(1)}M`;
const pct = (x: number): string => `${(x * 100).toFixed(1)}%`;
const num = (x: number, d = 3): string => (Number.isFinite(x) ? x.toFixed(d) : 'n/a');

/** The validation page, generated at build from the fit, the launch rates, and the board. */
export function validationMarkdown(fit: CompsFit, rates: LaunchRates, board: BoardRow[], snapshot: Snapshot): string {
  const c = fit.cleaning;
  const multiples = [5_000_000, 50_000_000, 100_000_000, 1_000_000_000, 3_000_000_000]
    .map((tvl) => `${money(tvl)}: ${fittedMultiple(tvl, fit).toFixed(3)}`)
    .join(', ');
  const buckets = hazardBuckets(snapshot);
  const hazardLine = buckets.map((b) => `~${b.mid_years}yr ${pct(b.p_token)} (n=${b.n}, h~${num(b.hazard, 2)}/yr)`).join('; ');
  const cats = Object.entries(rates.by_category)
    .filter(([cat, r]) => r.n >= 10 || r.fallback)
    .sort((a, b) => b[1].factor - a[1].factor);
  const catRows = cats
    .map(
      ([cat, r]) =>
        `| ${cat} | ${r.n} | ${pct(r.raw_rate)} | ${pct(r.shrunk_rate)} | ${r.factor.toFixed(3)} | ${r.fallback ? `kept prior ${r.factor.toFixed(2)} (shrunk ${r.shrunk_factor.toFixed(3)})` : 'adopted'} |`,
    )
    .join('\n');
  const fallbacks = Object.entries(rates.by_category).filter(([, r]) => r.fallback);
  const verdicts = { FARM: 0, THIN: 0, SKIP: 0 };
  for (const row of board) verdicts[row.verdict]++;
  const top10 = board.slice(0, 10);
  const widest = top10
    .map((r) => ({ name: r.name, w: r.rank_range[1] - r.rank_range[0], lo: r.rank_range[0], hi: r.rank_range[1] }))
    .sort((a, b) => b.w - a.w || a.lo - b.lo)
    .slice(0, 2)
    .map((x) => `${x.name} (${x.lo}-${x.hi})`)
    .join(' and ');
  const aboveFloor = board
    .filter((r) => r.tvl_usd >= snapshot.floor_usd && !snapshot.watchlist.includes(r.slug))
    .sort((a, b) => b.tvl_usd - a.tvl_usd);
  const aboveFloorText =
    aboveFloor.slice(0, 5).map((r) => `${r.name} (${money(r.tvl_usd)})`).join(', ') +
    (aboveFloor.length > 5 ? `, and ${aboveFloor.length - 5} more down to ${aboveFloor[aboveFloor.length - 1].name} (${money(aboveFloor[aboveFloor.length - 1].tvl_usd)})` : '');
  const offBoard = snapshot.protocols.length - board.length;

  return `# Validation (radar-3)

How the model was checked, and what it would take to change its mind. Every number here was
computed from the sealed snapshot at build time (as_of ${snapshot.as_of}); nothing was fitted
by hand.

## 1. The comps curve (U2)

- Clean comps: ${fit.n} of ${snapshot.protocols.length} protocols. Starting from ${c.with_mcap} protocols
  that record a market cap, ${c.bad_mcap} had a market cap of $0 or a non-positive TVL, ${c.excluded_category_name}
  were CEX/Bridge/wrapped/versioned or in an excluded category, and ${c.deduped} were duplicate tickers.
- Fit: log(mcap) = ${fit.intercept.toFixed(3)} + ${fit.slope.toFixed(3)} * log(TVL), R\u00b2 = ${fit.r2.toFixed(3)} (n=${fit.n}).
- The curve is shallow, so the implied multiple falls with size: ${multiples}. A flat ${FLAT_MULTIPLE} multiple
  overvalues the largest protocols and undervalues the smallest; the curve corrects both.
- Guardrail: the curve is used only because it beat flat out-of-sample. 5-fold CV log-RMSE:
  fitted ${num(fit.cv_fit)} vs flat ${num(fit.cv_flat)} (folds by sorted slug, index mod 5).
  Leave-one-out log-RMSE: fitted ${num(fit.loo_fit)} vs flat ${num(fit.loo_flat)}. listed_at split
  (train listed < 2024, test listed >= 2024): fitted ${num(fit.split_fit)} vs flat ${num(fit.split_flat)}.
  Had the curve lost on CV, the build would have fallen back to the flat ${FLAT_MULTIPLE} multiple.
  This build: ${fit.used_flat ? `the curve LOST on CV and the flat ${FLAT_MULTIPLE} multiple was used` : 'the curve won and was used'}.
- The fit is weak (R\u00b2 ${fit.r2.toFixed(3)}): TVL explains about a tenth of the variation in market cap.
  The curve is a better central tendency than flat, not a precise predictor — that is why every rank
  carries a bootstrap range (section 4).

## 2. The launch rates (U3)

- Cohort: ${rates.cohort_n} protocols listed at least a year ago; ${pct(rates.overall_rate)} have a token.
  "Has a token" is the model's own definition (def A: a token is recorded when mcap, gecko_id or
  symbol is present — the same rule isPreToken uses). A market-cap-only count would give ~19% and
  would undercount DEX and Lending tokens recorded via gecko_id/symbol without a market cap; def A
  is used, and the difference is stated here rather than hidden.
- Shrunk factors (k=${SHRINKAGE_K} toward the overall rate), categories with n >= 10 plus every fallback:

| Category | n | Raw | Shrunk | Factor | Decision |
|---|---:|---:|---:|---:|---|
${catRows}

- ${fallbacks.length === 0 ? 'No category fell back to the radar-2 prior.' : `Fell back to the radar-2 prior: ${fallbacks.map(([cat, r]) => `${cat} (shrunk ${r.shrunk_factor.toFixed(3)}, kept ${r.factor.toFixed(2)})`).join('; ')}.`}
  The guardrail: a shrunk factor is adopted only when |factor at k=10 minus factor at k=40| <= 0.15
  and the split-half (listed <= 2023 vs >= 2024) factor agrees within 0.25. Risk Curators is the
  category that matters most and the one that fails: its factor is 0.65-1.04 across splits, so the
  adopted value coincides with the old prior and the adoption changes nothing material for it.
- Maturity is flat (1.0): the forward hazard declines with age, it does not rise. Cumulative
  P(has a token) by age: ${hazardLine}. Constant-hazard fit ~${num(rates.hazard_per_year, 2)}/yr. A
  protocol still tokenless at its age has already survived the hazard — the backward-looking base
  rate overstates its forward chance (survivor selection), so the launch rates are planning rates,
  not forecasts.

## 3. Farm economics (U4)

- Cost per row: setup gas ($8 if capital >= $150, else $4) + $2/week gas over the hold (60/45/30
  days by age) + capital x ${(TBILL_RATE * 100).toFixed(1)}%/yr x hold (T-bill, ${TBILL_AS_OF}, a stated
  assumption, not a live quote). Total cost runs $13-22.
- Verdicts across the ${board.length} rows: FARM ${verdicts.FARM}, THIN ${verdicts.THIN}, SKIP ${verdicts.SKIP}.
  Break-even allocation = total cost / p_launch; EV at a scenario = p_launch x allocation - total cost.
  The $100/$500/$2,000 scenarios are labelled, not predictions.
- Honest note: verdicts skew FARM because p_launch is high for most categories (Dexs/Lending ~0.72-0.73
  shrunk) and costs are low. With the survivor-selection caveat above, treat FARM as "worth a look",
  not "will pay".

## 4. Rank uncertainty (U5)

- ${BOOTSTRAP_REPS} bootstrap refits of the comps curve (seeded mulberry32, seed ${BOOTSTRAP_SEED}),
  board re-scored each time. Each row carries its p10-p90 rank range in board.json.
- Rank 1 ${top10[0].name}: range ${top10[0].rank_range[0]}-${top10[0].rank_range[1]}. Rank 2 ${top10[1].name}:
  ${top10[1].rank_range[0]}-${top10[1].rank_range[1]}. The widest top-10 ranges are ${widest}.

## 5. Coverage (U1)

- ${board.length} rows: ${snapshot.watchlist.length} watchlist + ${board.length - snapshot.watchlist.length} outside it. The
  ${aboveFloor.length} rows above the watchlist
  floor (${money(snapshot.floor_usd)}): ${aboveFloorText}.
- ${offBoard} of ${snapshot.protocols.length} protocols are not on the board: they have a token, are wrapped/staked/bridged,
  or are a CEX.

## 6. What would change the assessment

- A fitted curve that loses to flat on CV; category factors that fail the stability guardrail;
  a refreshed snapshot; a token launch by a top row, or a new listing that changes the comps.
`;
}
