/* ============================================================
   Project58 — dashboard auth client
   ------------------------------------------------------------
   The real gate is middleware.js (edge) + /api/*. This file is
   the UI side of it: it resolves who is signed in, keeps an eye
   on expiry, and exposes the role capability map.

   Exposes window.P58Auth — loaded before dashboard.jsx.
   ============================================================ */

(function () {
  const LOGIN_PATH = "/login";

  /* ---------- roles ----------
     admin  — everything, including the actions that can wipe or
              reshape the whole site in one click.
     editor — day-to-day content. No Reset, no Import, no Site
              settings; can still add/edit/delete individual
              projects, news, team members and inquiries.
     -------------------------- */
  const CAPABILITIES = {
    admin: {
      content: true,
      heroGallery: true,
      siteSettings: true,
      importData: true,
      resetData: true,
    },
    editor: {
      content: true,
      heroGallery: true,
      siteSettings: false,
      importData: false,
      resetData: false,
    },
  };

  const ROLE_LABELS = { admin: "Admin", editor: "Editor" };

  function can(user, capability) {
    if (!user) return false;
    const caps = CAPABILITIES[user.role] || CAPABILITIES.editor;
    return Boolean(caps[capability]);
  }

  // Local dev runs off the plain Python static server, which has no
  // /api and no middleware. Gate the bypass strictly on hostname so it
  // can never trigger on a Vercel deploy (preview or production).
  function isLocalDev() {
    const h = location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "";
  }

  const DEV_USER = { u: "dev", name: "Local dev", role: "admin" };

  /* Resolve the current session.
     -> { state: "ok",    user }  signed in
        { state: "dev",   user }  local static server, no backend
        { state: "setup"        }  deployed but env vars missing
        { state: "anon"         }  not signed in */
  function fetchSession() {
    return fetch("/api/session", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then(function (res) {
        if (res.status === 503) return { state: "setup" };
        if (res.status === 401) return { state: "anon" };
        if (!res.ok) return isLocalDev() ? { state: "dev", user: DEV_USER } : { state: "anon" };

        return res
          .json()
          .then(function (body) {
            if (body && body.user) return { state: "ok", user: body.user, exp: body.exp };
            return { state: "anon" };
          })
          .catch(function () {
            // Static dev server answered with HTML, not JSON.
            return isLocalDev() ? { state: "dev", user: DEV_USER } : { state: "anon" };
          });
      })
      .catch(function () {
        return isLocalDev() ? { state: "dev", user: DEV_USER } : { state: "anon" };
      });
  }

  function goToLogin(reason) {
    const url = new URL(LOGIN_PATH, location.origin);
    url.searchParams.set("next", location.pathname);
    if (reason) url.searchParams.set("reason", reason);
    location.replace(url.toString());
  }

  function logout() {
    return fetch("/api/logout", { method: "POST", credentials: "same-origin" })
      .catch(function () { /* sign out locally regardless */ })
      .then(function () { location.replace(LOGIN_PATH); });
  }

  /* Poll while the tab is open so an expired session sends you back to
     the login page instead of silently failing later. */
  function watchSession(session, onLost) {
    if (session.state !== "ok") return function () {};

    const CHECK_MS = 5 * 60 * 1000;
    const tick = function () {
      if (document.hidden) return;
      fetchSession().then(function (next) {
        if (next.state !== "ok") onLost();
      });
    };

    const id = setInterval(tick, CHECK_MS);
    window.addEventListener("focus", tick);
    return function () {
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }

  window.P58Auth = {
    CAPABILITIES: CAPABILITIES,
    ROLE_LABELS: ROLE_LABELS,
    can: can,
    fetchSession: fetchSession,
    watchSession: watchSession,
    goToLogin: goToLogin,
    logout: logout,
    isLocalDev: isLocalDev,
  };
})();
