const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const TS = require('./prototype-core');
const NOW = '2026-09-20T12:00:00.000Z';
const contextInput = { source: 'Fictional customer message, manually supplied by venue', acquisition: 'Manual reference', reference: 'DEMO-MSG-10482', content: 'Fictional Guest A confirms Fictional Adesola Lounge, TS-10482 VIP Table & Bottle Service, NGN 3,500,000.', fictional: true };
const checks = { attribution: true, relevance: true, minimization: true, note: 'Reviewed fictional author and original booking channel, transaction amount and service; excerpt contains no unrelated data.' };
function complete() { const state = TS.seed(NOW); TS.capture(state, 'context', contextInput, NOW); TS.reviewContext(state, checks, NOW); return state; }
function approve(state) { TS.finalize(state, { acknowledged: true, revision: state.revision }, NOW); }

test('single fictional hospitality seed has four present items and one genuine gap', () => {
  const state = TS.seed(NOW);
  assert.equal(state.transaction.id, 'TS-10482');
  assert.equal(state.transaction.amount, 3500000);
  assert.deepEqual(TS.assess(state, NOW).map(row => row.status), ['Present', 'Present', 'Present', 'Present', 'Missing']);
  assert.ok(Object.values(state.evidence).every(item => item.fictional && item.source && item.origin && item.acquisition && item.capturedAt && item.capturedBy));
  assert.ok(!TS.POLICY.requirements.some(row => /identity/i.test(row.category)));
  assert.throws(() => TS.capture(state, 'identity', contextInput, NOW), /Unknown/);
});
test('capture requires content, provenance and fictional-data attestation', () => {
  for (const input of [{ ...contextInput, fictional: false }, { ...contextInput, source: '' }, { ...contextInput, reference: '' }, { ...contextInput, content: '' }, { ...contextInput, acquisition: 'Automatic integration' }]) {
    assert.throws(() => TS.capture(TS.seed(NOW), 'context', input, NOW), /Provide fictional/);
  }
  const state = TS.seed(NOW);
  TS.capture(state, 'payment', { ...contextInput, acquisition: 'Manual entry', reference: '' }, NOW);
  assert.equal(state.evidence.payment.origin, 'Provider-sourced');
  assert.equal(state.evidence.payment.acquisition, 'Manual entry');
});
test('customer capture alone and incomplete source checks cannot close the gap', () => {
  const state = TS.seed(NOW);
  TS.capture(state, 'context', contextInput, NOW);
  assert.equal(TS.assess(state, NOW).at(-1).status, 'Missing');
  assert.throws(() => TS.reviewContext(state, { ...checks, attribution: false }, NOW), /all three/);
  assert.throws(() => TS.reviewContext(state, { ...checks, note: ' ' }, NOW), /all three/);
  TS.reviewContext(state, checks, NOW);
  assert.equal(TS.assess(state, NOW).at(-1).status, 'Present');
  assert.equal(TS.packageFor(state, NOW).merchantReview, null);
});
test('follow-up records no send and never fabricates evidence', () => {
  const state = TS.seed(NOW);
  TS.request(state, 'context', NOW);
  assert.equal(state.evidence.context, undefined);
  assert.equal(TS.assess(state, NOW).at(-1).status, 'Missing');
  assert.match(state.requests[0].status, /nothing sent/);
});
test('future fulfillment becomes missing at its deadline and scheduling invalidates related records', () => {
  const state = complete(); approve(state);
  const due = '2026-10-01T12:00:00.000Z';
  TS.schedule(state, due, NOW);
  assert.equal(state.review, null);
  assert.equal(state.evidence.booking, undefined);
  assert.equal(state.evidence.fulfillment, undefined);
  assert.equal(TS.assess(state, NOW).find(row => row.id === 'fulfillment').status, 'Not yet due');
  assert.equal(TS.assess(state, due).find(row => row.id === 'fulfillment').status, 'Missing');
  assert.throws(() => TS.schedule(state, 'invalid', NOW), /valid date/);
  assert.throws(() => TS.schedule(state, '2020-01-01', NOW), /valid date/);
  assert.throws(() => approve(state), /Resolve/);
});
test('review gate enforces completeness, explicit approval and current revision', () => {
  assert.throws(() => approve(TS.seed(NOW)), /Resolve/);
  const state = complete();
  assert.throws(() => TS.finalize(state, { revision: state.revision, acknowledged: false }, NOW), /Merchant review/);
  assert.throws(() => TS.finalize(state, { revision: state.revision - 1, acknowledged: true }, NOW), /changed/);
  approve(state);
  const pkg = TS.packageFor(state, NOW);
  assert.match(pkg.status, /^Final/);
  assert.equal(pkg.merchantReview.revision, pkg.revision);
  assert.equal(pkg.target, TS.TARGET);
});
test('replacing evidence clears both customer source review and package approval', () => {
  const state = complete(); approve(state);
  const previousId = state.evidence.context.id;
  TS.capture(state, 'context', contextInput, NOW);
  assert.notEqual(state.evidence.context.id, previousId);
  assert.equal(state.evidence.context.contextReview, null);
  assert.equal(state.review, null);
  assert.match(TS.packageFor(state, NOW).status, /^Draft/);
  assert.equal(TS.assess(state, NOW).at(-1).status, 'Missing');
});
test('removal revokes review and exports an explicit gap without the removed content', () => {
  const state = complete(); approve(state);
  TS.remove(state, 'payment', NOW);
  const pkg = TS.packageFor(state, NOW);
  assert.equal(pkg.merchantReview, null);
  assert.ok(!pkg.evidence.some(item => item.requirementId === 'payment'));
  assert.equal(pkg.checklist[0].status, 'Missing');
});
test('upload bytes and complete provenance survive export without aliasing state', () => {
  const state = complete();
  const file = { name: 'fictional-receipt.txt', size: 4, type: 'text/plain', dataUrl: 'data:text/plain;base64,ZGVtbw==' };
  TS.capture(state, 'receipt', { ...contextInput, acquisition: 'Manual upload', file }, NOW);
  approve(state);
  const pkg = TS.packageFor(state, NOW);
  const item = pkg.evidence.find(row => row.requirementId === 'receipt');
  assert.deepEqual(item.file, file);
  assert.equal(item.origin, 'Merchant-reported');
  assert.equal(item.acquisition, 'Manual upload');
  assert.equal(item.capturedAt, NOW);
  pkg.transaction.amount = 0;
  assert.equal(state.transaction.amount, 3500000);
  assert.throws(() => TS.capture(state, 'receipt', { ...contextInput, acquisition: 'Manual upload', file: { ...file, size: TS.MAX_FILE_BYTES + 1 } }, NOW), /Provide/);
});

