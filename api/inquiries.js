import crypto from 'node:crypto';
import { json } from './_auth.js';
import { db, isFirebaseConfigured, storageError } from './_firebase.js';
import { readJsonBody, requireSession, notConfigured } from './_media.js';

export default async function handler(req, res) {
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return json(res, 405, { error: 'method_not_allowed' });
  }
  if (req.method !== 'POST' && !requireSession(req, res)) return;
  if (!isFirebaseConfigured()) return notConfigured(res);
  try {
    const collection = db().collection('inquiries');
    if (req.method === 'GET') {
      const snapshot = await collection.orderBy('createdAt', 'desc').get();
      return json(res, 200, { items: snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) });
    }
    if (req.method === 'POST') {
      const body = await readJsonBody(req, 64 * 1024);
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json(res, 400, { error: 'bad_inquiry' });
      const isRecord = value => value && typeof value === 'object' && !Array.isArray(value);
      if (!isRecord(body.answers) || (body.questionLabels !== undefined && !isRecord(body.questionLabels))) {
        return json(res, 400, { error: 'bad_inquiry', message: 'Answers and labels must be objects.' });
      }
      const item = {};
      // Custom form fields are strings; metadata is always server-owned.
      for (const [key, value] of Object.entries(body)) {
        if (!['id', 'status', 'createdAt', 'answers', 'questionLabels', '__proto__', 'constructor', 'prototype'].includes(key) && typeof value === 'string') item[key] = value.slice(0, 5000);
      }
      for (const key of ['answers', 'questionLabels']) {
        item[key] = Object.fromEntries(Object.entries(body[key] || {}).filter(([k, v]) => k.length <= 120 && typeof v === 'string').slice(0, 100).map(([k, v]) => [k, v.slice(0, 5000)]));
      }
      if (!Object.values(item.answers).some(value => value.trim())) return json(res, 400, { error: 'empty_inquiry', message: 'Complete the form before sending.' });
      item.id = crypto.randomUUID();
      item.createdAt = Date.now();
      item.status = 'new';
      await collection.doc(item.id).create(item);
      return json(res, 201, { ok: true, id: item.id });
    }
    const body = req.method === 'PATCH' ? await readJsonBody(req, 4096) : null;
    const id = req.method === 'DELETE' ? new URL(req.url, 'http://localhost').searchParams.get('id') : body?.id;
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id || '')) return json(res, 400, { error: 'invalid_id' });
    if (req.method === 'DELETE') await collection.doc(id).delete();
    else {
      if (!['new', 'read'].includes(body.status)) return json(res, 400, { error: 'invalid_status' });
      await collection.doc(id).update({ status: body.status });
    }
    return json(res, 200, { ok: true });
  } catch (error) { return storageError(res, error); }
}
