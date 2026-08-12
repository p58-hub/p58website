/* ============================================================
   /api/content — the site's content, shared by everyone

     GET -> 200 { content, updatedAt }   public
     PUT -> 200 { ok, updatedAt }        needs a session

   Until this existed the dashboard kept everything in
   localStorage, so an edit never left the browser that made it
   and every visitor fell back to the bundled defaults in
   data.jsx. One copy now lives in the same Blob store the images
   already use, at content/site.json.

   GET is deliberately open: an anonymous visitor has to be able
   to read it for the site to render. Nothing here is private —
   it is the same text and image URLs the site publishes anyway.

   Writes are last-one-wins. Two people saving at the same moment
   means the later save is the one kept, which is the right
   trade for a studio of this size and avoids a locking scheme
   nobody would ever see working.
   ============================================================ */

import { put, head } from "@vercel/blob";
import { json } from "./_auth.js";
import { isBlobConfigured, notConfigured, readJsonBody, requireSession } from "./_media.js";

const CONTENT_PATH = "content/site.json";

// The whole content document, JSON-encoded. Vercel caps a function request
// body at 4.5MB; this leaves room for the envelope around it. Content that
// still has base64 images inside it is what gets close to this — migrating
// them into the media library is what brings it back down.
const MAX_CONTENT_BYTES = 3.5 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method === "GET") return readContent(res);
  if (req.method === "PUT") return writeContent(req, res);

  res.setHeader("Allow", "GET, PUT");
  return json(res, 405, { error: "method_not_allowed" });
}

/* ---------- GET ----------
   Never fails: a missing store, an empty store or a corrupt
   document all answer 200 with content:null, which tells the site
   to use what it was bundled with. A visitor should never get a
   broken page because the dashboard has not saved anything yet. */

function sendContent(res, content, updatedAt) {
  // Cached at the edge, so an ordinary page view costs no function time.
  // Kept short because an edit should appear on the site quickly — and
  // stale-while-revalidate means the wait is never paid by a visitor.
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  res.end(JSON.stringify({ content: content || null, updatedAt: updatedAt || null }));
}

async function readContent(res) {
  if (!isBlobConfigured()) return sendContent(res, null, null);

  let url = null;
  try {
    const meta = await head(CONTENT_PATH);
    url = meta && meta.url ? meta.url : null;
  } catch {
    url = null; // nothing saved yet — not an error
  }
  if (!url) return sendContent(res, null, null);

  try {
    // Same cache-buster as the media index: a write can take a moment to
    // propagate through the CDN, and we want the copy we just made.
    const upstream = await fetch(url + "?t=" + Date.now(), { cache: "no-store" });
    if (!upstream.ok) return sendContent(res, null, null);

    const body = await upstream.json();
    return sendContent(res, body && body.content, body && body.updatedAt);
  } catch {
    return sendContent(res, null, null);
  }
}

/* ---------- PUT ---------- */

async function writeContent(req, res) {
  if (!isBlobConfigured()) return notConfigured(res);

  const session = requireSession(req, res);
  if (!session) return; // 401 already sent

  const body = await readJsonBody(req, 4 * 1024 * 1024);
  if (!body || typeof body.content !== "object" || body.content === null) {
    return json(res, 400, {
      error: "bad_content",
      message: "Expected a JSON body shaped { content: {...} }.",
    });
  }

  const updatedAt = new Date().toISOString();
  const payload = JSON.stringify({ content: body.content, updatedAt, updatedBy: session.u });

  if (Buffer.byteLength(payload, "utf8") > MAX_CONTENT_BYTES) {
    return json(res, 413, {
      error: "content_too_large",
      message:
        "The content is too big to publish. Move the remaining embedded images into the media library and try again.",
    });
  }

  await put(CONTENT_PATH, payload, {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });

  return json(res, 200, { ok: true, updatedAt });
}