function uiHarness() {
  const nodes = { app: { innerHTML: '', addEventListener() {}, querySelector() { return null; } }, notice: { textContent: '' } };
  const sandbox = { window: { TransactionShield: TS, addEventListener() {} }, document: { getElementById: id => nodes[id], querySelectorAll: () => [] }, location: { hash: '#/record' }, setInterval() {}, console };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(require.resolve('./prototype-app.js'), 'utf8'), sandbox);
  return { sandbox, nodes, run: code => vm.runInContext(code, sandbox) };
}
test('all app views render, deep links fall back safely, and evidence content is escaped', () => {
  const { run, nodes } = uiHarness();
  assert.match(nodes.app.innerHTML, /4 of 5/);
  for (const route of ['record', 'review', 'policy', 'disputes', 'verify/old']) {
    run(`location.hash = '#/${route}'; render();`);
    assert.ok(nodes.app.innerHTML.length > 1000);
  }
  run(`TS.capture(state, 'context', { source: '<img src=x onerror=alert(1)>', acquisition: 'Manual entry', content: '<script>alert(1)</script>', fictional: true }); location.hash = '#/review'; render();`);
  assert.match(nodes.app.innerHTML, /&lt;script&gt;/);
  assert.ok(!nodes.app.innerHTML.includes('<img src=x'));
  assert.match(nodes.app.innerHTML, /disabled/);
});
test('review page transitions from incomplete draft to reviewed final, then back to draft on edit', () => {
  const { run, nodes } = uiHarness();
  run(`TS.capture(state, 'context', ${JSON.stringify(contextInput)}); TS.reviewContext(state, ${JSON.stringify(checks)}); location.hash = '#/review'; render();`);
  assert.match(nodes.app.innerHTML, /Draft — not final/);
  assert.ok(!nodes.app.innerHTML.includes('type="submit" disabled'));
  run('TS.finalize(state, { revision: renderedRevision, acknowledged: true }); render();');
  assert.match(nodes.app.innerHTML, /Finalized after merchant review/);
  run(`TS.remove(state, 'receipt'); render();`);
  assert.match(nodes.app.innerHTML, /Draft — not final/);
  assert.match(nodes.app.innerHTML, /type="submit" disabled/);
});
