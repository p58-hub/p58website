import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';

const source = fs.readFileSync('dashboard.jsx', 'utf8');
const component = parse(source, { sourceType: 'script', plugins: ['jsx'] }).program.body
  .find(node => node.type === 'FunctionDeclaration' && node.id.name === 'ProjectAddressField');
const effect = component.body.body.find(node => node.type === 'ExpressionStatement' && node.expression.callee?.name === 'useEffect').expression.arguments[0];

function harness({ address = 'Ακαδημίας 56, Αθήνα 10679', located = false } = {}) {
  const state = { busy: false, results: [], status: '', changes: [], requests: [], timer: null };
  const request = { current: 0 };
  const context = vm.createContext({
    address, located, request, AbortController,
    changeRef: { current: value => state.changes.push(value) },
    setBusy: value => { state.busy = value; },
    setResults: value => { state.results = value; },
    setStatus: value => { state.status = value; },
    setTimeout: (callback, delay) => { state.timer = callback; state.delay = delay; return 1; },
    clearTimeout: () => { state.timer = null; },
    fetch: (url, options) => new Promise((resolve, reject) => state.requests.push({ url, options, resolve, reject })),
  });
  const cleanup = vm.runInContext(`(${source.slice(effect.start, effect.end)})()`, context);
  return { state, request, cleanup };
}
const match = { lat: 37.98, lng: 23.73, label: 'Ακαδημίας 56', approximate: false };
const respond = (pending, results) => pending.resolve({ ok: true, json: async () => ({ results }) });

test('address lookup waits for typing to pause and automatically saves the first match with alternatives', async () => {
  const { state } = harness({ address: '  Ακαδημίας 56, Αθήνα 10679  ' });
  assert.equal(state.requests.length, 0);
  assert.ok(state.delay >= 1000);
  const pending = state.timer();
  assert.equal(state.busy, true);
  assert.equal(JSON.parse(state.requests[0].options.body).address, 'Ακαδημίας 56, Αθήνα 10679');
  respond(state.requests[0], [match, { ...match, lat: 38 }]);
  await pending;
  assert.equal(state.changes[0].coordinates.lat, match.lat);
  assert.equal(state.changes[0].coordinates.address, 'Ακαδημίας 56, Αθήνα 10679');
  assert.equal(state.results.length, 2);
  assert.equal(state.busy, false);
});

test('saved pins and short addresses do not trigger a lookup', () => {
  assert.equal(harness({ located: true }).state.timer, null);
  assert.equal(harness({ address: '  abc  ' }).state.timer, null);
});

test('changing the address or closing the editor cancels pending work and ignores a late response', async () => {
  const waiting = harness();
  waiting.cleanup();
  assert.equal(waiting.state.timer, null);
  assert.equal(waiting.state.requests.length, 0);
  const { state, cleanup } = harness();
  const pending = state.timer();
  cleanup();
  assert.equal(state.requests[0].options.signal.aborted, true);
  respond(state.requests[0], [match]);
  await pending;
  assert.equal(state.changes.length, 0);
  assert.equal(state.results.length, 0);
});

test('manual pin placement invalidates a lookup before its response arrives', async () => {
  const { state, request } = harness();
  const pending = state.timer();
  request.current += 1;
  respond(state.requests[0], [match]);
  await pending;
  assert.equal(state.changes.length, 0);
  assert.equal(state.status, '');
});

test('empty results and failed requests leave coordinates unset and display feedback', async () => {
  for (const failure of [false, true]) {
    const { state } = harness();
    const pending = state.timer();
    if (failure) state.requests[0].reject(new Error('Lookup unavailable'));
    else respond(state.requests[0], []);
    await pending;
    assert.equal(state.changes.length, 0);
    assert.equal(state.busy, false);
    assert.ok(state.status.length > 0);
  }
});
