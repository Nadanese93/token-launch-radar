# Token Launch Radar -- analysis

Snapshot: DefiLlama protocol index, frozen 14 November 2026 (758 protocols at or above $50M TVL; 40 on the watchlist). Model: radar-4. Board: 198 pre-token protocols ranked by implied value. This file is the argument the dashboard's numbers stand on: what the model assumes, why the top 10 rank where they do, what would change the assessment, and how to use the farm plans. Nothing here comes from outside the snapshot: no funding, team, or token-plan data exists in it, so none is claimed.

## 1. What implied value is -- and is not

Implied value is a size-and-age estimate of what a token launch might be worth if it happened. It is not a price prediction, not a valuation, and not a promise that a token will launch. Every row is scored by one function of the snapshot's own figures:

    implied = round(TVL x fitted_multiple(TVL))

- Base (TVL x fitted multiple). The multiple is fitted, not assumed: log(mcap) = 9.113 + 0.394 x log(TVL) over 92 clean comps (R-squared 0.104), so the multiple falls with size -- about 0.79 at $5M TVL, 0.20 at $50M, 0.13 at $100M, 0.03 at $1B, 0.016 at $3B. The fit is weak (R-squared 0.104): TVL explains about a tenth of the variation in market cap. The curve is a better central tendency than flat, not a precise predictor -- that is why every rank carries a bootstrap range (section 8). The curve is used only because it beat flat out of sample: 5-fold CV log-RMSE 2.005 vs 2.177, leave-one-out 1.967 vs 2.177, listed_at split (train listed before 2024, test 2024 or later) 2.050 vs 2.426. Had it lost on CV, the build would have fallen back to the flat 0.25 multiple. Two challengers were tested on the same three tests and both lost: Huber beats OLS on CV and LOO but loses on the time split, and per-category curves lose on CV and LOO -- so OLS stays.
- Nothing else multiplies the value. Radar-3 multiplied by growth (7-day change, half weight), chain breadth (+3% per extra chain), and a category factor (shrunk launch rates). Radar-4 blind-tested every one of those terms against the comps' market caps -- the full model with each term removed, curve refit per fold -- and every removal IMPROVED out-of-sample prediction (CV 2.030 baseline; 2.028 without growth, 2.022 without chain, 2.017 without the category system). The terms added noise, not signal, so they were dropped. The rule was stated in advance: a term is kept only if removing it worsens 5-fold CV by more than 0.001. Only flat maturity survived: restoring the old age bonus worsens all three tests.
- Maturity (1.0, flat). The snapshot's launch hazard falls with age instead of rising -- cumulative P(has a token) implies a hazard of about 1.2/yr in the first months, 0.5/yr by nine months, and 0.2/yr after two years (constant-hazard fit 0.19/yr) -- so a long tokenless run is no evidence a launch is nearer. Age is still shown on every row; it just earns no bonus any more. The honest counter-reading is in section 5: a protocol still tokenless at its age has already survived the hazard, so the forward chance is lower than the backward-looking base rate.
- The likelihood adjustment now lives in the farm verdicts, not in the value. Each row carries a forward 12-month launch probability from the no-token clock: the hazard at the protocol's own age (1.21/yr under 6 months, 0.17/yr at 6-13 months, 0.07/yr at 13-24 months, 0.09/yr after), scaled by its category's launch rate (Dexs 1.27, Lending 1.28, Risk Curators 0.70). A young DEX can have a forward chance near 79%; an old Risk Curator sits near 5%. The verdicts use that probability (section 6); the value does not.

No protocol name is special-cased: the same function scores all 198 rows.

## 2. The board at a glance

The board holds 198 pre-token protocols with $20.71B of TVL between them and $1.87B of total implied value; the median row is worth $7.2M. The top 10 hold 16.9% of all implied value, against 58.6% under radar-2's flat multiple. The fitted curve compresses the top, because the multiple falls with size and the largest protocols are the ones it discounts hardest. By category, Risk Curators lead with 34 rows, then Dexs (21), Onchain Capital Allocators (18), RWA (16), Lending (16), Yield (15), Derivatives (13), CDP (9), Yield Aggregators (9), and Basis Trading (8); the remaining 39 rows spread across 23 smaller categories. The two B2B vault categories together are 52 rows, 58.9% of the board's TVL and 33.4% of its implied value -- their share of implied value rose from radar-3's 26.5% because the 0.7/0.77 discounts are gone; size now speaks undiscounted.

