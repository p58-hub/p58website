# Dashboard login — setup

The dashboard at `/dashboard` is private. This is real server-side auth, not a
JavaScript prompt: `middleware.js` runs at Vercel's edge **before** any file is
served, so without a valid session cookie you can't even download
`dashboard.html`, `dashboard.jsx` or `dashboard.css`.

**Until you do the three steps below, the dashboard is locked for everyone —
including you.** That's deliberate: a deploy missing its secret fails closed
rather than open.

---

## 1. Generate a session secret

```bash
npm install && npm run secret
```

Copy the printed value.

## 2. Generate an account

```bash
npm run account
```

It asks for a username, display name, role, and password (typing is hidden),
then prints a JSON entry. The password itself is never stored anywhere — only a
PBKDF2-SHA256 hash with a random salt.

Run it once per person. Collect the entries into a single JSON array:

```json
[
  {"u":"georgios","name":"Georgios","role":"admin","iter":210000,"salt":"…","hash":"…"},
  {"u":"maria","name":"Maria","role":"editor","iter":210000,"salt":"…","hash":"…"}
]
```

## 3. Add both to Vercel

Vercel dashboard → your project → **Settings → Environment Variables**. Add
these for **Production** (and Preview, if you want previews reachable):

| Name             | Value                                  |
| ---------------- | -------------------------------------- |
| `SESSION_SECRET` | the string from step 1                 |
| `P58_USERS`      | the JSON array from step 2, on one line |

Then **redeploy** — env vars only apply to new deployments.

Sign in at `https://project58.gr/login`.

---

## Roles

| | admin | editor |
|---|---|---|
| Projects, Categories, News, Team | ✅ | ✅ |
| Inquiries | ✅ | ✅ |
| Hero gallery | ✅ | ✅ |
| Export JSON | ✅ | ✅ |
| Site settings | ✅ | — |
| Import JSON | ✅ | — |
| Reset to defaults | ✅ | — |

Editors can still add, edit and delete individual items — that's ordinary
content work. What they can't do is the one-click actions that replace or wipe
the entire dataset, or change global site settings.

To change someone's role, regenerate their entry (or just edit the `"role"`
field in `P58_USERS`) and redeploy. To revoke someone, delete their object from
the array and redeploy — existing cookies keep working until they expire, so
also rotate `SESSION_SECRET` if you need it immediate. Rotating the secret signs
everyone out.

---

## How it works

| File | Role |
|---|---|
| `middleware.js` | Edge gate. Verifies the cookie before the dashboard files are served; redirects to `/login` otherwise. |
| `api/login.js` | Checks credentials, sets a signed `HttpOnly` cookie. |
| `api/session.js` | Tells the dashboard who is signed in. |
| `api/logout.js` | Clears the cookie. |
| `api/_auth.js` | Shared crypto. The `_` prefix keeps it off the public routes. |
| `auth.jsx` | Client side: role capability map, expiry watch, sign-out. |
| `login.html` | The sign-in page. Public by design. |

Session cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, signed with HMAC-SHA256.
8 hours by default, 30 days with "keep me signed in". Passwords are PBKDF2-SHA256,
210,000 iterations. Failed logins are rate-limited to 10 per 15 minutes per IP
(best effort — serverless instances aren't shared, so treat a strong password as
the real defence).

## Local development

The local Python server (`.claude/launch.json`) serves static files only — there
is no `/api` and no middleware. So on `localhost` the dashboard **bypasses login**
and signs you in as a local admin, with an orange notice in the corner as a
reminder. That bypass is gated strictly on the hostname being `localhost` /
`127.0.0.1`, so it can never trigger on a Vercel deployment, preview or production.

To exercise the real login flow, use `vercel dev` (it runs the functions and
middleware locally) with the two env vars set in `.env.local`.

## One thing this does not protect

Dashboard content lives in each browser's own `localStorage`, not on a server.
The login controls **who can reach the dashboard**; it isn't a shared database.
Two people signing in on different machines still see their own local content
until it's exported and imported. Changing that means adding real storage —
worth doing, but a separate piece of work.
