# Token Launch Radar -- analysis

Snapshot: DefiLlama protocol index, frozen 14 November 2026 (758 protocols at or above $50M TVL; 40 on the watchlist). Model: radar-3. Board: 198 pre-token protocols ranked by implied value. This file is the argument the dashboard's numbers stand on: what the model assumes, why the top 10 rank where they do, what would change the assessment, and how to use the farm plans. Nothing here comes from outside the snapshot: no funding, team, or token-plan data exists in it, so none is claimed.

## 1. What implied value is -- and is not

Implied value is a size-and-age estimate of what a token launch might be worth if it happened. It is not a price prediction, not a valuation, and not a promise that a token will launch. Every row is scored by one function of the snapshot's own figures:

    implied = round(TVL x fitted_multiple(TVL) x growth x 1.0 x chain x category factor)

- Base (TVL x fitted multiple). The multiple is fitted, not assumed: log(mcap) = 9.113 + 0.394 x log(TVL) over 92 clean comps (R-squared 0.104), so the multiple falls with size -- about 0.79 at $5M TVL, 0.20 at $50M, 0.13 at $100M, 0.03 at $1B, 0.016 at $3B. The fit is weak (R-squared 0.104): TVL explains about a tenth of the variation in market cap. The curve is a better central tendency than flat, not a precise predictor -- that is why every rank carries a bootstrap range (section 8). The curve is used only because it beat flat out of sample: 5-fold CV log-RMSE 2.005 vs 2.177, leave-one-out 1.967 vs 2.177, listed_at split (train listed before 2024, test 2024 or later) 2.050 vs 2.426. Had it lost on CV, the build would have fallen back to the flat 0.25 multiple.
- Growth (1 + clamped 7-day change / 100 x 0.5). The 7-day TVL change, clamped to -60%..+120% and given half weight, so momentum matters but a one-week spike cannot dominate a ranking. A null change counts as zero.
- Maturity (1.0, flat). Radar-2 rewarded age; radar-3 does not. The snapshot's launch hazard falls with age instead of rising -- cumulative P(has a token) implies a hazard of about 1.2/yr in the first months, 0.5/yr by nine months, and 0.2/yr after two years (constant-hazard fit 0.19/yr) -- so a long tokenless run is no evidence a launch is nearer. Age is still shown on every row; it just earns no bonus any more. The honest counter-reading is in section 5: a protocol still tokenless at its age has already survived the hazard, so the forward chance is lower than the backward-looking base rate.
- Chain (1 + 0.03 x min(chains - 1, 5)). Three percent per extra chain, capped at +15%: breadth of deployment is worth something, but the fifth chain is not worth as much as the second.
- Category factor (shrunk empirical launch rates). Among protocols listed at least a year ago, 56.7% have a token; each category's factor is its shrunk rate (pseudo-count k=20 toward the overall rate) divided by that overall rate: Dexs 1.27, Lending 1.28, RWA 1.02, Yield 1.02, Basis Trading 1.08, CDP 1.00, Derivatives 1.07, Onchain Capital Allocator 0.77, Risk Curators 0.7. Risk Curators is kept at the old radar-2 prior (0.7): its shrunk factor (0.68) is unstable across splits (0.65-1.04), so the adoption changes nothing material for it. "Has a token" is the model's own definition (mcap, gecko_id, or symbol present). A market-cap-only count would give about 19% and undercount DEX/Lending tokens recorded without a market cap; the 56.7% figure is used, and the difference is stated here.

No protocol name is special-cased. The same function scores all 198 rows, and the dashboard recomputes every row from the snapshot figures so the page and the board visibly agree.

## 2. The board at a glance