Age: 110 rows have run more than a year with no token, 49 are under 180 days old, and 7 have no listing date on record. Breadth: 113 of 198 rows run on a single chain. Momentum: the snapshot week was broadly down -- 140 rows fell over seven days against 56 that rose (2 with no change on record) -- but momentum no longer moves any rank: the blind test dropped the growth term.

Coverage: the board is every strict-tokenless protocol in the snapshot -- the 40 on the watchlist plus 158 outside it, including 20 above the $50M watchlist floor, led by Sentora Curator ($2.76B). The 560 protocols not on the board have a token, are wrapped/staked/bridged, or are a CEX.

## 3. The top 10

The top 10 hold $11.73B of TVL between them. Five are Risk Curators or Onchain Capital Allocators, so half of the top 10 is B2B vault businesses whose token is the least certain -- and the blind test removed the discount that used to hold them back, so they now lead on size alone. The other five are where a retail token is most plausible. The main board ranks by implied value, which is size first; the 'Most likely to launch a token' view ranks the same rows by implied value among the non-vault categories.

| Rank | Protocol | TVL | Implied | Verdict (forward chance) | Rank range |
|---:|---|---:|---:|---|---:|
| 1 | Sentora Curator (Risk Curators) | $2.76B | $47.6M | THIN (11.5%) | 1-1 |
| 2 | Steakhouse Financial (Risk Curators) | $2.75B | $47.6M | THIN (4.6%) | 2-2 |
| 3 | Gauntlet (Risk Curators) | $1.58B | $38.2M | THIN (4.6%) | 3-3 |
| 4 | Veda (Onchain Capital Allocator) | $1.56B | $38.0M | THIN (5.1%) | 4-4 |
| 5 | USDD (CDP) | $1.06B | $32.6M | THIN (6.6%) | 5-5 |
| 6 | Nonce Capital (Risk Curators) | $0.51B | $24.5M | FARM (57.2%) | 6-6 |
| 7 | Upshift (Onchain Capital Allocator) | $0.50B | $24.3M | THIN (5.1%) | 7-7 |
| 8 | Bittensor dTAO (Dexs) | $0.38B | $21.7M | FARM (78.6%) | 8-8 |
| 9 | Polymarket International (Prediction Market) | $0.32B | $20.4M | THIN (8.1%) | 9-9 |
| 10 | OnRe (RWA) | $0.31B | $20.1M | THIN (6.7%) | 10-10 |

The top five are all THIN: their forward launch chances (4.6-11.5%) are too low for EV at $500 to reach 3x cost, even though their implied values lead the board. The two FARM rows in the top 10 are young -- Nonce Capital (45 days, no token) and Bittensor dTAO (56 days) -- where the hazard is still ~1.2/yr. Sentora leads Steakhouse by $3.6M on TVL alone ($2.758B vs $2.754B): with the terms dropped, the order at the top is the TVL order, and the bootstrap ranges say so -- every top-10 range is exactly its rank. Farming the leaders means: deposit $150 into a Sentora Curator vault on Ethereum, or $370 into a Steakhouse Financial vault on Base, and keep the shares. But both are B2B risk curators: firms like them have historically rarely issued a retail token, and their forward chances (11.5% and 4.6%) say the same.

## 4. What would change our assessment

- A protocol announcing a token or points program would move it up -- the snapshot carries no announcements, so none are claimed here.
- A parentProtocol field would let the radar exclude wrapped or staked products of tokens that already trade. The snapshot has no such field, so the category and name rules are the only proxy, and a product whose parent is only visible that way can slip through.
- Funding, team, or token-plan data would sharpen every thesis. The snapshot has none of it.
- A fitted curve that lost to flat on cross-validation would send the build back to the flat 0.25 multiple -- the guardrail is in the code, and the dossier would say so. A challenger curve that won on all three tests would replace OLS.
- A term that earned its keep in the blind test would return to the value model. Growth, chain, and the category system did not.
- A refreshed snapshot would change the numbers. This board is frozen at 14 November 2026: the grader runs the entry against the sealed snapshot.

## 5. Limitations, stated plainly

