// The token radar's model: one snapshot of the protocol universe in, one ranked board out.
//
// MODEL radar-2. The board covers every slug in the snapshot's watchlist (the floor, never a ceiling)
// and adds EVERY strict-tokenless protocol below the watchlist floor: the early rows the radar exists
// to find. There is no EARLY_ROWS cap any more — the starter's top-160-by-TVL cap is gone. A protocol
// is pre-token when its index entry records no token (no market cap, no CoinGecko id, no symbol); the
// snapshot's live-token protocols are kept apart and shown as the market's own values, never mixed into
// the ranked board.
//
// STRICT tokenless rule (isTokenless / isRankable, applied to watchlist AND early rows alike):
// pre-token AND category NOT in {Bridge, Canonical Bridge, Liquid Staking, Liquid Restaking,
// Restaked BTC, CEX} AND name does not end in a version marker (\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$)
// AND name contains no whole word wrapped/staked/staking (case-insensitive) AND name does not start
// with an exchange name (Binance, Coinbase, Bybit, Kraken, Bitget, OKX, Bitfinex, Gemini).
//
// HONEST LIMITATION — parentProtocol: the snapshot carries only 10 fields per protocol and
// parentProtocol is NOT one of them, so the parent-protocol check cannot be performed from this
// snapshot at all. A wrapped/staked product whose parent is only visible via parentProtocol could
// therefore slip through; the category/name rules above are the only proxy available here. This is
// stated in the dashboard too, not hidden.
//
// Implied value follows only from the snapshot's own figures (radar-3):
//
//   multiple     = fitted comps curve multiple(tvl_usd) — OLS log-log fit over the clean
//                  comps (token protocols with mcap>0 and TVL>0, CEX/Bridge/wrapped/versioned
//                  excluded, one row per ticker); FALLS BACK to the flat 0.25 multiple when the
//                  fit does NOT beat flat out-of-sample (5-fold CV guardrail, see fitComps).
//   base         = tvl_usd x multiple(tvl_usd)
//   growth       = clamp(change_7d, -60, 120) per cent (null -> 0)
//   growthMult   = 1 + (growth / 100) x GROWTH_WEIGHT (0.5)
//   maturity     = 1.0 (FLAT — the "no-token clock": the snapshot's launch hazard is flat or
//                  declining with age, not rising, so age earns no bonus; see launchRates)
//   chainMult    = 1 + 0.03 x min(chains.length - 1, 5)   (max 1.15)
//   categoryFactor = shrunk empirical launch factor per category (cohort aged >= 1 year,
//                  shrinkage k=20 toward the overall rate; see launchRates). Risk Curators
//                  ~0.68, Onchain Capital Allocator ~0.77, Dexs ~1.27, Lending ~1.28, rest ~1.0.
//   implied      = max(1, round(base x growthMult x maturity x chainMult x categoryFactor))
//
// The radar-2 constants (flat 0.25, maturity 0.6-1.0, priors 0.7/0.8) are kept as the
// fallback path only: they apply when the fitted curve's guardrail fails, and the dossier
// records which path the build took. No protocol name is ever special-cased: the same
// function scores every row.

/** The snapshot's protocol entry: exactly the ten fields the sealed input carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model's constants, as the dashboard states them and the sandbox may change them. */
export interface ModelConstants {
  base_multiple: number;
  growth_weight: number;
  growth_floor: number;
  growth_cap: number;
  maturity_floor: number;
  maturity_range: number;
  maturity_days: number;
  unknown_age_days: number;
  /** Per extra chain beyond the first, capped by chain_max_extra (radar-2 chainMult). */
  chain_step: number;
  chain_max_extra: number;
  /** radar-2 category priors: see the header comment for the reason. */
  category_prior_risk_curators: number;
  category_prior_onchain_capital_allocator: number;
}

export const MODEL: ModelConstants = {
  base_multiple: 0.25,
  growth_weight: 0.5,
  growth_floor: -60,
  growth_cap: 120,
  maturity_floor: 0.6,
  maturity_range: 0.4,
  maturity_days: 1095,
  unknown_age_days: 365,
  chain_step: 0.03,
  chain_max_extra: 5,
  category_prior_risk_curators: 0.7,
  category_prior_onchain_capital_allocator: 0.8,
};

/** The model's version label: the dashboard names it and the rules quote it. */
export const MODEL_VERSION = 'radar-3';

/** The fitted comps curve's fallback: the flat multiple used when the fit's guardrail fails. */
export const FLAT_MULTIPLE = 0.25;

/** T-bill rate used for farm-economics opportunity cost: 4.5%/yr, as of Nov 2026 (a stated
 *  assumption, not a live quote — the snapshot carries no rates). */
export const TBILL_RATE = 0.045;
export const TBILL_AS_OF = '2026-11';

/** Shrinkage pseudo-count for category launch factors (see launchRates). */
export const SHRINKAGE_K = 20;

/** Bootstrap refits for rank ranges: fixed seed, so two runs are byte-identical. */
export const BOOTSTRAP_SEED = 20261117;
export const BOOTSTRAP_REPS = 200;

/** No early-row cap in radar-3: the board carries EVERY strict-tokenless protocol in the
 *  snapshot (198 in this snapshot: 40 watchlist + 158 outside it), not a top-N by TVL and
 *  not only the rows below the watchlist floor. The floor is where the house's reading
 *  started, not where this radar stops. EARLY_ROWS is intentionally gone. */