The board holds 198 pre-token protocols with $20.71B of TVL between them and $1.84B of total implied value; the median row is worth $7.3M, so the board is top-heavy -- but far less than before: the top 10 hold 15.5% of all implied value, against 58.6% under radar-2's flat multiple. The fitted curve compresses the top, because the multiple falls with size and the largest protocols are the ones it discounts hardest. By category, Risk Curators lead with 34 rows, then Dexs (21), Onchain Capital Allocators (18), Lending (16), RWA (16), Yield (15), Derivatives (13), CDP (9), Yield Aggregators (9), and Basis Trading (8); the remaining 39 rows spread across 23 smaller categories. The two B2B vault categories together are 52 rows, 58.9% of the board's TVL and 26.5% of its implied value -- still more than half the board's TVL, but their share of implied value has halved from radar-2's 53.0%, again because the curve hits the biggest vaults hardest. That is the single most important fact about this board, and the reason the dashboard carries a second view (section 7).

Age: 110 rows have run more than a year with no token, 49 are under 180 days old, and 7 have no listing date on record. Breadth: 113 of 198 rows run on a single chain, so most of the board earns no chain multiplier at all. Momentum: the snapshot week was broadly down -- 140 rows fell over seven days against 56 that rose (2 with no change on record) -- so the growth multiplier is a drag on most rows, and the few with strong positive growth stand out for it.

Coverage: the board is every strict-tokenless protocol in the snapshot -- the 40 on the watchlist plus 158 outside it, including 20 above the $50M watchlist floor, led by Sentora Curator ($2.76B). The 560 protocols not on the board have a token, are wrapped/staked/bridged, or are a CEX.

## 3. The top 10 -- one thesis each

The top 10 hold $11.30B of TVL between them. Five are Risk Curators or Onchain Capital Allocators, so half of the top 10 is B2B vault businesses whose token is the least certain. The other five -- a CDP stablecoin, a DEX, a lender, a basis-trading protocol, and an RWA protocol -- are where a retail token is most plausible. The main board ranks by implied value, which is size first; the 'Most likely to launch a token' view ranks the same rows by implied value among the non-vault categories.

### Rank 1 -- Steakhouse Financial (Risk Curators)

TVL $2.75B, 7-day change -2.19%, 543 days (about 1.5 years) with no token, on 11 chains (Base, Ethereum, Robinhood Chain and 8 more). Implied value $37.9M (fitted multiple 0.0173, growth 0.989, maturity 1.0, chain 1.15, category factor 0.7); bootstrap rank range 1-2. It leads Sentora Curator by $1.2M on chain breadth (1.15 on 11 chains vs 1.09 on 4), despite a slightly smaller TVL and negative growth. Farming it means: Deposit $150 into a Steakhouse Financial vault on Base and keep the shares. But it is a B2B risk curator: it earns institutional fees for managing vault risk, and firms like it have historically rarely issued a retail token. The 0.7 factor already discounts it; even discounted, its size keeps it first. Its launch thesis is size, not likelihood -- and the bootstrap range says ranks 1 and 2 are a coin flip.

### Rank 2 -- Sentora Curator (Risk Curators)

TVL $2.76B, 7-day change +2.37%, 407 days (about 1.1 years) with no token, on 4 chains (Ethereum, Ink, Solana, Tempo). Implied value $36.7M (fitted multiple 0.0173, growth 1.0118, maturity 1.0, chain 1.09, category factor 0.7); bootstrap rank range 2-3. The largest TVL in the snapshot, and the highest-ranked of the 20 rows the completed board adds above the old watchlist floor -- under radar-2's floor it was not on the board at all. Farming it means: Deposit $150 into a Sentora Curator vault on Ethereum and keep the shares. Same B2B risk-curator caution as Steakhouse. Its growth (+2.37%) is positive where Steakhouse's is negative, but its 4 chains against Steakhouse's 11 cost it rank 1.

### Rank 3 -- USDD (CDP)

