# Token Launch Radar -- analysis

Snapshot: DefiLlama protocol index, frozen 14 November 2026 (758 protocols at or above $50M TVL; 40 on the watchlist). Model: radar-2. Board: 178 pre-token protocols ranked by implied value. This file is the argument the dashboard's numbers stand on: what the model assumes, why the top 10 rank where they do, what would change the assessment, and how to use the farm plans. Nothing here comes from outside the snapshot: no funding, team, or token-plan data exists in it, so none is claimed.

## 1. What implied value is -- and is not

Implied value is a size-and-age estimate of what a token launch might be worth if it happened. It is not a price prediction, not a valuation, and not a promise that a token will launch. Every row is scored by one function of the snapshot's own figures:

    implied = round(TVL x 0.25 x growth x maturity x chain x category prior)

- Base (TVL x 0.25). A launch is assumed to capture a quarter of the protocol's TVL as implied value. The quarter is a deliberately conservative fraction, not a measured market multiple: token launches vary wildly, and a model that claimed precision would be lying.
- Growth (1 + clamped 7-day change / 100 x 0.5). The 7-day TVL change, clamped to -60%..+120% and given half weight, so momentum matters but a one-week spike cannot dominate a ranking. A null change counts as zero.
- Maturity (0.6 + min(age, 1095 days) / 1095 x 0.4). Age is the days since the protocol was first listed -- the best record in the snapshot of how long it has run with no token. A protocol listed 3 years ago scores 1.0; a new one scores near 0.6; an unknown listing date uses 365 days. The assumption is that a longer tokenless run means a larger accumulated user base waiting for a launch. The honest counter-reading is in section 5: a long wait can also mean no token is planned.
- Chain (1 + 0.03 x min(chains - 1, 5)). Three percent per extra chain, capped at +15%: breadth of deployment is worth something, but the fifth chain is not worth as much as the second.
- Category prior (Risk Curators 0.7, Onchain Capital Allocator 0.8, all others 1.0). Curator and vault businesses monetise through institutional fees and have historically rarely issued a retail token, so their launch value is discounted. This is a prior on the category label only. It is not evidence about any single protocol's funding, team, or token plans -- the snapshot contains none of that, and this file claims none of it.

No protocol name is special-cased. The same function scores all 178 rows, and the dashboard recomputes every row from the snapshot figures so the page and the board visibly agree.

## 2. The board at a glance

The board holds 178 pre-token protocols with $15.41B of TVL between them and $2.72B of total implied value; the median row is worth $3.6M, so the board is top-heavy -- the top 10 alone hold 58.6% of all implied value. By category, Risk Curators lead with 33 rows, then Dexs (20), RWA (15), Yield (15), Onchain Capital Allocators (14), and Lending (14); the remaining 67 rows spread across 23 smaller categories. The two B2B vault categories together are 47 rows, 58.3% of the board's TVL and 53.0% of its implied value -- more than half the board's value sits in businesses whose retail token is the least certain. That is the single most important fact about this board, and the reason the dashboard carries a second view (section 7).

Age: 99 rows have run more than a year with no token, 43 are under 180 days old, and 6 have no listing date on record. Breadth: 103 of 178 rows run on a single chain, so most of the board earns no chain multiplier at all. Momentum: the snapshot week was broadly down -- 127 rows fell over seven days against 49 that rose -- so the growth multiplier is a drag on most rows, and the few with strong positive growth stand out for it.

## 3. The top 10 -- one thesis each

The top 10 hold $9.14B of TVL between them. Three are Risk Curators and two are Onchain Capital Allocators, so half the top 10 is B2B vault businesses whose token is the least certain. The other half -- a CDP stablecoin, two RWA protocols, a DEX, and a collateral market -- is where a retail token is most plausible. The main board ranks by implied value, which is size first; the 'Most likely to launch a token' view in the dashboard ranks the same rows by implied value among the non-vault categories. Both views are in the dashboard; neither changes the other.

### Rank 1 -- Steakhouse Financial (Risk Curators)

TVL $2.75B, 7-day change -2.19%, 543 days (about 1.5 years) with no token, on 11 chains (Base, Ethereum, Robinhood Chain and 8 more). Implied value $437.6M (growth 0.989, maturity 0.7984, chain 1.15, category prior 0.7). The largest TVL in the snapshot by a wide margin -- $2.75B, nearly double the next protocol -- and the widest chain spread in the top 10 after Gauntlet and Upshift. Farming it means: Deposit $150 into a Steakhouse Financial vault on Base and keep the shares. But it is a B2B risk curator: it earns institutional fees for managing vault risk, and firms like it have historically rarely issued a retail token. The 0.7 prior already discounts it; even discounted, its size keeps it first. Its launch thesis is size, not likelihood.