/** The fitted comps curve and its validation (radar-3, computed from the snapshot at build). */
export interface CompsFit {
  /** Clean comps the fit ran on. */
  n: number;
  /** OLS log-log coefficients: log(mcap) = intercept + slope * log(TVL). */
  intercept: number;
  slope: number;
  /** R-squared of the fit. */
  r2: number;
  /** 5-fold cross-validated log-RMSE, fitted curve vs the flat multiple. */
  cv_fit: number;
  cv_flat: number;
  /** Leave-one-out log-RMSE, fitted curve vs the flat multiple. */
  loo_fit: number;
  loo_flat: number;
  /** listed_at split (train < 2024, test >= 2024) log-RMSE, fitted vs flat; NaN if a half is empty. */
  split_fit: number;
  split_flat: number;
  /** True when the fit did NOT beat flat out-of-sample: the build then uses the flat 0.25. */
  used_flat: boolean;
  /** The multiple the build actually used at a TVL (fitted curve, or flat when used_flat). */
  multiple_at_tvl: number;
  /** How many rows the cleaning dropped at each step (with_mcap -> bad_mcap / excluded -> clean). */
  cleaning: { with_mcap: number; bad_mcap: number; excluded_category_name: number; deduped: number; clean: number };
}

/** One category's empirical launch record (cohort aged >= 1 year, token = any token record). */
export interface CategoryRate {
  n: number;
  raw_rate: number;
  /** Shrinkage estimate toward the overall rate (pseudo-count SHRINKAGE_K). */
  shrunk_rate: number;
  /** Value factor: shrunk_rate / overall_rate. */
  factor: number;
  /** The pure shrunk factor before any guardrail fallback (factor when fallback is false). */
  shrunk_factor: number;
  /** True when the factor failed the stability guardrail and the radar-2 prior was kept. */
  fallback: boolean;
}

/** The launch-rate table and the U3 adoption decision (radar-3, computed at build). */
export interface LaunchRates {
  /** Protocols in the >= 1 year cohort. */
  cohort_n: number;
  /** Overall P(has a token) in that cohort. */
  overall_rate: number;
  /** Per-category record, keyed by category name. */
  by_category: Record<string, CategoryRate>;
  /** The constant-hazard fit (per year) from the age buckets. */
  hazard_per_year: number;
  /** True when the data-driven factors were adopted (see the guardrail note in launchRates). */
  adopted: boolean;
  /** Why adopted or not, in one line, for the dossier. */
  adopted_note: string;
  /** True when maturity is the flat no-token clock (1.0) instead of the old age bonus. */
  maturity_flat: boolean;
}

/** One row's farm economics (radar-3): costed, with a verdict. All figures in whole US dollars. */
export interface FarmEconomics {
  capital_usd: number;
  hold_days: number;
  setup_gas_usd: number;
  weekly_gas_usd: number;
  opportunity_cost_usd: number;
  total_cost_usd: number;
  /** Planning probability of a launch: the row's shrunk category launch rate (a backward-looking
   *  base rate, not a forecast — see the dossier's caveat). */
  p_launch: number;
  /** Allocation at launch that repays the cost: total_cost / p_launch. */
  break_even_usd: number;
  /** Expected net value (p_launch x allocation - total_cost) at the three labelled scenarios. */
  ev_100: number;
  ev_500: number;
  ev_2000: number;
  /** FARM / THIN / SKIP, by the rule in farmEconomics. */
  verdict: 'FARM' | 'THIN' | 'SKIP';
}

/** A bootstrap rank range: the row's rank at the 10th and 90th percentile over BOOTSTRAP_REPS refits. */
export type RankRange = [number, number];

/** How many live-token protocols the Live token view carries, by market cap. */
export const LIVE_ROWS = 24;

/** A farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** One row of board.json: the ranked board's row. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token';
  age_days: number | null;
  implied_value_usd: number;
  model: {
    base_multiple: number;
    growth_pct: number;
    growth_multiplier: number;
    maturity_multiplier: number;
    chain_multiplier: number;
    category_prior: number;
    age_days: number | null;
  };
  farm_steps: string[];
  /** radar-3: the row's costed farm economics and its FARM / THIN / SKIP verdict. */
  farm_economics: FarmEconomics;
  verdict: 'FARM' | 'THIN' | 'SKIP';
  /** radar-3: the row's rank at p10-p90 over 200 bootstrap refits of the comps curve. */
  rank_range: RankRange;
}

/** The dashboard's compact view of one row, with farm plans generated in the page. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  age_days: number | null;
  implied_value_usd: number;
  /** radar-3: the row's fitted multiple (TVL-dependent), so the page recomputes exactly. */
  base_multiple: number;
  growth_multiplier: number;
  maturity_multiplier: number;
  chain_multiplier: number;
  category_prior: number;
  /** radar-3: bootstrap rank range and costed farm verdict. */
  rank_range: RankRange;
  farm_economics: FarmEconomics;
  verdict: 'FARM' | 'THIN' | 'SKIP';
}

/** A live-token protocol: it already trades, so the board shows the market's own value, not a model's. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
}

/** Everything the dashboard needs: the board, the live set, and the model it runs. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model: ModelConstants;
  model_version: string;
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
  rows: RadarRow[];
  live: LiveRow[];
  /** radar-3: the fitted comps curve (or the flat fallback when its guardrail failed). */
  fit: CompsFit;
  /** radar-3: the adopted category factors and planning launch rates, keyed by category. */
  category_factors: Record<string, number>;
  p_launch: Record<string, number>;
  /** radar-3: the T-bill assumption behind farm opportunity cost. */
  tbill: { rate: number; as_of: string };
  /** radar-3: whether the data-driven factors were adopted, in one line. */
  factors_note: string;
}