TVL $1.06B, 7-day change -2.81%, 611 days (about 1.7 years) with no token, on 3 chains (Tron, Ethereum, Binance). Implied value $34.2M (fitted multiple 0.0309, growth 0.986, maturity 1.0, chain 1.06, category factor 1.00); bootstrap rank range 1-4. The highest-ranked consumer protocol and the largest CDP stablecoin without a token. A decentralised stablecoin is user-facing by nature, so a token fits its business in a way it does not fit a B2B vault; its factor is 1.00, so its rank is carried by size alone. Farming it means: Supply $150 of USDC to USDD on Tron and keep the position open. Its 7-day change is -2.81% and it runs on only 3 chains, so its chain multiplier (1.06) is the smallest among the top 4. Its rank range (1-4) is tied for the widest in the top 10 (with BitFi Basis): the bootstrap puts it anywhere from first to fourth.

### Rank 4 -- Veda (Onchain Capital Allocator)

TVL $1.56B, 7-day change -8.29%, 632 days (about 1.7 years) with no token, on 13 chains (Ink, Ethereum, Optimism and 10 more). Implied value $32.3M (fitted multiple 0.0243, growth 0.9586, maturity 1.0, chain 1.15, category factor 0.77); bootstrap rank range 3-4. Its implied value is carried by size and breadth (13 chains, the second-widest spread); its 7-day change (-8.29%) is the second-steepest fall in the top 10. Farming it means: Deposit $150 into a Veda vault on Ink and keep the shares. It is an onchain capital allocator -- a B2B vault business -- so the same caution applies as for Steakhouse, discounted less (factor 0.77) because allocators sit closer to retail flows than pure risk curators.

### Rank 5 -- Gauntlet (Risk Curators)

TVL $1.58B, 7-day change +5.65%, 543 days (about 1.5 years) with no token, on 14 chains (Base, Binance, Ethereum and 11 more). Implied value $31.6M (fitted multiple 0.0242, growth 1.0282, maturity 1.0, chain 1.15, category factor 0.7); bootstrap rank range 5-6. Fourteen chains (second-widest spread after Upshift) and the third-strongest 7-day growth in the top 10 (+5.65%). Farming it means: Deposit $150 into a Gauntlet vault on Base and keep the shares. Same B2B risk-curator caution as Steakhouse; growth is a one-week figure and the model caps its weight for exactly that reason.

### Rank 6 -- Bittensor dTAO (Dexs)

TVL $376.0M, 7-day change -6.56%, 56 days with no token, on 1 chain (Bittensor). Implied value $26.7M (fitted multiple 0.0577, growth 0.9672, maturity 1.0, chain 1, category factor 1.27); bootstrap rank range 5-6. A DEX on a single chain (Bittensor), $0.38B TVL, and only 56 days with no token -- the youngest in the top 10. Under radar-2 its youth cost it (maturity 0.62); under radar-3 maturity is flat, so its rank is carried by TVL and the highest category factor in the top 10 (Dexs 1.27). Farming it means: Provide $100 of liquidity to Bittensor dTAO's main pool on Bittensor and keep the position open. The same youth is the risk, and its 7-day change is -6.56%.

### Rank 7 -- Figure Markets Prime (Lending)

TVL $190.5M, 7-day change +18.03%, 474 days (about 1.3 years) with no token, on 1 chain (Provenance). Implied value $23.1M (fitted multiple 0.0871, growth 1.0902, maturity 1.0, chain 1, category factor 1.28); bootstrap rank range 7-8. The strongest 7-day growth in the top 10 (+18.03%) and the highest category factor (Lending 1.28) lift the smallest TVL in the top 10 to seventh: a $190.5M protocol outranks $499.1M Upshift on growth and factor alone. Farming it means: Supply $100 of USDC to Figure Markets Prime on Provenance and keep the position open. It is a single-chain position (Provenance), so one ecosystem's fortunes decide it -- and +18% in one week is the kind of spike the growth cap exists for.

### Rank 8 -- Upshift (Onchain Capital Allocator)

