/* ============================================================
   Project58 — edge gate for the dashboard
   ------------------------------------------------------------
   Runs before any static file is served, so an unauthenticated
   visitor cannot even download dashboard.html / .jsx / .css —
   not merely "can't see the UI". Without this the gate would
   live only in client JS, which anyone could strip.

   Verifies the same HMAC-SHA256 token api/_auth.js issues, via
   Web Crypto (node:crypto is not available in the edge runtime).

   Note: outside Next.js the handler gets a plain Request — there
   is no request.cookies, so the Cookie header is parsed by hand.
   ============================================================ */

import { next } from "@vercel/functions";

const COOKIE_NAME = "p58_session";
const LOGIN_PATH = "/login";

export const config = {
  matcher: ["/dashboard", "/dashboard.html", "/dashboard.jsx", "/dashboard.css"],
};

function readCookie(request, name) {
  const header = request.headers.get("cookie");
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

function b64urlToBytes(input) {
  let s = String(input).replace(/-/g, "+").replace(/_/g, "/");
  const rem = s.length % 4;
  if (rem === 2) s += "==";
  else if (rem === 3) s += "=";
  else if (rem === 1) return null;

  let bin;
  try {
    bin = atob(s);
  } catch {
    return null;
  }
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function verifyToken(token, secret) {
  if (typeof token !== "string") return null;

  const dot = token.indexOf(".");
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const sig = b64urlToBytes(token.slice(dot + 1));
  if (!sig) return null;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const valid = await crypto.subtle.verify("HMAC", key, sig, encoder.encode(body));
  if (!valid) return null;

  const payloadBytes = b64urlToBytes(body);
  if (!payloadBytes) return null;

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    return null;
  }

  if (!payload || typeof payload.exp !== "number") return null;
  if (Date.now() >= payload.exp) return null;

  return payload;
}

export default async function middleware(request) {
  const url = new URL(request.url);

  const toLogin = (reason) => {
    const target = new URL(LOGIN_PATH, url.origin);
    target.searchParams.set("next", url.pathname);
    if (reason) target.searchParams.set("reason", reason);
    return Response.redirect(target.toString(), 302);
  };

  // No secret configured => fail CLOSED. A deploy that forgot the env
  // var must lock everyone out, never let everyone in.
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return toLogin("setup");

  const token = readCookie(request, COOKIE_NAME);
  if (!token) return toLogin();

  const payload = await verifyToken(token, secret);
  if (!payload) return toLogin("expired");

  // Authenticated: let the static file through, but make sure no shared
  // cache ever stores a gated document.
  return next({
    headers: {
      "Cache-Control": "no-store, must-revalidate",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
