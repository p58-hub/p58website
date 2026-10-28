import { writeFile } from "./_files.js";
import crypto from "node:crypto";
import { db, isFirebaseConfigured, storageError } from "./_firebase.js";
import { json } from "./_auth.js";
import {
  FILE_PREFIX,
  MAX_IMAGE_BYTES,
  decodeDataUrl,
  notConfigured,
  readIndex,
  readJsonBody,
  requireSession,
  safeName,
} from "./_media.js";


function cleanText(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export default async function handler(req, res) {
  if (!isFirebaseConfigured()) return notConfigured(res);

  const session = requireSession(req, res);
  if (!session) return; // 401 already sent

  try {
  if (req.method === "GET") return await listMedia(res);
  if (req.method === "POST") return await uploadMedia(req, res, session);
  if (req.method === "PATCH") return await updateMedia(req, res);
  if (req.method === "DELETE") return await deleteMedia(req, res);

  } catch (error) { return storageError(res, error); }
  res.setHeader("Allow", "GET, POST, PATCH, DELETE");
  return json(res, 405, { error: "method_not_allowed" });
}

/* ---------- GET ---------- */

async function listMedia(res) {
  const items = await readIndex();
  return json(res, 200, { items });
}

/* ---------- POST ---------- */

async function uploadMedia(req, res, session) {
  const body = await readJsonBody(req);
  if (!body) {
    return json(res, 413, {
      error: "body_too_large",
      message: "That image is too big to upload. Try a smaller file.",
    });
  }

  const decoded = decodeDataUrl(body.dataUrl);
  if (decoded.error) {
    const messages = {
      too_large:
        "That file is over " + Math.round(MAX_IMAGE_BYTES / 1024 / 1024) + "MB after processing. " +
        "Photos are shrunk automatically, but GIF and MP4 are uploaded as-is — compress or trim them first.",
      unsupported_type: "That file type isn't supported. Use JPEG, PNG, WebP, AVIF, GIF, SVG or MP4.",
    };
    return json(res, 400, {
      error: decoded.error,
      message: messages[decoded.error] || "That file couldn't be read as an image.",
    });
  }

  const filename = safeName(body.filename);
  const id = crypto.randomUUID();
  const blob = { url: '/api/media-file?id=' + id + '&name=' + encodeURIComponent(filename), pathname: FILE_PREFIX + id + '/' + filename };
  const item = {
    id,
    url: blob.url,
    pathname: blob.pathname,
    filename,
    contentType: decoded.contentType,
    size: decoded.buffer.length,
    width: Number.isFinite(body.width) ? body.width : null,
    height: Number.isFinite(body.height) ? body.height : null,
    projectId: cleanText(body.projectId, 120) || null,
    kind: body.kind === "logo" || body.kind === "icon" ? body.kind : "image",
    caption: cleanText(body.caption, 300),
    uploadedAt: new Date().toISOString(),
    uploadedBy: session.u,
  };

  try {
    await db().runTransaction(async transaction => {
      const reservation = db().collection('mediaNames').doc(filename);
      if ((await transaction.get(reservation)).exists) throw Object.assign(new Error('duplicate'), { code: 'duplicate' });
      writeFile(transaction, id, decoded.buffer, decoded.contentType);
      transaction.create(db().collection('media').doc(id), item);
      transaction.create(reservation, { id });
    });
  } catch (error) {
    if (error.code === 'duplicate') return json(res, 409, { error: 'duplicate_filename', message: 'A file with this name already exists.' });
    throw error;
  }

  return json(res, 201, { item });
}

/* ---------- PATCH ---------- */

async function updateMedia(req, res) {
  const body = await readJsonBody(req, 64 * 1024);
  const id = body && typeof body.id === "string" ? body.id : "";
  if (!id) return json(res, 400, { error: "missing_id", message: "The media item id is missing." });

  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return json(res, 400, { error: 'invalid_id' });
  if (!['projectId', 'caption', 'kind'].some(key => key in body)) return json(res, 400, { error: 'no_changes', message: 'No media changes were supplied.' });
  const ref = db().collection('media').doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return json(res, 404, { error: 'not_found' });
  const item = {};

  // projectId: a string assigns, null moves it back to the backlog.
  // Absent means "leave it alone", which is why this checks for the key.
  if ("projectId" in body) {
    item.projectId = body.projectId === null ? null : cleanText(body.projectId, 120) || null;
  }
  if ("caption" in body) item.caption = cleanText(body.caption, 300);
  if ("kind" in body) {
    item.kind = body.kind === "logo" || body.kind === "icon" ? body.kind : "image";
  }

  await ref.update(item);
  return json(res, 200, { item: { ...snapshot.data(), ...item, id } });
}

/* ---------- DELETE ---------- */

async function deleteMedia(req, res) {
  const url = new URL(req.url, "http://localhost");
  const id = url.searchParams.get("id") || "";
  if (!id) return json(res, 400, { error: "missing_id" });

  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return json(res, 400, { error: 'invalid_id' });
  const ref = db().collection('media').doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return json(res, 404, { error: 'not_found' });
  const item = snapshot.data();
  if (!item.pathname?.startsWith(FILE_PREFIX)) throw new Error('Invalid media path');
  const batch = db().batch();
  batch.delete(ref);
  const fileRef = db().collection('mediaFiles').doc(id);
  const file = await fileRef.get();
  for (let i = 0; i < (file.data()?.chunks || 0); i++) batch.delete(fileRef.collection('chunks').doc(String(i)));
  batch.delete(fileRef);
  batch.delete(db().collection('mediaNames').doc(item.filename));
  await batch.commit();
  return json(res, 200, { ok: true, id });
}
