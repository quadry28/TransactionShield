# Transaction Shield — MVP Plan

## The wedge (a hypothesis, not yet validated)

Not "help merchants fight chargebacks" — that's a crowded, generic category. The hypothesis worth testing is the **pre-departure capture window**: getting phone verification, explicit authorization, and fulfillment proof locked in *while the customer is still in the venue*, before they leave Nigeria and the merchant loses all leverage.

This is a bet, not a settled claim. We have not established that generic fraud/chargeback tools fail to address this, and "obviously better than a horizontal dashboard" is exactly the kind of claim that needs evidence, not assertion. The real test is narrower and more concrete than either of those claims:

- **Can staff actually complete the capture flow during a busy night** — under real time pressure, with a customer who wants to leave the table, not in a calm demo?
- **Do the people who actually fight disputes (the merchant's dispute/chargeback team, or the payment processor) find the resulting evidence package useful** — does it change outcomes, or is it just more paperwork?

If either answer is no, the wedge doesn't hold regardless of how sound the theory sounds. Everything below should be read as scoped to validate those two questions cheaply, not to build out a product on the assumption they're already true.

Tradeoff, if the hypothesis does hold: staying this narrow (Nigerian nightlife / VIP hospitality) caps total addressable market versus a horizontal "chargeback evidence for any merchant" play. That tradeoff is only worth accepting once the capture flow and evidence usefulness are actually validated, not before.

## Core loop (v1 — the only thing that matters)

1. **Flag at the table.** Staff marks a transaction as high-risk — international card and/or VIP/hospitality and/or high value. Manual quick-entry for v1, not a POS integration.
2. **Verify same-minute.** Customer gets a WhatsApp link immediately, at the table: verify phone (OTP) → confirm amount → confirm they recognize the merchant/service. Minutes, not hours, while they're still physically present and have a reason to cooperate.
3. **Confirm fulfillment same night.** Staff confirms check-in, table, and service completion via a WhatsApp reply — no app, no dashboard, just a text back.
4. **Surface the outcome.** Transaction is marked evidence-secured, or flagged as a same-night gap the merchant can still chase down before the customer leaves.

## Out of scope for v1 (deferred, not abandoned)

These are real and already modeled in the current prototype, but they're retention/depth features, not the wedge — they don't help until the core loop above is proven:

- Split-payment tracking (multiple payers per booking)
- Guest-vs-cardholder mismatch handling (booked by one person, attended by another)
- Full dispute/representment package generation
- The 0–100 rule-based risk score — collapse to a binary "capture now" trigger for v1
- Multi-provider POS integrations (Moniepoint/OPay/PalmPay/Flutterwave webhooks)
- The dashboard as a daily-use surface — merchant should live on WhatsApp, dashboard is an audit backstop at most

## Current risk scoring model (being simplified for v1)

The prototype's full model, for reference — this is what the v1 binary "capture now" trigger is simplifying. Every transaction gets a rule-based risk score (0–100), deliberately not a machine-learning fraud probability, so the reason for the flag is always visible:

| Factor | Points |
| --- | --- |
| International card | +28 |
| High-value transaction (≥ ₦1,000,000) | +21 |
| *or* above-average value (₦250,000–999,999) | +12 |
| First transaction with this customer | +15 |
| VIP / hospitality / nightlife purchase | +18 |
| *or* other service-based transaction | +8 |
| No card reference on file (paid by transfer) | +6 |

Score (capped at 100) maps to three tiers — **Low** (< 30), **Medium** (30–59), **High** (≥ 60) — which set the evidence requirement: Standard, Enhanced, or Additional. Low-risk transactions don't even require phone verification; Medium and High do. The hospitality weighting is the sharpest lever, reflecting that VIP table/bottle-service purchases carry an outsized friendly-fraud and chargeback rate industry-wide — the exact pattern this product exists to catch.

For v1, this collapses to a single binary trigger (international card and/or VIP/hospitality and/or high value → "capture now"), so the full weighted model isn't a build dependency for launch — but it's worth keeping intact as the basis for re-introducing graduated evidence requirements once there's real dispute-outcome data to tune the weights against.

## Success metric

These map directly to the two questions under "The wedge" — each is a proxy for one of them, not a vanity metric:

- **Can staff complete it on a busy night?** → same-night capture rate — % of flagged transactions that get verification + authorization completed before the customer leaves the venue. Measured against staff at a real, busy pilot venue, not a walkthrough.
- **Is the evidence actually useful?** → dispute win-rate on captured vs. uncaptured transactions, and — just as important — direct feedback from whoever reviews the evidence package (merchant's dispute contact or the payment processor) on whether it changed how they handled the case.

If same-night capture rate stays low under real conditions, or reviewers say the package doesn't help, that's the hypothesis failing — not a reason to add more features to the capture flow.

## Open questions

- Who flags a transaction as high-risk in v1 — a specific staff role (floor manager, cashier), and at what point in the transaction (at payment, at seating)?
- What's the fallback when a customer won't complete verification before leaving the table — does staff escalate, or does the transaction just get logged as an unresolved gap?
- Which single venue is the pilot, and what counts as a good-enough same-night capture rate to justify building the deferred features?
