import { json } from './_auth.js';
import { requireSession, readJsonBody, notConfigured } from './_media.js';
import { isFirebaseConfigured, db, storageError } from './_firebase.js';
import { DEFAULT_PROFILE, EMPTY_PROFILE, normalizeProfile, makeVCard, validCardId, fullName, ownerCardPath } from '../card/profile.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'PUT'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT');
    return json(res, 405, { error: 'method_not_allowed' });
  }
  const params = new URL(req.url, 'http://localhost').searchParams;
  const id = params.get('id') ?? 'georgios', list = params.get('list') === '1';
  if (!validCardId(id)) return json(res, 400, { error: 'invalid_card_id' });
  const session = req.method === 'PUT' || list ? requireSession(req, res) : null;
  if ((req.method === 'PUT' || list) && !session) return;
  if (req.method === 'PUT' && !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return json(res, 415, { error: 'json_required' });
  if (!isFirebaseConfigured()) {
    if (req.method === 'GET' && !list && id === 'georgios') return json(res, 200, { id, profile: DEFAULT_PROFILE, configured: false });
    return notConfigured(res);
  }
  const defaults = id === 'georgios' ? DEFAULT_PROFILE : EMPTY_PROFILE;
  function sendProfile(profile, updatedAt) {
    if (params.get('manifest') === '1') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/manifest+json');
      return res.end(JSON.stringify({ name: fullName(profile) + ' · Project58', short_name: fullName(profile), id: ownerCardPath(id), start_url: ownerCardPath(id), scope: '/card/', display: 'standalone', background_color: '#f7f5f0', theme_color: '#f7f5f0', icons: [{ src: '/card/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/card/icon-512.png', sizes: '512x512', type: 'image/png' }] }));
    }
    return json(res, 200, { id, profile, configured: true, updatedAt: updatedAt || null });
  }

  try {
    const collection = db().collection('businessCards');
    if (req.method === 'GET' && list) {
      const snapshot = await collection.limit(500).get();
      const cards = snapshot.docs.filter(doc => validCardId(doc.id)).map(doc => {
        const saved = doc.data();
        return { id: doc.id, memberId: saved.memberId || '', profile: normalizeProfile(saved.profile, doc.id === 'georgios' ? DEFAULT_PROFILE : EMPTY_PROFILE), updatedAt: saved.updatedAt || null };
      });
      if (!cards.some(card => card.id === 'georgios')) cards.unshift({ id: 'georgios', profile: DEFAULT_PROFILE, memberId: '', updatedAt: null });
      return json(res, 200, { cards, configured: true });
    }
    const ref = collection.doc(id);
    if (req.method === 'GET') {
      const snapshot = await ref.get(), saved = snapshot.exists ? snapshot.data() : null;
      if (!saved && id !== 'georgios') return json(res, 404, { error: 'card_not_found', message: 'Η κάρτα δεν είναι διαθέσιμη.' });
      return sendProfile(normalizeProfile(saved?.profile || defaults, defaults), saved?.updatedAt);
    }
    const body = await readJsonBody(req, 12 * 1024), p = body?.profile;
    const fields = Object.keys(DEFAULT_PROFILE).filter(key => !['photo', 'description'].includes(key));
    if (!p || typeof p !== 'object' || Array.isArray(p) || fields.some(key => typeof p[key] !== 'string' || p[key].length > 180) || (p.description !== undefined && (typeof p.description !== 'string' || p.description.length > 1000)) || (p.photo !== undefined && (typeof p.photo !== 'string' || p.photo.length > 2048)) || (body.memberId !== undefined && (typeof body.memberId !== 'string' || body.memberId.length > 180))) {
      return json(res, 400, { error: 'invalid_profile', message: 'Συμπλήρωσε τα στοιχεία της κάρτας με έγκυρες τιμές.' });
    }
    const profile = normalizeProfile(p, defaults);
    if ((!p.firstName.trim() && !p.lastName.trim()) || (p.email.trim() && !profile.email) || (p.website.trim() && !profile.website) || (p.photo?.trim() && !profile.photo) || (p.phone.trim() && !/^\+?\d{5,20}$/.test(profile.phone))) {
      return json(res, 400, { error: 'invalid_profile', message: 'Έλεγξε το όνομα, το email, το τηλέφωνο και τις διευθύνσεις website/φωτογραφίας.' });
    }
    if (Buffer.byteLength(makeVCard(profile)) > 2000) return json(res, 400, { error: 'profile_too_long', message: 'Συντόμευσε τα στοιχεία για να χωρούν στον QR επαφής.' });
    const updatedAt = new Date().toISOString();
    const saved = { profile, updatedAt, updatedBy: session.u, ...(body.memberId !== undefined ? { memberId: body.memberId } : {}) };
    if (body.create === true) {
      try { await ref.create(saved); } catch (error) {
        if (error.code === 6 || error.code === 'already-exists') return json(res, 409, { error: 'card_exists', message: 'Αυτός ο σύνδεσμος χρησιμοποιείται ήδη. Διάλεξε άλλον.' });
        throw error;
      }
    } else {
      if (id !== 'georgios' && !(await ref.get()).exists) return json(res, 404, { error: 'card_not_found', message: 'Η κάρτα δεν υπάρχει. Δημιούργησέ την από τις ρυθμίσεις.' });
      await ref.set(saved, { merge: true });
    }
    return json(res, 200, { ok: true, id, profile, updatedAt });
  } catch (error) { return storageError(res, error); }
}
