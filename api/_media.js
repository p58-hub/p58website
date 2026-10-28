import { db } from "./_firebase.js";
import { COOKIE_NAME, verifyToken, readCookie, json } from "./_auth.js";

export const INDEX_PATH = "media/index.json";
export const FILE_PREFIX = "media/files/";

// A decoded file larger than this is refused. Vercel caps a function
// request body at 4.5MB and base64 inflates by a third, so the client
// downscales before uploading and this is only a backstop. Note that
// GIF and MP4 cannot be downscaled in the browser without losing the
// animation, so for those this ceiling is the real one.
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/svg+xml",
  "video/mp4",
];

export function notConfigured(res) {
  return json(res, 503, { error: "firebase_not_configured", message: "Firebase is not configured on the server. Set its server environment variables and redeploy." });
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

export async function readIndex() {
  const snapshot = await db().collection('media').orderBy('uploadedAt', 'desc').get();
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
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
  if (req.body && typeof req.body === "object") return Promise.resolve(Buffer.byteLength(JSON.stringify(req.body)) <= maxBytes ? req.body : null);
  if (typeof req.body === "string") {
    if (Buffer.byteLength(req.body) > maxBytes) return Promise.resolve(null);
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
