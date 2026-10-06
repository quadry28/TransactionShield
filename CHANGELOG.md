# Transaction Shield — Changelog

## 2026-09-20 — Scoped fictional hospitality prototype

Replaced the active broad demo with the workflow in `docs/product-spec.md`. Preserved the pre-edit HTML and changelog (including uncommitted work) in `../transaction-shield-pre-spec-backup/`. Earlier entries below describe historical builds, not current capabilities or validated claims.

- One fictional TS-10482 hospitality reference case, no real contact or identity data, no provider connections or messaging, and no adoption/outcome dashboard.
- Provisional, explicitly unvalidated five-item checklist with present/missing/not-yet-due assessment. Undefined policy details and implementation assumptions documented in `docs/prototype-decisions.md` before final delivery.
- Manual reference, entry and upload, each preserving source origin, custodian, method, capture actor/time and content. Uploaded bytes included in package exports.
- Separate Customer Context attribution/relevance/minimization review, with no automatic authenticity claim.
- Local manual follow-ups, reassessment, full evidence preview, draft JSON export and explicit merchant finalization. All mutations invalidate final review; Customer Context replacement also invalidates its source review.
- Session-only storage and explicit limitations. Updated README and annotated the historical plan.
- Validation: JavaScript syntax checks and 11 passing Node model/render tests, covering provenance, gaps, deadline transitions, review gates, approval invalidation, uploads, escaping and routes. Browser verification unavailable: the browser tool reported no available browser.

## 2026-09-14 — Added TS-10481 (OPay example, matching the live demo)

Added the third example transaction the live demo shows that we were missing: **TS-10481** — Ifeoma Adebanjo, OPay, ₦850,000, "Private Dining Experience." Built at the same depth as our other non-flagship seed transactions (not a dedicated dashboard walkthrough), consistent with the original spec's instruction not to expand OPay into a full guided demo.

