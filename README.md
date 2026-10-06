# Transaction Shield

A fictional, manual-capture prototype for preparing transaction evidence for a payment processor dispute / representment submission. The problem and hospitality evidence policy still need merchant validation.

## Run

Open `transaction-shield.html` in a modern browser with the adjacent JavaScript and CSS files present. No build or dependencies are required. Alternatively, from this directory:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8765/transaction-shield.html`.

## Walkthrough

1. Inspect fictional TS-10482: a Nigerian VIP table / bottle-service booking for NGN 3,500,000 paid by international card, with a fictional Paystack reference. Four manually referenced records are present; Customer Context is missing.
2. Under Customer Context, select **Add evidence**, then **Use fictional sample** (or enter/reference/upload your own fictional sample). Confirm the fictional-data checkbox and save.
3. Inspect the captured evidence and provenance. Complete the additional source-review checks and explain their basis. Capturing a message alone does not close this gap.
4. Open **Review package** and inspect the complete evidence, provenance and limitations. Confirm merchant review to finalize the current revision.
5. Download the reviewed JSON package. It includes source provenance, file bytes when uploaded, the provisional policy, checklist and review metadata. Nothing is submitted.

Draft export is available with explicit gaps and draft status. A recorded manual follow-up sends nothing and never closes a gap. Changing any evidence revokes package approval; replacing Customer Context requires a new source review. Changing sample service timing clears booking and fulfillment records and demonstrates not-yet-due assessment.

Use fictional data only. All changes and uploaded files remain in session memory and are lost on refresh/reset. The prototype does not load the old build's local-storage records. It has no identity-data collection flow, API integrations, messaging, submission, durable evidence storage or merchant access control.

## Scope and unresolved policy

[Product specification](docs/product-spec.md) is authoritative. [Prototype decisions](docs/prototype-decisions.md) records the undefined requirements identified before implementation and the explicit provisional assumptions. The UI and exports label the checklist as unvalidated; no Paystack acceptance requirements are asserted.

Merchant interviews must establish the actual evidence requirements, operational owner, communication sources, collection bottleneck and processor format. No adoption, monitored-volume, dispute-outcome or compliance conclusions are claimed.

## Files and checks

- `transaction-shield.html`: application entry point.
- `prototype.css`: responsive interface styles.
- `prototype-core.js`: evidence, provenance, assessment and review model.
- `prototype-app.js`: manual capture and package review interface.
- `prototype.test.js`: dependency-free model and render tests.
- `PLAN.md`: validation questions and deferred product ideas; the specification supersedes historical scope.
- `CHANGELOG.md`: history, including the previous broader demo.

Run the automated checks with Node.js:

```powershell
node --check prototype-core.js
node --check prototype-app.js
node --test prototype.test.js
```

The 11 checks cover the initial gap, provenance validation, Customer Context scrutiny, follow-ups, deadline transitions, review gating/invalidation, attachment export, route rendering and HTML escaping. They are model and DOM-stub checks, not a real-browser suite. Visual layout and browser interactions could not be verified in this environment because the browser tool reported no browser available.