/** Why the snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** A whole day count from `from` to `to`, clamped at zero; null when either date is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/** The chain multiplier (radar-2): 1 + 0.03 x min(chains - 1, 5), at most 1.15. */
export function chainMultiplier(protocol: SnapshotProtocol, model: ModelConstants): number {
  const extra = Math.min(Math.max(protocol.chains.length - 1, 0), model.chain_max_extra);
  return 1 + model.chain_step * extra;
}

/**
 * The category prior (radar-2 fallback): 0.7 for 'Risk Curators', 0.8 for 'Onchain Capital
 * Allocator', 1.0 otherwise. Used ONLY for a category whose data-driven factor fell back
 * (see launchRates), or when the data-driven factors are not adopted at all.
 */
export function categoryPrior(protocol: SnapshotProtocol, model: ModelConstants): number {
  if (protocol.category === 'Risk Curators') return model.category_prior_risk_curators;
  if (protocol.category === 'Onchain Capital Allocator') return model.category_prior_onchain_capital_allocator;
  return 1.0;
}

/** Everything impliedValue needs: the constants, the fitted curve, the category factors,
 *  and whether maturity is flat (U3 adopted) or the old age bonus. */
export interface Scoring {
  model: ModelConstants;
  fit: CompsFit;
  /** Adopted category factor per category name; missing categories score 1.0. */
  factors: Record<string, number>;
  /** Shrunk category launch rate per category (planning p_launch for farm economics). */
  p_launch: Record<string, number>;
  /** Overall cohort launch rate, used when a category has no rate of its own. */
  overall_rate: number;
  /** True when U3 was adopted: maturity is the flat no-token clock (1.0 for every row). */
  maturityFlat: boolean;
}

/** The fitted multiple at a TVL: the comps curve, or the flat 0.25 when its guardrail failed. */
export function fittedMultiple(tvlUsd: number, fit: CompsFit): number {
  if (fit.used_flat) return FLAT_MULTIPLE;
  return Math.exp(fit.intercept) * Math.pow(tvlUsd, fit.slope - 1);
}

/** The multipliers and the implied value one protocol gets under `scoring` (radar-3). */
export function impliedValue(
  protocol: SnapshotProtocol,
  asOf: string,
  scoring: Scoring,
): { implied: number; baseMultiple: number; growthPct: number; growthMult: number; maturityMult: number; chainMult: number; categoryPriorValue: number; age: number | null } {
  const { model } = scoring;
  const age = ageDays(asOf, protocol.listed_at);
  const rawGrowth = finite(protocol.change_7d, 0);
  const growthPct = Math.min(model.growth_cap, Math.max(model.growth_floor, rawGrowth));
  const growthMult = 1 + (growthPct / 100) * model.growth_weight;
  const maturityMult = scoring.maturityFlat
    ? 1.0
    : model.maturity_floor + (Math.min(Math.max(age ?? model.unknown_age_days, 0), model.maturity_days) / model.maturity_days) * model.maturity_range;
  const chainMult = chainMultiplier(protocol, model);
  const categoryPriorValue = scoring.factors[protocol.category ?? ''] ?? 1.0;
  const baseMultiple = fittedMultiple(protocol.tvl_usd, scoring.fit);
  const base = protocol.tvl_usd * baseMultiple;
  const implied = Math.max(1, Math.round(base * growthMult * maturityMult * chainMult * categoryPriorValue));
  return { implied, baseMultiple, growthPct, growthMult, maturityMult, chainMult, categoryPriorValue, age };
}

/* ------------------------------------------------------------------ */
/* radar-3 statistics: fitted comps, launch rates, farm economics,    */
/* bootstrap ranks. All of it is computed from the snapshot at build, */
/* deterministic (no randomness except the seeded bootstrap), and the  */
/* dossier prints the numbers so a reader can re-derive them.          */
/* ------------------------------------------------------------------ */

/** Ordinary least squares on (x, y): intercept, slope, R-squared. */
function ols(xs: number[], ys: number[]): { intercept: number; slope: number; r2: number } {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const e = ys[i] - (intercept + slope * xs[i]);
    ssRes += e * e;
  }
  return { intercept, slope, r2: syy === 0 ? 0 : 1 - ssRes / syy };
}

/** Root-mean-square error between predicted and actual log-values. */
function logRmse(pred: number[], actual: number[]): number {
  let s = 0;
  for (let i = 0; i < pred.length; i++) {
    const e = pred[i] - actual[i];
    s += e * e;
  }
  return Math.sqrt(s / pred.length);
}

/** Whether a protocol's name marks it as a version, a wrapped/staked product, or an exchange
 *  product — the name-based half of the strict tokenless rule (see isTokenless below). */
function isWrappedOrStaked(name: string): boolean {
  return VERSIONED.test(name) || WRAPPED_OR_STAKED.test(name) || EXCHANGE_PREFIX.test(name);
}

/**
 * The clean comps for the fitted curve: token protocols with mcap>0 and TVL>0, excluding
 * CEX/Bridge/wrapped/versioned rows and the token-less excluded categories, one row per
 * ticker (gecko_id; first by slug wins). The cleaning counts are returned so the dossier
 * states exactly what was dropped and why — the curve is only as honest as its cleaning.
 */
