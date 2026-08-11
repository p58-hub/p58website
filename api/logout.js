/* ============================================================
   POST /api/logout — clears the session cookie.
   POST-only so a stray <img> or link can't sign you out.
   ============================================================ */

import { clearCookie, json } from "./_auth.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "method_not_allowed" });
  }

  res.setHeader("Set-Cookie", clearCookie());
  return json(res, 200, { ok: true });
}