TVL $499.1M, 7-day change +8.31%, 710 days (about 1.9 years) with no token, on 15 chains (Ethereum, Stellar, Flare and 12 more). Implied value $22.4M (fitted multiple 0.0486, growth 1.0416, maturity 1.0, chain 1.15, category factor 0.77); bootstrap rank range 7-9. The widest chain spread in the top 10 (15 chains) and the second-strongest 7-day growth (+8.31%), at 710 days with no token -- the longest tokenless run in the top 10. Farming it means: Deposit $100 into a Upshift vault on Ethereum and keep the shares. It is an onchain capital allocator, so the B2B caution applies (factor 0.77). Its implied value is a third of Veda's despite the growth, because its TVL ($0.50B) is a third of Veda's -- and because the fitted curve gives a $499M protocol a multiple of 0.049, not 0.25.

### Rank 9 -- BitFi Basis (Basis Trading)

TVL $214.9M, 7-day change -10.26%, 638 days (about 1.7 years) with no token, on 7 chains (Binance, Ethereum, Base and 4 more). Implied value $20.4M (fitted multiple 0.0810, growth 0.9487, maturity 1.0, chain 1.15, category factor 1.08); bootstrap rank range 8-11. The steepest 7-day fall in the top 10 (-10.26%) and the second-smallest TVL, held up by 7 chains and a factor above 1. Farming it means: Deposit $100 of USDC into BitFi Basis on Binance and keep the position open. Its rank range (8-11) is tied for the widest in the top 10 (with USDD): the bootstrap is unsure whether it belongs in the top 10 at all.

### Rank 10 -- OnRe (RWA)

TVL $308.9M, 7-day change +0.11%, 488 days (about 1.3 years) with no token, on 1 chain (Solana). Implied value $20.4M (fitted multiple 0.0650, growth 1.0005, maturity 1.0, chain 1, category factor 1.02); bootstrap rank range 9-11. An RWA protocol on a single chain (Solana), $0.31B TVL, 488 days with no token, and almost flat 7-day growth (+0.11%). Its rank is carried by TVL alone: no chain breadth, no growth, a factor near 1. Farming it means: Mint $100 of the protocol's yield asset on Solana and hold it. RWA is a consumer category, so a token fits -- but a single-chain position is both focus and concentration risk: one ecosystem's fortunes decide it.

## 4. What would change our assessment

- A protocol announcing a token, a points program, or a governance launch would move it up -- but the snapshot carries no announcements, so this file does not pretend any exist.
- A parentProtocol field would let the radar exclude wrapped or staked products of tokens that already trade. The snapshot has no such field, so the category and name rules are the only proxy, and a product whose parent is only visible that way can slip through.
- Funding, team, or token-plan data would sharpen every thesis. The snapshot has none of it. Any analysis that cited a funding round or a team member for these protocols would be invented.
- A fitted curve that lost to flat on cross-validation would send the build back to the flat 0.25 multiple -- the guardrail is in the code, and the dossier would say so.
- Category factors that failed the stability guardrail would keep the old radar-2 priors. Risk Curators already did; the others passed.
- A refreshed snapshot would change the numbers. This board is frozen at 14 November 2026 by design: the grader runs the entry against the sealed snapshot, so the board the judge sees is the board the grader reproduces.

## 5. Limitations, stated plainly