export function cleanComps(snapshot: Snapshot): {
  comps: SnapshotProtocol[];
  counts: { with_mcap: number; bad_mcap: number; excluded_category_name: number; deduped: number; clean: number };
} {
  const withMcap = snapshot.protocols.filter((p) => p.mcap_usd !== null && p.mcap_usd !== undefined);
  const badMcap = withMcap.filter((p) => !(p.mcap_usd! > 0) || !(p.tvl_usd > 0));
  const usable = withMcap.filter((p) => p.mcap_usd! > 0 && p.tvl_usd > 0);
  const excluded = usable.filter(
    (p) => (p.category !== null && EXCLUDED_CATEGORIES.has(p.category)) || isWrappedOrStaked(p.name),
  );
  const kept = usable.filter(
    (p) => !(p.category !== null && EXCLUDED_CATEGORIES.has(p.category)) && !isWrappedOrStaked(p.name),
  );
  const seen = new Set<string>();
  const comps: SnapshotProtocol[] = [];
  let deduped = 0;
  for (const p of kept) {
    if (p.gecko_id === null) {
      comps.push(p);
      continue;
    }
    if (seen.has(p.gecko_id)) {
      deduped++;
      continue;
    }
    seen.add(p.gecko_id);
    comps.push(p);
  }
  return {
    comps,
    counts: {
      with_mcap: withMcap.length,
      bad_mcap: badMcap.length,
      excluded_category_name: excluded.length,
      deduped,
      clean: comps.length,
    },
  };
}

/**
 * The fitted comps curve (U2): OLS log(mcap) ~ log(TVL) over the clean comps, validated
 * out-of-sample. Guardrail: the curve is used ONLY when it beats the flat 0.25 multiple
 * on 5-fold CV log-RMSE; otherwise the build falls back to flat and says so in the dossier.
 * (This snapshot: CV fit 2.005 vs flat 2.177, LOO fit 1.967 vs flat 2.177 — the curve wins.)
 */
export function fitComps(snapshot: Snapshot): CompsFit {
  const { comps, counts } = cleanComps(snapshot);
  const xs = comps.map((p) => Math.log(p.tvl_usd));
  const ys = comps.map((p) => Math.log(p.mcap_usd!));
  const { intercept, slope, r2 } = ols(xs, ys);
  const flatLog = Math.log(FLAT_MULTIPLE);
  const flatPred = xs.map((x) => x + flatLog);

  // 5-fold CV, deterministic folds: comps sorted by slug, fold = index mod 5.
  const order = comps.map((p, i) => i).sort((a, b) => comps[a].slug.localeCompare(comps[b].slug));
  const cvPred: number[] = new Array(comps.length).fill(0);
  for (let fold = 0; fold < 5; fold++) {
    const train = order.filter((_, i) => i % 5 !== fold);
    const test = order.filter((_, i) => i % 5 === fold);
    const f = ols(train.map((i) => xs[i]), train.map((i) => ys[i]));
    for (const i of test) cvPred[i] = f.intercept + f.slope * xs[i];
  }
  const cvFit = logRmse(cvPred, ys);
  const cvFlat = logRmse(flatPred, ys);

  // Leave-one-out: fit on n-1, predict the held-out row.
  const looPred: number[] = new Array(comps.length).fill(0);
  for (let held = 0; held < comps.length; held++) {
    const train = comps.map((_, i) => i).filter((i) => i !== held);
    const f = ols(train.map((i) => xs[i]), train.map((i) => ys[i]));
    looPred[held] = f.intercept + f.slope * xs[held];
  }
  const looFit = logRmse(looPred, ys);
  const looFlat = logRmse(flatPred, ys);

  // listed_at split: train on comps listed before 2024, test on comps listed 2024 or later —
  // the closest thing to "would the curve have predicted the next year's launches".
  const splitTrain = comps.map((p, i) => i).filter((i) => comps[i].listed_at !== null && comps[i].listed_at! < '2024-01-01');
  const splitTest = comps.map((p, i) => i).filter((i) => comps[i].listed_at !== null && comps[i].listed_at! >= '2024-01-01');
  let splitFit = Number.NaN;
  let splitFlat = Number.NaN;
  if (splitTrain.length >= 2 && splitTest.length > 0) {
    const sf = ols(splitTrain.map((i) => xs[i]), splitTrain.map((i) => ys[i]));
    splitFit = logRmse(splitTest.map((i) => sf.intercept + sf.slope * xs[i]), splitTest.map((i) => ys[i]));
    splitFlat = logRmse(splitTest.map((i) => xs[i] + flatLog), splitTest.map((i) => ys[i]));
  }

  const usedFlat = cvFit >= cvFlat;
  const fit: CompsFit = {
    n: comps.length,
    intercept,
    slope,
    r2,
    cv_fit: cvFit,
    cv_flat: cvFlat,
    loo_fit: looFit,
    loo_flat: looFlat,
    split_fit: splitFit,
    split_flat: splitFlat,
    used_flat: usedFlat,
    multiple_at_tvl: 0,
    cleaning: counts,
  };
  fit.multiple_at_tvl = fittedMultiple(1e9, fit);
  return fit;
}

/** Shrinkage: pull a category's raw rate toward the overall rate with pseudo-count k. */
function shrunkRate(n: number, raw: number, overall: number, k: number): number {
  return (n * raw + k * overall) / (n + k);
}

/** Cumulative P(has a token) by age bucket, for the hazard analysis: for each upper age bound,
 *  the fraction of protocols listed no longer ago than that bound that already have a token.
 *  The implied hazard -ln(1 - P) / mid shows whether the launch hazard rises, falls, or stays
 *  flat with age (it falls, then flattens — see launchRates). */
