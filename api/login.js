/* ============================================================
   POST /api/login   { username, password, remember? }
   -> 200 { user } + HttpOnly session cookie
   -> 401 on bad credentials
   -> 503 if the deploy has no SESSION_SECRET / P58_USERS
   ============================================================ */

import {
  isConfigured,
  verifyCredentials,
  createToken,
  sessionCookie,
  json,
  readBody,
} from "./_auth.js";

const SESSION_HOURS = 8;
const REMEMBER_DAYS = 30;

/* Best-effort brute-force brake. Serverless instances are recycled and
   there can be several at once, so this slows an attacker down but is
   not a hard guarantee — the real protection is PBKDF2 + a strong
   password. */
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function rateLimited(ip) {
  const rec = attempts.get(ip);
  if (!rec || Date.now() - rec.first > WINDOW_MS) return false;
  return rec.count >= MAX_ATTEMPTS;
}

function noteFailure(ip) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.first > WINDOW_MS) attempts.set(ip, { first: now, count: 1 });
  else rec.count += 1;

  if (attempts.size > 5000) attempts.clear();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "method_not_allowed" });
  }

  if (!isConfigured()) {
    return json(res, 503, {
      error: "not_configured",
      message:
        "Set SESSION_SECRET and P58_USERS in the Vercel project settings, then redeploy.",
    });
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    res.setHeader("Retry-After", "900");
    return json(res, 429, {
      error: "too_many_attempts",
      message: "Too many sign-in attempts. Try again in 15 minutes.",
    });
  }

  const body = await readBody(req);
  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    noteFailure(ip);
    return json(res, 400, {
      error: "missing_fields",
      message: "Enter both a username and a password.",
    });
  }

  const user = verifyCredentials(username, password);
  if (!user) {
    noteFailure(ip);
    return json(res, 401, {
      error: "invalid_credentials",
      message: "That username and password don't match.",
    });
  }

  const maxAge =
    body.remember === true ? REMEMBER_DAYS * 24 * 60 * 60 : SESSION_HOURS * 60 * 60;

  const token = createToken(user, maxAge);
  if (!token) return json(res, 503, { error: "not_configured" });

  attempts.delete(ip);
  res.setHeader("Set-Cookie", sessionCookie(token, maxAge));
  return json(res, 200, { user, expiresIn: maxAge });
}