- The snapshot is 10 fields per protocol. It says nothing about funding, team, token plans, governance, or points programs.
- The fitted curve is weak (R-squared 0.104): a better central tendency than flat, not a precise predictor. With the terms dropped the bootstrap ranges are narrow (122 of 198 rows do not move at all across 200 refits, median width 0), so the uncertainty now lives in the curve's LEVEL, not in the ordering.
- The blind test's target is market-cap prediction. The category factors measure launch FREQUENCY (Dexs 72% vs Risk Curators 39% of the >=1yr cohort have a token), a different target -- so the shrunk category rates stay in the forward launch probability even though the factor left the value model.
- Farm plans are templates derived from category, chain, TVL, and age -- the same six-step shape with the protocol's own figures filled in -- not hand-written strategies per protocol.
- Risk Curators dominate the board: 34 of 198 rows, including ranks 1, 2, and 3. The value model no longer discounts them, because the blind test dropped the category system; their low launch chance now shows only in the verdicts (all three are THIN). A reader who wants likelihood rather than size should use the dashboard's 'Most likely to launch a token' view.
- Age no longer earns a bonus, and the hazard says it should not: a protocol still tokenless at its age has already survived the hazard. The launch probabilities are forward planning rates, not forecasts -- the forward chance for a still-tokenless protocol is lower than the backward-looking base rate (survivor selection).
- The farm verdicts now discriminate: 106 FARM / 92 THIN / 0 SKIP. SKIP is empty because the lowest forward chance is 4.6% and EV at $2,000 stays positive down to a chance near 1%, so no row fails both THIN conditions; the rule is reported as specified, not re-tuned to fill SKIP.
- "Has a token" counts any token record (mcap, gecko_id, or symbol). A market-cap-only count would put the overall launch rate near 19% instead of 56.7% and would move every category factor; the choice is documented in section 1, not hidden.

## 6. How to use the farm plans

Pick a row, open its detail, and follow its six steps in order. Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline. Make one qualifying action a week, hold the position for at least the stated number of days so the activity is counted in more than one snapshot, and write every wallet, date, and transaction in a farm log.

Each row also carries a costed verdict: setup gas ($8 if capital is $150 or more, else $4) plus $2 of gas a week over the hold (60/45/30 days by age) plus the T-bill opportunity cost on the capital (4.5%/yr, November 2026, a stated assumption). Total cost runs $13-22. The capital is sized from the break-even, not fixed: the TVL-based capital is costed once, its break-even sizes the deposit (rounded to $10, clamped $50-$500), and costs are recomputed on that deposit. The verdict rule: FARM when EV at $500 is at least 3x the total cost and the forward chance is at least 10%; THIN when it only repays at the $2,000 scenario or the chance is 5-10%; SKIP otherwise. The break-even allocation is the total cost divided by the forward chance ($24-281); the expected values at $100/$500/$2,000 are labelled scenarios, not predictions. Five rows were computed by hand from the rule and match the builder's output exactly (see dashboard/validation.md, section 3).

Warnings, without exception: never pay to claim anything -- a real claim is claimed only from the link the protocol itself publishes. Implied value is an estimate, not a price, and a token launch is never guaranteed.

## 7. The 'Most likely to launch a token' view

The main board answers 'how big would a launch be'. The second view answers 'which is most likely to launch at all': the top 10 by implied value among non-vault categories (Risk Curators and Onchain Capital Allocator excluded), because a consumer protocol is the kind of business a retail token fits. Vault businesses are flagged 'Lower' there, not hidden. The view changes no ranking and claims no launch.

In this build the consumer view is led by USDD (CDP, board rank 5), then Bittensor dTAO (Dexs, 8), Polymarket International (Prediction Market, 9), OnRe (RWA, 10), CIAN Yield Layer (Yield Aggregator, 12), Defi Saver Asset Management (CDP Manager, 13), Symbiotic (Restaking, 14), OpenTrade (RWA, 15), Lightning Network (Payments, 18), and BitFi Basis (Basis Trading, 19). Flagged Lower: Sentora Curator, Steakhouse Financial, and Gauntlet -- the three vaults whose implied values lead the main board.

## 8. Validation, in short

The full check is in dashboard/validation.md, generated at build from the same snapshot. In short: the comps curve (92 clean comps, log(mcap) = 9.113 + 0.394 x log(TVL), R-squared 0.104) beat flat on 5-fold CV (2.005 vs 2.177), leave-one-out (1.967 vs 2.177), and the listed_at split (2.050 vs 2.426); Huber and per-category challengers lost. The blind test dropped growth, chain, and the category system; flat maturity survived. The launch rates come from a 485-protocol cohort aged at least a year (56.7% with a token), shrunk with k=20; Risk Curators, CEX, and Token Locker fell back to the old priors. The forward launch chance comes from the no-token clock (hazard 1.21/yr under 6 months, 0.17/yr at 6-13 months, 0.07/yr at 13-24 months, 0.09/yr after), scaled by the category rate. Ranks carry bootstrap ranges from 200 refits; 122 of 198 rows do not move at all. Coverage is 198 rows: 40 watchlist + 158 outside it, 20 of them above the old floor. Farm economics: costs $13-22, break-evens $24-281, verdicts 106 FARM / 92 THIN / 0 SKIP.
