/* ============================================================
   Project58 — media library helpers (Vercel Node function runtime)
   ------------------------------------------------------------
   Files prefixed with "_" are not exposed as routes by Vercel,
   so this module stays internal to /api.

   Images are stored in Vercel Blob. A single index.json sitting
   next to them records what each image is and which project it
   belongs to. Keeping the assignment in the index — rather than
   in the pathname — means an image URL never changes when it is
   moved between a project and the backlog, so URLs already saved
   inside project content can't break.

     media/index.json   the library
     media/files/…      the images themselves

   Credentials arrive automatically once a Blob store is linked,
   in one of two shapes depending on how it was connected:

     BLOB_STORE_ID + VERCEL_OIDC_TOKEN   the current default
     BLOB_READ_WRITE_TOKEN               a static token

   The SDK picks whichever is present, preferring OIDC. Without
   either we fail closed — same principle as the auth code.
   ============================================================ */

import { put, head } from "@vercel/blob";
import { COOKIE_NAME, verifyToken, readCookie, json } from "./_auth.js";

export const INDEX_PATH = "media/index.json";
export const FILE_PREFIX = "media/files/";

// A decoded image larger than this is refused. Vercel caps a function
// request body at 4.5MB and base64 inflates by a third, so the client
// downscales before uploading and this is only a backstop.
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/svg+xml"];

function isSet(name) {
  const value = process.env[name];
  return typeof value === "string" && value.length > 0;
}

/* BLOB_STORE_ID is set at build time when the store is linked; the
   matching VERCEL_OIDC_TOKEN is injected into the function at run
   time, so only the store id is worth checking here. */
export function isBlobConfigured() {
  return isSet("BLOB_READ_WRITE_TOKEN") || isSet("BLOB_STORE_ID");
}

export function notConfigured(res) {
  return json(res, 503, {
    error: "blob_not_configured",
    message:
      "No Blob store is linked to this deployment. Create one in Vercel (Storage → Create → Blob, Public) and redeploy.",
  });
}

/* Any signed-in user may manage media. This is ordinary content
   work, the same as adding a project or a news item — the admin /
   editor split covers wiping and reshaping the whole dataset, not
   individual items. */
export function requireSession(req, res) {
  const payload = verifyToken(readCookie(req, COOKIE_NAME));
  if (!payload) {
    json(res, 401, { error: "no_session", message: "Sign in again." });
    return null;
  }
  return payload;
}

/* ---------- the index ---------- */

async function indexUrl() {
  try {
    const meta = await head(INDEX_PATH);
    return meta && meta.url ? meta.url : null;
  } catch {
    return null; // nothing uploaded yet — an empty library, not an error
  }
}

export async function readIndex() {
  const url = await indexUrl();
  if (!url) return [];

  // Public blobs are served through the CDN and a write can take up to a
  // minute to propagate. The cache-buster keeps reads consistent with the
  // write we just made.
  const res = await fetch(url + "?t=" + Date.now(), { cache: "no-store" });
  if (!res.ok) return [];

  try {
    const body = await res.json();
    return Array.isArray(body && body.items) ? body.items : [];
  } catch {
    return [];
  }
}

export async function writeIndex(items) {
  await put(INDEX_PATH, JSON.stringify({ items, updatedAt: new Date().toISOString() }, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
  return items;
}

/* ---------- uploads ---------- */

export function safeName(filename) {
  const raw = String(filename || "image").split(/[\\/]/).pop();
  const dot = raw.lastIndexOf(".");
  const stem = (dot > 0 ? raw.slice(0, dot) : raw)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const ext = (dot > 0 ? raw.slice(dot + 1) : "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
  return (stem || "image") + (ext ? "." + ext : "");
}

/* Turns the data: URL the browser produced back into bytes.
   Returns { buffer, contentType } or an { error } describing why not. */
export function decodeDataUrl(dataUrl) {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return { error: "not_a_data_url" };
  }

  const comma = dataUrl.indexOf(",");
  const header = dataUrl.slice(5, comma);
  if (comma < 0 || !header.includes("base64")) return { error: "not_base64" };

  const contentType = header.split(";")[0].toLowerCase();
  if (!ALLOWED_TYPES.includes(contentType)) return { error: "unsupported_type", contentType };

  let buffer;
  try {
    buffer = Buffer.from(dataUrl.slice(comma + 1), "base64");
  } catch {
    return { error: "bad_base64" };
  }

  if (!buffer.length) return { error: "empty" };
  if (buffer.length > MAX_IMAGE_BYTES) return { error: "too_large", size: buffer.length };

  return { buffer, contentType };
}

/* ---------- request body ----------
   Not reusing readBody() from _auth.js: that one truncates at 10kB,
   which is right for a login form and fatal for an image upload. */
export function readJsonBody(req, maxBytes = 6 * 1024 * 1024) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  if (typeof req.body === "string") {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch {
      return Promise.resolve(null);
    }
  }

  return new Promise((resolve) => {
    const chunks = [];
    let size = 0;
    let aborted = false;

    req.on("data", (chunk) => {
      if (aborted) return;
      size += chunk.length;
      if (size > maxBytes) {
        aborted = true;
        resolve(null); // too big — never silently truncate
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (aborted) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        resolve(null);
      }
    });
    req.on("error", () => resolve(null));
  });
}
