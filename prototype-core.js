/* Dependency-free evidence model, shared by the browser and Node tests. */
(function (root) {
  'use strict';
  const TARGET = 'Payment processor dispute / representment submission';
  const POLICY = {
    id: 'hospitality-demo-v1',
    status: 'Provisional — not merchant- or processor-validated',
    requirements: [
      { id: 'payment', category: 'Payment Data', title: 'Payment reference and status', due: 'payment', origin: 'Provider-sourced', hint: 'Manually enter the fictional payment reference, amount, currency, status and method shown on the provider record. Labels are demo vocabulary, not a validated Paystack schema.' },
      { id: 'booking', category: 'Commercial Data', title: 'Booking record', due: 'payment', origin: 'Merchant-reported', hint: 'Link the booking to this transaction, venue, service and scheduled time.' },
      { id: 'receipt', category: 'Commercial Data', title: 'Itemized receipt', due: 'payment', origin: 'Merchant-reported', hint: 'Include the purchased items, total and transaction reference.' },
      { id: 'fulfillment', category: 'Commercial Data', title: 'Check-in and fulfillment record', due: 'service', origin: 'Merchant-reported', hint: 'Record check-in, the service delivered, completion time and reporting staff role.' },
      { id: 'context', category: 'Customer Context', title: 'Customer transaction confirmation', due: 'payment', origin: 'Customer-confirmed', hint: 'A minimal fictional excerpt acknowledging the merchant, service and exact amount. Review its attribution and context separately.' }
    ]
  };
  const METHODS = ['Manual reference', 'Manual entry', 'Manual upload'];
  const MAX_FILE_BYTES = 2 * 1024 * 1024;
  const PAYMENT_STATUSES = ['Successful', 'Failed', 'Pending', 'Refunded', 'Reversed'];
  const PAYMENT_METHODS = ['International card', 'Local card', 'Bank transfer'];
  function seed(now = new Date().toISOString()) {
    const state = {
      revision: 1, review: null, sequence: 0,
      transaction: { id: 'TS-10482', merchant: 'Fictional Adesola Lounge', customer: 'Fictional Guest A', description: 'VIP Table & Bottle Service', amount: 3500000, currency: 'NGN', provider: 'Paystack', reference: 'DEMO-PSK-TS10482', paymentStatus: 'Successful (fictional)', card: 'International card', paidAt: '2026-09-18T18:00:00.000Z', serviceAt: '2026-09-19T00:05:00.000Z' },
      evidence: {}, requests: [], audit: []
    };
    const samples = {
      payment: ['Fictional Paystack export', 'DEMO-PSK-TS10482', 'Fictional Paystack export for TS-10482: reference DEMO-PSK-TS10482, NGN 3,500,000, status Successful, international card. Manually entered sample, no connection.'],
      booking: ['Fictional venue booking ledger', 'DEMO-BOOKING-10482', 'Fictional Guest A; Table 6; VIP Table & Bottle Service; NGN 3,500,000; service ends 19 September 2026 at 01:05 WAT; transaction TS-10482.'],
      receipt: ['Fictional venue receipt ledger', 'DEMO-RECEIPT-10482', 'TS-10482: VIP table NGN 1,000,000; bottle-service package NGN 2,500,000; total NGN 3,500,000. Fictional sample.'],
      fulfillment: ['Fictional floor-manager service log', 'DEMO-SERVICE-10482', 'TS-10482; Fictional Guest A checked in at Table 6 at 23:20 WAT on 18 September 2026; VIP table and bottle service completed at 01:05 WAT on 19 September; reported by Fictional Floor Manager.' ]
    };
    for (const [id, values] of Object.entries(samples)) {
      state.evidence[id] = { id: `E-${++state.sequence}`, requirementId: id, source: values[0], reference: values[1], content: values[2], origin: POLICY.requirements.find(r => r.id === id).origin, acquisition: 'Manual reference', capturedBy: 'Fictional Demo Merchant', capturedAt: now, fictional: true, file: null, contextReview: null,
        paymentFields: id === 'payment' ? { amount: 3500000, currency: 'NGN', status: 'Successful', method: 'International card' } : null };
    }
    state.audit.push({ at: now, actor: 'Fictional Demo Merchant', action: 'Loaded fictional reference transaction and four manually referenced sample records.' });
    return state;
  }
  function requirement(id) {
    const result = POLICY.requirements.find(r => r.id === id);
    if (!result) throw new Error('Unknown evidence requirement.');
    return result;
  }
  function nonempty(value) { return typeof value === 'string' && value.trim().length > 0; }
  function validFile(file) {
    return file && nonempty(file.name) && Number.isInteger(file.size) && file.size > 0 && file.size <= MAX_FILE_BYTES && typeof file.dataUrl === 'string' && /^data:[^,]*;base64,[A-Za-z0-9+/=]+$/.test(file.dataUrl);
  }
  function validEvidence(item, req) {
    const base = item && item.fictional === true && item.origin === req.origin && nonempty(item.source) && nonempty(item.capturedBy) && nonempty(item.capturedAt) && METHODS.includes(item.acquisition) &&
      (item.acquisition === 'Manual reference' ? nonempty(item.reference) && nonempty(item.content) : item.acquisition === 'Manual upload' ? validFile(item.file) && nonempty(item.content) : nonempty(item.content));
    return !!base && (req.id === 'payment' ? validPaymentFields(item) : true);
  }
  function validPaymentFields(item) {
    const f = item.paymentFields;
    return nonempty(item.reference) && !!f && Number.isFinite(f.amount) && f.amount > 0 && /^[A-Z]{3}$/.test(f.currency || '') && PAYMENT_STATUSES.includes(f.status) && PAYMENT_METHODS.includes(f.method);
  }
  function contextReviewed(item) {
    const review = item && item.contextReview;
    return review && nonempty(review.actor) && nonempty(review.at) && nonempty(review.note) && review.attribution && review.relevance && review.minimization;
  }
  function assess(state, now = new Date().toISOString()) {
    return POLICY.requirements.map(req => {
      const item = state.evidence[req.id];
      const dueAt = req.due === 'service' ? state.transaction.serviceAt : state.transaction.paidAt;
      const due = Date.parse(dueAt) <= Date.parse(now);
      let status, explanation;
      if (validEvidence(item, req) && (req.id !== 'context' || contextReviewed(item))) {
        status = 'Present'; explanation = req.id === 'context' ? 'Captured and source-reviewed by the merchant; not independently authenticated.' : 'Captured with source provenance; not independently verified.';
      } else if (item) {
        status = 'Missing'; explanation = req.id === 'context' && validEvidence(item, req) ? 'Captured, but additional Customer Context source review is required.' : 'The record lacks required provenance or content.';
      } else {
        status = due ? 'Missing' : 'Not yet due'; explanation = due ? 'Required record has not been captured.' : `Required after service completion (${dueAt}).`;
      }
      return { ...req, dueAt, status, explanation, item: item || null };
    });
  }
  function change(state, action, actor, now) {
    state.revision += 1;
    state.review = null;
    state.audit.push({ at: now, actor, action });
  }
  function capture(state, id, input, now = new Date().toISOString()) {
    const req = requirement(id);
    const item = { id: `E-${state.sequence + 1}`, requirementId: id, source: String(input.source || '').trim(), origin: req.origin, acquisition: input.acquisition, reference: String(input.reference || '').trim(), content: String(input.content || '').trim(), capturedBy: 'Fictional Demo Merchant', capturedAt: now, fictional: input.fictional === true, file: input.file || null, contextReview: null,
      paymentFields: id === 'payment' ? { amount: Number(input.paymentAmount), currency: String(input.paymentCurrency || '').trim().toUpperCase(), status: input.paymentStatus, method: input.paymentMethod } : null };
    if (!validEvidence(item, req)) throw new Error(id === 'payment' ? 'Provide the payment reference, a positive amount, a 3-letter currency code, a status and a method, plus the source and content required by the capture method.' : 'Provide fictional evidence, its source, and the content/reference or uploaded file required by the capture method.');
    if ([item.source, item.reference, item.content].some(value => value.length > 6000)) throw new Error('Keep each evidence field within 6,000 characters.');
    state.sequence += 1;
    state.evidence[id] = item;
    change(state, `Captured ${req.title} as ${item.id}; ${item.origin}; ${item.acquisition}; source: ${item.source}.`, item.capturedBy, now);
    return item;
  }
  function remove(state, id, now = new Date().toISOString()) {
    const req = requirement(id);
    if (!state.evidence[id]) return;
    delete state.evidence[id];
    change(state, `Removed ${req.title} from the package.`, 'Fictional Demo Merchant', now);
  }
  function reviewContext(state, checks, now = new Date().toISOString()) {
    const item = state.evidence.context;
    if (!validEvidence(item, requirement('context'))) throw new Error('Capture Customer Context before reviewing its source.');
    if (!checks.attribution || !checks.relevance || !checks.minimization || !nonempty(checks.note)) throw new Error('Complete all three source checks and record the basis for your review.');
    item.contextReview = { actor: 'Fictional Demo Merchant', at: now, note: checks.note.trim(), attribution: true, relevance: true, minimization: true };
    change(state, `Reviewed Customer Context ${item.id}: ${checks.note.trim()}`, 'Fictional Demo Merchant', now);
  }
  function request(state, id, now = new Date().toISOString()) {
    const req = requirement(id);
    const message = `Manual follow-up for ${state.transaction.id}: please supply a fictional ${req.title.toLowerCase()} with its source and transaction reference. No real customer or identity data.`;
    state.requests.push({ requirementId: id, message, at: now, status: 'Follow-up recorded locally; nothing sent' });
    change(state, `Recorded manual follow-up for ${req.title}; nothing sent.`, 'Fictional Demo Merchant', now);
    return message;
  }
  function schedule(state, iso, now = new Date().toISOString()) {
    if (!Number.isFinite(Date.parse(iso)) || Date.parse(iso) < Date.parse(state.transaction.paidAt)) throw new Error('Service completion must be a valid date after payment.');
    state.transaction.serviceAt = new Date(iso).toISOString();
    // Scheduling a different service invalidates the old booking and fulfillment records.
    delete state.evidence.booking;
    delete state.evidence.fulfillment;
    change(state, 'Changed expected service completion; booking and fulfillment must be recaptured.', 'Fictional Demo Merchant', now);
  }
  function finalize(state, input, now = new Date().toISOString()) {
    if (input.revision !== state.revision) throw new Error('The evidence changed. Review the current draft again.');
    if (!input.acknowledged) throw new Error('Merchant review is required before finalization.');
    if (assess(state, now).some(row => row.status !== 'Present')) throw new Error('Resolve all required records and Customer Context source review before finalization.');
    state.review = { revision: state.revision, actor: 'Fictional Demo Merchant', at: now, acknowledged: true };
    state.audit.push({ at: now, actor: state.review.actor, action: `Reviewed and finalized fictional package revision ${state.revision}. Nothing submitted.` });
  }
  function packageFor(state, now = new Date().toISOString()) {
    const rows = assess(state, now);
    const final = state.review && state.review.revision === state.revision && rows.every(row => row.status === 'Present');
    return JSON.parse(JSON.stringify({
      title: 'Transaction Shield fictional evidence package', status: final ? 'Final — merchant reviewed (prototype only)' : 'Draft — not final', revision: state.revision, generatedAt: now,
      target: TARGET, intendedProcessor: 'Paystack (reference case only; submission requirements not validated)', policy: POLICY,
      limitations: ['Fictional data only.', 'Provisional checklist; merchant interviews and processor requirements remain unvalidated.', 'Present means captured with required provenance and review, not proof of authenticity or an outcome.', 'Manual captures only; no integration or submission.', 'Session-only prototype; not durable storage or an immutable audit log.'],
      transaction: state.transaction, checklist: rows.map(({ item, ...row }) => row), evidence: Object.values(state.evidence), requests: state.requests, merchantReview: final ? state.review : null, audit: state.audit
    }));
  }
  const api = { TARGET, POLICY, METHODS, MAX_FILE_BYTES, PAYMENT_STATUSES, PAYMENT_METHODS, seed, assess, capture, remove, reviewContext, request, schedule, finalize, packageFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TransactionShield = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
