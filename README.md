# Transaction Shield

## Problem

Nigeria's nightlife and hospitality industry — VIP tables, bottle service, private events — has a chargeback gap: customers, often international visitors, run up high-value charges at a venue and then, after leaving Nigeria, dispute the transaction with their card issuer, claiming it was unauthorized or the service was never received.

By the time the dispute lands, the customer is gone and the merchant usually has no organized proof on hand — no record that the customer verified their phone, explicitly authorized the exact amount, or actually checked in and received the service. Fighting the chargeback becomes a scramble to reconstruct what happened from scattered receipts, POS logs, and WhatsApp threads, and merchants frequently lose disputes they should be able to win.

## What Transaction Shield does

Transaction Shield is an evidence layer that sits alongside a merchant's existing payment providers (Moniepoint, OPay, PalmPay, Flutterwave) and automatically compiles the proof needed to defend a transaction — phone verification, explicit customer authorization, itemized receipts, and fulfillment/check-in confirmation — before a dispute ever happens. It does not move money or replace the payment provider; it connects the evidence each one already generates into one record, and organizes it into a representment-ready package if a chargeback is filed.

The prototype models this end-to-end for the highest-risk case: a high-value, international-card, VIP/hospitality transaction, including two edge cases specific to nightlife bookings that generic dispute tooling doesn't handle:

### Guest vs. cardholder mismatch

A table or event is often booked and paid for by one person but attended by someone else — a company books and pays for a delegate, a host pays for a guest of honor. If the cardholder wasn't physically present, "Transaction Not Recognized" is an easy claim to make, and proof that *the cardholder* authorized the charge doesn't by itself prove they authorized *this specific guest's attendance*. The prototype tracks the lead guest separately from the cardholder whenever they differ, records how the booking was arranged (e.g. "booked centrally by Robert for his firm's conference delegation"), and surfaces this as an explicit evidence gap rather than silently treating cardholder authorization as sufficient.

### Split payments

A booking is sometimes paid by more than one person — a group splitting a table, family members each covering part of a deposit. Each payer's charge, payment reference, and authorization are tracked independently rather than as one lump transaction. This matters because a chargeback comes from one payer's card issuer at a time: a complaint from any single payer can only be defended with *that person's* payment and authorization proof, not the group's evidence as a whole. The prototype shows per-payer authorization status and lets the merchant chase down verification from whichever payer hasn't confirmed yet.

### Risk scoring model

Every transaction gets a rule-based risk score (0–100) that decides how much evidence Transaction Shield asks for — it's deliberately not a machine-learning fraud probability, so a merchant can always see exactly which factors drove the score. Points stack from a fixed set of factors:

| Factor | Points |
| --- | --- |
| International card | +28 |
| High-value transaction (≥ ₦1,000,000) | +21 |
| *or* above-average value (₦250,000–999,999) | +12 |
| First transaction with this customer | +15 |
| VIP / hospitality / nightlife purchase | +18 |
| *or* other service-based transaction | +8 |
| No card reference on file (paid by transfer) | +6 |

The score (capped at 100) maps to three tiers — **Low** (< 30), **Medium** (30–59), **High** (≥ 60) — which in turn set the evidence requirement shown elsewhere in the app: Standard, Enhanced, or Additional. A Low-risk transaction doesn't even require phone verification; Medium and High do. The hospitality weighting is the sharpest lever in the model, reflecting that VIP table/bottle-service purchases carry an outsized friendly-fraud and chargeback rate industry-wide — which is exactly the pattern this prototype exists to catch.

## This repo

- `transaction-shield.html` — single-file prototype (HTML/CSS/JS, no build step, hash-based routing).
- `CHANGELOG.md` — build history and design decisions, including how the prototype was matched against a reference demo.
