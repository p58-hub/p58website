/* ============================================================
   Project58 — shared auth helpers (Vercel Node function runtime)
   ------------------------------------------------------------
   Files prefixed with "_" are not exposed as routes by Vercel,
   so this module stays internal to /api.

   Two env vars drive everything (see AUTH_SETUP.md):
     SESSION_SECRET — random string, >= 32 chars, signs cookies
     P58_USERS      — JSON array of accounts, shape below

   P58_USERS (generate with `npm run account`):
     [{"u":"georgios","name":"Georgios","role":"admin",
       "iter":210000,"salt":"<hex>","hash":"<hex>"}]

   Roles: "admin" (everything) | "editor" (content only)
   ============================================================ */

import crypto from "node:crypto";

export const COOKIE_NAME = "p58_session";
export const DEFAULT_ITER = 210000;
export const ROLES = ["admin", "editor"];

const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = "sha256";

/* ---------- config ---------- */

// A missing or short secret means we fail CLOSED — never fall back to a
// hardcoded key, that would make every deploy trivially forgeable.
function getSecret() {
  const s = process.env.SESSION_SECRET;
  return typeof s === "string" && s.length >= 32 ? s : null;
}

function getUsers() {
  const raw = process.env.P58_USERS;
  if (!raw) return null;
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return null;
    return list.filter((u) => u && u.u && u.salt && u.hash);
  } catch {
    return null;
  }
}

export function isConfigured() {
  const users = getUsers();
  return Boolean(getSecret() && users && users.length);
}

/* ---------- passwords ---------- */

function pbkdf2(password, saltHex, iter) {
  return crypto.pbkdf2Sync(
    String(password),
    Buffer.from(saltHex, "hex"),
    iter || DEFAULT_ITER,
    PBKDF2_KEYLEN,
    PBKDF2_DIGEST
  );
}

function findUser(username) {
  const users = getUsers();
  if (!users) return null;
  const needle = String(username || "").trim().toLowerCase();
  if (!needle) return null;
  return users.find((u) => String(u.u).trim().toLowerCase() === needle) || null;
}

// Always does the same work whether or not the account exists, so
// response timing doesn't leak which usernames are real.
export function verifyCredentials(username, password) {
  const user = findUser(username);
  const target = user || {
    salt: "00000000000000000000000000000000",
    hash: "",
    iter: DEFAULT_ITER,
  };

  let derived;
  try {
    derived = pbkdf2(password, target.salt, target.iter);
  } catch {
    return null;
  }

  let expected;
  try {
    expected = Buffer.from(target.hash || "", "hex");
  } catch {
    expected = Buffer.alloc(0);
  }

  const ok =
    expected.length === derived.length && crypto.timingSafeEqual(derived, expected);

  if (!user || !ok) return null;

  return {
    u: String(user.u),
    name: user.name ? String(user.name) : String(user.u),
    role: ROLES.includes(user.role) ? user.role : "editor",
  };
}

/* ---------- session tokens ----------
   token = base64url(payloadJSON) + "." + base64url(HMAC-SHA256)
   The signing input is the ASCII base64url segment, so this file and
   the Web Crypto code in middleware.js sign the exact same bytes.
   ------------------------------------ */

function sign(input, secret) {
  return crypto.createHmac("sha256", secret).update(input).digest();
}

export function createToken(user, maxAgeSeconds) {
  const secret = getSecret();
  if (!secret) return null;

  const now = Date.now();
  const payload = {
    u: user.u,
    name: user.name,
    role: user.role,
    iat: now,
    exp: now + maxAgeSeconds * 1000,
  };

  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = sign(body, secret).toString("base64url");
  return body + "." + sig;
}

export function verifyToken(token) {
  const secret = getSecret();
  if (!secret || typeof token !== "string") return null;

  const dot = token.indexOf(".");
  if (dot <= 0) return null;

  const body = token.slice(0, dot);

  let given;
  try {
    given = Buffer.from(token.slice(dot + 1), "base64url");
  } catch {
    return null;
  }

  const expected = sign(body, secret);
  if (given.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(given, expected)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!payload || typeof payload.exp !== "number") return null;
  if (Date.now() >= payload.exp) return null;
  if (!ROLES.includes(payload.role)) return null;

  return payload;
}

/* ---------- cookies ---------- */

export function readCookie(req, name) {
  const header = req.headers && req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const kv = part.trim();
    const eq = kv.indexOf("=");
    if (eq > 0 && kv.slice(0, eq) === name) {
      try {
        return decodeURIComponent(kv.slice(eq + 1));
      } catch {
        return kv.slice(eq + 1);
      }
    }
  }
  return null;
}

export function sessionCookie(token, maxAgeSeconds) {
  return [
    COOKIE_NAME + "=" + encodeURIComponent(token),
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=" + maxAgeSeconds,
  ].join("; ");
}

export function clearCookie() {
  return [
    COOKIE_NAME + "=",
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0",
  ].join("; ");
}

/* ---------- small helpers ---------- */

export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export function readBody(req) {
  // Vercel usually parses JSON for us; fall back to the raw stream.
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  if (typeof req.body === "string") {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch {
      return Promise.resolve({});
    }
  }
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 10000) raw = raw.slice(0, 10000);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}
