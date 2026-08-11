/* ============================================================
   /api/media — the image library

     GET     -> 200 { items }            everything in the library
     POST    -> 201 { item }             upload one image
     PATCH   -> 200 { item }             assign to a project / caption
     DELETE  -> 200 { ok }               remove image + index entry

   All four require a valid session cookie. "Backlog" is not a
   separate place: it is simply every item whose projectId is null,
   so moving an image in or out of a project is a metadata change
   and the image URL never moves.

   Note the server can't validate projectId — the content lives in
   each browser's localStorage, not here. The dashboard sends ids it
   knows about, and any item pointing at a project that no longer
   exists surfaces in the UI as unassigned.
   ============================================================ */

import crypto from "node:crypto";
import { put, del } from "@vercel/blob";
import { json } from "./_auth.js";
import {
  FILE_PREFIX,
  MAX_IMAGE_BYTES,
  decodeDataUrl,
  isBlobConfigured,
  notConfigured,
  readIndex,
  readJsonBody,
  requireSession,
  safeName,
  writeIndex,
} from "./_media.js";

const ONE_YEAR = 365 * 24 * 60 * 60;

function cleanText(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export default async function handler(req, res) {
  if (!isBlobConfigured()) return notConfigured(res);

  const session = requireSession(req, res);
  if (!session) return; // 401 already sent

  if (req.method === "GET") return listMedia(res);
  if (req.method === "POST") return uploadMedia(req, res, session);
  if (req.method === "PATCH") return updateMedia(req, res);
  if (req.method === "DELETE") return deleteMedia(req, res);

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
        "That image is over " + Math.round(MAX_IMAGE_BYTES / 1024 / 1024) + "MB after processing. Try a smaller one.",
      unsupported_type: "That file type isn't supported. Use JPEG, PNG, WebP, AVIF, GIF or SVG.",
    };
    return json(res, 400, {
      error: decoded.error,
      message: messages[decoded.error] || "That file couldn't be read as an image.",
    });
  }

  const filename = safeName(body.filename);
  const blob = await put(FILE_PREFIX + filename, decoded.buffer, {
    access: "public",
    contentType: decoded.contentType,
    addRandomSuffix: true, // never collide, and lets the URL cache forever
    cacheControlMaxAge: ONE_YEAR,
  });

  const item = {
    id: crypto.randomUUID(),
    url: blob.url,
    pathname: blob.pathname,
    filename,
    contentType: decoded.contentType,
    size: decoded.buffer.length,
    width: Number.isFinite(body.width) ? body.width : null,
    height: Number.isFinite(body.height) ? body.height : null,
    projectId: cleanText(body.projectId, 120) || null,
    caption: cleanText(body.caption, 300),
    uploadedAt: new Date().toISOString(),
    uploadedBy: session.u,
  };

  const items = await readIndex();
  await writeIndex([item, ...items]);

  return json(res, 201, { item });
}

/* ---------- PATCH ---------- */

async function updateMedia(req, res) {
  const body = await readJsonBody(req, 64 * 1024);
  const id = body && typeof body.id === "string" ? body.id : "";
  if (!id) return json(res, 400, { error: "missing_id" });

  const items = await readIndex();
  const idx = items.findIndex((x) => x && x.id === id);
  if (idx < 0) return json(res, 404, { error: "not_found" });

  const item = { ...items[idx] };

  // projectId: a string assigns, null moves it back to the backlog.
  // Absent means "leave it alone", which is why this checks for the key.
  if ("projectId" in body) {
    item.projectId = body.projectId === null ? null : cleanText(body.projectId, 120) || null;
  }
  if ("caption" in body) item.caption = cleanText(body.caption, 300);

  const next = items.slice();
  next[idx] = item;
  await writeIndex(next);

  return json(res, 200, { item });
}

/* ---------- DELETE ---------- */

async function deleteMedia(req, res) {
  const url = new URL(req.url, "http://localhost");
  const id = url.searchParams.get("id") || "";
  if (!id) return json(res, 400, { error: "missing_id" });

  const items = await readIndex();
  const item = items.find((x) => x && x.id === id);
  if (!item) return json(res, 404, { error: "not_found" });

  // Drop the file first; if that fails we keep the index entry rather
  // than orphaning a blob nobody can see or clean up.
  try {
    await del(item.url);
  } catch {
    return json(res, 502, {
      error: "delete_failed",
      message: "Couldn't remove the file from storage. Nothing was changed.",
    });
  }

  await writeIndex(items.filter((x) => x && x.id !== id));
  return json(res, 200, { ok: true, id });
}
