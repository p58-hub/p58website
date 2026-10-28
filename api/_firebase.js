// Server-only Firebase access. Never expose service-account credentials to the browser.
import { cert, applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Firestore } from '@google-cloud/firestore';
import { IdentityPoolClient } from 'google-auth-library';
import { getVercelOidcToken } from '@vercel/oidc';

export function isFirebaseConfigured() {
  return Boolean((process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_WIF_AUDIENCE) || process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS);
}
function app() {
  const existing = getApps().find(app => app.name === 'p58');
  if (existing) return existing;
  if (!isFirebaseConfigured()) throw new Error('Firebase is not configured');
  const account = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    : process.env.FIREBASE_CLIENT_EMAIL ? {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    } : null;
  return initializeApp({
    credential: account ? cert(account) : applicationDefault(),
    ...(process.env.FIREBASE_PROJECT_ID ? { projectId: process.env.FIREBASE_PROJECT_ID } : {}),
  }, 'p58');
}
let federatedDb;
export const db = () => {
  if (!process.env.FIREBASE_WIF_AUDIENCE) return getFirestore(app());
  if (!federatedDb) {
    const authClient = new IdentityPoolClient({
      audience: process.env.FIREBASE_WIF_AUDIENCE,
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      token_url: 'https://sts.googleapis.com/v1/token',
      subject_token_supplier: { getSubjectToken: () => getVercelOidcToken() },
      scopes: ['https://www.googleapis.com/auth/datastore'],
    });
    federatedDb = new Firestore({ projectId: process.env.FIREBASE_PROJECT_ID, authClient, preferRest: true });
  }
  return federatedDb;
};
// Content is split into byte chunks below Firestore's 1 MiB document limit.
// A transaction makes both reads and writes atomic across the entire snapshot.
const CHUNK_SIZE = 400 * 1024;
const contentRef = (firestore, path) => firestore.collection('siteContent').doc(path === 'content/draft.json' ? 'draft' : 'published');
export async function readDocument(path, firestore = db()) {
  return firestore.runTransaction(async transaction => {
    const ref = contentRef(firestore, path);
    const manifest = await transaction.get(ref);
    if (!manifest.exists) return null;
    const count = manifest.data().chunks;
    if (!Number.isInteger(count) || count < 1 || count > 10) throw new Error('Invalid content manifest');
    const chunks = await transaction.getAll(...Array.from({ length: count }, (_, i) => ref.collection('chunks').doc(String(i))));
    if (chunks.some(chunk => !chunk.exists)) throw new Error('Incomplete content');
    return JSON.parse(Buffer.concat(chunks.map(chunk => chunk.data().bytes)).toString('utf8'));
  });
}
export async function writeDocument(path, value, { createOnly = false, firestore = db() } = {}) {
  const bytes = Buffer.from(JSON.stringify(value));
  const count = Math.ceil(bytes.length / CHUNK_SIZE);
  if (count > 10) throw new Error('Content exceeds supported size');
  await firestore.runTransaction(async transaction => {
    const ref = contentRef(firestore, path);
    const previous = await transaction.get(ref);
    if (createOnly && previous.exists) throw new Error('Firebase content already exists');
    for (let i = 0; i < count; i++) transaction.set(ref.collection('chunks').doc(String(i)), { bytes: bytes.subarray(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE) });
    for (let i = count; i < (previous.data()?.chunks || 0); i++) transaction.delete(ref.collection('chunks').doc(String(i)));
    transaction.set(ref, { chunks: count, updatedAt: value.updatedAt || new Date().toISOString() });
  });
}
export function storageError(res, error) {
  console.error('Firebase operation failed:', error.code || error.name);
  res.statusCode = 503;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ error: 'firebase_unavailable', message: 'Firebase could not save or load the data. Please try again.' }));
}