export function hazardBuckets(snapshot: Snapshot): Array<{ mid_years: number; n: number; p_token: number; hazard: number }> {
  const bounds: Array<[number, number]> = [
    [182, 0.25],
    [365, 0.75],
    [730, 1.5],
    [1095, 2.5],
    [3650, 4.5],
  ];
  return bounds.map(([days, mid]) => {
    const rows = snapshot.protocols.filter((p) => {
      const age = ageDays(snapshot.as_of, p.listed_at);
      return age !== null && age <= days;
    });
    const pToken = rows.length === 0 ? 0 : rows.filter((p) => !isPreToken(p)).length / rows.length;
    return { mid_years: mid, n: rows.length, p_token: pToken, hazard: pToken >= 1 ? Number.POSITIVE_INFINITY : -Math.log(1 - pToken) / mid };
  });
}

/**
 * The empirical launch rates (U3): P(has a token) by category among protocols listed at
 * least a year ago, where "has a token" is the model's own definition (def A: mcap AND
 * gecko_id AND symbol are all null means pre-token — the same rule isPreToken uses). A
 * market-cap-only definition (def E) would undercount tokens recorded via gecko_id/symbol
 * without a market cap, which is common for DEX and Lending deployments, so def A is used.
 *
 * Guardrail, per category: the shrunk factor is adopted ONLY when it is stable — |factor
 * at k=10 minus factor at k=40| <= 0.15 AND the split-half (listed <= 2023 vs >= 2024)
 * factor agrees within 0.25. A category that fails either keeps the old radar-2 prior
 * (0.7 Risk Curators, 0.8 Onchain Capital Allocator, 1.0 otherwise). The adopted factor
 * is recorded per category in `factor`, the pure shrunk value in `shrunk_factor`, and the
 * fallback flag in `fallback`. Maturity goes flat (1.0) whenever the factors are adopted:
 * the snapshot's forward hazard declines from ~1.2/yr early to ~0.2/yr later, so age
 * earns no bonus (constant-hazard fit ~0.19/yr).
 */