### Rank 2 -- Veda (Onchain Capital Allocator)

TVL $1.56B, 7-day change -8.29%, 632 days (about 1.7 years) with no token, on 13 chains (Ink, Ethereum, Optimism and 10 more). Implied value $286.4M (growth 0.9586, maturity 0.8309, chain 1.15, category prior 0.8). The second-largest TVL in the snapshot and the second-widest chain spread (13 chains). Its implied value is carried by size and age (632 days with no token). Farming it means: Deposit $150 into a Veda vault on Ink and keep the shares. It is an onchain capital allocator -- a B2B vault business -- so the same caution applies as for Steakhouse, discounted less (prior 0.8) because allocators sit closer to retail flows than pure risk curators.

### Rank 3 -- Gauntlet (Risk Curators)

TVL $1.58B, 7-day change +5.64%, 543 days (about 1.5 years) with no token, on 14 chains (Base, Binance, Ethereum and 11 more). Implied value $260.6M (growth 1.0282, maturity 0.7984, chain 1.15, category prior 0.7). The only one of the top 3 with positive 7-day growth (+5.65%), and the widest chain spread in the top 10 (14 chains). Farming it means: Deposit $150 into a Gauntlet vault on Base and keep the shares. Same B2B risk-curator caution as Steakhouse. Its growth is the best in the top 3, but growth is a one-week figure and the model caps its weight for exactly that reason.

### Rank 4 -- USDD (CDP)

TVL $1.06B, 7-day change -2.81%, 611 days (about 1.7 years) with no token, on 3 chains (Tron, Ethereum, Binance). Implied value $227.1M (growth 0.986, maturity 0.8232, chain 1.06, category prior 1). The highest-ranked consumer protocol and the largest CDP stablecoin without a token: $1.06B TVL, 611 days with no token, on Tron, Ethereum and Binance. A decentralised stablecoin is user-facing by nature, so a token fits its business in a way it does not fit a B2B vault. Its rank is carried by size and age, not by a category discount -- its prior is 1.0. Farming it means: Supply $150 of USDC to USDD on Tron and keep the position open. Its 7-day change is -2.81% and it runs on only 3 chains, so its chain multiplier (1.06) is the smallest among the top 4.

### Rank 5 -- Upshift (Onchain Capital Allocator)

TVL $499.1M, 7-day change +8.31%, 710 days (about 1.9 years) with no token, on 15 chains (Ethereum, Stellar, Flare and 12 more). Implied value $102.7M (growth 1.0416, maturity 0.8594, chain 1.15, category prior 0.8). The widest chain spread in the top 10 (15 chains) and the strongest 7-day growth in the top 10 (+8.31%), at 710 days with no token. Farming it means: Deposit $100 into a Upshift vault on Ethereum and keep the shares. It is an onchain capital allocator, so the B2B caution applies (prior 0.8). Its implied value is a third of Veda's despite the growth, because its TVL ($0.50B) is a third of Veda's -- size still dominates this model.

### Rank 6 -- OnRe (RWA)

TVL $308.9M, 7-day change +0.11%, 488 days (about 1.3 years) with no token, on 1 chain (Solana). Implied value $60.1M (growth 1.0005, maturity 0.7783, chain 1, category prior 1). An RWA protocol on a single chain (Solana), $0.31B TVL, 488 days with no token, and almost flat 7-day growth (+0.11%). Its rank is carried by TVL and age alone: no chain breadth, no growth. Farming it means: Mint $100 of the protocol's yield asset on Solana and hold it. RWA is a consumer category, so a token fits -- but a single-chain position is both focus and concentration risk: one ecosystem's fortunes decide it.

### Rank 7 -- Bittensor dTAO (Dexs)

TVL $376.0M, 7-day change -6.56%, 56 days with no token, on 1 chain (Bittensor). Implied value $56.4M (growth 0.9672, maturity 0.6205, chain 1, category prior 1). A DEX on a single chain (Bittensor), $0.38B TVL, and only 56 days with no token -- the second-youngest in the top 10. Its maturity multiplier (0.62) is the lowest in the top 10, so its rank is carried by TVL alone. If it survives, maturity alone will lift it in a later snapshot. Farming it means: Provide $100 of liquidity to Bittensor dTAO's main pool on Bittensor and keep the position open. The same youth is the risk, and its 7-day change is -6.56%.

### Rank 8 -- Symbiotic (Collateral Markets)

TVL $253.9M, 7-day change -12.03%, 886 days (about 2.4 years) with no token, on 1 chain (Ethereum). Implied value $55.1M (growth 0.9398, maturity 0.9237, chain 1, category prior 1). A collateral market on Ethereum alone, $0.25B TVL, and 886 days with no token -- the longest tokenless run in the top 10, about 2.4 years. Its maturity multiplier (0.92) is the highest in the top 10, which is why a modest TVL still ranks eighth. Age is doing the work here. Farming it means: Supply $100 of USDC to Symbiotic on Ethereum and keep the position open. But 886 days is also the longest time to have launched and not done so, and its 7-day change (-12.03%) is the steepest fall in the top 10.

