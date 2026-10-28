import test from 'node:test';
import assert from 'node:assert/strict';
import content from '../../api/content.js';
import media from '../../api/media.js';
import inquiries from '../../api/inquiries.js';
import { createToken } from '../../api/_auth.js';
import { readJsonBody } from '../../api/_media.js';

process.env.SESSION_SECRET = 'test-secret-with-at-least-thirty-two-characters';
const cookie = 'p58_session=' + createToken({ u: 'test', name: 'Test', role: 'admin' }, 60);
async function call(handler, method, url, body, authenticated = false) {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(value) { this.body = JSON.parse(value); } };
  await handler({ method, url, body, headers: authenticated ? { cookie } : {} }, res);
  return res;
}
test('private content and inquiry operations require a session', async () => {
  for (const [handler, method, url] of [[content, 'GET', '/api/content?draft=1'], [content, 'PUT', '/api/content'], [inquiries, 'GET', '/api/inquiries'], [inquiries, 'PATCH', '/api/inquiries'], [inquiries, 'DELETE', '/api/inquiries?id=x']]) {
    assert.equal((await call(handler, method, url)).statusCode, 401);
  }
});
test('missing Firebase is a visible failure, never a successful empty document', async () => {
  for (const name of ['FIREBASE_STORAGE_BUCKET', 'FIREBASE_SERVICE_ACCOUNT_JSON', 'FIREBASE_CLIENT_EMAIL', 'GOOGLE_APPLICATION_CREDENTIALS']) delete process.env[name];
  for (const [handler, method, url] of [[content, 'GET', '/api/content'], [content, 'PUT', '/api/content'], [media, 'GET', '/api/media'], [inquiries, 'POST', '/api/inquiries']]) {
    const res = await call(handler, method, url, {}, true);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.error, 'firebase_not_configured');
  }
});
test('parsed JSON bodies cannot bypass size limits', async () => {
  assert.equal(await readJsonBody({ body: { text: 'x'.repeat(100) } }, 20), null);
  assert.equal(await readJsonBody({ body: JSON.stringify({ text: 'x'.repeat(100) }) }, 20), null);
  assert.deepEqual(await readJsonBody({ body: { ok: true } }, 20), { ok: true });
});
test('unsupported methods do not modify content', async () => {
  assert.equal((await call(content, 'DELETE', '/api/content', {}, true)).statusCode, 405);
});
