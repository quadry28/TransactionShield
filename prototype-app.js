'use strict';
const TS = window.TransactionShield;
let state = TS.seed();
let captureId = null;
let renderedRevision = null;
let busy = false;
const app = document.getElementById('app');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const date = value => new Date(value).toLocaleString('en-GB', { timeZone: 'Africa/Lagos', dateStyle: 'medium', timeStyle: 'short' }) + ' WAT';
const badge = status => `<span class="status ${status.toLowerCase().replaceAll(' ', '-')}">${escapeHtml(status)}</span>`;
function notify(message) { document.getElementById('notice').textContent = message; }
function route() { return ['record', 'review', 'policy'].includes(location.hash.slice(2)) ? location.hash.slice(2) : 'record'; }
function provenance(item) {
  return `<dl><dt>Source origin</dt><dd>${escapeHtml(item.origin)}</dd><dt>Source / custodian</dt><dd>${escapeHtml(item.source)}</dd><dt>Capture method</dt><dd>${escapeHtml(item.acquisition)}</dd><dt>Reference</dt><dd>${escapeHtml(item.reference || 'No external reference; see captured content')}</dd><dt>Captured by</dt><dd>${escapeHtml(item.capturedBy)} · ${escapeHtml(date(item.capturedAt))}</dd><dt>Evidence ID</dt><dd>${escapeHtml(item.id)} · fictional sample</dd></dl>`;
}
function render() {
  const view = route();
  document.querySelectorAll('nav a').forEach(a => { if (a.hash === `#/${view}`) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  app.innerHTML = view === 'record' ? recordView() : view === 'review' ? reviewView() : policyView();
  if (captureId && view === 'record') document.getElementById('source')?.focus();
}
function recordView() {
  const t = state.transaction;
  const rows = TS.assess(state);
  const present = rows.filter(row => row.status === 'Present').length;
  return `<div class="grid"><section class="card"><div class="eyebrow">Selected fictional reference transaction</div><h2>${t.id} · VIP Table &amp; Bottle Service</h2><div class="large-number">₦3,500,000</div><dl><dt>Merchant</dt><dd>${t.merchant} · Lagos, Nigeria</dd><dt>Customer</dt><dd>${t.customer}</dd><dt>Payment</dt><dd>International card · Paystack · ${t.paymentStatus}</dd><dt>Payment reference</dt><dd><code>${t.reference}</code></dd><dt>Expected completion</dt><dd>${escapeHtml(date(t.serviceAt))}</dd></dl><details class="spacer no-print"><summary>Change fictional service timing</summary><div><p class="muted">To explore “Not yet due,” choose a future completion time. Changing this clears the old booking and fulfillment records for reassessment.</p><form id="schedule-form"><label for="service-date">Expected completion (UTC)</label><input id="service-date" name="serviceAt" type="datetime-local" value="${t.serviceAt.slice(0,16)}" required><button class="spacer" type="submit">Update sample timing</button></form></div></details></section><aside class="card tint"><div class="eyebrow">Evidence assessment</div><h2>${present} of ${rows.length} required records present</h2><p>${present === rows.length ? 'No collection action required under this provisional assessment. Merchant package review is a separate step.' : 'Close the item-level gaps below, then review the compiled package.'}</p><p><strong>Response target</strong><br>${TS.TARGET}</p><p class="muted">Intended processor: Paystack, for this fictional reference case. Its submission requirements have not been validated.</p><a class="button primary" href="#/review">Review draft package</a><p class="meta spacer">Provisional policy ${TS.POLICY.id}. “Present” means captured with the required provenance and review, not authenticated.</p></aside></div>
    <section aria-labelledby="checklist-title"><div class="row"><div><h2 id="checklist-title">Evidence checklist</h2><p class="muted">Manual uploads and references. Every record retains its source.</p></div><button data-action="reset" class="no-print">Reset fictional example</button></div>
    ${rows.map(row => evidenceCard(row)).join('')}</section>
    <details class="card"><summary>Local follow-ups and activity (${state.audit.length} events)</summary><div>${auditView()}</div></details>`;
}
function evidenceCard(row) {
  const item = row.item;
  return `<article class="card ${row.id === 'context' ? 'high-risk' : ''}"><div class="row"><div><div class="eyebrow">${row.category}${row.id === 'context' ? ' · Highest-risk source' : ''}</div><h3>${row.title}</h3></div>${badge(row.status)}</div><p class="muted">${row.hint}</p><p>${escapeHtml(row.explanation)}</p>
    ${row.id === 'context' ? '<p class="notice">Messages can be incomplete, forwarded or misattributed. A merchant capture alone does not establish customer confirmation. Review attribution, transaction relevance and data minimization before this item counts as present.</p>' : ''}
    ${item ? `<details><summary>Inspect captured evidence and provenance</summary><div>${provenance(item)}<div class="evidence-body">${escapeHtml(item.content)}</div>${item.file ? `<p class="meta">Attached: ${escapeHtml(item.file.name)} · ${item.file.size.toLocaleString()} bytes · included in JSON export</p>` : ''}${item.contextReview ? `<p class="meta">Source review by ${escapeHtml(item.contextReview.actor)} · ${escapeHtml(date(item.contextReview.at))}<br>${escapeHtml(item.contextReview.note)}</p>` : ''}</div></details>` : `<p class="meta">Required source origin: ${row.origin} · due ${escapeHtml(date(row.dueAt))}</p>`}
    <div class="stack spacer no-print"><button data-action="capture" data-id="${row.id}">${item ? 'Replace evidence' : 'Add evidence'}</button>${row.status !== 'Present' ? `<button data-action="request" data-id="${row.id}">Record manual follow-up</button>` : ''}${item ? `<button class="danger" data-action="remove" data-id="${row.id}">Remove</button>` : ''}</div>
    ${captureId === row.id ? captureForm(row) : ''}
    ${row.id === 'context' && item && !item.contextReview && captureId !== 'context' ? contextForm() : ''}</article>`;
}
function captureForm(row) {
  return `<form id="capture-form" data-id="${row.id}" class="spacer"><h3>Capture fictional ${row.title.toLowerCase()}</h3><p class="meta">Source origin: ${row.origin}. This label describes the original source, not a live connection or independent verification.</p>
    <label for="source">Source / custodian</label><input id="source" name="source" maxlength="250" placeholder="e.g. Fictional venue booking ledger" required>
    <label for="method">How was this acquired?</label><select id="method" name="acquisition">${TS.METHODS.map(method => `<option>${method}</option>`).join('')}</select>
    <div id="reference-fields"><label for="reference">Source reference</label><input id="reference" name="reference" maxlength="500" placeholder="e.g. DEMO-BOOKING-10482" required></div>
    <div id="upload-fields" class="hidden"><label for="evidence-file">Fictional evidence file (up to 2 MB)</label><input type="file" id="evidence-file" name="file" accept=".txt,.csv,.json,.pdf,.png,.jpg,.jpeg"><p class="file-note muted">Stored in memory until refresh. File bytes are included in the JSON package; files are not executed or automatically authenticated.</p></div>
    <label for="content">${row.id === 'context' ? 'Minimal customer-confirmed excerpt and transaction link' : 'Record content / description of uploaded evidence'}</label><textarea id="content" name="content" maxlength="6000" required placeholder="Use only fictional sample content. Include TS-10482 and the relevant transaction facts."></textarea>
    <label class="check"><input type="checkbox" name="fictional" required><span>This is fictional evidence. It contains no real customer or identity data.</span></label>
    <div class="stack spacer"><button class="primary" type="submit">Save evidence</button><button type="button" data-action="fill-sample" data-id="${row.id}">Use fictional sample</button><button type="button" data-action="cancel-capture">Cancel</button></div></form>`;
}
function contextForm() {
  return `<form id="context-form" class="notice no-print"><h3>Additional Customer Context source review</h3><label class="check"><input name="attribution" type="checkbox" required><span>I checked the attributed author, original channel and how the excerpt was obtained.</span></label><label class="check"><input name="relevance" type="checkbox" required><span>I checked that the excerpt acknowledges this merchant, service and ₦3,500,000 amount, with enough surrounding context.</span></label><label class="check"><input name="minimization" type="checkbox" required><span>I checked that only relevant fictional content is included, with no identity data or unrelated conversation.</span></label><label for="context-note">Basis for the source review</label><textarea id="context-note" name="note" maxlength="2000" placeholder="Describe the fictional source and the checks you performed." required></textarea><button type="submit" class="spacer">Record source review</button></form>`;
}
function auditView() {
  return `${state.requests.length ? `<h3>Manual follow-ups</h3>${state.requests.map(req => `<p class="evidence-body">${escapeHtml(req.message)}<br><small>${escapeHtml(req.status)} · ${escapeHtml(date(req.at))}</small></p>`).join('')}` : ''}<h3>Session activity</h3><p class="meta">Local working history; not an immutable audit log.</p><ol class="audit">${state.audit.map(event => `<li>${escapeHtml(event.action)}<br><small>${escapeHtml(event.actor)} · ${escapeHtml(date(event.at))}</small></li>`).join('')}</ol>`;
}
function reviewView() {
  const pkg = TS.packageFor(state);
  renderedRevision = state.revision;
  const complete = pkg.checklist.every(row => row.status === 'Present');
  const final = !!pkg.merchantReview;
  return `<section class="card review-document"><div class="row"><div><div class="eyebrow">Fictional evidence package · revision ${pkg.revision}</div><h2>${pkg.status}</h2></div><button class="no-print" data-action="export">Download ${final ? 'reviewed' : 'draft'} JSON package</button></div><p><strong>Prepared for: ${pkg.target}</strong></p><p class="muted">${pkg.intendedProcessor}</p><div class="notice">${TS.POLICY.status}. This is a prototype package format, not an accepted processor template. Nothing is submitted.</div><h3>Transaction summary</h3><dl><dt>Reference case</dt><dd>TS-10482 · ${pkg.transaction.description}</dd><dt>Merchant / customer</dt><dd>${pkg.transaction.merchant} / ${pkg.transaction.customer}</dd><dt>Payment</dt><dd>₦3,500,000 · International card · ${pkg.transaction.paymentStatus}</dd><dt>Provider reference</dt><dd>${pkg.transaction.provider} · ${pkg.transaction.reference}</dd><dt>Service completion</dt><dd>${escapeHtml(date(pkg.transaction.serviceAt))}</dd></dl>
    <h3 class="spacer">Required evidence and unresolved gaps</h3><div class="table-scroll"><table><thead><tr><th>Evidence</th><th>Assessment</th><th>Explanation</th></tr></thead><tbody>${pkg.checklist.map(row => `<tr><td>${row.title}<br><small>${row.category}</small></td><td>${badge(row.status)}</td><td>${escapeHtml(row.explanation)}</td></tr>`).join('')}</tbody></table></div>
    <h3 class="spacer">Compiled evidence with source provenance</h3>${pkg.evidence.map(item => `<section class="card ${item.requirementId === 'context' ? 'high-risk' : ''}"><h3>${TS.POLICY.requirements.find(row => row.id === item.requirementId).title}</h3>${provenance(item)}<div class="evidence-body">${escapeHtml(item.content)}</div>${item.file ? `<p>Attachment: ${escapeHtml(item.file.name)} (${item.file.size} bytes). Included in the JSON package.</p>` : ''}${item.contextReview ? `<p><strong>Customer Context source review:</strong> ${escapeHtml(item.contextReview.note)}</p><p class="meta">${escapeHtml(item.contextReview.actor)} · ${escapeHtml(date(item.contextReview.at))}</p>` : item.requirementId === 'context' ? '<p class="notice">Source review outstanding. This item does not count as present.</p>' : ''}</section>`).join('')}
    <h3>Package limitations</h3><ul>${pkg.limitations.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul><details><summary>Follow-ups and audit trail included in export</summary><div>${auditView()}</div></details></section>
    <section class="card no-print"><h2>Merchant review</h2>${final ? `<p class="status present">Finalized after merchant review</p><p>${escapeHtml(pkg.merchantReview.actor)} · ${escapeHtml(date(pkg.merchantReview.at))}</p><p>Any evidence change invalidates this approval and returns the package to draft.</p>` : `<p>Inspect the evidence and provenance above before approving this exact revision.</p>${complete ? '' : '<p class="notice">Finalization is unavailable until all five required records are present, including the additional Customer Context source review. You can export a clearly marked draft with gaps.</p>'}<form id="finalize-form"><label class="check"><input type="checkbox" name="acknowledged" required ${complete ? '' : 'disabled'}><span>I have reviewed the compiled evidence, provenance, source checks and limitations for revision ${pkg.revision}. I approve this fictional package for the named response target.</span></label><button class="primary spacer" type="submit" ${complete ? '' : 'disabled'}>Finalize reviewed prototype package</button></form>`}<a class="button spacer" href="#/record">Back to evidence checklist</a></section>`;
}
function policyView() {
  return `<section class="card"><div class="eyebrow">${TS.POLICY.id}</div><h2>Provisional hospitality evidence policy</h2><p class="notice">${TS.POLICY.status}. Merchant interviews have not yet established the detailed hospitality evidence policy or validated the problem.</p><p>One transaction type: an in-person Nigerian VIP table / bottle-service booking worth at least ₦1,000,000, paid by international card.</p><p><strong>Named response target:</strong> ${TS.TARGET}. The fictional reference case uses Paystack; the actual processor format and requirements remain to be confirmed.</p><div class="table-scroll"><table><thead><tr><th>Required item (demo assumption)</th><th>Source origin</th><th>Due rule (demo assumption)</th></tr></thead><tbody>${TS.POLICY.requirements.map(row => `<tr><td>${row.title}</td><td>${row.origin}</td><td>${row.due === 'service' ? 'At expected service completion' : 'At payment'}</td></tr>`).join('')}</tbody></table></div><h3 class="spacer">Assessment rules</h3><p>A record is present when it contains content and source provenance. Customer Context also needs an explicit source review covering attribution, relevance and minimization. These checks record merchant judgment; they do not authenticate evidence.</p><p>A missing fulfillment record is “Not yet due” before the expected service completion time, then becomes “Missing.” Recording a follow-up never closes a gap. All required records must be present before merchant review can finalize the package.</p><h3>Still to establish through interviews and a pilot</h3><ul><li>The pilot merchant, staff owner and actual collection bottleneck.</li><li>The required hospitality evidence and timing, including handling missing customer confirmation.</li><li>Which customer communication sources are available and how their provenance can be assessed.</li><li>The processor’s required fields, submission format and handling of unresolved gaps.</li><li>Whether this workflow reduces merchant effort and helps response preparation.</li></ul><h3>Prototype boundaries</h3><p>Fictional records only; manual capture; session memory; JSON working-package export. No messaging, provider connections, automatic collection or submission. No adoption metrics, dispute outcomes or compliance conclusions.</p><p>Identity Data is excluded by this policy and has no collection flow. Any future policy requiring it needs separately defined handling. Split payments, guest/cardholder mismatches, other transaction types and card-network reason-code formats are outside this prototype.</p></section>`;
}
function updateMethod() {
  const method = document.getElementById('method').value;
  const upload = method === 'Manual upload';
  document.getElementById('upload-fields').classList.toggle('hidden', !upload);
  document.getElementById('evidence-file').required = upload;
  document.getElementById('reference').required = method === 'Manual reference';
}
function fillSample(id) {
  const baseline = TS.seed().evidence[id];
  document.getElementById('method').value = 'Manual reference';
  updateMethod();
  document.getElementById('source').value = baseline?.source || 'Fictional customer booking-message excerpt, manually supplied by the venue';
  document.getElementById('reference').value = baseline?.reference || 'DEMO-CONTEXT-10482';
  document.getElementById('content').value = baseline?.content || 'Fictional Guest A, fictional booking-message thread DEMO-CONTEXT-10482: “I recognize Fictional Adesola Lounge and confirm the NGN 3,500,000 payment for my VIP Table & Bottle Service booking TS-10482.” This is a fictional excerpt for source-review testing, not an actual customer message.';
  if (id === 'booking' || id === 'fulfillment') document.getElementById('content').value = `Fictional ${id === 'booking' ? 'booking' : 'floor-manager service record'} for TS-10482; Fictional Guest A; Table 6; VIP Table & Bottle Service; NGN 3,500,000; expected service completion ${date(state.transaction.serviceAt)}.${id === 'fulfillment' ? ' Sample staff report: guest checked in and service completed at the recorded completion time.' : ''}`;
}
function readFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || file.size === 0 || file.size > TS.MAX_FILE_BYTES) return reject(new Error('Select a non-empty fictional file no larger than 2 MB.'));
    if (!/\.(txt|csv|json|pdf|png|jpe?g)$/i.test(file.name)) return reject(new Error('Use a TXT, CSV, JSON, PDF, PNG or JPEG sample file.'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The file could not be read. Try selecting it again.'));
    reader.onload = () => resolve({ name: file.name, size: file.size, type: file.type || 'application/octet-stream', dataUrl: reader.result });
    reader.readAsDataURL(file);
  });
}
app.addEventListener('change', event => { if (event.target.id === 'method') updateMethod(); });
app.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button || busy) return;
  const { action, id } = button.dataset;
  try {
    if (action === 'capture') { captureId = id; render(); }
    if (action === 'cancel-capture') { captureId = null; render(); }
    if (action === 'fill-sample') fillSample(id);
    if (action === 'request') { TS.request(state, id); render(); notify('Manual follow-up recorded locally. Nothing was sent; the evidence gap remains.'); }
    if (action === 'remove') { TS.remove(state, id); render(); notify('Evidence removed. The package needs a new review after changes.'); }
    if (action === 'reset' && window.confirm('Reset this fictional example? This discards all session captures, uploads and reviews.')) { state = TS.seed(); captureId = null; render(); notify('Fictional reference example reset.'); }
    if (action === 'export') {
      const pkg = TS.packageFor(state);
      const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `TS-10482-${pkg.merchantReview ? 'reviewed' : 'draft'}-r${state.revision}.json`;
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('Fictional package downloaded with evidence, file bytes, provenance and review status. Nothing submitted.');
    }
  } catch (error) { notify(error.message); }
});
app.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  const form = event.target;
  const fields = new FormData(form);
  try {
    if (form.id === 'capture-form') {
      const input = Object.fromEntries(fields);
      input.fictional = fields.has('fictional');
      input.file = null;
      if (input.acquisition === 'Manual upload') {
        busy = true;
        form.querySelectorAll('button').forEach(button => button.disabled = true);
        input.file = await readFile(fields.get('file'));
      }
      TS.capture(state, form.dataset.id, input);
      captureId = null;
      render(); notify('Evidence saved with provenance. Assessment updated; any earlier package approval is cleared.');
    } else if (form.id === 'context-form') {
      TS.reviewContext(state, { attribution: fields.has('attribution'), relevance: fields.has('relevance'), minimization: fields.has('minimization'), note: fields.get('note') });
      render(); notify('Customer Context source review recorded. Merchant package review is still required.');
    } else if (form.id === 'schedule-form') {
      TS.schedule(state, fields.get('serviceAt') + ':00.000Z'); captureId = null;
      render(); notify('Timing updated. Recapture the booking and fulfillment records for the changed service.');
    } else if (form.id === 'finalize-form') {
      TS.finalize(state, { revision: renderedRevision, acknowledged: fields.has('acknowledged') });
      render(); notify('Fictional package finalized after merchant review. Nothing submitted.');
    }
  } catch (error) {
    notify(error.message);
    form.querySelectorAll('button').forEach(button => button.disabled = false);
  } finally { busy = false; }
});
window.addEventListener('hashchange', () => { captureId = null; render(); });
// Refresh assessment at due-time boundaries without interrupting an open form or review.
setInterval(() => { if (route() === 'record' && !captureId && !app.querySelector('form:focus-within') && !busy) {
  const statuses = TS.assess(state).map(row => row.status).join('|');
  const visible = [...app.querySelectorAll('article .status')].map(el => el.textContent).join('|');
  if (statuses !== visible) render();
} }, 30000);
render();