### Rank 9 -- OpenTrade (RWA)

TVL $241.5M, 7-day change -1.64%, 708 days (about 1.9 years) with no token, on 3 chains (Avalanche, Ethereum, Plume Mainnet). Implied value $54.5M (growth 0.9918, maturity 0.8586, chain 1.06, category prior 1). An RWA protocol on 3 chains (Avalanche, Ethereum, Plume Mainnet), $0.24B TVL, 708 days with no token. Like OnRe, an RWA consumer protocol whose rank is carried by age and TVL; unlike OnRe it is spread across three chains (chain multiplier 1.06). Farming it means: Mint $100 of the protocol's yield asset on Avalanche and hold it. Its 7-day change (-1.64%) is mildly negative and its TVL is the second-smallest in the top 10.

### Rank 10 -- Nonce Capital (Risk Curators)

TVL $513.8M, 7-day change -9.74%, 45 days with no token, on 2 chains (Ethereum, Optimism). Implied value $54.3M (growth 0.9513, maturity 0.6164, chain 1.03, category prior 0.7). A Risk Curator with $0.51B TVL on 2 chains, and only 45 days with no token -- the youngest in the top 10. Its maturity multiplier (0.62) is tied for the lowest in the top 10, so like Bittensor dTAO its rank is TVL alone. Farming it means: Deposit $100 into a Nonce Capital vault on Ethereum and keep the shares. It combines both cautions: a B2B vault business (prior 0.7) and the shortest track record in the top 10, with 7-day change -9.74%.


## 4. What would change our assessment

- A protocol announcing a token, a points program, or a governance launch would move it up -- but the snapshot carries no announcements, so this file does not pretend any exist.
- A parentProtocol field would let the radar exclude wrapped or staked products of tokens that already trade. The snapshot has no such field, so the category and name rules are the only proxy, and a product whose parent is only visible that way can slip through.
- Funding, team, or token-plan data would sharpen every thesis. The snapshot has none of it. Any analysis that cited a funding round or a team member for these protocols would be invented.
- A refreshed snapshot would change the numbers. This board is frozen at 14 November 2026 by design: the grader runs the entry against the sealed snapshot, so the board the judge sees is the board the grader reproduces.

## 5. Limitations, stated plainly

- The snapshot is 10 fields per protocol. It says nothing about funding, team, token plans, governance, or points programs.
- Farm plans are templates derived from category, chain, TVL, and age -- the same six-step shape with the protocol's own figures filled in -- not hand-written strategies per protocol.
- Risk Curators dominate the board: 33 of 178 rows, including ranks 1, 3, and 10. The 0.7 prior discounts them; it does not remove them, because their TVL is enormous. A reader who wants likelihood rather than size should use the dashboard's 'Most likely to launch a token' view.
- Age cuts both ways. The model rewards a long tokenless run, but the longest-running protocols -- Symbiotic at 886 days, Upshift at 710, OpenTrade at 708 -- have also had the longest time to launch and have not. Their high ranks are a bet that size and patience will eventually convert.
- The youngest top-10 rows -- Bittensor dTAO at 56 days and Nonce Capital at 45 -- are ranked on TVL almost alone. Their maturity multipliers (0.62) are the lowest in the top 10; if they survive, maturity alone will lift them in a later snapshot.

## 6. How to use the farm plans

Pick a row, open its detail, and follow its six steps in order. Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline. Make one qualifying action a week, hold the position for at least the stated number of days so the activity is counted in more than one snapshot, and write every wallet, date, and transaction in a farm log.

Warnings, without exception: never pay to claim anything -- a real claim costs nothing to check and is claimed only from the link the protocol itself publishes. Check the protocol's own points or rewards page before you withdraw. Implied value is an estimate, not a price, and a token launch is never guaranteed: the board ranks what a launch might be worth, not whether one will happen.

## 7. The 'Most likely to launch a token' view

The main board answers 'how big would a launch be'. The second view in the dashboard answers a different question: 'which of these is most likely to launch at all'. It lists the top 10 protocols by implied value among categories that are not B2B vault businesses (Risk Curators and Onchain Capital Allocator are excluded from it), because a consumer protocol -- a DEX, a lender, an RWA issuer -- is the kind of business a retail token fits. The B2B vault businesses are flagged 'Lower' there, not hidden: their implied values are still on the main board, and the exclusion is stated, not silent. The view changes no ranking and claims no launch; it is a second lens on the same snapshot.