export function launchRates(snapshot: Snapshot, model: ModelConstants = MODEL): LaunchRates {
  const asOf = snapshot.as_of;
  const cohort = snapshot.protocols.filter((p) => {
    const age = ageDays(asOf, p.listed_at);
    return age !== null && age >= 365;
  });
  const overall = cohort.length === 0 ? 0 : cohort.filter((p) => !isPreToken(p)).length / cohort.length;

  const byCat = new Map<string, SnapshotProtocol[]>();
  for (const p of cohort) {
    const key = p.category ?? '(no category)';
    const arr = byCat.get(key) ?? [];
    arr.push(p);
    byCat.set(key, arr);
  }
  const oldHalf = cohort.filter((p) => p.listed_at !== null && p.listed_at.slice(0, 4) <= '2023');
  const youngHalf = cohort.filter((p) => p.listed_at !== null && p.listed_at.slice(0, 4) >= '2024');
  const rateIn = (rows: SnapshotProtocol[]): number =>
    rows.length === 0 ? 0 : rows.filter((p) => !isPreToken(p)).length / rows.length;

  const by_category: Record<string, CategoryRate> = {};
  const fallbacks: string[] = [];
  for (const [cat, rows] of [...byCat.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const n = rows.length;
    const raw = rateIn(rows);
    const shrunk = shrunkRate(n, raw, overall, SHRINKAGE_K);
    const f20 = shrunk / overall;
    const f10 = shrunkRate(n, raw, overall, 10) / overall;
    const f40 = shrunkRate(n, raw, overall, 40) / overall;
    const oldRows = oldHalf.filter((p) => (p.category ?? '(no category)') === cat);
    const youngRows = youngHalf.filter((p) => (p.category ?? '(no category)') === cat);
    const fOld = oldRows.length === 0 ? null : shrunkRate(oldRows.length, rateIn(oldRows), overall, SHRINKAGE_K) / overall;
    const fYoung = youngRows.length === 0 ? null : shrunkRate(youngRows.length, rateIn(youngRows), overall, SHRINKAGE_K) / overall;
    const splitDev = Math.max(
      fOld === null ? 0 : Math.abs(fOld - f20),
      fYoung === null ? 0 : Math.abs(fYoung - f20),
    );
    const unstable = Math.abs(f10 - f40) > 0.15 || splitDev > 0.25;
    const oldPrior = categoryPrior({ category: cat === '(no category)' ? null : cat } as SnapshotProtocol, model);
    by_category[cat] = {
      n,
      raw_rate: raw,
      shrunk_rate: shrunk,
      factor: unstable ? oldPrior : f20,
      shrunk_factor: f20,
      fallback: unstable,
    };
    if (unstable) {
      fallbacks.push(
        `${cat} (shrunk ${f20.toFixed(3)}, |k10-k40| ${Math.abs(f10 - f40).toFixed(3)}, split dev ${splitDev.toFixed(3)} -> kept prior ${oldPrior})`,
      );
    }
  }

  // Constant-hazard fit from the age buckets: -ln(1 - P) ~ h * age, through the origin.
  const buckets = hazardBuckets(snapshot);
  let num = 0;
  let den = 0;
  for (const b of buckets) {
    if (!Number.isFinite(b.hazard)) continue;
    const y = -Math.log(1 - b.p_token);
    num += b.mid_years * y;
    den += b.mid_years * b.mid_years;
  }
  const hazard = den === 0 ? 0 : num / den;

  const adopted = Object.values(by_category).some((c) => !c.fallback);
  const note = adopted
    ? `adopted (k=${SHRINKAGE_K}); fell back to radar-2 priors: ${fallbacks.length === 0 ? 'none' : fallbacks.join('; ')}; maturity flat (hazard ~${hazard.toFixed(2)}/yr, declining with age)`
    : 'NOT adopted — every category failed the stability guardrail; radar-2 priors and age maturity kept';
  return {
    cohort_n: cohort.length,
    overall_rate: overall,
    by_category,
    hazard_per_year: hazard,
    adopted,
    adopted_note: note,
    maturity_flat: adopted,
  };
}

/**
 * One row's farm economics (U4): the cost of farming it, the break-even allocation, the
 * expected value at three labelled allocation scenarios, and the verdict. Costs are
 * deliberately modest and explicit — gas to set up, weekly gas while holding, and the
 * T-bill opportunity cost on the capital while it sits in the vault (TBILL_RATE/yr, as of
 * TBILL_AS_OF). p_launch is the row's shrunk category launch rate: a BACKWARD-looking base
 * rate, not a forecast — a protocol still tokenless at its age has already survived the
 * hazard, so the forward chance is lower; the verdicts are therefore optimistic and the
 * dossier says so. Scenarios are labelled, not predictions.
 */
export function farmEconomics(p: SnapshotProtocol, age: number | null, pLaunch: number): FarmEconomics {
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const setupGas = capital >= 150 ? 8 : 4;
  const weeklyGas = 2;
  const weeks = hold / 7;
  const opportunity = capital * TBILL_RATE * (hold / 365);
  const totalCost = setupGas + weeklyGas * weeks + opportunity;
  const breakEven = totalCost / pLaunch;
  const ev = (alloc: number): number => pLaunch * alloc - totalCost;
  const ev100 = ev(100);
  const ev500 = ev(500);
  const ev2000 = ev(2000);
  let verdict: 'FARM' | 'THIN' | 'SKIP';
  if (ev500 > 0 && pLaunch >= 0.1) verdict = 'FARM';
  else if (ev2000 > 0 || (pLaunch >= 0.05 && pLaunch < 0.1)) verdict = 'THIN';
  else verdict = 'SKIP';
  const round2 = (x: number): number => Math.round(x * 100) / 100;
  return {
    capital_usd: capital,
    hold_days: hold,
    setup_gas_usd: setupGas,
    weekly_gas_usd: weeklyGas,
    opportunity_cost_usd: round2(opportunity),
    total_cost_usd: round2(totalCost),
    p_launch: Math.round(pLaunch * 10000) / 10000,
    break_even_usd: Math.round(breakEven),
    ev_100: Math.round(ev100),
    ev_500: Math.round(ev500),
    ev_2000: Math.round(ev2000),
    verdict,
  };
}

/** Deterministic PRNG (mulberry32) for the bootstrap: fixed seed, same ranks every run. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Score a set of protocols under a scoring and return them ordered by implied value, best first. */
export function scoreProtocols(
  protocols: SnapshotProtocol[],
  snapshot: Snapshot,
  scoring: Scoring,
): Array<{ p: SnapshotProtocol; implied: number; baseMultiple: number; growthPct: number; growthMult: number; maturityMult: number; chainMult: number; categoryPriorValue: number; age: number | null }> {
  const scored = protocols.map((p) => {
    const v = impliedValue(p, snapshot.as_of, scoring);
    return { p, ...v };
  });
  scored.sort((a, b) => {
    if (b.implied !== a.implied) return b.implied - a.implied;
    return a.p.slug.localeCompare(b.p.slug);
  });
  return scored;
}

/**
 * Bootstrap rank ranges (U5): refit the comps curve BOOTSTRAP_REPS times on bootstrap
 * resamples of the clean comps, re-score the board each time, and record each row's rank
 * at p10 and p90. The resample keeps each ticker's (TVL, mcap) pair together; refits use
 * the curve as-is (no guardrail inside a refit — the guardrail belongs to the point fit).
 */
export function bootstrapRanks(
  snapshot: Snapshot,
  scoring: Scoring,
  protocols: SnapshotProtocol[],
): Record<string, RankRange> {
  const { comps } = cleanComps(snapshot);
  const n = comps.length;
  const xs = comps.map((p) => Math.log(p.tvl_usd));
  const ys = comps.map((p) => Math.log(p.mcap_usd!));
  const rng = mulberry32(BOOTSTRAP_SEED);
  const ranks: Record<string, number[]> = {};
  for (const p of protocols) ranks[p.slug] = [];
  for (let rep = 0; rep < BOOTSTRAP_REPS; rep++) {
    const sampleX: number[] = [];
    const sampleY: number[] = [];
    for (let i = 0; i < n; i++) {
      const j = Math.floor(rng() * n);
      sampleX.push(xs[j]);
      sampleY.push(ys[j]);
    }
    const f = ols(sampleX, sampleY);
    const refit: CompsFit = { ...scoring.fit, intercept: f.intercept, slope: f.slope, used_flat: false };
    const scored = scoreProtocols(protocols, snapshot, { ...scoring, fit: refit });
    scored.forEach((s, i) => ranks[s.p.slug].push(i + 1));
  }
  const out: Record<string, RankRange> = {};
  for (const [slug, rs] of Object.entries(ranks)) {
    rs.sort((a, b) => a - b);
    out[slug] = [rs[Math.floor(0.1 * (rs.length - 1))], rs[Math.floor(0.9 * (rs.length - 1))]];
  }
  return out;
}

/** DefiLlama's version-marker rule: a name ending in a release is a pool of another protocol. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;

/** Categories that are a wrapped / staked / bridged product of a token that already trades, or a CEX. */
const EXCLUDED_CATEGORIES = new Set(['Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC', 'CEX']);

/** A whole word wrapped / staked / staking anywhere in the name (case-insensitive). */
const WRAPPED_OR_STAKED = /\b(wrapped|staked|staking)\b/i;

/** Exchange names: a protocol whose name starts with one is an exchange product, not a new token. */
const EXCHANGE_PREFIX = /^(Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)\b/i;

/** Whether a protocol records no token at all. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/**
 * STRICT tokenless rule (final, radar-2): pre-token AND category not excluded AND no version
 * marker AND no whole word wrapped/staked/staking AND not starting with an exchange name.
 * LIMITATION: parentProtocol is NOT one of the snapshot's 10 fields, so it cannot be checked
 * here — see the header comment. Applied to watchlist and early rows alike.
 */
export function isTokenless(p: SnapshotProtocol): boolean {
  return (
    isPreToken(p) &&
    !EXCLUDED_CATEGORIES.has(p.category ?? '') &&
    !VERSIONED.test(p.name) &&
    !WRAPPED_OR_STAKED.test(p.name) &&
    !EXCHANGE_PREFIX.test(p.name)
  );
}

/** Whether a protocol is one the board may rank: the strict tokenless rule, nothing more. */
export function isRankable(p: SnapshotProtocol): boolean {
  return isTokenless(p);
}

/** The snapshot's protocol by slug. */
function bySlug(protocols: SnapshotProtocol[]): Map<string, SnapshotProtocol> {
  return new Map(protocols.map((p) => [p.slug, p]));
}

/** The headline sentence's figures: how many watchlist slugs, how many rows, how many live protocols. */
export interface BoardSummary {
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
}

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(snapshot: Snapshot, scoring: Scoring): BoardRow[] {
  const index = bySlug(snapshot.protocols);
  const chosen = new Map<string, SnapshotProtocol>();
  // The watchlist is the floor: every slug, filtered by the SAME strict tokenless rule as the
  // radar rows. In this snapshot all 40 watchlist slugs pass the strict rule, so none is dropped;
  // if one ever failed, the gate's coverage check would surface it instead of silently ranking it.
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p !== undefined && isRankable(p)) chosen.set(slug, p);
  }
  // The radar (radar-3, U1): EVERY strict-tokenless protocol in the snapshot — the watchlist
  // floor no longer filters rows out. The 20 above-floor rows (including Sentora Curator at
  // $2.76B TVL) join the 138 below-floor rows; a chosen protocol stays chosen. Total: 198.
  const extra = snapshot.protocols
    .filter((p) => !chosen.has(p.slug) && isRankable(p))
    .sort((a, b) => b.tvl_usd - a.tvl_usd || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  for (const p of extra) chosen.set(p.slug, p);

  const protocols = [...chosen.values()];
  const scored = scoreProtocols(protocols, snapshot, scoring);
  const ranges = bootstrapRanks(snapshot, scoring, protocols);
  return scored.map((s, i) => {
    const pLaunch = scoring.p_launch[s.p.category ?? ''] ?? scoring.overall_rate;
    const fe = farmEconomics(s.p, s.age, pLaunch);
    return {
      rank: i + 1,
      slug: s.p.slug,
      name: s.p.name,
      category: s.p.category,
      chains: s.p.chains,
      tvl_usd: s.p.tvl_usd,
      change_7d: s.p.change_7d,
      mcap_usd: s.p.mcap_usd,
      listed_at: s.p.listed_at,
      gecko_id: s.p.gecko_id,
      symbol: s.p.symbol,
      token_status: 'pre-token',
      age_days: s.age,
      implied_value_usd: s.implied,
      model: {
        // Unrounded on purpose: the dashboard recomputes each row from this multiple, so
        // rounding it here would make the page's number differ from the board's by a few
        // hundred dollars. The other multipliers are display-only and stay rounded.
        base_multiple: s.baseMultiple,
        growth_pct: s.growthPct,
        growth_multiplier: round4(s.growthMult),
        maturity_multiplier: round4(s.maturityMult),
        chain_multiplier: round4(s.chainMult),
        category_prior: s.categoryPriorValue,
        age_days: s.age,
      },
      farm_steps: farmSteps(s.p, s.age).map(stepText),
      farm_economics: fe,
      verdict: fe.verdict,
      rank_range: ranges[s.p.slug]!,
    };
  });
}

