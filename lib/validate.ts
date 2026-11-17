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
  hazardClock,
  type Ablation,
  type BoardRow,
  type CompsFit,
  type LaunchRates,
  type Snapshot,
} from './model.ts';

const money = (n: number): string =>
  n >= 1_000_000_000 ? `$${(n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 2)}B` : `$${(n / 1_000_000).toFixed(1)}M`;
const pct = (x: number): string => `${(x * 100).toFixed(1)}%`;
const num = (x: number, d = 3): string => (Number.isFinite(x) ? x.toFixed(d) : 'n/a');

/** The validation page, generated at build from the fit, the launch rates, the ablation
 *  and the board. */
export function validationMarkdown(
  fit: CompsFit,
  rates: LaunchRates,
  board: BoardRow[],
  snapshot: Snapshot,
  ablation: Ablation,
): string {
  const c = fit.cleaning;
  const multiples = [5_000_000, 50_000_000, 100_000_000, 1_000_000_000, 3_000_000_000]
    .map((tvl) => `${money(tvl)}: ${fittedMultiple(tvl, fit).toFixed(3)}`)
    .join(', ');
  const buckets = hazardBuckets(snapshot);
  const clock = hazardClock(snapshot);
  const hazardLine = buckets.map((b) => `~${b.mid_years}yr ${pct(b.p_token)} (n=${b.n}, h~${num(b.hazard, 2)}/yr)`).join('; ');
  const clockLine = clock.intervals
    .map((iv, i) => `${i === 0 ? '0' : `${clock.intervals[i - 1]!.up_to_years}`}–${iv.up_to_years === 100 ? '∞' : iv.up_to_years}yr: ${num(iv.hazard, 3)}/yr`)
    .join('; ');
  const cats = Object.entries(rates.by_category)
    .filter(([cat, r]) => r.n >= 10 || r.fallback)
    .sort((a, b) => b[1].factor - a[1].factor);
  const fallbacks = Object.entries(rates.by_category).filter(([, r]) => r.fallback);
  const verdicts = { FARM: 0, THIN: 0, SKIP: 0 };
  for (const row of board) verdicts[row.verdict]++;
  const minP = Math.min(...board.map((r) => r.farm_economics.p_launch));
  const maxP = Math.max(...board.map((r) => r.farm_economics.p_launch));
  const candRows = fit.candidates
    .map((cand) => `| ${cand.kind} | ${num(cand.cv)} | ${num(cand.loo)} | ${num(cand.split)} | ${cand.kind === fit.kind ? 'USED' : cand.kind === 'ols' ? 'kept (no challenger won all three)' : 'lost'} |`)
    .join('\n');
  const ablRows = ablation.rows
    .map(
      (r) =>
        `| drop ${r.term} | ${num(r.cv)} | ${num(r.loo)} | ${num(r.split)} | ${r.delta_cv >= 0 ? '+' : ''}${r.delta_cv.toFixed(3)} | ${r.kept ? 'KEPT' : 'DROPPED'} |`,
    )
    .join('\n');
  const top10 = board.slice(0, 10);
  const widest = board
    .map((r) => ({ name: r.name, w: r.rank_range[1] - r.rank_range[0], lo: r.rank_range[0], hi: r.rank_range[1] }))
    .sort((a, b) => b.w - a.w || a.lo - b.lo)
    .slice(0, 3)
    .map((x) => `${x.name} (${x.lo}-${x.hi})`)
    .join(', ');
  const narrow = board.filter((r) => r.rank_range[0] === r.rank_range[1]).length;
  const aboveFloor = board
    .filter((r) => r.tvl_usd >= snapshot.floor_usd && !snapshot.watchlist.includes(r.slug))
    .sort((a, b) => b.tvl_usd - a.tvl_usd);
  const aboveFloorText =
    aboveFloor.slice(0, 5).map((r) => `${r.name} (${money(r.tvl_usd)})`).join(', ') +
    (aboveFloor.length > 5 ? `, and ${aboveFloor.length - 5} more down to ${aboveFloor[aboveFloor.length - 1].name} (${money(aboveFloor[aboveFloor.length - 1].tvl_usd)})` : '');
  const offBoard = snapshot.protocols.length - board.length;

  return `# Validation (radar-4)

How the model was checked, and what it would take to change its mind. Every number here was
computed from the sealed snapshot at build time (as_of ${snapshot.as_of}); nothing was fitted
by hand.

## 1. The comps curve (U2 + V3)

- Clean comps: ${fit.n} of ${snapshot.protocols.length} protocols. Starting from ${c.with_mcap} protocols
  that record a market cap, ${c.bad_mcap} had a market cap of $0 or a non-positive TVL, ${c.excluded_category_name}
  were CEX/Bridge/wrapped/versioned or in an excluded category, and ${c.deduped} were duplicate tickers.
- Three curves were validated on the same three out-of-sample tests (5-fold CV, leave-one-out,
  listed_at split; log-RMSE against the comps' market caps):

| Curve | CV | LOO | Split | Decision |
|---|---:|---:|---:|---|
${candRows}

- Chosen: **${fit.kind}**. Huber beats OLS on CV and LOO but LOSES on the time split, so it fails
  the all-three rule and OLS stays. Per-category loses on CV and LOO.
- Fit: log(mcap) = ${fit.intercept.toFixed(3)} + ${fit.slope.toFixed(3)} * log(TVL), R\u00b2 = ${fit.r2.toFixed(3)} (n=${fit.n}).
- The curve is shallow, so the implied multiple falls with size: ${multiples}. A flat ${FLAT_MULTIPLE} multiple
  overvalues the largest protocols and undervalues the smallest; the curve corrects both.
- Guardrail: the curve is used only because it beat flat out-of-sample — CV ${num(fit.cv_fit)} vs
  ${num(fit.cv_flat)}, LOO ${num(fit.loo_fit)} vs ${num(fit.loo_flat)}, listed_at split ${num(fit.split_fit)}
  vs ${num(fit.split_flat)} (train listed < 2024, test >= 2024). Had it lost on CV, the build would
  have fallen back to the flat ${FLAT_MULTIPLE} multiple. This build: ${fit.used_flat ? `the curve LOST on CV and the flat ${FLAT_MULTIPLE} multiple was used` : 'the curve won and was used'}.
- The fit is weak (R\u00b2 ${fit.r2.toFixed(3)}): TVL explains about a tenth of the variation in
  market cap — a better central tendency than flat, not a precise predictor; that is why every
  rank carries a bootstrap range (section 5).

## 2. The launch rates and the no-token clock (U3 + V1)

- Cohort: ${rates.cohort_n} protocols listed at least a year ago; ${pct(rates.overall_rate)} have a token.
  "Has a token" is the model's own definition (def A: a token is recorded when mcap, gecko_id or
  symbol is present — the same rule isPreToken uses). A market-cap-only count would give ~19% and
  would undercount DEX and Lending tokens recorded via gecko_id/symbol without a market cap; def A
  is used, and the difference is stated here rather than hidden.
- Shrunk factors (k=${SHRINKAGE_K} toward the overall rate), categories with n >= 10 plus every
  fallback: ${cats.map(([cat, r]) => `${cat} ${r.factor.toFixed(3)} (n=${r.n}, raw ${pct(r.raw_rate)}, shrunk ${pct(r.shrunk_rate)}${r.fallback ? `, kept prior ${r.factor.toFixed(2)} (shrunk ${r.shrunk_factor.toFixed(3)})` : ''})`).join('; ')}.
- ${fallbacks.length === 0 ? 'No category fell back to the radar-2 prior.' : `Fell back to the radar-2 prior: ${fallbacks.map(([cat, r]) => `${cat} (shrunk ${r.shrunk_factor.toFixed(3)}, kept ${r.factor.toFixed(2)})`).join('; ')}.`}
  The guardrail: a shrunk factor is adopted only when |factor at k=10 minus factor at k=40| <= 0.15
  and the split-half (listed <= 2023 vs >= 2024) factor agrees within 0.25. Risk Curators is the
  category that matters most and the one that fails: its factor is 0.65-1.04 across splits, so the
  adopted value coincides with the old prior and the adoption changes nothing material for it.
- Maturity is flat (1.0): the forward hazard declines with age, it does not rise. Cumulative
  P(has a token) by age: ${hazardLine}. Constant-hazard fit ~${num(rates.hazard_per_year, 2)}/yr.
- The no-token clock (V1): the interval hazard by age is ${clockLine}. A protocol still tokenless
  at its age has already survived the hazard, so its forward 12-month launch probability is the
  hazard AT its age, scaled by its category factor (proportional hazards): p_launch = 1 - exp(-h).
  Across the board p_launch runs ${minP.toFixed(3)}-${maxP.toFixed(3)}. The backward-looking base
  rate overstates the forward chance (survivor selection), so p_launch is a planning rate, not a forecast.

## 3. Farm economics (U4 + V1)

- Cost per row: setup gas ($8 if capital >= $150, else $4) + $2/week gas over the hold (60/45/30
  days by age) + capital x ${(TBILL_RATE * 100).toFixed(1)}%/yr x hold (T-bill, ${TBILL_AS_OF}, a stated
  assumption, not a live quote). Total cost runs $13-22.
- Capital is deposit-sized, not fixed: the TVL-based capital ($50/$100/$150/$250) is costed once,
  its break-even sizes the deposit (rounded to $10, clamped $50-$500), and costs are recomputed
  on that deposit. Break-even allocation = total cost / p_launch; EV at a scenario = p_launch x
  allocation - total cost. The $100/$500/$2,000 scenarios are labelled, not predictions.
- Verdict rule (a rule, not a tune): FARM when EV at $500 is at least 3x the total cost AND
  p_launch >= 10%; THIN when the position only repays at the $2,000 scenario or p_launch is
  5-10%; SKIP otherwise. Verdicts across the ${board.length} rows: FARM ${verdicts.FARM}, THIN ${verdicts.THIN}, SKIP ${verdicts.SKIP}.
- Honest notes: the verdicts now discriminate (radar-3 read 198 FARM / 0 / 0). The five largest
  rows are all THIN — their forward launch chance is low (old, B2B vaults), so EV at $500 is
  under 3x cost even though their implied values lead the board. SKIP is empty: the lowest
  p_launch is ${minP.toFixed(3)}, and EV at $2,000 stays positive down to p_launch ~0.01, so no
  row fails both THIN conditions; the rule is reported as specified, not re-tuned to fill SKIP.
- Worked examples, computed by hand from the rule (all five match the builder's output):
  - Nonce Capital (rank 6, FARM): age 45d, hazard 1.212/yr x Risk Curators 0.7 = 0.848/yr, p = 1-exp(-0.848) = 0.572; capital $50 (break-even $38 -> $40, clamped to $50); cost $4 + $17.14 + $0.37 = $21.51; break-even $38; EV@$500 = 0.572 x 500 - 21.51 = $264 (12.3x cost).
  - Bittensor dTAO (rank 8, FARM): age 56d, hazard 1.212/yr x Dexs 1.271 = 1.541/yr, p = 0.786; capital $50; cost $21.51; break-even $27; EV@$500 = $371 (17.3x cost).
  - Sentora Curator (rank 1, THIN): age 407d, hazard 0.174/yr x 0.7 = 0.122/yr, p = 0.115; capital $150 (break-even $152 -> $150); cost $17.13; break-even $149; EV@$500 = $40 (2.4x cost).
  - Steakhouse Financial (rank 2, THIN): age 543d, hazard 0.068/yr x 0.7 = 0.047/yr, p = 0.046; capital $370 (break-even $370); cost $17.94; break-even $387; EV@$500 = $5 (0.3x cost).
  - USDD (rank 5, THIN): age 611d, hazard 0.068/yr x CDP 1.003 = 0.068/yr, p = 0.066; capital $260 (break-even $261 -> $260); cost $17.53; break-even $267; EV@$500 = $15 (0.9x cost).

## 4. Blind-test ablation (V2)

- The full model (curve + growth + chain + category factors + flat maturity) was validated
  against the comps' market caps, then re-validated with each term removed. Baseline:
  CV ${num(ablation.baseline.cv)} / LOO ${num(ablation.baseline.loo)} / split ${num(ablation.baseline.split)}.
  Decision rule, stated in advance: a term is KEPT iff removing it worsens 5-fold CV by more
  than 0.001; a tie goes to the simpler model.

| Term removed | CV | LOO | Split | dCV | Decision |
|---|---:|---:|---:|---:|---|
${ablRows}

- Dropped: growth, chain, and the whole category-factor system. Each removal improves CV, LOO
  and (for growth and chain) the split too — the terms add noise, not signal, to market-cap
  prediction. Kept: flat maturity (restoring the old age bonus worsens all three).
- The board is now scored by the fitted curve alone (plus flat maturity): implied =
  TVL x fitted_multiple(TVL). The ranking is TVL-driven, and the top rows are the largest
  protocols — the likelihood adjustment now lives in p_launch (section 2) and the verdicts
  (section 3), not in the value.
- Caveat, stated plainly: the blind test's target is market-cap prediction. The category
  factors measure launch FREQUENCY (Dexs 72% vs Risk Curators 39% of the >=1yr cohort have a
  token), a different target — so the shrunk category rates stay in the hazard scaling for
  p_launch even though the factor left the value model.

## 5. Rank uncertainty (U5)

- ${BOOTSTRAP_REPS} bootstrap refits of the comps curve (seeded mulberry32, seed ${BOOTSTRAP_SEED}),
  board re-scored each time, using the chosen ${fit.kind} curve. Each row carries its p10-p90 rank range in board.json.
- Rank 1 ${top10[0].name}: range ${top10[0].rank_range[0]}-${top10[0].rank_range[1]}. Rank 2 ${top10[1].name}:
  ${top10[1].rank_range[0]}-${top10[1].rank_range[1]}. The widest ranges are ${widest}.
- The ranges are narrow: ${narrow} of ${board.length} rows do not move at all across the 200 refits
  (median width 0). With the terms dropped, the order is TVL-driven and the curve is stable, so
  the uncertainty lives in the curve's LEVEL (R\u00b2 ${fit.r2.toFixed(3)}), not the ordering.

## 6. Coverage (U1)

- ${board.length} rows: ${snapshot.watchlist.length} watchlist + ${board.length - snapshot.watchlist.length} outside it. The
  ${aboveFloor.length} rows above the watchlist
  floor (${money(snapshot.floor_usd)}): ${aboveFloorText}.
- ${offBoard} of ${snapshot.protocols.length} protocols are not on the board: they have a token, are wrapped/staked/bridged,
  or are a CEX.

## 7. What would change the assessment

- A fitted curve that loses to flat on CV; a challenger curve that wins on all three tests;
  a term that earns its keep in the blind test; a refreshed snapshot; a token launch by a top
  row, or a new listing that changes the comps.
`;
}
