// Copies legacy JSON into Firestore; media bytes and URLs remain in Vercel Blob.
// Usage: node scripts/migrate-firebase.mjs content-backup.json media-index.json
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { db, readDocument, writeDocument } from '../api/_firebase.js';
export async function migrate(content, items, firestore = db()) {
  if (await readDocument('content/site.json', firestore)) throw new Error('Firebase content already exists; refusing to overwrite.');
  for (const item of items) {
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(item.id) || !item.filename || item.filename.includes('/')) throw new Error('Invalid media metadata');
    await firestore.runTransaction(async transaction => {
      const ref = firestore.collection('media').doc(item.id);
      const name = firestore.collection('mediaNames').doc(item.filename);
      const [old, reserved] = await transaction.getAll(ref, name);
      if (old.exists && old.data().url !== item.url) throw new Error('Conflicting media id');
      if (reserved.exists && reserved.data().id !== item.id) throw new Error('Conflicting filename');
      if (!old.exists) transaction.create(ref, item);
      transaction.set(name, { id: item.id });
    });
  }
  if (content?.content) await writeDocument('content/site.json', content, { createOnly: true, firestore });
  console.log('Migrated', items.length, 'media records; published content:', Boolean(content?.content));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [contentFile, mediaFile] = process.argv.slice(2);
  if (!contentFile || !mediaFile) throw new Error('Provide a content backup and media index JSON file.');
  await migrate(JSON.parse(fs.readFileSync(contentFile)), JSON.parse(fs.readFileSync(mediaFile)).items || []);
}