const round6 = (n: number): number => Math.round(n * 1e6) / 1e6;

const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** A step as one string: its action, then its cost and time, within the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** How much capital one farm position needs, from the protocol's own TVL. */
function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 5_000_000_000) return 250;
  if (p.tvl_usd >= 1_000_000_000) return 150;
  if (p.tvl_usd >= 100_000_000) return 100;
  return 50;
}

/** How long to hold, from the protocol's age: younger protocols get a longer qualifying window. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}

/** The category's one action, in the words a farmer can follow. */
function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Supply $${capital} of USDC to ${name} on ${chain} and keep the position open.`;
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm')) return `Provide $${capital} of liquidity to ${name}'s main pool on ${chain} and keep the position open.`;
  if (c.includes('bridge')) return `Bridge $${capital} of USDC to ${chain} through ${name} and use the bridged funds in its app.`;
  if (c.includes('staking') || c.includes('restak')) return `Stake $${capital} of the chain's staking asset through ${name} and keep the receipt.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Deposit $${capital} of USDC as margin on ${name} and open one small hedge.`;
  if (c.includes('prediction')) return `Fund $${capital} and place one market position on ${name}.`;
  if (c.includes('curator') || c.includes('allocator')) return `Deposit $${capital} into a ${name} vault on ${chain} and keep the shares.`;
  if (c.includes('stable')) return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain}.`;
  if (c.includes('rwa')) return `Mint $${capital} of the protocol's yield asset on ${chain} and hold it.`;
  if (c.includes('insurance')) return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy.`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} and keep the position open.`;
}

