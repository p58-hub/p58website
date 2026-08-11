/* ============================================================
   GET /api/session
   -> 200 { user } when the session cookie is valid
   -> 401 otherwise
   The dashboard calls this on load to decide what to render.
   ============================================================ */

import { COOKIE_NAME, isConfigured, verifyToken, readCookie, json } from "./_auth.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "method_not_allowed" });
  }

  if (!isConfigured()) {
    return json(res, 503, {
      error: "not_configured",
      message:
        "Set SESSION_SECRET and P58_USERS in the Vercel project settings, then redeploy.",
    });
  }

  const payload = verifyToken(readCookie(req, COOKIE_NAME));
  if (!payload) return json(res, 401, { error: "no_session" });

  return json(res, 200, {
    user: { u: payload.u, name: payload.name, role: payload.role },
    exp: payload.exp,
  });
}