Evidence state mirrors TS-10482's pattern (receipt and fulfillment captured automatically/by staff, customer authorization still pending) since that reliably produces the demo's target status. Verified via the Node harness: 43% / Partial / Customer Action Pending, matching the live demo exactly. Full route smoke test (including the new transaction's own detail/evidence/activity tabs) passes.

## 2026-09-14 — Matched TS-10480's merchant sub-brand name to the live demo

`SEED_TXNS['TS-10480'].merchant`: `"Adesola Couture"` → `"Aderonke Atelier"`, matching the live reference demo. This field is read dynamically (`t.merchant||MERCHANT.name`) in all 8 places it appears (verify shell, auth quotes, WhatsApp/SMS previews, evidence package doc), so the single seed-data change propagates everywhere without further edits. Verified via the Node harness.

## 2026-09-14 — Added the "Package" lifecycle stage

Added the 5th lifecycle stage the live demo has and we were missing: **Package**. `lifecycleFor(t)` now checks, for disputed transactions, whether a `package` activity event has already been logged (i.e. the merchant has generated an evidence package for that dispute via the existing "Generate Evidence Package" flow) — if so, lifecycle is `Package` instead of `Disputed`. `lifecyclePill` styles it with `pill-gold` and the existing `doc` icon (same icon already used on the "Generate Evidence Package" button).

Verified via the Node harness: of the three disputed seed transactions, TXN-3388 (the one with a `package` activity already seeded, `dispute.status:"submitted"`) now correctly shows `Package`; TXN-3382 and TXN-3385 (open disputes, no package generated yet) still show `Disputed`. Full route smoke test still passes.

## 2026-09-14 — Reconciled TS-10482 with the live reference demo

Re-fetched `transaction-shield-demo.quadry28.chatgpt.site` and compared against our build. Found a direct conflict: the incremental-update spec said TS-10482 should show "Evidence Complete / No Action Required," but the live demo actually shows it as **Partial (43%) / Customer Action Pending**. Confirmed with the user, then changed our build to match the live demo rather than the spec text.

- `SEED_TXNS['TS-10482'].evidence`: `phone`, `auth`, `amountAck`, `merchantAck` reverted to `"pending"` (receipt and fulfillment stay `"verified"` — the service happened and the POS receipt is on file, but the customer hasn't completed authorization yet).
- Activity log trimmed to match: removed the `otp`/`auth`/`finalized` events that implied completion; added a "reminder sent, still awaiting verification" entry.
- Dashboard guided-demo card copy updated to describe the actual state (service fulfilled, receipt captured, customer authorization still pending) instead of claiming completion.
- Verified via the Node harness: `evidenceCompleteness` → 43%, `evLabel` → `Partial`, `merchantActionFor` → `Customer Action Pending` — matches the live demo exactly.

Other differences noted but not changed (out of scope / lower confidence, not yet resolved with the user):
- Demo has a 5th lifecycle stage, "Package" (ours only has Detected/Authorized/Fulfilled/Disputed).
- Demo shows a third example transaction, TS-10481 (OPay, "Private Dining Experience") — not built here, consistent with the spec's instruction not to expand OPay into a full walkthrough.
- TS-10480's merchant sub-brand name differs: demo says "Aderonke Atelier," ours says "Adesola Couture."

## 2026-09-14 — Evidence Record restructure + Evidence Autopilot (incremental)

Applied a spec targeting "Payment / Authentication / Commercial Record / Fulfillment / Supporting Evidence / Audit Trail" and an "Evidence Autopilot" concept to our existing `transaction-shield.html`. The spec referenced routes/features (`/review`, `/review/full`, a Paystack-based TS-10482) and a "September 4 folder" that don't exist on this machine — confirmed with the user this should be applied to our single-file prototype, translating the concepts into its existing architecture rather than inventing the missing project.

**Evidence engine**
- Decoupled phone/OTP verification from the risk score — it's now always optional/supplementary (`evidenceSlots`), never gated by transaction value or risk tier. Fixes the "no extra verification solely because high-value" requirement.
- Fixed a real bug: the evidence-completeness "missing" list previously lumped `pending` (not-yet-due) items in with `missing` (materially absent) items. Now tracked separately everywhere (`renderEvidenceAutopilot`, `gapAlertMessage`, `renderNextStepCallout`).
- `computeRisk().verificationLevel` and the evidence engine no longer scale required evidence by value — informational risk scoring stays, but it no longer requests more proof for bigger amounts.

**Transaction Evidence Record**
- Replaced the old lettered evidence sections (A–F: Customer, Transaction Authorization, Presence & Fulfillment, Supporting Documents, Evidence Sources, Completeness) with six named sections: **Payment, Authentication, Commercial Record, Fulfillment, Supporting Evidence, Audit Trail**, each tagged Provider-sourced / Merchant-reported / Customer-confirmed.
- Added a new **Evidence Autopilot** block (`renderEvidenceAutopilot`) showing "Evidence Complete" + "No Action Required" when nothing required is missing or overdue, separating "materially missing" from "not yet due."

**Provider normalization**
- Added Paystack as a provider (previously only Moniepoint/OPay/PalmPay/Flutterwave existed in the data).
- New "One evidence model. Multiple payment providers." section on the Overview page (`renderProviderNormalization`), showing synthetic raw records from Paystack/Flutterwave/Moniepoint/OPay all mapping to the same `Payment.reference` / `Payment.status` fields, explicitly labeled Simulated.

**TS-10482 (flagship demo transaction)**
- Reassigned from Moniepoint to **Paystack**; evidence set to fully verified (all required items complete, `completion` still optional/pending); added a `fulfillment` object and a realistic multi-step activity log. Confirmed via test harness: `Evidence Complete`, `No Action Required`, lifecycle `Fulfilled`, 0 materially missing, 0 in-progress items.

**TS-10480 (fulfillment gap story)**
- Already Flutterwave with `shippingTracking:"verified"` / `deliveryConfirmation:"missing"` / no dispute — data was already correct. Strengthened the surrounding copy to explicitly state "No dispute exists" and distinguish carrier-reported delivery from recipient acknowledgment as separate records that don't overwrite each other (`renderNextStepCallout`, `gapAlertMessage`, `openFulfillmentModal`'s goods branch, `evidenceSlots`, `evidenceSourceRows`).
- The "Capture Recipient Acknowledgment" action now reuses the existing WhatsApp-preview pattern, shows the carrier record as unchanged, and confirmed via test harness that capturing the acknowledgment does not touch `shippingTracking`.

**Copy alignment**
- Hero now leads with the exact requested tagline/supporting line: "Make every transaction provable." / "One evidence layer across payment providers and operational systems."
- Removed the OTP-proves-identity claim from `reasonProfile()`'s rationale and from the evidence-package preview modal; phone is now labeled "supplementary" everywhere it appears, explicitly stated as not identity/card-ownership proof.
- Fixed stale copy that claimed evidence requirements "scale with risk" (no longer true after the decoupling above).

**Validation**
- `node --check` on the extracted script — no syntax errors.
- Built a Node `vm`-based DOM stub (no browser available for this pass — spec required working locally only, no publish/deploy) and exercised the real render pipeline: `evidenceCompleteness`, `lifecycleFor`, `merchantActionFor` for TS-10482 and TS-10480 confirmed correct; 15 of 16 routes rendered without error. The one failure (`#/protect`) is a test-stub limitation (the harness's fake `querySelector` always returns `null`, and `bindProtectForm` queries form fields immediately on render) — not a regression, and that route was already unlinked from navigation in the prior session.
- Confirmed via rendered-HTML assertions: all four providers and "One evidence model" / "Simulated" labels appear on the dashboard; all six named evidence sections render for TS-10482; "No dispute exists" and carrier/recipient language render for TS-10480.

**Not done / limitations**
- No live browser check this pass (constraint: work locally only, don't publish/deploy) — the Node harness is a strong proxy but isn't pixel/CSS verification. Recommend a real browser pass (e.g. republishing the artifact) before treating this as fully verified.
- Did not build the literal `/review` and `/review/full` routes referenced in the original spec — those don't correspond to anything in this codebase; the closest existing equivalents (Disputes list/detail) were preserved as-is.
- Left `PalmPay` in the underlying transaction data (used by several non-flagship rows) even though it isn't one of the four providers named in the provider-normalization spec — removing it would have meant rewriting otherwise-unrelated seed transactions, which was out of scope.

## 2026-09-13 — Matched design/structure to `transaction-shield-demo.quadry28.chatgpt.site`

Compared our local prototype (`transaction-shield.html`) against the hosted demo and brought this build in line with it. Reference demo routes seen: `/`, `/review`, `/demo/split-payment`, `/demo/duplicate-review`.

### Palette & typography
- Replaced the green/gold Newsreader+IBM Plex theme with hex values pulled directly from the demo's shipped CSS bundle:
  - Brand green `#0E5B3C`, gold `#A65B13`, alert red `#AF4836`, paper `#F7F8F5`, ink `#16231D` (plus matching dark-mode set).
- Swapped fonts to a Geist-style system stack (`ui-sans-serif` / `ui-monospace`) with Georgia for headings, dropping the Google Fonts import entirely.
- Added `text-decoration:none` to `.btn` (pre-existing gap — anchor-tag buttons were rendering underlined).

### Navigation
- Trimmed the sidebar from 5 items down to the demo's 4, same order: **Overview → Transactions → Evidence vault → Disputes**.
- Removed the persistent "New Transaction" button from the top bar (route still exists, just unlinked from primary nav).

### Copy & stats (Overview page)
- Hero copy replaced with the demo's exact lines: *"Make every transaction provable."* / *"Transaction Shield automatically builds and coordinates the evidence record you may need before a dispute happens."*
- Stat tiles now show the demo's literal numbers: 249 transactions monitored, ₦127M value monitored, 231 No Action Required, 12 Customer Action Pending, 5 Merchant Action Required, 2 Currently disputed, 4 Connected payment sources.
- Added a "GUIDED 3-MINUTE DEMO" callout matching the demo's button labels, wired to existing app routes:
  - **Start evidence flow** / **Try WhatsApp-first flow** → `#/txn/TS-10482` (the existing full-lifecycle walkthrough transaction)
  - **Reviewer walkthrough** → `#/disputes`
  - **Split-payment demo** → `#/txn/TXN-3390` (already has multi-payer split data)

### Table & badge vocabulary
- Transactions/Overview tables now use the demo's exact columns: **Transaction | Lifecycle | Evidence Status | Evidence Requirement | Merchant Action**.
- New derived-label functions added (`lifecycleFor`, `evLabel`, `merchantActionFor`, `reqPill`) so the demo's wording is computed from the existing risk/evidence engine rather than hardcoded:
  - Lifecycle: `Detected` / `Authorized` / `Fulfilled` / `Disputed`
  - Evidence Status: `Complete` / `Partial` / `Gap` (renamed from `Strong` / `Building` / `Needs Attention` everywhere it appeared — Vault filter tabs, dispute cards, quick checklist, evidence record section)
  - Evidence Requirement: `Standard` / `Enhanced` / `Additional` (renamed from `Basic` / `Standard` / `Enhanced` in `computeRisk()`)
  - Merchant Action: `No Action Required` / `Customer Action Pending` / `Merchant Action Required`

### Deliberate deviation — kept
- Did **not** replace the Adesola Lounge merchant story or regenerate a literal 249-row synthetic dataset. The aggregate stat tiles show the demo's real numbers; the transaction list underneath is still our ~13-row narrative sample (VIP lounge/catering business, multi-currency diaspora clients). Flagged to the user as a scope call — can be swapped for a fully generic large dataset on request.

### Verification
- `node --check` on the extracted `<script>` block — no syntax errors.
- Manually walked Overview, Transactions, Evidence vault, Disputes, and a transaction detail page via a live artifact preview — nav, stat tiles, new badge vocabulary, and guided-demo links all confirmed working.

---

## Earlier — Original prototype build
- Single-file HTML/CSS/JS app (`transaction-shield.html`), hash-router based, no build step.
- Merchant persona: **Adesola Lounge** (VIP hospitality & catering, Victoria Island, Lagos).
- Rule-based risk engine (`computeRisk`), evidence-completeness engine (`evidenceCompleteness`), dispute-mechanism modeling (card chargeback vs. transfer complaint), split-payment support, guest-vs-cardholder mismatch handling, simulated WhatsApp merchant notifications, customer-facing verification ("ticket") flow.
- Original views: Overview, Transactions, New Transaction (Protect), Evidence Vault, Disputes, Risk & Evidence Requirements, Transaction Detail, Verify (customer-facing).
