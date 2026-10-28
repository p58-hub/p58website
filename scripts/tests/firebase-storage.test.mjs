import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
const documents = new Map();
let fail = false;
mock.module('firebase-admin/app', { namedExports: {
  getApps: () => [{ name: 'p58' }], cert: x => x, applicationDefault: () => ({}), initializeApp: () => ({}),
} });
const ref = path => ({ path, collection: name => ({ doc: id => ref(path + '/' + name + '/' + id) }) });
const snapshot = ref => ({ exists: documents.has(ref.path), data: () => documents.get(ref.path) });
const firestore = {
  collection: name => ({ doc: id => ref(name + '/' + id) }),
  async runTransaction(fn) {
    if (fail) throw new Error('unavailable');
    const writes = [];
    const result = await fn({
      get: async ref => snapshot(ref),
      getAll: async (...refs) => refs.map(snapshot),
      set: (ref, data) => writes.push(() => documents.set(ref.path, data)),
      delete: ref => writes.push(() => documents.delete(ref.path)),
    });
    writes.forEach(write => write());
    return result;
  },
};
mock.module('firebase-admin/firestore', { namedExports: { getFirestore: () => firestore } });
const { default: content } = await import('../../api/content.js');
const { createToken } = await import('../../api/_auth.js');
process.env.SESSION_SECRET = 'test-secret-with-at-least-thirty-two-characters';
process.env.FIREBASE_STORAGE_BUCKET = 'test';
process.env.FIREBASE_SERVICE_ACCOUNT_JSON = '{}';
const cookie = 'p58_session=' + createToken({ u: 'test', name: 'Test', role: 'admin' }, 60);
async function call(method, draft, body, authenticated = true) {
  const res = { setHeader() {}, end(raw) { this.body = JSON.parse(raw); } };
  await content({ method, url: '/api/content' + (draft ? '?draft=1' : ''), body, headers: authenticated ? { cookie } : {} }, res);
  return res;
}
test('saving drafts does not publish; publishing persists and anonymous GET omits author', async () => {
  assert.equal((await call('GET', false, null, false)).body.content, null);
  assert.equal((await call('PUT', true, { content: { title: 'Draft' } })).statusCode, 200);
  assert.equal((await call('GET', false, null, false)).body.content, null);
  assert.equal((await call('GET', true)).body.content.title, 'Draft');
  assert.equal((await call('PUT', false, { content: { title: 'Live' } })).statusCode, 200);
  const published = await call('GET', false, null, false);
  assert.equal(published.body.content.title, 'Live');
  assert.equal(published.body.updatedBy, undefined);
  assert.equal((await call('GET', true, null, false)).statusCode, 401);
});
test('storage failures never produce a success or empty-content response', async () => {
  fail = true;
  assert.equal((await call('PUT', false, { content: { title: 'Lost' } })).statusCode, 503);
  assert.equal((await call('GET', false)).statusCode, 503);
  fail = false;
  assert.equal((await call('GET', false)).body.content.title, 'Live');
});

test('multi-chunk content round trips and shrinking removes obsolete chunks', async () => {
  const large = 'α'.repeat(450000);
  assert.equal((await call('PUT', true, { content: { large } })).statusCode, 200);
  assert.equal((await call('GET', true)).body.content.large, large);
  assert.ok(documents.has('siteContent/draft/chunks/2'));
  await call('PUT', true, { content: { title: 'Small' } });
  assert.equal(documents.has('siteContent/draft/chunks/2'), false);
});

test('uploaded SVG is public media but scripts are sandboxed', async () => {
  const { default: mediaFile } = await import('../../api/media-file.js');
  const bytes = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  documents.set('mediaFiles/test-svg', { chunks: 1, contentType: 'image/svg+xml', size: bytes.length });
  documents.set('mediaFiles/test-svg/chunks/0', { bytes });
  const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, end(value) { this.body = value; } };
  await mediaFile({ method: 'GET', url: '/api/media-file?id=test-svg', headers: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['Content-Type'], 'image/svg+xml');
  assert.match(res.headers['Content-Security-Policy'], /^sandbox;/);
  assert.equal(res.headers['X-Content-Type-Options'], 'nosniff');
  assert.deepEqual(res.body, bytes);
});

test('video requests support byte ranges, suffixes and invalid offsets', async () => {
  const {default:mediaFile}=await import('../../api/media-file.js');
  const bytes=Buffer.from('0123456789');
  documents.set('mediaFiles/video-test',{chunks:1,contentType:'video/mp4',size:bytes.length});
  documents.set('mediaFiles/video-test/chunks/0',{bytes});
  for (const [range, expected, contentRange] of [['bytes=2-5','2345','bytes 2-5/10'],['bytes=7-','789','bytes 7-9/10'],['bytes=-3','789','bytes 7-9/10']]) {
    const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(body){this.body=body;}};
    await mediaFile({method:'GET',url:'/api/media-file?id=video-test',headers:{range}},res);
    assert.equal(res.statusCode,206);
    assert.equal(res.body.toString(),expected);
    assert.equal(res.headers['Content-Range'],contentRange);
    assert.equal(res.headers['Content-Length'],String(expected.length));
  }
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(body){this.body=body;}};
  await mediaFile({method:'GET',url:'/api/media-file?id=video-test',headers:{range:'bytes=30-40'}},res);
  assert.equal(res.statusCode,416);
  assert.equal(res.headers['Content-Range'],'bytes */10');
});

test('malformed inquiry answers are rejected before database writes', async () => {
  const {default:inquiries}=await import('../../api/inquiries.js');
  for (const answers of ['not an object',['wrong'],{}, {message:'   '}]) {
    const res={setHeader(){},end(body){this.body=JSON.parse(body);}};
    await inquiries({method:'POST',url:'/api/inquiries',headers:{},body:{answers}},res);
    assert.equal(res.statusCode,400);
  }
});

test('an empty media patch returns a client error instead of a Firebase failure', async () => {
  const {default:media}=await import('../../api/media.js');
  const res={setHeader(){},end(body){this.body=JSON.parse(body);}};
  await media({method:'PATCH',url:'/api/media',headers:{cookie},body:{id:'existing-file'}},res);
  assert.equal(res.statusCode,400);
  assert.equal(res.body.error,'no_changes');
});
