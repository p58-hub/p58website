import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PROFILE, EMPTY_PROFILE } from '../../card/profile.js';
let configured = true, fail = false;
const stored = new Map();
function ref(id) { return {
  async get() { if (fail) throw new Error('unavailable'); return { exists: stored.has(id), data: () => stored.get(id) }; },
  async set(value, options) { if (fail) throw new Error('unavailable'); stored.set(id, { ...(options?.merge ? stored.get(id) : {}), ...value }); },
  async create(value) { if (stored.has(id)) throw Object.assign(new Error('exists'), { code: 6 }); await this.set(value); },
}; }
mock.module('../../api/_firebase.js', { namedExports: {
  isFirebaseConfigured: () => configured,
  db: () => ({ collection(name) { assert.equal(name, 'businessCards'); return { doc: ref, limit: () => ({ async get() { return { docs: [...stored].map(([id, value]) => ({ id, data: () => value })) }; } }) }; } }),
  storageError(res) { res.statusCode = 503; res.end(JSON.stringify({ error: 'firebase_unavailable' })); },
}});
const { default: handler } = await import('../../api/card.js');
const { createToken } = await import('../../api/_auth.js');
process.env.SESSION_SECRET = 'card-test-secret-at-least-thirty-two-characters';
const cookie = 'p58_session=' + createToken({ u: 'test', role: 'admin' }, 60);
async function call(method, body, auth = false, query = '', contentType = 'application/json') {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(body) { this.body = JSON.parse(body); } };
  await handler({ method, url: '/api/card' + query, body, headers: { 'content-type': contentType, ...(auth ? { cookie } : {}) } }, res);
  return res;
}
test('public reads expose only profile; writes and listing require a session', async () => {
  assert.equal((await call('PUT', { profile: DEFAULT_PROFILE })).statusCode, 401);
  assert.equal((await call('GET', null, false, '?list=1')).statusCode, 401);
  assert.equal((await call('PUT', { profile: DEFAULT_PROFILE }, true, '', 'text/plain')).statusCode, 415);
  assert.equal((await call('DELETE', {}, true)).statusCode, 405);
  const write = await call('PUT', { profile: { ...DEFAULT_PROFILE, phone: '+306901234567' } }, true);
  assert.equal(write.statusCode, 200);
  const read = await call('GET');
  assert.equal(read.body.profile.phone, '+306901234567');
  assert.equal(read.body.updatedBy, undefined);
  assert.equal(read.headers['Cache-Control'], 'no-store');
});
test('member creation is isolated, duplicate-safe and never substitutes the founder', async () => {
  const profile = { ...EMPTY_PROFILE, firstName: 'Naveen', lastName: 'Kumar', title: 'Architect', photo: '/assets/people/naveen-kumar.png' };
  const original = stored.get('georgios');
  assert.equal((await call('GET', null, false, '?id=missing')).statusCode, 404);
  assert.equal((await call('PUT', { profile }, true, '?id=naveen')).statusCode, 404);
  assert.equal((await call('PUT', { profile, create: true, memberId: 'tm2' }, true, '?id=naveen')).statusCode, 200);
  assert.equal((await call('PUT', { profile, create: true }, true, '?id=naveen')).statusCode, 409);
  assert.equal(stored.get('georgios'), original);
  const read = await call('GET', null, false, '?id=naveen');
  assert.equal(read.body.profile.firstName, 'Naveen'); assert.equal(read.body.profile.email, ''); assert.equal(read.body.memberId, undefined);
  const list = await call('GET', null, true, '?list=1');
  assert.equal(list.body.cards.find(card => card.id === 'naveen').memberId, 'tm2');
  assert.ok(list.body.cards.every(card => !card.updatedBy));
  const manifest = await call('GET', null, false, '?id=naveen&manifest=1');
  assert.equal(manifest.body.start_url, '/card/member/naveen');
  assert.equal(manifest.headers['Content-Type'], 'application/manifest+json');
});
test('malformed IDs and unsafe photo URLs are rejected without overwrites', async () => {
  const before = stored.get('georgios');
  for (const query of ['?id=../other', '?id=a%2Fb', '?id=', '?id=UPPER']) assert.equal((await call('GET', null, false, query)).statusCode, 400);
  for (const patch of [{ photo: 'javascript:alert(1)' }, { photo: '//evil.test/pic' }, { email: 'broken' }, { website: 'javascript:alert(1)' }, { phone: '++--' }, { firstName: '', lastName: '' }]) {
    assert.equal((await call('PUT', { profile: { ...DEFAULT_PROFILE, ...patch } }, true)).statusCode, 400);
    assert.equal(stored.get('georgios'), before);
  }
});
test('descriptions publish, reload, validate and clear while older clients remain supported', async () => {
  const description = 'Αρχιτεκτονική και σχεδιασμός.\n' + 'α'.repeat(900);
  const profile = { ...EMPTY_PROFILE, firstName: 'Naveen', description };
  const write = await call('PUT', { profile }, true, '?id=naveen');
  assert.equal(write.statusCode, 200);
  assert.equal((await call('GET', null, false, '?id=naveen')).body.profile.description, description);
  assert.equal((await call('GET', null, true, '?list=1')).body.cards.find(card => card.id === 'naveen').profile.description, description);
  for (const invalid of ['x'.repeat(1001), 42, null]) {
    assert.equal((await call('PUT', { profile: { ...profile, description: invalid } }, true, '?id=naveen')).statusCode, 400);
    assert.equal(stored.get('naveen').profile.description, description);
  }
  assert.equal((await call('PUT', { profile: { ...profile, description: '' } }, true, '?id=naveen')).statusCode, 200);
  assert.equal((await call('GET', null, false, '?id=naveen')).body.profile.description, '');
  delete profile.description;
  assert.equal((await call('PUT', { profile }, true, '?id=naveen')).statusCode, 200);
});
test('storage errors fail closed and unconfigured member routes do not leak founder defaults', async () => {
  fail = true;
  assert.equal((await call('PUT', { profile: DEFAULT_PROFILE }, true)).statusCode, 503);
  fail = false; configured = false;
  assert.equal((await call('GET')).body.configured, false);
  assert.equal((await call('GET', null, false, '?id=naveen')).statusCode, 503);
  assert.equal((await call('PUT', { profile: DEFAULT_PROFILE }, true)).statusCode, 503);
});