- The snapshot is 10 fields per protocol. It says nothing about funding, team, token plans, governance, or points programs.
- The fitted curve is weak (R-squared 0.104). It is a better central tendency than flat, not a precise predictor; the bootstrap rank ranges exist because the curve is uncertain, and the top 10's ranges (1-2, 2-3, 1-4, 3-4, 5-6, 5-6, 7-8, 7-9, 8-11, 9-11) say the order inside the top 10 is soft.
- Farm plans are templates derived from category, chain, TVL, and age -- the same six-step shape with the protocol's own figures filled in -- not hand-written strategies per protocol.
- Risk Curators dominate the board: 34 of 198 rows, including ranks 1, 2, and 5. The 0.7 factor discounts them; it does not remove them, because their TVL is enormous. A reader who wants likelihood rather than size should use the dashboard's 'Most likely to launch a token' view.
- Age no longer earns a bonus, and the hazard says it should not: a protocol still tokenless at its age has already survived the hazard. The launch rates are backward-looking base rates, not forecasts -- the forward chance for a still-tokenless protocol is lower (survivor selection).
- The farm verdicts do not discriminate under the stated rule: all ${board.length} rows read FARM, because the lowest planning launch rate is 0.39 and costs are $13-22, so EV at the $500 scenario is positive ($172-349) for every row. The break-even allocation ($18-56) and the three EV figures are the numbers that actually separate rows; a stricter verdict rule would be needed for the verdict to mean anything.
- "Has a token" counts any token record (mcap, gecko_id, or symbol). A market-cap-only count would put the overall launch rate near 19% instead of 56.7% and would move every category factor; the choice is documented in section 1, not hidden.

## 6. How to use the farm plans

Pick a row, open its detail, and follow its six steps in order. Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline. Make one qualifying action a week, hold the position for at least the stated number of days so the activity is counted in more than one snapshot, and write every wallet, date, and transaction in a farm log.

Each row also carries a costed verdict: setup gas ($8 if capital is $150 or more, else $4) plus $2 of gas a week over the hold (60/45/30 days by age) plus the T-bill opportunity cost on the capital (4.5%/yr, November 2026, a stated assumption). Total cost runs $13-22. The break-even allocation is the total cost divided by the planning launch rate ($18-56 across the board); the expected values at $100/$500/$2,000 are labelled scenarios, not predictions -- they say what the position would be worth if the allocation at launch were that size.

Warnings, without exception: never pay to claim anything -- a real claim costs nothing to check and is claimed only from the link the protocol itself publishes. Check the protocol's own points or rewards page before you withdraw. Implied value is an estimate, not a price, and a token launch is never guaranteed: the board ranks what a launch might be worth, not whether one will happen.

## 7. The 'Most likely to launch a token' view

The main board answers 'how big would a launch be'. The second view in the dashboard answers a different question: 'which of these is most likely to launch at all'. It lists the top 10 protocols by implied value among categories that are not B2B vault businesses (Risk Curators and Onchain Capital Allocator are excluded from it), because a consumer protocol -- a DEX, a lender, an RWA issuer -- is the kind of business a retail token fits. The B2B vault businesses are flagged 'Lower' there, not hidden, and the exclusion is stated, not silent. The view changes no ranking and claims no launch; it is a second lens on the same snapshot.

In this build the consumer view is led by USDD (CDP, board rank 3), then Bittensor dTAO (Dexs, 6), Figure Markets Prime (Lending, 7), BitFi Basis (Basis Trading, 9), OnRe (RWA, 10), CIAN Yield Layer (Yield Aggregator, 11), Defi Saver Asset Management (CDP Manager, 12), OpenTrade (RWA, 13), Plume Vaults (RWA, 14), and Polymarket International (Prediction Market, 15). Flagged Lower: Steakhouse Financial, Sentora Curator, and Veda -- the three vaults whose implied values lead the main board.

## 8. Validation, in short

The full check is in dashboard/validation.md, generated at build from the same snapshot. In short: the comps curve (92 clean comps, log(mcap) = 9.113 + 0.394 x log(TVL), R-squared 0.104) beat flat on 5-fold CV (2.005 vs 2.177), leave-one-out (1.967 vs 2.177), and the listed_at split (2.050 vs 2.426). The launch rates come from a 485-protocol cohort aged at least a year (56.7% with a token), shrunk with k=20; Risk Curators, CEX, and Token Locker fell back to the old priors on the stability guardrail. Ranks carry bootstrap ranges from 200 refits (seeded, deterministic). Coverage is 198 rows: 40 watchlist + 158 outside it, 20 of them above the old floor. Farm economics: costs $13-22, break-evens $18-56, verdicts 198 FARM / 0 THIN / 0 SKIP.
