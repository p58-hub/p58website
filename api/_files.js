import { db } from './_firebase.js';
export const FILE_CHUNK_SIZE = 400 * 1024;
export function writeFile(transaction, id, buffer, contentType) {
  const ref = db().collection('mediaFiles').doc(id);
  const count = Math.ceil(buffer.length / FILE_CHUNK_SIZE);
  for (let i = 0; i < count; i++) transaction.set(ref.collection('chunks').doc(String(i)), { bytes: buffer.subarray(i * FILE_CHUNK_SIZE, (i + 1) * FILE_CHUNK_SIZE) });
  transaction.set(ref, { chunks: count, contentType, size: buffer.length });
}
export async function readFile(id) {
  return db().runTransaction(async transaction => {
    const ref = db().collection('mediaFiles').doc(id);
    const manifest = await transaction.get(ref);
    if (!manifest.exists) return null;
    const file = manifest.data();
    if (!Number.isInteger(file.chunks) || file.chunks < 1 || file.chunks > 8) throw new Error('Invalid file manifest');
    const docs = await transaction.getAll(...Array.from({ length: file.chunks }, (_, i) => ref.collection('chunks').doc(String(i))));
    if (docs.some(doc => !doc.exists)) throw new Error('Incomplete file');
    return { ...file, buffer: Buffer.concat(docs.map(doc => doc.data().bytes)) };
  });
}
