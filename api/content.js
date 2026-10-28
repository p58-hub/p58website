import { json } from './_auth.js';
import { notConfigured, readJsonBody, requireSession } from './_media.js';
import { isFirebaseConfigured, readDocument, writeDocument, storageError } from './_firebase.js';

export default async function handler(req, res) {
  const draft = new URL(req.url, 'http://localhost').searchParams.get('draft') === '1';
  if (!['GET', 'PUT'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT');
    return json(res, 405, { error: 'method_not_allowed' });
  }
  const session = (draft || req.method === 'PUT') ? requireSession(req, res) : null;
  if ((draft || req.method === 'PUT') && !session) return;
  if (!isFirebaseConfigured()) return notConfigured(res);
  const path = draft ? 'content/draft.json' : 'content/site.json';
  try {
    if (req.method === 'GET') {
      const saved = await readDocument(path);
      return json(res, 200, { content: saved?.content || null, updatedAt: saved?.updatedAt || null });
    }
    const body = await readJsonBody(req, 4 * 1024 * 1024);
    if (!body || !body.content || typeof body.content !== 'object' || Array.isArray(body.content)) {
      return json(res, 400, { error: 'bad_content', message: 'Expected { content: {...} }.' });
    }
    const updatedAt = new Date().toISOString();
    const payload = { content: body.content, updatedAt, updatedBy: session.u };
    if (Buffer.byteLength(JSON.stringify(payload)) > 3.5 * 1024 * 1024) {
      return json(res, 413, { error: 'content_too_large', message: 'Move embedded images into the media library before saving.' });
    }
    await writeDocument(path, payload);
    return json(res, 200, { ok: true, updatedAt });
  } catch (error) { return storageError(res, error); }
}