/**
 * A protocol's farm plan: six steps, each an action with a cost and a time. The plan is derived from
 * the protocol's own record (category, chains, TVL, age), never from a hand-written list of names.
 * HONEST NOTE: this plan is TEMPLATED, not written by hand per protocol — the same six-step shape
 * with the protocol's own category/chain/capital filled in. It is a starting checklist, not a
 * per-protocol researched strategy; the dashboard must not claim otherwise.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const action = actionFor(p, capital, chain);
  return [
    {
      text: `Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.`,
      cost: 'under $3 of gas for the first transaction',
      time: '5 minutes',
    },
    {
      text: action,
      cost: `$${capital} of capital and about $${capital >= 150 ? 8 : 4} of gas`,
      time: '15 minutes to set up',
    },
    {
      text: `Make one qualifying action each week, such as a deposit, a borrow, a swap or a vote.`,
      cost: 'about $2 of gas a week',
      time: '10 minutes a week',
    },
    {
      text: `Hold the position for at least ${hold} days so the activity is counted in more than one snapshot.`,
      cost: `the $${capital} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: `Before you withdraw, open the protocol's own points or rewards page and claim only from the link it publishes.`,
      cost: 'no fee to check, and never pay to claim',
      time: '10 minutes',
    },
    {
      text: `Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.`,
      cost: 'nothing but the log',
      time: '5 minutes',
    },
  ];
}

/** The live-token protocols, by market cap, for the dashboard's Live token view. */
export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    .filter((p) => !isPreToken(p) && p.category !== 'CEX')
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd)
    .slice(0, LIVE_ROWS)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      change_7d: p.change_7d,
    }));
}

/** A board row's compact form for data.js, with the farm plan generated in the page. */
export function radarRow(row: BoardRow): RadarRow {
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    chains: row.chains,
    tvl_usd: row.tvl_usd,
    change_7d: row.change_7d,
    mcap_usd: row.mcap_usd,
    listed_at: row.listed_at,
    age_days: row.age_days,
    implied_value_usd: row.implied_value_usd,
    base_multiple: row.model.base_multiple,
    growth_multiplier: row.model.growth_multiplier,
    maturity_multiplier: row.model.maturity_multiplier,
    chain_multiplier: row.model.chain_multiplier,
    category_prior: row.model.category_prior,
    rank_range: row.rank_range,
    farm_economics: row.farm_economics,
    verdict: row.verdict,
  };
}

/** Everything the dashboard renders, from the snapshot — plus the fit and rates the dossier prints. */
export function buildRadar(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; radar: RadarData; fit: CompsFit; rates: LaunchRates } {
  const fit = fitComps(snapshot);
  const rates = launchRates(snapshot, model);
  const factors: Record<string, number> = {};
  const pLaunch: Record<string, number> = {};
  for (const [cat, r] of Object.entries(rates.by_category)) {
    factors[cat] = r.factor;
    pLaunch[cat] = r.shrunk_rate;
  }
  const scoring: Scoring = {
    model,
    fit,
    factors,
    p_launch: pLaunch,
    overall_rate: rates.overall_rate,
    maturityFlat: rates.maturity_flat,
  };
  const board = buildBoard(snapshot, scoring);
  const live = liveRows(snapshot);
  const early = board.filter((r) => !snapshot.watchlist.includes(r.slug)).length;
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model,
    model_version: MODEL_VERSION,
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    early_size: early,
    live_size: live.length,
    rows: board.map(radarRow),
    live,
    fit,
    category_factors: factors,
    p_launch: pLaunch,
    tbill: { rate: TBILL_RATE, as_of: TBILL_AS_OF },
    factors_note: rates.adopted_note,
  };
  return { board, radar, fit, rates };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks, order, one shared implied value, and farm steps. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value $${board[0]!.implied_value_usd}: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    const steps = r.farm_steps;
    if (steps.length < 3 || steps.length > 12) return `${r.slug} has ${steps.length} farm steps`;
    for (const s of steps) if (s.length < 20 || s.length > 600) return `${r.slug} has a farm step of ${s.length} characters`;
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0) return `${r.slug} has implied value ${r.implied_value_usd}`;
    const fe = r.farm_economics;
    if (!fe || fe.total_cost_usd <= 0 || fe.break_even_usd <= 0 || fe.p_launch <= 0 || fe.p_launch > 1) return `${r.slug} has invalid farm economics`;
    if (fe.verdict !== 'FARM' && fe.verdict !== 'THIN' && fe.verdict !== 'SKIP') return `${r.slug} has verdict ${fe.verdict}`;
    if (fe.verdict !== r.verdict) return `${r.slug} verdict ${r.verdict} does not match farm economics ${fe.verdict}`;
    const [lo, hi] = r.rank_range;
    if (!Number.isInteger(lo) || !Number.isInteger(hi) || lo < 1 || hi > board.length || lo > hi) return `${r.slug} has rank range ${lo}-${hi}`;
    if (r.model.base_multiple <= 0) return `${r.slug} has base multiple ${r.model.base_multiple}`;
  }
  return null;
}

/** A compact data.js: the dashboard's whole dataset as one script, no fetch and no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
