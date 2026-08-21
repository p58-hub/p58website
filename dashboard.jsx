// =========================================================
// Project58 Dashboard — content admin
// =========================================================
// Manages Projects / News / Team. Every change is written
// twice: to localStorage under "p58_data_v1" straight away,
// and then to /api/content, which is the copy the live site
// serves to everyone else.
//
// The local write is what makes editing feel instant and
// survive a closed tab; the publish is what makes the edit
// real. Without a Blob store linked only the first happens,
// which is the old behaviour — edits visible in this browser
// alone. See MEDIA_SETUP.md.
// =========================================================

const { useState, useEffect, useMemo, useRef, Fragment } = React;

const STORE_KEY = "p58_data_v1";
const INQUIRY_STORE_KEY = "p58_inquiries_v1";
const PROJECT_PREVIEW_PREFIX = "p58_project_preview_v1:";
const GALLERY_VIEW_KEY = "p58_gallery_view";

/* ---------- Seed data (defaults from data.jsx) ---------- */
const DEFAULT_SITE = window.DEFAULT_SITE_SETTINGS || {
  contact: {
    location_label: "ATHENS",
    address: "Akademias 76 · 106 76",
    address_url: "",
    phone: "+30 210 000 5800",
    phone_url: "tel:+302100005800",
    email: "g.grigoriadis@project58.gr",
    email_url: "mailto:g.grigoriadis@project58.gr",
    instagram_text: "Instagram → @project.58",
    instagram_url: "",
  },
};
const normaliseSite = window.normaliseSiteSettings || ((site) => ({ ...DEFAULT_SITE, ...(site || {}) }));
// Defined in data.jsx so the public site renders the same list the dashboard edits.
const DEFAULT_CATEGORIES = window.DEFAULT_CATEGORIES;
const slugifyId = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const normaliseSubcategories = (subs) => (Array.isArray(subs) ? subs : [])
  .map((s, order) => {
    const label = (typeof s === "string" ? s : (s && s.label)) || "";
    return {
      id: (s && s.id) || slugifyId(label) || newId("sub"),
      label: label || (s && s.id) || "Sub-category",
      order: Number.isFinite(Number(s && s.order)) ? Number(s.order) : order,
      // The badge this brand shows beside its projects. Empty means the
      // lettered monogram, which is also the fallback for a broken URL.
      icon: (s && s.icon) || "",
    };
  })
  .filter((s) => s.label)
  .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
const normaliseCategories = (items) => {
  const source = Array.isArray(items) && items.length ? items : DEFAULT_CATEGORIES;
  return source
    .map((c, order) => ({
      id: c.id || slugifyId(c.label) || newId("cat"),
      label: c.label || c.id || "Category",
      description: c.description || "",
      order: Number.isFinite(Number(c.order)) ? Number(c.order) : order,
      subLabel: c.subLabel || "Sub-category",
      subcategories: normaliseSubcategories(c.subcategories),
    }))
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
};
const seed = () => ({
  projects: (window.PROJECTS || []).map((p, order) => ({
    slug: p.slug || p.id,
    category: p.category || p.typology || "retail",
    order: p.order != null ? p.order : order,
    featured: p.featured != null ? p.featured : order < 6,
    visible: p.visible !== false,
    ...p,
    body: p.body.map((b) => [...b]),
    gallery: p.gallery.map((g) => ({ ...g })),
  })),
  news: (window.NEWS || []).map((n) => ({ ...n })),
  team: (window.TEAM || []).map((t) => ({ ...t })),
  categories: normaliseCategories(DEFAULT_CATEGORIES),
  site: normaliseSite(DEFAULT_SITE),
});

/* Shapes a stored document into what the dashboard expects, patching up
   older shapes as it goes. Takes the raw object rather than reading storage
   itself, because the same document can now arrive from two places: this
   browser's localStorage, or /api/content. Returns null if it isn't one. */
const normaliseStored = (stored) => {
  try {
    if (stored && stored.projects && stored.news && stored.team) {
      const projects = stored.projects.map((p) => ({
        ...p,
        slug: !p.slug || p.slug === p.id ? descriptiveProjectSlug(p) : p.slug,
        visible: p.visible !== false,
      }));
      const team = stored.team.map((member, order) => ({ ...member, order: member.order != null ? member.order : order }));
      if (team[0] && team[0].name === "Nikos Andreadis") {
        team[0] = { ...team[0], name: "Georgios Grigoriadis", role: "Founder", role_gr: "Ιδρυτής", note: "Founder of Project58, leading the studio’s architectural direction and project delivery.", note_gr: "Ιδρυτής του Project58, με ευθύνη για την αρχιτεκτονική κατεύθυνση και την υλοποίηση των έργων του γραφείου.", portrait: "assets/people/georgios-grigoriadis.jpg" };
      } else if (team[0] && team[0].name === "Georgios Grigoriadis" && !team[0].portrait) {
        team[0] = { ...team[0], portrait: "assets/people/georgios-grigoriadis.jpg" };
      }
      if (team[1] && team[1].name === "Eleni Karali") {
        team[1] = { ...team[1], name: "Naveen Kumar", role: "Architect", role_gr: "Αρχιτέκτονας", note: "Architect working across concept design, development, and detailed coordination.", note_gr: "Αρχιτέκτονας με αντικείμενο τον σχεδιασμό, την ανάπτυξη και τον λεπτομερή συντονισμό των έργων.", portrait: "assets/people/naveen-kumar.png" };
      }
      if (team[2] && team[2].name === "Dimitris Vlachos") {
        team[2] = { ...team[2], name: "Evagelos Kastavenakis", role: "Architect", role_gr: "Αρχιτέκτονας", note: "Architect focused on spatial development, material research, and project execution.", note_gr: "Αρχιτέκτονας με έμφαση στη χωρική ανάπτυξη, την έρευνα υλικών και την υλοποίηση έργων.", portrait: "assets/people/evagelos-kastavenakis.png" };
      }
      const categories = normaliseCategories(stored.categories).map((cat) => {
        if (cat.subcategories && cat.subcategories.length) return cat;
        const brands = [...new Set(projects.filter((p) => (p.category || p.typology || "retail") === cat.id).map((p) => (p.brand || "").trim()).filter(Boolean))];
        if (!brands.length) return cat;
        return {
          ...cat,
          subLabel: cat.subLabel && cat.subLabel !== "Sub-category" ? cat.subLabel : "Brand",
          subcategories: brands.map((b, order) => ({ id: slugifyId(b) || newId("sub"), label: b, order })),
        };
      });
      return { ...stored, projects, team, categories, site: normaliseSite(stored.site || DEFAULT_SITE) };
    }
  } catch (e) { /* not a usable document */ }
  return null;
};

const load = () => {
  try {
    const normalised = normaliseStored(JSON.parse(localStorage.getItem(STORE_KEY) || "null"));
    if (normalised) return normalised;
  } catch (e) { /* fallthrough */ }
  return seed();
};

/* What the site is currently showing everyone. Resolves null when there is
   nothing published yet, no Blob store, or no API at all. */
const fetchPublished = () =>
  fetch("/api/content?t=" + Date.now(), { credentials: "same-origin", cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((body) => (body && body.content ? normaliseStored(body.content) : null))
    .catch(() => null);

const persist = (data) => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
  catch (e) { alert("Couldn't save — localStorage is full. Try removing some images."); }
};

/* Publishing is what makes an edit visible to anyone other than this browser.
   localStorage above stays the immediate, offline-safe copy; this uploads the
   same document to /api/content, which the live site reads.

   Resolves "unconfigured" rather than throwing when no Blob store is linked —
   that is a setup state, not an error, and the old localStorage-only
   behaviour is still perfectly usable in it. */
const publishContent = (data) =>
  fetch("/api/content", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ content: data }),
  })
    .then((res) => {
      if (res.ok) return "published";
      // 503 is "no Blob store linked"; the rest are what a deployment with no
      // /api at all answers, such as the static local preview. None of them
      // are failures worth alarming about — the local save still stands.
      if ([503, 404, 405, 501].includes(res.status)) return "unconfigured";
      if (res.status === 401) throw new Error("Session expired — sign in again to publish");
      return res.json().catch(() => null).then((body) => {
        throw new Error((body && body.message) || "Couldn't publish (" + res.status + ")");
      });
    })
    // A rejected fetch means offline or no server answering — same story.
    .catch((err) => {
      if (err instanceof TypeError) return "unconfigured";
      throw err;
    });

const newId = (prefix) => prefix + "-" + Math.random().toString(36).slice(2, 8);
const slugify = (value) => String(value || "")
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");
const descriptiveProjectSlug = window.projectSlugFromFields || ((project) => slugify([project.name, project.location].filter(Boolean).join(" ")));

/* ---------- Icons ---------- */
const Ic = {
  plus:   <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg>,
  trash:  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M3 4l.6 8.2A1 1 0 0 0 4.6 13h4.8a1 1 0 0 0 1-0.8L11 4"/><line x1="2" y1="4" x2="12" y2="4"/><path d="M5.5 4V2.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1V4"/></svg>,
  upload: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 9V2M4 5l3-3 3 3"/><path d="M2 9v2.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9"/></svg>,
  download: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 2v7M4 6l3 3 3-3"/><path d="M2 9v2.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9"/></svg>,
  external: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 2H2v10h10V9"/><path d="M8 2h4v4M12 2L7 7"/></svg>,
  reset: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7a5 5 0 1 0 1.5-3.5"/><path d="M2 2v3h3"/></svg>,
  close: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg>,
  grip: <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="5" cy="3" r="1.15"/><circle cx="9" cy="3" r="1.15"/><circle cx="5" cy="7" r="1.15"/><circle cx="9" cy="7" r="1.15"/><circle cx="5" cy="11" r="1.15"/><circle cx="9" cy="11" r="1.15"/></svg>,
  grid: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1.75" y="1.75" width="4" height="4" rx="1"/><rect x="8.25" y="1.75" width="4" height="4" rx="1"/><rect x="1.75" y="8.25" width="4" height="4" rx="1"/><rect x="8.25" y="8.25" width="4" height="4" rx="1"/></svg>,
  rows: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="2" y1="3.5" x2="12" y2="3.5"/><line x1="2" y1="7" x2="12" y2="7"/><line x1="2" y1="10.5" x2="12" y2="10.5"/></svg>,
};

/* ============================================================
   MEDIA LIBRARY — client for /api/media
   ------------------------------------------------------------
   Images live in Vercel Blob, not localStorage. The library keeps
   the assignment (which project an image belongs to) server-side,
   so "backlog" is just projectId === null.
   ============================================================ */

/* Uploads are downscaled in the browser first. A phone photo is
   easily 6MB, a Vercel function body caps at 4.5MB, and the site
   never displays anything wider than ~2400px anyway. */
const MEDIA_MAX_DIM = 2400;
const MEDIA_QUALITY = 0.85;

/* ------------------------------------------------------------
   Upload registry
   ------------------------------------------------------------
   Each uploader used to own a private `busy` boolean, which was
   enough to grey out its own button and useless to anything else.
   The projects list needs to know that a given project is still
   uploading, and the header needs the total across all of them —
   neither can reach into a component's local state.

   So progress lives here instead, keyed by project id, and the
   views subscribe. Uploads outside a project editor (the media
   library's own picker) report under BACKLOG_KEY.
   ------------------------------------------------------------ */
const BACKLOG_KEY = "__backlog__";

const uploadRegistry = {
  state: {},          // key -> { done, total }
  subs: new Set(),

  subscribe(fn) { this.subs.add(fn); return () => this.subs.delete(fn); },
  emit() { const snap = JSON.parse(JSON.stringify(this.state)); this.subs.forEach((fn) => fn(snap)); },

  begin(key, total) {
    const k = key || BACKLOG_KEY;
    const current = this.state[k] || { done: 0, total: 0 };
    // Adding to an in-flight batch rather than replacing it: picking more
    // files while the first lot is still going is normal, not a restart.
    this.state[k] = { done: current.done, total: current.total + (total || 1) };
    this.emit();
  },
  step(key) {
    const k = key || BACKLOG_KEY;
    const current = this.state[k];
    if (!current) return;
    current.done = Math.min(current.total, current.done + 1);
    if (current.done >= current.total) delete this.state[k];
    this.emit();
  },
};

/* Subscribes a component to the registry. Returns { byKey, done, total }. */
function useUploads() {
  const [byKey, setByKey] = useState({});
  useEffect(() => uploadRegistry.subscribe(setByKey), []);
  return useMemo(() => {
    let done = 0;
    let total = 0;
    Object.keys(byKey).forEach((k) => { done += byKey[k].done; total += byKey[k].total; });
    return { byKey, done, total, active: total > 0 };
  }, [byKey]);
}

/* Types that must reach the server byte-for-byte: rasterising a vector only
   makes it worse, and pushing a GIF or an MP4 through a canvas would flatten
   it to a single still frame. These skip the downscale, so the size ceiling
   applies to the original file. */
const MEDIA_PASSTHROUGH = ["image/svg+xml", "image/gif", "video/mp4"];
// Matches MAX_IMAGE_BYTES in api/_media.js — the server's backstop, which for
// these types is the only limit there is.
const MEDIA_PASSTHROUGH_MAX_BYTES = 3 * 1024 * 1024;

function mediaFileType(file) {
  const reported = String((file && file.type) || "").toLowerCase();
  if ([
    "image/jpeg", "image/png", "image/webp", "image/avif",
    "image/svg+xml", "image/gif", "video/mp4",
  ].includes(reported)) return reported;
  const name = String((file && file.name) || "").toLowerCase();
  if (name.endsWith(".svg")) return "image/svg+xml";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".mp4")) return "video/mp4";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".avif")) return "image/avif";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return "";
}

function downscaleImage(file) {
  return new Promise((resolve, reject) => {
    const inputType = mediaFileType(file);
    if (MEDIA_PASSTHROUGH.includes(inputType)) {
      // Caught here rather than at the server so the message can say why.
      if (file.size > MEDIA_PASSTHROUGH_MAX_BYTES) {
        reject(new Error(
          file.name + " is " + (file.size / 1024 / 1024).toFixed(1) + "MB. " +
          (inputType === "video/mp4" ? "MP4" : inputType === "image/gif" ? "GIF" : "SVG") +
          " files are uploaded as-is to keep them intact, so they have to be under " +
          Math.round(MEDIA_PASSTHROUGH_MAX_BYTES / 1024 / 1024) + "MB. Compress or trim it first."
        ));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "").replace(/^data:;base64,/, `data:${inputType};base64,`);
        resolve({ dataUrl, width: null, height: null });
      };
      reader.onerror = () => reject(new Error("Couldn't read " + file.name));
      reader.readAsDataURL(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const longest = Math.max(img.naturalWidth, img.naturalHeight) || 1;
      const scale = Math.min(1, MEDIA_MAX_DIM / longest);
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      // PNG keeps its transparency; everything else is far smaller as JPEG.
      const type = inputType === "image/png" ? "image/png" : "image/jpeg";
      resolve({ dataUrl: canvas.toDataURL(type, MEDIA_QUALITY), width: w, height: h });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Couldn't read " + file.name + " as an image."));
    };
    img.src = objectUrl;
  });
}

async function mediaFetch(url, options) {
  const res = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    ...(options || {}),
  });

  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    /* the local static server answers with HTML, not JSON */
  }

  // Every one of these routes answers with JSON. Anything else means we
  // never reached the function — the local static server rewrites unknown
  // paths to index.html and answers 200 with HTML, which would otherwise
  // read as a perfectly empty library rather than a missing backend.
  if (!res.ok || body === null) {
    const err = new Error((body && body.message) || "That didn't work. Try again.");
    err.status = res.status;
    err.code = (body && body.error) || "no_backend";

    if (body === null) {
      err.code = window.P58Auth.isLocalDev() ? "local_dev" : "no_backend";
      err.message = window.P58Auth.isLocalDev()
        ? "The media library needs the Vercel backend, which the local preview server doesn't run. Use `vercel dev` or the deployed site."
        : "The server didn't answer with JSON. The deployment may still be building.";
    }
    throw err;
  }
  return body;
}

const MEDIA_INDEX_CACHE_KEY = "p58_media_index_cache_v1";
let mediaMemoryItems = (() => {
  try {
    const cached = JSON.parse(localStorage.getItem(MEDIA_INDEX_CACHE_KEY) || "null");
    return cached && Array.isArray(cached.items) ? cached.items : [];
  } catch (err) { return []; }
})();
let mediaListPromise = null;

function cachedMediaItems() {
  return mediaMemoryItems.slice();
}

function cacheMediaItems(items) {
  mediaMemoryItems = Array.isArray(items) ? items.slice() : [];
  try {
    localStorage.setItem(MEDIA_INDEX_CACHE_KEY, JSON.stringify({ items: mediaMemoryItems, savedAt: Date.now() }));
  } catch (err) { /* the dashboard still works without the speed cache */ }
  return mediaMemoryItems;
}

function listMedia(force) {
  if (!force && mediaMemoryItems.length) return Promise.resolve({ items: cachedMediaItems(), cached: true });
  if (mediaListPromise) return mediaListPromise;
  mediaListPromise = mediaFetch("/api/media")
    .then((body) => {
      cacheMediaItems((body && body.items) || []);
      return body;
    })
    .finally(() => { mediaListPromise = null; });
  return mediaListPromise;
}

const mediaApi = {
  list: (force) => listMedia(!!force),
  upload: (payload) =>
    mediaFetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((body) => {
      if (body && body.item) cacheMediaItems([body.item, ...mediaMemoryItems.filter((item) => item.id !== body.item.id)]);
      return body;
    }),
  update: (payload) =>
    mediaFetch("/api/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((body) => {
      if (body && body.item) cacheMediaItems(mediaMemoryItems.map((item) => item.id === body.item.id ? body.item : item));
      return body;
    }),
  remove: (id) => mediaFetch("/api/media?id=" + encodeURIComponent(id), { method: "DELETE" })
    .then((body) => {
      cacheMediaItems(mediaMemoryItems.filter((item) => item.id !== id));
      return body;
    }),
};

async function updateMediaWithRetry(payload, verify) {
  let lastError = null;
  const waits = [0, 250, 750, 1500];
  for (const wait of waits) {
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    try {
      const body = await mediaApi.update(payload);
      if (!verify || verify(body && body.item)) return body;
      lastError = new Error("The Media API did not confirm the change.");
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("The Media change could not be saved.");
}

/* Every library file a project points at — hero, badge and gallery. */
function projectMediaUrls(project) {
  const urls = [project.hero, project.icon];
  (project.gallery || []).forEach((g) => urls.push(g && g.src));
  return urls.filter((u) => typeof u === "string" && u && !u.startsWith("data:"));
}

/* Using a file in a project takes it out of the backlog. Only unassigned
   items are claimed, so a file already filed under another project stays
   where it is rather than being pulled back and forth. */
async function claimBacklogForProject(project) {
  const urls = new Set(projectMediaUrls(project));
  if (!urls.size || !project.id) return 0;

  let items;
  try {
    const body = await mediaApi.list();
    items = (body && body.items) || [];
  } catch (err) {
    return 0; // library unreachable (local dev, no blob store) — nothing to file
  }

  let claimed = 0;
  for (const item of items) {
    if (item.projectId || !urls.has(item.url)) continue;
    try {
      await mediaApi.update({ id: item.id, projectId: project.id });
      claimed += 1;
    } catch (err) { /* leave it in the backlog rather than failing the save */ }
  }
  return claimed;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function normaliseMediaFilename(filename) {
  const raw = String(filename || "image").split(/[\\/]/).pop();
  const dot = raw.lastIndexOf(".");
  const stem = (dot > 0 ? raw.slice(0, dot) : raw)
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const ext = (dot > 0 ? raw.slice(dot + 1) : "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
  return (stem || "image") + (ext ? "." + ext : "");
}

/* ============================================================
   ROOT APP
   ============================================================ */
function App({ session }) {
  const user = session.user;
  const can = (capability) => window.P58Auth.can(user, capability);

  const [data, setData] = useState(load);
  const [section, setSection] = useState("projects");
  const [textsProject, setTextsProject] = useState("all");
  const [editing, setEditing] = useState(null); // { kind, id|null }
  const [toast, setToast] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [inquiries, setInquiries] = useState(() => { try { return JSON.parse(localStorage.getItem(INQUIRY_STORE_KEY) || "[]"); } catch (e) { return []; } });
  const [viewInquiry, setViewInquiry] = useState(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const goSection = (s) => { setSection(s); setSideOpen(false); };
  const goProjectTexts = (id = "all") => { setTextsProject(id); setEditing(null); goSection("texts"); };

  useEffect(() => {
    if (!accountOpen) return undefined;

    const closeAccount = (event) => {
      if (event.type === "keydown" && event.key === "Escape") {
        setAccountOpen(false);
        return;
      }
      if (event.type === "mousedown" && !accountRef.current?.contains(event.target)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", closeAccount);
    document.addEventListener("keydown", closeAccount);
    return () => {
      document.removeEventListener("mousedown", closeAccount);
      document.removeEventListener("keydown", closeAccount);
    };
  }, [accountOpen]);

  /* Adopt whatever is published before anything can be edited. Without this,
     opening the dashboard on a second computer would start from that
     machine's own localStorage — possibly the untouched seed — and the first
     edit would publish it straight over the real content.

     setDirty is deliberately not called: adopting is not an edit, and
     marking it dirty would publish a copy of what we just downloaded. */
  const dirtyRef = useRef(false);
  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);

  /* Publishing state, kept separate from the toast. A toast that has already
     faded cannot answer "did that reach the site?", and that is exactly the
     question worth being able to answer at any moment. */
  const [publishState, setPublishState] = useState({ status: "idle", message: "" });

  /* The last thing we know the site is serving. Comparing against it is what
     tells us which projects carry unpublished edits — "dirty" only says that
     something changed somewhere, which is no use per row. */
  const [publishedSnapshot, setPublishedSnapshot] = useState(null);

  const uploads = useUploads();

  // Warm the small media index as soon as the dashboard opens. The Library
  // picker can then paint instantly, while this request refreshes its cache
  // in the background long before the user needs it.
  useEffect(() => { mediaApi.list(true).catch(() => {}); }, []);

  const pendingIds = useMemo(() => {
    const projects = data.projects || [];
    // Nothing published yet: everything is pending, by definition.
    if (!publishedSnapshot) return projects.map((p) => p.id);
    const live = new Map((publishedSnapshot.projects || []).map((p) => [p.id, JSON.stringify(p)]));
    return projects.filter((p) => live.get(p.id) !== JSON.stringify(p)).map((p) => p.id);
  }, [data.projects, publishedSnapshot]);

  /* Whether anything at all differs from what the site is serving. pendingIds
     only watches projects, but settings, team, news and categories are just as
     publishable — the button has to appear for those too. */
  const hasUnpublishedChanges = useMemo(
    () => (publishedSnapshot ? JSON.stringify(data) !== JSON.stringify(publishedSnapshot) : true),
    [data, publishedSnapshot]
  );

  /* The button is only worth showing when pressing it would do something —
     plus while a publish is in flight, has failed, or is waiting on uploads,
     since those all still need somewhere to report. */
  const showPublish =
    hasUnpublishedChanges ||
    uploads.active ||
    publishState.status === "busy" ||
    publishState.status === "error";

  const runPublish = (payload) => {
    setPublishState({ status: "busy", message: "Publishing…" });
    return publishContent(payload)
      .then((result) => {
        const ok = result === "published";
        if (ok) setPublishedSnapshot(payload);
        setPublishState({
          status: ok ? "ok" : "warn",
          message: ok
            ? "Published " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Not published — saved on this device only",
        });
        return result;
      })
      .catch((err) => {
        setPublishState({ status: "error", message: err.message });
        throw err;
      });
  };

  /* Publishing one project still sends the whole document — that is the only
     shape /api/content takes. What makes it "one project" is the base: we
     start from what is already live and swap in just this project, so edits
     to the others stay unpublished. */
  const publishOneProject = (id) => {
    const project = (data.projects || []).find((p) => p.id === id);
    if (!project) return Promise.resolve();
    if (!publishedSnapshot) return runPublish(data); // nothing live yet — seed it

    const live = publishedSnapshot.projects || [];
    const at = live.findIndex((p) => p.id === id);
    const projects = at >= 0
      ? live.map((p) => (p.id === id ? project : p))
      : [...live, project];

    return runPublish({ ...publishedSnapshot, projects });
  };

  /* The sheet's own Publish: store the edit, then push just this project live.
     Going through the same document update keeps the two paths identical —
     the only difference is that this one does not wait to be asked twice. */
  const onSaveAndPublishProject = (proj) => {
    onSaveProject(proj);
    const live = publishedSnapshot ? (publishedSnapshot.projects || []) : null;
    if (!live) {
      const projects = (data.projects || []).some((p) => p.id === proj.id)
        ? (data.projects || []).map((p) => (p.id === proj.id ? proj : p))
        : [proj, ...(data.projects || [])];
      return runPublish({ ...data, projects }).catch(() => {});
    }
    const at = live.findIndex((p) => p.id === proj.id);
    const projects = at >= 0 ? live.map((p) => (p.id === proj.id ? proj : p)) : [...live, proj];
    return runPublish({ ...publishedSnapshot, projects }).catch(() => {});
  };

  useEffect(() => {
    let cancelled = false;
    fetchPublished().then((published) => {
      if (cancelled || !published) return;
      setPublishedSnapshot(published); // safe even mid-edit: it is what the site has
      if (dirtyRef.current) return;    // edited while in flight
      persist(published);              // keep the local copy in step
      setData(published);
    });
    return () => { cancelled = true; };
  }, []);

  // keep inquiries in sync with new submissions from the live site
  useEffect(() => {
    const refresh = () => { try { setInquiries(JSON.parse(localStorage.getItem(INQUIRY_STORE_KEY) || "[]")); } catch (e) { /* ignore */ } };
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("focus", refresh); };
  }, []);
  const persistInquiries = (list) => { setInquiries(list); try { localStorage.setItem(INQUIRY_STORE_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ } };
  const deleteInquiry = (id) => { if (!confirm("Delete this inquiry? This cannot be undone.")) return; persistInquiries(inquiries.filter((x) => x.id !== id)); setViewInquiry(null); };
  const setInquiryStatus = (id, status) => persistInquiries(inquiries.map((x) => x.id === id ? { ...x, status } : x));

  /* Saving and publishing are deliberately two steps. Every change is
     written to localStorage at once, so nothing is ever lost — but it only
     reaches the live site when Publish is pressed. That keeps half-finished
     edits off the site, and makes going live something you decide rather
     than something that happens 1.2 seconds after you stop typing. */
  useEffect(() => {
    if (!dirty) return;
    persist(data);
    setToast("Saved — ready to publish");
    setPublishState({ status: "pending", message: "Ready to publish" });
  }, [data, dirty]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const update = (next) => { setData(next); setDirty(true); };

  /* ----- handlers ----- */
  const onSaveProject = (proj) => {
    const exists = data.projects.findIndex((p) => p.id === proj.id);
    const projects = exists >= 0
      ? data.projects.map((p, i) => i === exists ? proj : p)
      : [proj, ...data.projects];
    update({ ...data, projects: projects.map((p, order) => ({ ...p, order })) });
    setEditing(null);
    claimBacklogForProject(proj).then((n) => {
      if (n) setToast(n === 1 ? "1 file filed under this project" : n + " files filed under this project");
    });
  };
  const onSaveCategory = (category) => {
    const nextCategory = {
      ...category,
      id: (category.id || category.label || newId("cat")).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    };
    const exists = data.categories.findIndex((c) => c.id === nextCategory.id);
    const categories = exists >= 0
      ? data.categories.map((c, i) => i === exists ? nextCategory : c)
      : [...data.categories, { ...nextCategory, order: data.categories.length }];
    update({ ...data, categories: normaliseCategories(categories) });
    setEditing(null);
  };
  const onMoveCategory = (id, dir) => {
    const idx = data.categories.findIndex((c) => c.id === id);
    const nextIdx = idx + dir;
    if (idx < 0 || nextIdx < 0 || nextIdx >= data.categories.length) return;
    const categories = data.categories.slice();
    const tmp = categories[idx];
    categories[idx] = categories[nextIdx];
    categories[nextIdx] = tmp;
    update({ ...data, categories: categories.map((c, order) => ({ ...c, order })) });
  };
  const onMoveProject = (id, dir) => {
    const idx = data.projects.findIndex((p) => p.id === id);
    const nextIdx = idx + dir;
    if (idx < 0 || nextIdx < 0 || nextIdx >= data.projects.length) return;
    const projects = data.projects.slice();
    const tmp = projects[idx];
    projects[idx] = projects[nextIdx];
    projects[nextIdx] = tmp;
    update({ ...data, projects: projects.map((p, order) => ({ ...p, order })) });
  };
  const onToggleProjectVisibility = (id, visible) => {
    const project = data.projects.find((p) => p.id === id);
    if (!project) return;
    const nextProject = { ...project, visible };
    const nextData = {
      ...data,
      projects: data.projects.map((p) => (p.id === id ? nextProject : p)),
    };
    update(nextData);
    setToast(visible ? "Publishing project visibility…" : "Hiding project from the live site…");

    // Publish only this project's visibility. Other local project edits stay
    // pending instead of being pushed live as a side effect of this switch.
    const live = publishedSnapshot && (publishedSnapshot.projects || []);
    const payload = live
      ? {
          ...publishedSnapshot,
          projects: live.some((p) => p.id === id)
            ? live.map((p) => (p.id === id ? { ...p, visible } : p))
            : [...live, nextProject],
        }
      : nextData;

    runPublish(payload)
      .then((result) => {
        if (result === "published") {
          setToast(visible ? "Project is visible on the live site" : "Project hidden from the live site");
        }
      })
      .catch(() => { /* the persistent publish status shows the failure */ });
  };
  const onMoveTeam = (id, dir) => {
    const idx = data.team.findIndex((t) => t._id === id);
    const nextIdx = idx + dir;
    if (idx < 0 || nextIdx < 0 || nextIdx >= data.team.length) return;
    const team = data.team.slice();
    const tmp = team[idx];
    team[idx] = team[nextIdx];
    team[nextIdx] = tmp;
    update({ ...data, team: team.map((t, order) => ({ ...t, order })) });
  };
  const onSaveNews = (n) => {
    const exists = data.news.findIndex((x) => x._id === n._id);
    const news = exists >= 0
      ? data.news.map((x, i) => i === exists ? n : x)
      : [n, ...data.news];
    update({ ...data, news });
    setEditing(null);
  };
  const onSaveTeam = (t) => {
    const exists = data.team.findIndex((x) => x._id === t._id);
    const team = exists >= 0
      ? data.team.map((x, i) => i === exists ? t : x)
      : [t, ...data.team];
    update({ ...data, team });
    setEditing(null);
  };
  const onDelete = (kind, idOrIdx) => {
    if (!confirm("Delete this " + kind + "? This cannot be undone.")) return;
    if (kind === "project") update({ ...data, projects: data.projects.filter((p) => p.id !== idOrIdx) });
    if (kind === "category") update({ ...data, categories: normaliseCategories(data.categories.filter((c) => c.id !== idOrIdx)) });
    if (kind === "news") update({ ...data, news: data.news.filter((n) => n._id !== idOrIdx) });
    if (kind === "team") update({ ...data, team: data.team.filter((t) => t._id !== idOrIdx) });
  };

  /* ----- export / reset -----
     Export is no longer a toolbar button — the content lives on the server
     now, so a manual JSON download is not the only copy any more. It stays
     here because the media migration still takes a backup with it before
     rewriting content, which is the one moment it genuinely matters. */
  const onExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project58-content-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const onReset = () => {
    if (!can("resetData")) return;
    if (!confirm("Reset all content to the bundled defaults? Your edits will be lost.")) return;
    localStorage.removeItem(STORE_KEY);
    location.reload();
  };

  const counts = {
    projects: data.projects.length,
    categories: data.categories.length,
    news: data.news.length,
    team: data.team.length,
    inquiries: inquiries.length,
  };
  const unreadInquiries = inquiries.filter((x) => (x.status || "new") === "new").length;

  const onSaveSite = (site) => {
    const nextSite = normaliseSite(site);
    update({ ...data, site: nextSite });
    if (window.applySiteFavicon) window.applySiteFavicon(nextSite);
    setToast("Settings saved");
  };

  const onSaveHeroGallery = (heroGallery) => {
    const site = normaliseSite({ ...(data.site || DEFAULT_SITE), heroGallery });
    update({ ...data, site });
    setToast("Hero gallery saved");
  };

  const onSaveHomeV2 = (homeV2) => {
    const site = normaliseSite({ ...(data.site || DEFAULT_SITE), homeV2 });
    update({ ...data, site });
    setToast("V2 section saved — ready to publish");
  };

  const onSaveInquiryForm = (inquiryForm) => {
    const site = normaliseSite({ ...(data.site || DEFAULT_SITE), inquiryForm });
    update({ ...data, site });
    setToast("Inquiry questions saved — ready to publish");
  };

  const onSaveWebsiteTexts = (websiteTexts) => {
    const site = normaliseSite({ ...(data.site || DEFAULT_SITE), websiteTexts });
    update({ ...data, site });
    setToast("Website texts saved — ready to publish");
  };

  /* The gallery is driven by each project's `featured` flag, so this is the
     same switch as "Show on home rail" in the project editor — just reachable
     from the one screen that shows the whole selection at once. */
  const onToggleFeatured = (id, on) => {
    const current = normaliseSite(data.site || DEFAULT_SITE);
    const existing = current.heroGallery.order || [];
    const order = on
      ? (existing.includes(id) ? existing : existing.concat(id))
      : existing.filter((x) => x !== id);

    update({
      ...data,
      projects: data.projects.map((p) => (p.id === id ? { ...p, featured: on } : p)),
      site: normaliseSite({ ...current, heroGallery: { ...current.heroGallery, order } }),
    });
    setToast(on ? "Added to the gallery" : "Removed from the gallery");
  };

  const onReorderHeroGallery = (order) => {
    const current = normaliseSite(data.site || DEFAULT_SITE);
    update({
      ...data,
      site: normaliseSite({ ...current, heroGallery: { ...current.heroGallery, order } }),
    });
  };

  // If a section is off-limits for this role, fall back to Projects
  // rather than rendering an empty panel.
  const SECTION_CAPABILITY = { site: "siteSettings", "website-texts": "siteSettings", v2: "siteSettings", hero: "heroGallery", "inquiry-form": "siteSettings" };
  useEffect(() => {
    const needed = SECTION_CAPABILITY[section];
    if (needed && !can(needed)) setSection("projects");
  }, [section, user.role]);

  return (
    <div className="app">
      {session.state === "dev" && (
        <div className="dev-banner">
          Local preview — no backend here, so sign-in is bypassed. On Vercel the dashboard requires a login.
        </div>
      )}
      {sideOpen && <div className="side-backdrop" onClick={() => setSideOpen(false)} />}
      <aside className={`side ${sideOpen ? "open" : ""}`}>
        <div className="side-brand">
          <img src="assets/logo-black.svg" alt="Project58" />
          <span className="tag">CMS</span>
          <button className="side-close" aria-label="Close menu" onClick={() => setSideOpen(false)}>{Ic.close}</button>
        </div>

        <div className="side-section-title">Content</div>
        <button className={`side-btn ${section === "projects" ? "on" : ""}`} onClick={() => goSection("projects")}>
          <span>Projects</span><span className="count">{counts.projects}</span>
        </button>
        <button className={`side-btn side-sub-btn ${section === "texts" ? "on" : ""}`} onClick={() => goSection("texts")}>
          <span>Project texts</span><span className="count">{counts.projects}</span>
        </button>
        <button className={`side-btn ${section === "categories" ? "on" : ""}`} onClick={() => goSection("categories")}>
          <span>Categories</span><span className="count">{counts.categories}</span>
        </button>
        <button className={`side-btn ${section === "news" ? "on" : ""}`} onClick={() => goSection("news")}>
          <span>News &amp; press</span><span className="count">{counts.news}</span>
        </button>
        <button className={`side-btn ${section === "team" ? "on" : ""}`} onClick={() => goSection("team")}>
          <span>Team</span><span className="count">{counts.team}</span>
        </button>
        <button className={`side-btn ${section === "media" ? "on" : ""}`} onClick={() => goSection("media")}>
          <span>Media</span><span className="count">▦</span>
        </button>
        <button className={`side-btn ${section === "inquiries" ? "on" : ""}`} onClick={() => goSection("inquiries")}>
          <span>Inquiries</span><span className={`count ${unreadInquiries ? "count-alert" : ""}`}>{unreadInquiries ? unreadInquiries : counts.inquiries}</span>
        </button>
        {can("siteSettings") && (
          <button className={`side-btn side-sub-btn ${section === "inquiry-form" ? "on" : ""}`} onClick={() => goSection("inquiry-form")}>
            <span>Form questions</span><span className="count">?</span>
          </button>
        )}
        {can("siteSettings") && (
          <button className={`side-btn ${section === "site" ? "on" : ""}`} onClick={() => goSection("site")}>
            <span>Site settings</span><span className="count">⚙</span>
          </button>
        )}
        {can("siteSettings") && (
          <button className={`side-btn side-sub-btn ${section === "website-texts" ? "on" : ""}`} onClick={() => goSection("website-texts")}>
            <span>Website texts</span><span className="count">Aa</span>
          </button>
        )}
        {can("heroGallery") && (
          <button className={`side-btn ${section === "hero" ? "on" : ""}`} onClick={() => goSection("hero")}>
            <span>Hero gallery</span><span className="count">▶</span>
          </button>
        )}
        {can("siteSettings") && (
          <button className={`side-btn ${section === "v2" ? "on" : ""}`} onClick={() => goSection("v2")}>
            <span>V2 banners</span><span className="count">{normaliseSite(data.site || DEFAULT_SITE).homeV2.banners.length}</span>
          </button>
        )}

        <div className="side-footer">
          <a className="side-link" href="index.html" target="_blank" rel="noopener">
            <span>Live site</span><span>↗</span>
          </a>
          <a className="side-link" href="mobile.html" target="_blank" rel="noopener">
            <span>Mobile preview</span><span>↗</span>
          </a>

          <div className="side-meta">localStorage · v1</div>
          <div className="side-user">
            <div className="side-user-id">
              <span className="side-user-avatar" aria-hidden="true">{initials(user.name)}</span>
              <span className="side-user-text"><b title={user.name}>{user.name}</b><span className={`side-user-role role-${user.role}`}>{window.P58Auth.ROLE_LABELS[user.role] || user.role}</span></span>
            </div>
            <button className="side-signout" type="button" onClick={() => window.P58Auth.logout()}>Sign out</button>
          </div>
          <a className="side-footer-logo" href="index.html" target="_blank" rel="noopener" aria-label="Open Project58 website">
            <img src="assets/logo-black.svg" alt="Project58" />
          </a>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="actions">
            {showPublish && (
            <button
              className={
                "btn publish-btn "
                + (pendingIds.length || publishState.status === "pending" ? "primary" : "ghost")
                + (uploads.active ? " publish-btn--uploading" : "")
              }
              style={uploads.active ? { "--upload-pct": Math.round((uploads.done / uploads.total) * 100) + "%" } : null}
              onClick={() => runPublish(data).catch(() => { /* shown beside the button */ })}
              disabled={publishState.status === "busy" || uploads.active}
              title={uploads.active
                ? "Waiting for images to finish uploading"
                : "Publish every project with unpublished changes"}>
              <span className="ic">{Ic.external}</span>
              <span>
                {uploads.active
                  ? "Uploading " + uploads.done + "/" + uploads.total
                  : publishState.status === "busy"
                    ? "Publishing…"
                    : pendingIds.length
                      ? "Publish (" + pendingIds.length + ")"
                      : "Publish"}
              </span>
            </button>
            )}
            {publishState.message ? (
              <span className={"publish-state publish-state--" + publishState.status} title={publishState.message}>
                {publishState.message}
              </span>
            ) : null}
            {can("resetData") && (
              <button className="btn ghost" onClick={onReset} title="Reset to defaults">
                <span className="ic">{Ic.reset}</span><span>Reset</span>
              </button>
            )}
            <button className="btn primary new-content-btn" style={(section === "texts" || section === "site" || section === "website-texts" || section === "v2" || section === "hero" || section === "inquiries" || section === "inquiry-form" || section === "media") ? { display: "none" } : null} onClick={() => setEditing({ kind: section === "projects" ? "project" : section === "categories" ? "category" : section === "news" ? "news" : "team", id: null })}>
              <span className="ic">{Ic.plus}</span><span>New {section === "projects" ? "project" : section === "categories" ? "category" : section === "news" ? "news item" : section === "site" ? "—" : "person"}</span>
            </button>
          </div>
          <div className={"topbar-user" + (accountOpen ? " open" : "")} ref={accountRef}>
            <button
              className="topbar-user-trigger"
              type="button"
              aria-label="Open account menu"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((open) => !open)}
            >
              <span className="topbar-user-avatar" aria-hidden="true">{initials(user.name)}</span>
            </button>
            {accountOpen && (
              <div className="topbar-account-popover" role="menu" aria-label="Account menu">
                <div className="topbar-account-head">
                  <span className="topbar-account-avatar" aria-hidden="true">{initials(user.name)}</span>
                  <span>
                    <b title={user.name}>{user.name}</b>
                    <small>{window.P58Auth.ROLE_LABELS[user.role] || user.role}</small>
                  </span>
                </div>
                <button className="topbar-account-signout" type="button" role="menuitem" onClick={() => window.P58Auth.logout()}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="content">
          {section === "projects" && (
            <ProjectsList data={data.projects} categories={data.categories} onEdit={(id) => setEditing({ kind: "project", id })} onDelete={(id) => onDelete("project", id)} onMove={onMoveProject} onToggleVisibility={onToggleProjectVisibility} onNew={() => setEditing({ kind: "project", id: null })} pendingIds={pendingIds} uploads={uploads} onPublishOne={(id) => publishOneProject(id).catch(() => { /* shown in the header */ })} publishBusy={publishState.status === "busy"} />
          )}
          {section === "texts" && (
            <ProjectTextsSheet
              projects={data.projects}
              categories={data.categories}
              initialProject={textsProject}
              onSave={(projects) => {
                update({ ...data, projects });
                setToast("Project texts saved — ready to publish");
              }}
              onOpenProject={(id) => setEditing({ kind: "project", id })}
              onToast={setToast}
            />
          )}
          {section === "categories" && (
            <CategoriesList data={data.categories} projects={data.projects} onEdit={(id) => setEditing({ kind: "category", id })} onDelete={(id) => onDelete("category", id)} onMove={onMoveCategory} onNew={() => setEditing({ kind: "category", id: null })} />
          )}
          {section === "news" && (
            <NewsList data={data.news} onEdit={(id) => setEditing({ kind: "news", id })} onDelete={(id) => onDelete("news", id)} onNew={() => setEditing({ kind: "news", id: null })} />
          )}
          {section === "team" && (
            <TeamList data={data.team} onEdit={(id) => setEditing({ kind: "team", id })} onDelete={(id) => onDelete("team", id)} onMove={onMoveTeam} onNew={() => setEditing({ kind: "team", id: null })} />
          )}
          {section === "media" && (
            <MediaLibrary
              projects={data.projects}
              data={data}
              onReplaceData={update}
              onExport={onExport}
              onToast={setToast}
            />
          )}
          {section === "inquiries" && (
            <InquiriesList data={inquiries} onView={(id) => { setViewInquiry(id); setInquiryStatus(id, "read"); }} onDelete={deleteInquiry} />
          )}
          {section === "inquiry-form" && can("siteSettings") && (
            <InquiryFormSettings inquiryForm={normaliseSite(data.site || DEFAULT_SITE).inquiryForm} onSave={onSaveInquiryForm} />
          )}
          {section === "site" && can("siteSettings") && (
            <SiteSettings site={normaliseSite(data.site || DEFAULT_SITE)} onSave={onSaveSite} />
          )}
          {section === "website-texts" && can("siteSettings") && (
            <WebsiteTextsSettings site={normaliseSite(data.site || DEFAULT_SITE)} onSave={onSaveWebsiteTexts} />
          )}
          {section === "hero" && can("heroGallery") && (
            <HeroGallerySettings
              heroGallery={normaliseSite(data.site || DEFAULT_SITE).heroGallery}
              projects={data.projects}
              onSave={onSaveHeroGallery}
              onToggleFeatured={onToggleFeatured}
              onReorder={onReorderHeroGallery}
            />
          )}
          {section === "v2" && can("siteSettings") && (
            <HomeV2Settings homeV2={normaliseSite(data.site || DEFAULT_SITE).homeV2} onSave={onSaveHomeV2} />
          )}
        </div>
      </main>

      <nav className="mobile-bottom-nav" aria-label="Primary dashboard navigation">
        <button className={section === "projects" ? "on" : ""} type="button" onClick={() => goSection("projects")}><span className="mobile-nav-icon" aria-hidden="true">▤</span><span>Projects</span></button>
        <button className={section === "media" ? "on" : ""} type="button" onClick={() => goSection("media")}><span className="mobile-nav-icon" aria-hidden="true">▦</span><span>Media</span></button>
        <button className="mobile-create-project" type="button" aria-label="Create new project" onClick={() => { goSection("projects"); setEditing({ kind: "project", id: null }); }}><span aria-hidden="true">+</span></button>
        <button className={(section === "site" || section === "website-texts" || section === "v2" || section === "hero") ? "on" : ""} type="button" disabled={!can("siteSettings")} onClick={() => can("siteSettings") && goSection("site")}><span className="mobile-nav-icon" aria-hidden="true">⚙</span><span>Settings</span></button>
        <button className={(sideOpen || !["projects", "media", "site", "website-texts", "v2", "hero"].includes(section)) ? "on" : ""} type="button" onClick={() => setSideOpen(true)}><span className="mobile-nav-icon mobile-nav-more" aria-hidden="true">•••</span><span>More{unreadInquiries ? ` · ${unreadInquiries}` : ""}</span></button>
      </nav>

      {editing && editing.kind === "project" && (
        <ProjectSheet
          project={editing.id ? data.projects.find((p) => p.id === editing.id) : null}
          categories={data.categories}
          defaultProjectBadge={normaliseSite(data.site || DEFAULT_SITE).defaultProjectBadge}
          onSave={onSaveProject}
          onPublish={onSaveAndPublishProject}
          onTexts={editing.id ? () => goProjectTexts(editing.id) : null}
          onClose={() => setEditing(null)}
          uploadsActive={uploads.active}
          publishBusy={publishState.status === "busy"}
        />
      )}
      {editing && editing.kind === "category" && (
        <CategorySheet
          category={editing.id ? data.categories.find((c) => c.id === editing.id) : null}
          onSave={onSaveCategory}
          onClose={() => setEditing(null)}
        />
      )}
      {editing && editing.kind === "news" && (
        <NewsSheet
          item={editing.id ? data.news.find((n) => n._id === editing.id) : null}
          onSave={onSaveNews}
          onClose={() => setEditing(null)}
        />
      )}
      {editing && editing.kind === "team" && (
        <TeamSheet
          member={editing.id ? data.team.find((t) => t._id === editing.id) : null}
          onSave={onSaveTeam}
          onClose={() => setEditing(null)}
        />
      )}
      {viewInquiry && (
        <InquirySheet
          inquiry={inquiries.find((x) => x.id === viewInquiry)}
          onDelete={deleteInquiry}
          onClose={() => setViewInquiry(null)}
        />
      )}

      {toast && (
        <div className="toast"><span className="dot"></span><span>{toast}</span></div>
      )}
    </div>
  );
}

/* ============================================================
   LISTS
   ============================================================ */
const PROJECT_TEXT_FIELDS = [
  { key: "name", label: "Project name", greek: "name_gr", compact: true },
  { key: "location", label: "Location", greek: "location_gr", compact: true },
  { key: "type", label: "Type", greek: "type_gr", compact: true },
  { key: "contractor", label: "Contractor", greek: "contractor_gr", compact: true },
  { key: "engineer", label: "Engineer", greek: "engineer_gr", compact: true },
  { key: "lead_architect", label: "Lead architect", greek: "lead_architect_gr", compact: true },
  { key: "design_team", label: "Design team", greek: "design_team_gr", compact: true },
  { key: "summary", label: "Short description", greek: "summary_gr" },
];

function projectTextRows(project) {
  const rows = PROJECT_TEXT_FIELDS.map((field) => ({
    id: `field-${field.key}`,
    kind: "field",
    label: field.label,
    key: field.key,
    greekKey: field.greek,
    compact: field.compact,
    en: project[field.key] || "",
    gr: project[field.greek] || "",
  }));

  (project.gallery || []).forEach((image, i) => {
    rows.push({ id: `gallery-${i}`, kind: "gallery", index: i, label: `Image ${i + 1} · caption`, compact: true, en: image.tag || "", gr: image.tag_gr || "" });
  });
  return rows;
}

function ProjectTextsSheet({ projects, categories = [], initialProject = "all", onSave, onOpenProject, onToast }) {
  const [draft, setDraft] = useState(() => projects.map((project) => ({ ...project })));
  const [query, setQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState(initialProject);
  const [expandedProjects, setExpandedProjects] = useState(() => new Set());
  const [language, setLanguage] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");

  useEffect(() => {
    setDraft(projects.map((project) => ({ ...project })));
  }, [projects]);

  useEffect(() => {
    setSelectedProject(initialProject);
  }, [initialProject]);

  const changed = JSON.stringify(draft) !== JSON.stringify(projects);
  const normalisedQuery = query.trim().toLocaleLowerCase();
  const categoryProjects = useMemo(() => draft.filter((project) => {
    if (categoryFilter === "all") return true;
    const projectCategory = project.category || project.typology || "retail";
    if (categoryFilter === "uncategorised") return !categories.some((category) => category.id === projectCategory);
    return projectCategory === categoryFilter;
  }), [draft, categories, categoryFilter]);
  const brandOptions = useMemo(() => [...new Set(categoryProjects.map((project) => (project.brand || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [categoryProjects]);
  const filteredProjects = useMemo(() => categoryProjects.filter((project) => {
    if (brandFilter !== "all" && (project.brand || "").trim() !== brandFilter) return false;
    if (visibilityFilter === "live" && project.visible === false) return false;
    if (visibilityFilter === "hidden" && project.visible !== false) return false;
    return true;
  }), [categoryProjects, brandFilter, visibilityFilter]);
  const filtersActive = categoryFilter !== "all" || brandFilter !== "all" || visibilityFilter !== "all";
  const groups = useMemo(() => filteredProjects.map((project) => {
    const allRows = projectTextRows(project);
    const projectHaystack = [project.name, project.name_gr, project.brand, project.code, project.location].join(" ").toLocaleLowerCase();
    const rows = normalisedQuery
      ? allRows.filter((row) => `${row.label} ${row.en} ${row.gr} ${projectHaystack}`.toLocaleLowerCase().includes(normalisedQuery))
      : allRows;
    return { project, rows };
  }).filter(({ project, rows }) => (selectedProject === "all" || project.id === selectedProject) && rows.length), [filteredProjects, selectedProject, normalisedQuery]);

  useEffect(() => {
    if (brandFilter !== "all" && !brandOptions.includes(brandFilter)) setBrandFilter("all");
  }, [brandFilter, brandOptions]);

  useEffect(() => {
    if (selectedProject !== "all" && !filteredProjects.some((project) => project.id === selectedProject)) setSelectedProject("all");
  }, [selectedProject, filteredProjects]);

  const dirtyProjectIds = useMemo(() => {
    const original = new Map(projects.map((project) => [project.id, JSON.stringify(project)]));
    return new Set(draft.filter((project) => original.get(project.id) !== JSON.stringify(project)).map((project) => project.id));
  }, [draft, projects]);

  const setCell = (projectId, row, lang, value) => {
    setDraft((current) => current.map((project) => {
      if (project.id !== projectId) return project;
      if (row.kind === "field") {
        return { ...project, [lang === "en" ? row.key : row.greekKey]: value };
      }
      const gallery = (project.gallery || []).map((image) => ({ ...image }));
      if (gallery[row.index]) gallery[row.index][lang === "en" ? "tag" : "tag_gr"] = value;
      return { ...project, gallery };
    }));
  };

  const copyVisible = () => {
    const clean = (value) => String(value || "").replace(/\t/g, " ").replace(/\r?\n/g, " ");
    const lines = [["Project", "Code", "Field", "English", "Greek"]];
    groups.forEach(({ project, rows }) => rows.forEach((row) => {
      lines.push([project.name, project.code, row.label, row.en, row.gr].map(clean));
    }));
    const text = lines.map((line) => line.join("\t")).join("\n");
    if (!navigator.clipboard) {
      onToast("Clipboard access is not available in this browser");
      return;
    }
    navigator.clipboard.writeText(text)
      .then(() => onToast("Visible project texts copied"))
      .catch(() => onToast("Couldn’t copy the project texts"));
  };

  const chooseProject = (id) => {
    setSelectedProject(id);
    if (id === "all") setExpandedProjects(new Set());
  };

  const toggleExpanded = (id) => {
    setExpandedProjects((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderTextTable = (project, rows) => (
    <div className="texts-table-wrap">
      <table className="texts-table">
        <thead><tr><th>Field</th><th className="text-col-en">English</th><th className="text-col-gr">Greek</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th className="texts-field" scope="row">{row.label}</th>
              <td className="text-col-en">
                {row.compact
                  ? <input type="text" value={row.en} aria-label={`${project.name} · ${row.label} · English`} onChange={(event) => setCell(project.id, row, "en", event.target.value)} />
                  : <textarea value={row.en} aria-label={`${project.name} · ${row.label} · English`} onChange={(event) => setCell(project.id, row, "en", event.target.value)} />}
              </td>
              <td className="text-col-gr">
                {row.compact
                  ? <input type="text" value={row.gr} aria-label={`${project.name} · ${row.label} · Greek`} onChange={(event) => setCell(project.id, row, "gr", event.target.value)} placeholder="Greek translation" />
                  : <textarea value={row.gr} aria-label={`${project.name} · ${row.label} · Greek`} onChange={(event) => setCell(project.id, row, "gr", event.target.value)} placeholder="Greek translation" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={`texts-sheet language-${language}`}>
      <SectionHead eyebrow="/ All project copy · English + Greek" title="Project texts" />
      <div className="texts-toolbar">
        <label className="texts-search">
          <span>Search</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Project, field or text…" />
        </label>
        <label>
          <span>Language</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="all">English + Greek</option>
            <option value="en">English</option>
            <option value="gr">Greek</option>
          </select>
        </label>
        <div className="texts-toolbar-actions">
          <button className="btn ghost" type="button" onClick={copyVisible}>Copy visible</button>
          <button className="btn primary" type="button" disabled={!changed} onClick={() => onSave(draft)}>Save changes</button>
        </div>
      </div>

      <div className="texts-filters" aria-label="Project filters">
        <label><span>Category</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}{draft.some((project) => !categories.some((category) => category.id === (project.category || project.typology || "retail"))) && <option value="uncategorised">Uncategorised</option>}</select></label>
        <label><span>Sub-category / brand</span><select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}><option value="all">All brands</option>{brandOptions.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select></label>
        <label><span>Visibility</span><select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value)}><option value="all">Live + hidden</option><option value="live">Live</option><option value="hidden">Hidden</option></select></label>
        <button className="btn ghost" type="button" disabled={!filtersActive} onClick={() => { setCategoryFilter("all"); setBrandFilter("all"); setVisibilityFilter("all"); }}>Clear filters</button>
      </div>

      <div className="texts-workspace">
        <nav className="texts-project-menu" aria-label="Projects">
          <button type="button" className={selectedProject === "all" ? "on" : ""} onClick={() => chooseProject("all")}>
            <span><strong>All projects</strong><small>{filtersActive ? "Filtered overview" : "Collapsed overview"}</small></span>
            <b>{filteredProjects.length}</b>
          </button>
          <div className="texts-project-menu-list">
            {filteredProjects.map((project) => (
              <button key={project.id} type="button" className={selectedProject === project.id ? "on" : ""} onClick={() => chooseProject(project.id)}>
                <span><strong>{project.name || "Untitled"}</strong><small>{project.code} · {project.brand || "No brand"}</small></span>
                {dirtyProjectIds.has(project.id) && <i title="Unsaved changes" aria-label="Unsaved changes"></i>}
              </button>
            ))}
            {!filteredProjects.length && <div className="texts-project-menu-empty">No projects match these filters.</div>}
          </div>
        </nav>

        <div className="texts-editor">
          {selectedProject === "all" ? (
            <div className="texts-accordions">
              {groups.map(({ project, rows }) => {
                const expanded = expandedProjects.has(project.id);
                return (
                  <section className={`texts-project-panel ${expanded ? "is-open" : ""}`} key={project.id}>
                    <button className="texts-project-line" type="button" onClick={() => toggleExpanded(project.id)} aria-expanded={expanded}>
                      <span className="texts-project-chevron" aria-hidden="true">›</span>
                      <strong>{project.name || "Untitled"}</strong>
                      <span>{project.code}</span>
                      <span>{project.brand || "No brand"}</span>
                      <span>{rows.length} fields</span>
                      {dirtyProjectIds.has(project.id) && <i>Edited</i>}
                    </button>
                    {expanded && (
                      <div className="texts-project-panel-body">
                        <div className="texts-project-panel-head">
                          <span>{project.visible === false ? "Hidden from site" : "Visible on site"}</span>
                          <button type="button" onClick={() => onOpenProject(project.id)}>Open full project ↗</button>
                        </div>
                        {renderTextTable(project, rows)}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          ) : groups.length ? (
            groups.map(({ project, rows }) => (
              <section className="texts-selected-project" key={project.id}>
                <div className="texts-selected-head">
                  <div><span>{project.code} · {project.brand || "No brand"}</span><h2>{project.name || "Untitled"}</h2></div>
                  <button className="btn ghost" type="button" onClick={() => onOpenProject(project.id)}>Open full project ↗</button>
                </div>
                {renderTextTable(project, rows)}
              </section>
            ))
          ) : <div className="texts-empty">No project text matches this search.</div>}
          {selectedProject === "all" && !groups.length && <div className="texts-empty">No project text matches this search.</div>}
        </div>
      </div>
      <div className="texts-foot">
        <span>{groups.reduce((total, group) => total + group.rows.length, 0)} text fields shown</span>
        <span>Save here, then use Publish to update the live site.</span>
      </div>
    </div>
  );
}

function categoryLabel(categories, id) {
  const cat = categories.find((c) => c.id === id);
  return cat ? cat.label : id || "Uncategorised";
}

function ProjectsList({ data, categories, onEdit, onDelete, onMove, onToggleVisibility, onNew, pendingIds, uploads, onPublishOne, publishBusy }) {
  if (!data.length) return <Empty kind="projects" onNew={onNew} />;
  const groups = categories.map((cat) => ({
    category: cat,
    projects: data.filter((p) => (p.category || p.typology || "retail") === cat.id),
  }));
  const uncategorised = data.filter((p) => !categories.find((c) => c.id === (p.category || p.typology || "retail")));
  if (uncategorised.length) groups.push({ category: { id: "uncategorised", label: "Uncategorised", description: "Projects without a matching category" }, projects: uncategorised });

  const pending = new Set(pendingIds || []);
  const byKey = (uploads && uploads.byKey) || {};

  const renderRow = (p) => {
    const globalIndex = data.findIndex((x) => x.id === p.id);

    // This project's own upload batch, if it has one in flight.
    const job = byKey[p.id];
    const pct = job && job.total ? Math.round((job.done / job.total) * 100) : 0;

    // Publish is offered only once the images are in — publishing mid-upload
    // would put a URL on the site that does not exist yet.
    const canPublish = pending.has(p.id) && !job && !publishBusy;

    return (
      <div
        className={"row row-projects" + (job ? " row--uploading" : "") + (pending.has(p.id) ? " row--pending" : "")}
        style={job ? { "--upload-pct": pct + "%" } : null}
        key={p.id}
        onClick={() => onEdit(p.id)}>
        <div className="thumb">
          {p.hero ? <img src={p.hero} alt="" /> : <div className="placeholder">no img</div>}
        </div>
        <div className="name">
          {p.name}
          <span className="sub">{p.brand} · {p.visible === false ? "Hidden" : "Visible on site"}</span>
        </div>
        <div className="meta">{p.location}</div>
        <div className="meta">{p.year} · {p.status}</div>
        <div className="meta">{p.code}{p.featured ? " · Featured" : ""}<span className="sub">{categoryLabel(categories, p.category || p.typology || "retail")} · /projects/{p.slug || p.id}</span></div>
        <div className="row-actions">
          <button
            className={"visibility-toggle " + (p.visible === false ? "is-hidden" : "is-visible")}
            type="button"
            role="switch"
            aria-checked={p.visible !== false}
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(p.id, p.visible === false); }}
            title={p.visible === false ? "Show this project on the live site" : "Hide this project from the live site"}>
            <span aria-hidden="true"></span>
            {p.visible === false ? "Hidden" : "Visible"}
          </button>
          <button className="delete" onClick={(e) => { e.stopPropagation(); onMove(p.id, -1); }} title="Move up" disabled={globalIndex === 0}>↑</button>
          <button className="delete" onClick={(e) => { e.stopPropagation(); onMove(p.id, 1); }} title="Move down" disabled={globalIndex === data.length - 1}>↓</button>
          <button className="delete" onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} title="Delete">{Ic.trash}</button>
          {job ? (
            <span className="row-upload" title={"Uploading " + job.done + " of " + job.total}>{pct}%</span>
          ) : canPublish ? (
            <button
              className="row-publish"
              onClick={(e) => { e.stopPropagation(); onPublishOne(p.id); }}
              title="Publish only this project to the live site">
              Publish
            </button>
          ) : null}
        </div>
      </div>
    );
  };
  const listHead = (
    <div className="list-head head-projects">
      <span></span><span>Name</span><span>Location</span><span>Year · status</span><span>Code · flags</span><span></span>
    </div>
  );
  const renderVisibilityGroups = (projects, keyPrefix) => [
    { key: "live", label: "Live", projects: projects.filter((project) => project.visible !== false) },
    { key: "hidden", label: "Hidden", projects: projects.filter((project) => project.visible === false) },
  ].map((visibility) => (
    <div className={`project-visibility-group is-${visibility.key}`} key={`${keyPrefix}-${visibility.key}`}>
      <div className="project-visibility-head">
        <span className="project-visibility-dot" aria-hidden="true"></span>
        <h4>{visibility.label}</h4>
        <span className="project-visibility-count">{visibility.projects.length}</span>
      </div>
      <div className="list">
        {listHead}
        {visibility.projects.length
          ? visibility.projects.map(renderRow)
          : <div className="empty-row">No {visibility.label.toLowerCase()} projects.</div>}
      </div>
    </div>
  ));

  return (
    <>
      <SectionHead title="Projects" />
      {groups.map((group) => {
        // Build the ordered list of sub-category buckets (brands).
        const defined = (group.category.subcategories || []).map((s) => s.label);
        const present = [...new Set(group.projects.map((p) => (p.brand || "").trim()).filter(Boolean))];
        const ordered = [...defined.filter((b) => present.includes(b)), ...present.filter((b) => !defined.includes(b))];
        const hasSub = ordered.length > 0;
        const subLabel = group.category.subLabel && group.category.subLabel !== "Sub-category" ? group.category.subLabel : "Brand";
        const buckets = hasSub
          ? [
              ...ordered.map((brand) => ({ key: brand, label: brand, projects: group.projects.filter((p) => (p.brand || "").trim() === brand) })),
              { key: "__none__", label: `No ${subLabel.toLowerCase()}`, projects: group.projects.filter((p) => !(p.brand || "").trim()) },
            ].filter((b) => b.projects.length)
          : null;
        return (
          <div className="category-group" key={group.category.id}>
            <div className="category-group-head">
              <div>
                <h2>{group.category.label}</h2>
                <p>{group.category.description || "No description"}</p>
              </div>
              <span>{group.projects.length}</span>
            </div>
            {group.projects.length === 0 ? (
              <div className="list"><div className="empty-row">No projects in {group.category.label}.</div></div>
            ) : buckets ? (
              buckets.map((bucket) => (
                <div className="subgroup" key={bucket.key}>
                  <div className="subgroup-head"><span className="subgroup-kind">{subLabel}</span><h3>{bucket.label}</h3><span className="subgroup-count">{bucket.projects.length}</span></div>
                  {renderVisibilityGroups(bucket.projects, `${group.category.id}-${bucket.key}`)}
                </div>
              ))
            ) : (
              <div className="category-visibility-groups">
                {renderVisibilityGroups(group.projects, group.category.id)}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function CategoriesList({ data, projects, onEdit, onDelete, onMove, onNew }) {
  if (!data.length) return <Empty kind="categories" onNew={onNew} />;
  return (
    <>
      <SectionHead eyebrow="/ Categories · project grouping" title="Categories" />
      <div className="list">
        <div className="list-head head-categories">
          <span>Category</span>
          <span>Description</span>
          <span>Projects</span>
          <span></span>
        </div>
        {data.map((c, i) => (
          <div className="row row-categories" key={c.id} onClick={() => onEdit(c.id)}>
            <div className="name">{c.label}<span className="sub">/{c.id}</span></div>
            <div className="meta">{c.description || "No description"}</div>
            <div className="meta">{projects.filter((p) => (p.category || p.typology || "retail") === c.id).length}</div>
            <div className="row-actions">
              <button className="delete" onClick={(e) => { e.stopPropagation(); onMove(c.id, -1); }} title="Move up" disabled={i === 0}>↑</button>
              <button className="delete" onClick={(e) => { e.stopPropagation(); onMove(c.id, 1); }} title="Move down" disabled={i === data.length - 1}>↓</button>
              <button className="delete" onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} title="Delete">{Ic.trash}</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function NewsList({ data, onEdit, onDelete, onNew }) {
  // ensure each news item has a stable _id
  data.forEach((n) => { if (!n._id) n._id = newId("nw"); });
  if (!data.length) return <Empty kind="news items" onNew={onNew} />;
  return (
    <>
      <SectionHead eyebrow="/ Recent press · talks · launches" title="News &amp; press" />
      <div className="list">
        <div className="list-head head-news">
          <span>Date</span>
          <span>Title</span>
          <span>Category</span>
          <span></span>
        </div>
        {data.map((n) => (
          <div className="row row-news" key={n._id} onClick={() => onEdit(n._id)}>
            <div className="meta">{n.date}</div>
            <div className="name">{n.title}<span className="sub">{(n.deck || "").slice(0, 80)}{(n.deck || "").length > 80 ? "…" : ""}</span></div>
            <div className="meta">{n.cat}</div>
            <button className="delete" onClick={(e) => { e.stopPropagation(); onDelete(n._id); }} title="Delete">{Ic.trash}</button>
          </div>
        ))}
      </div>
    </>
  );
}

function TeamList({ data, onEdit, onDelete, onMove, onNew }) {
  data.forEach((t) => { if (!t._id) t._id = newId("tm"); });
  if (!data.length) return <Empty kind="team members" onNew={onNew} />;
  return (
    <>
      <SectionHead eyebrow="/ Eight people · two cities" title="Team" />
      <div className="list">
        <div className="list-head head-team">
          <span></span>
          <span>Name</span>
          <span>Role</span>
          <span></span>
        </div>
        {data.map((t, i) => (
          <div className="row row-team" key={t._id} onClick={() => onEdit(t._id)}>
            <div className="thumb">
              {t.portrait ? <img src={t.portrait} alt="" /> : <div className="placeholder">{t.name ? t.name.split(" ").map((s) => s[0]).slice(0, 2).join("") : "—"}</div>}
            </div>
            <div className="name">{t.name}<span className="sub">{t.note}</span></div>
            <div className="meta">{t.role}</div>
            <div className="row-actions">
              <button className="delete" onClick={(e) => { e.stopPropagation(); onMove(t._id, -1); }} title="Move up" disabled={i === 0}>↑</button>
              <button className="delete" onClick={(e) => { e.stopPropagation(); onMove(t._id, 1); }} title="Move down" disabled={i === data.length - 1}>↓</button>
              <button className="delete" onClick={(e) => { e.stopPropagation(); onDelete(t._id); }} title="Delete">{Ic.trash}</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function formatInquiryDate(ts) {
  try { return new Date(ts).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch (e) { return "—"; }
}

function InquiryFormSettings({ inquiryForm, onSave }) {
  const normalise = window.normaliseInquiryForm || ((form) => form);
  const fallbackGroups = window.INQUIRY_FORM_GROUPS || [
    { id: "planning", title: "What are you planning?", title_gr: "Τι σχεδιάζετε;" },
    { id: "space", title: "About the space", title_gr: "Σχετικά με τον χώρο" },
    { id: "details", title: "A few details", title_gr: "Μερικές λεπτομέρειες" },
    { id: "contact", title: "How can we reach you?", title_gr: "Πώς μπορούμε να επικοινωνήσουμε;" },
  ];
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(normalise(inquiryForm || {}))));
  const [selectedId, setSelectedId] = useState(() => normalise(inquiryForm || {}).questions?.[0]?.id || null);
  const [selectedGroup, setSelectedGroup] = useState(() => normalise(inquiryForm || {}).groups?.[0]?.id || "planning");
  const [adding, setAdding] = useState(false);
  const [addingStep, setAddingStep] = useState(false);
  const [stepDraft, setStepDraft] = useState({ title: "", title_gr: "" });
  const [editorLang, setEditorLang] = useState("en");
  const [preview, setPreview] = useState(false);
  const [previewLang, setPreviewLang] = useState("en");
  const [draft, setDraft] = useState({ label: "", label_gr: "", type: "text", group: "details", required: false });

  useEffect(() => {
    const next = JSON.parse(JSON.stringify(normalise(inquiryForm || {})));
    setForm(next);
    setSelectedId((current) => next.questions.some((question) => question.id === current) ? current : next.questions[0]?.id || null);
    setSelectedGroup((current) => next.groups.some((group) => group.id === current) ? current : next.groups[0]?.id || "");
  }, [inquiryForm]);

  const questions = form.questions || [];
  const groups = form.groups?.length ? form.groups : fallbackGroups;
  const activeStep = groups.find((group) => group.id === selectedGroup) || groups[0];
  const stepQuestions = questions.filter((question) => question.group === selectedGroup);
  const selectedIndex = questions.findIndex((question) => question.id === selectedId);
  const changed = JSON.stringify(normalise(form)) !== JSON.stringify(normalise(inquiryForm || {}));
  const valid = groups.length > 0 && groups.every((group) => group.title.trim() && group.title_gr.trim()) && questions.length > 0 && questions.every((question) => question.label.trim() && question.label_gr.trim() && (
    !["buttons", "select"].includes(question.type) || ((question.options || []).some((option) => String(option).trim()) && (question.options_gr || []).some((option) => String(option).trim()))
  ));
  const updateQuestion = (index, patch) => setForm((current) => ({
    ...current,
    questions: current.questions.map((question, i) => i === index ? { ...question, ...patch } : question),
  }));
  const moveQuestion = (index, direction) => setForm((current) => {
    const next = current.questions.slice();
    const stepIndexes = next.map((question, questionIndex) => question.group === next[index].group ? questionIndex : -1).filter((questionIndex) => questionIndex >= 0);
    const position = stepIndexes.indexOf(index);
    const target = stepIndexes[position + direction];
    if (target == null) return current;
    [next[index], next[target]] = [next[target], next[index]];
    return { ...current, questions: next };
  });
  const moveStep = (id, direction) => setForm((current) => {
    const next = current.groups.slice();
    const index = next.findIndex((group) => group.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= next.length) return current;
    [next[index], next[target]] = [next[target], next[index]];
    return { ...current, groups: next };
  });
  const removeQuestion = (index) => {
    if (!confirm("Remove this sub-section from the inquiry form? Existing inquiries will keep their saved answer.")) return;
    const remaining = questions.filter((_, i) => i !== index);
    setForm((current) => ({ ...current, questions: remaining }));
    setSelectedId(remaining[Math.min(index, remaining.length - 1)]?.id || null);
  };
  const updateStep = (id, patch) => setForm((current) => ({ ...current, groups: current.groups.map((group) => group.id === id ? { ...group, ...patch } : group) }));
  const openAddStep = () => { setStepDraft({ title: "", title_gr: "" }); setAddingStep(true); };
  const addStep = () => {
    if (!stepDraft.title.trim() || !stepDraft.title_gr.trim()) return;
    const step = { id: newId("step"), title: stepDraft.title.trim(), title_gr: stepDraft.title_gr.trim() };
    setForm((current) => ({ ...current, groups: [...current.groups, step] }));
    setSelectedGroup(step.id);
    setAddingStep(false);
  };
  const removeStep = (id) => {
    if (groups.length <= 1) return;
    const step = groups.find((group) => group.id === id);
    const fieldCount = questions.filter((question) => question.group === id).length;
    if (!confirm(`Remove “${step?.title || "this step"}”${fieldCount ? ` and its ${fieldCount} sub-section${fieldCount === 1 ? "" : "s"}` : ""}? Existing inquiries will keep their saved answers.`)) return;
    const remainingGroups = groups.filter((group) => group.id !== id);
    setForm((current) => ({ ...current, groups: remainingGroups, questions: current.questions.filter((question) => question.group !== id) }));
    setSelectedGroup(remainingGroups[0]?.id || "");
  };
  const openAddQuestion = () => {
    setDraft({ label: "", label_gr: "", type: "text", group: selectedGroup, required: false });
    setAdding(true);
  };
  const addQuestion = () => {
    if (!draft.label.trim() || !draft.label_gr.trim()) return;
    const question = {
      id: newId("question"),
      label: draft.label.trim(),
      label_gr: draft.label_gr.trim(),
      type: draft.type,
      group: draft.group,
      required: draft.required,
      placeholder: "",
      placeholder_gr: "",
      options: ["buttons", "select"].includes(draft.type) ? ["Answer 1"] : [],
      options_gr: ["buttons", "select"].includes(draft.type) ? ["Απάντηση 1"] : [],
    };
    setForm((current) => ({ ...current, questions: [...current.questions, question] }));
    setSelectedGroup(question.group);
    setSelectedId(question.id);
    setAdding(false);
  };
  const updateOption = (questionIndex, optionIndex, value, lang = "en") => {
    const key = lang === "gr" ? "options_gr" : "options";
    const options = [...(questions[questionIndex][key] || [])];
    options[optionIndex] = value;
    updateQuestion(questionIndex, { [key]: options });
  };
  const addOption = (questionIndex) => updateQuestion(questionIndex, { options: [...(questions[questionIndex].options || []), "New answer"], options_gr: [...(questions[questionIndex].options_gr || []), "Νέα απάντηση"] });
  const removeOption = (questionIndex, optionIndex) => updateQuestion(questionIndex, { options: (questions[questionIndex].options || []).filter((_, i) => i !== optionIndex), options_gr: (questions[questionIndex].options_gr || []).filter((_, i) => i !== optionIndex) });
  const editorText = (item, field) => editorLang === "gr" ? (item[`${field}_gr`] || "") : (item[field] || "");
  const previewText = (item, field) => previewLang === "gr" ? (item[`${field}_gr`] || item[field] || "") : (item[field] || "");
  const previewField = (question) => {
    const options = previewLang === "gr" ? (question.options_gr || question.options || []) : (question.options || []);
    if (question.type === "buttons") return <div className="inquiry-preview-choices">{options.map((option) => <button type="button" key={option}>{option}</button>)}</div>;
    if (question.type === "select") return <select disabled><option>{previewLang === "gr" ? "Επιλέξτε…" : "Select…"}</option>{options.map((option) => <option key={option}>{option}</option>)}</select>;
    if (question.type === "textarea") return <textarea rows="3" disabled placeholder={previewText(question, "placeholder")} />;
    return <input disabled type={question.type === "email" ? "email" : question.type === "tel" ? "tel" : "text"} placeholder={previewText(question, "placeholder")} />;
  };

  return (
    <>
      <SectionHead eyebrow="/ English · Greek · answers · required fields" title="Form questions" />
      <div className="settings-card inquiry-form-settings">
        <div className="inquiry-builder-intro">
          <div><h2>Project inquiry form</h2><p>Select a step, then organise the sub-sections shown inside it.</p></div>
          <div className="inquiry-builder-buttons"><button className="btn ghost" type="button" onClick={() => setPreview(true)}>Preview</button><button className="btn ghost" type="button" onClick={openAddStep}><span className="ic">{Ic.plus}</span>Add step</button><button className="btn primary" type="button" onClick={openAddQuestion}><span className="ic">{Ic.plus}</span>Add sub-section</button></div>
        </div>

        <div className="inquiry-editor-toolbar">
          <div><strong>Content language</strong><span>Edit one language at a time for a clearer, wider workspace.</span></div>
          <div className="inquiry-editor-language" role="group" aria-label="Content editing language"><button className={editorLang === "en" ? "on" : ""} type="button" aria-pressed={editorLang === "en"} onClick={() => setEditorLang("en")}>EN</button><button className={editorLang === "gr" ? "on" : ""} type="button" aria-pressed={editorLang === "gr"} onClick={() => setEditorLang("gr")}>GR</button></div>
        </div>

        <div className="inquiry-builder-workspace">
          <label className="inquiry-question-select">
            <span>Select step</span>
            <select value={selectedGroup} onChange={(event) => setSelectedGroup(event.target.value)}>
              {groups.map((group, index) => <option value={group.id} key={group.id}>Step {String(index + 1).padStart(2, "0")} · {editorText(group, "title")}</option>)}
            </select>
          </label>
          <nav className="inquiry-question-menu inquiry-step-menu" aria-label="Form steps">
            {groups.map((group, index) => {
              const count = questions.filter((question) => question.group === group.id).length;
              return <div className={`inquiry-step-menu-item ${group.id === selectedGroup ? "on" : ""}`} key={group.id}><button className={`inquiry-step-select ${group.id === selectedGroup ? "on" : ""}`} type="button" onClick={() => setSelectedGroup(group.id)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{editorText(group, "title")}</strong><small>{editorLang === "gr" ? "Ελληνικά" : "English"}</small><i>{count} fields</i></button><div className="inquiry-step-reorder" aria-label={`Reorder ${editorText(group, "title")}`}><button type="button" disabled={index === 0} aria-label={`Move ${editorText(group, "title")} up`} title="Move step up" onClick={() => moveStep(group.id, -1)}>↑</button><button type="button" disabled={index === groups.length - 1} aria-label={`Move ${editorText(group, "title")} down`} title="Move step down" onClick={() => moveStep(group.id, 1)}>↓</button></div></div>;
            })}
          </nav>
          <div className="inquiry-builder-list">
          <div className="inquiry-step-heading">
            <div className="inquiry-step-title-editor"><span>Step {String(groups.findIndex((group) => group.id === selectedGroup) + 1).padStart(2, "0")} · {editorLang === "gr" ? "Ελληνικά" : "English"}</span><label><small>{editorLang.toUpperCase()}</small><input aria-label={`${editorLang === "gr" ? "Greek" : "English"} step question`} value={editorText(activeStep || {}, "title")} onChange={(event) => updateStep(selectedGroup, { [editorLang === "gr" ? "title_gr" : "title"]: event.target.value })} /></label></div>
            <div className="inquiry-step-heading-actions"><button className="btn ghost" type="button" onClick={openAddQuestion}><span className="ic">{Ic.plus}</span>Add sub-section</button><button className="btn danger" type="button" disabled={groups.length <= 1} onClick={() => removeStep(selectedGroup)}>{Ic.trash} Remove step</button></div>
          </div>
          {questions.map((question, index) => ({ question, index })).filter((item) => item.question.group === selectedGroup).map(({ question, index }, stepIndex) => {
            const hasOptions = question.type === "buttons" || question.type === "select";
            return (
              <section className="inquiry-question-card" key={question.id}>
                <div className="inquiry-question-head">
                  <span className="inquiry-question-number">{String(index + 1).padStart(2, "0")}</span>
                  <strong>{editorText(question, "label") || "Untitled question"}</strong>
                  {question.required && <span className="inquiry-required-badge">Required</span>}
                  <div className="inquiry-question-actions">
                    <button type="button" onClick={() => moveQuestion(index, -1)} disabled={stepIndex === 0} title="Move up">↑</button>
                    <button type="button" onClick={() => moveQuestion(index, 1)} disabled={stepIndex === stepQuestions.length - 1} title="Move down">↓</button>
                    <button type="button" className="danger" onClick={() => removeQuestion(index)} title="Remove question">{Ic.trash}</button>
                  </div>
                </div>
                <div className="inquiry-language-grid inquiry-language-grid-single">
                  {editorLang === "en" ? <div className="inquiry-language-panel"><div className="inquiry-language-title"><b>EN</b><span>English</span></div><Field label="Question"><input type="text" value={question.label} onChange={(event) => updateQuestion(index, { label: event.target.value })} /></Field><Field label="Placeholder"><input type="text" value={question.placeholder || ""} onChange={(event) => updateQuestion(index, { placeholder: event.target.value })} placeholder="Optional hint" /></Field></div> : <div className="inquiry-language-panel"><div className="inquiry-language-title"><b>GR</b><span>Ελληνικά</span></div><Field label="Ερώτηση"><input type="text" value={question.label_gr || ""} onChange={(event) => updateQuestion(index, { label_gr: event.target.value })} /></Field><Field label="Placeholder"><input type="text" value={question.placeholder_gr || ""} onChange={(event) => updateQuestion(index, { placeholder_gr: event.target.value })} placeholder="Προαιρετική υπόδειξη" /></Field></div>}
                </div>
                <div className="inquiry-question-grid inquiry-question-settings-grid">
                  <Field label="Answer type">
                    <select value={question.type} onChange={(event) => { const choice = ["buttons", "select"].includes(event.target.value); updateQuestion(index, { type: event.target.value, options: choice ? (question.options.length ? question.options : ["Answer 1"]) : [], options_gr: choice ? (question.options_gr.length ? question.options_gr : ["Απάντηση 1"]) : [] }); }}>
                      <option value="text">Short text</option>
                      <option value="textarea">Long text</option>
                      <option value="email">Email</option>
                      <option value="tel">Phone</option>
                      <option value="buttons">Choice buttons</option>
                      <option value="select">Dropdown</option>
                    </select>
                  </Field>
                  <Field label="Form step">
                    <select value={question.group} onChange={(event) => updateQuestion(index, { group: event.target.value })}>
                      {groups.map((group) => <option key={group.id} value={group.id}>{editorText(group, "title")}</option>)}
                    </select>
                  </Field>
                </div>
                <label className="inquiry-required-toggle">
                  <input type="checkbox" checked={question.required} onChange={(event) => updateQuestion(index, { required: event.target.checked })} />
                  <span>Mandatory question</span>
                </label>

                {hasOptions && (
                  <div className="inquiry-options-editor">
                    <div className="inquiry-options-title"><span>Answers · {editorLang === "gr" ? "Greek" : "English"}</span><button type="button" onClick={() => addOption(index)}>{Ic.plus} Add answer</button></div>
                    {(editorLang === "gr" ? (question.options_gr || []) : (question.options || [])).map((option, optionIndex) => (
                      <div className="inquiry-option-row" key={optionIndex}>
                        <span>{optionIndex + 1}</span>
                        <input aria-label={`${editorLang === "gr" ? "Greek" : "English"} answer ${optionIndex + 1}`} type="text" value={option} onChange={(event) => updateOption(index, optionIndex, event.target.value, editorLang)} />
                        <button type="button" onClick={() => removeOption(index, optionIndex)} title="Remove answer">{Ic.trash}</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
          {!stepQuestions.length && <div className="empty-row">This step has no sub-sections yet.</div>}
          </div>
        </div>

        <div className="settings-foot">
          <span className="muted">{groups.length} steps · {questions.length} sub-sections · {questions.filter((question) => question.required).length} mandatory</span>
          <button className="btn primary" type="button" disabled={!changed || !valid} onClick={() => onSave(normalise(form))}>Save form</button>
        </div>
      </div>
      {addingStep && (
        <div className="sheet-wrap inquiry-builder-modal" onMouseDown={(event) => event.target === event.currentTarget && setAddingStep(false)}>
          <div className="sheet inquiry-builder-dialog" role="dialog" aria-modal="true" aria-labelledby="add-step-title">
            <div className="sheet-head"><div><div className="eyebrow">/ New form step</div><h2 id="add-step-title">Add step</h2></div><button className="icon-btn" type="button" aria-label="Close" onClick={() => setAddingStep(false)}>{Ic.close}</button></div>
            <div className="sheet-body"><div className="inquiry-language-grid"><div className="inquiry-language-panel"><div className="inquiry-language-title"><b>EN</b><span>English</span></div><Field label="Step question" required><input autoFocus value={stepDraft.title} onChange={(event) => setStepDraft({ ...stepDraft, title: event.target.value })} placeholder="e.g. What are you planning?" /></Field></div><div className="inquiry-language-panel"><div className="inquiry-language-title"><b>GR</b><span>Ελληνικά</span></div><Field label="Ερώτηση βήματος" required><input value={stepDraft.title_gr} onChange={(event) => setStepDraft({ ...stepDraft, title_gr: event.target.value })} placeholder="π.χ. Τι σχεδιάζετε;" /></Field></div></div></div>
            <div className="sheet-foot"><span className="muted">You can add sub-sections after creating the step</span><div className="right"><button className="btn ghost" type="button" onClick={() => setAddingStep(false)}>Cancel</button><button className="btn primary" type="button" disabled={!stepDraft.title.trim() || !stepDraft.title_gr.trim()} onClick={addStep}>Add step</button></div></div>
          </div>
        </div>
      )}
      {adding && (
        <div className="sheet-wrap inquiry-builder-modal" onMouseDown={(event) => event.target === event.currentTarget && setAdding(false)}>
          <div className="sheet inquiry-builder-dialog" role="dialog" aria-modal="true" aria-labelledby="add-question-title">
            <div className="sheet-head"><div><div className="eyebrow">/ Step sub-section</div><h2 id="add-question-title">Add sub-section</h2></div><button className="icon-btn" type="button" aria-label="Close" onClick={() => setAdding(false)}>{Ic.close}</button></div>
            <div className="sheet-body">
              <div className="inquiry-language-grid">
                <div className="inquiry-language-panel"><div className="inquiry-language-title"><b>EN</b><span>English</span></div><Field label="Question" required><input autoFocus type="text" value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} /></Field></div>
                <div className="inquiry-language-panel"><div className="inquiry-language-title"><b>GR</b><span>Ελληνικά</span></div><Field label="Ερώτηση" required><input type="text" value={draft.label_gr} onChange={(event) => setDraft({ ...draft, label_gr: event.target.value })} /></Field></div>
              </div>
              <div className="inquiry-question-grid inquiry-question-settings-grid">
                <Field label="Answer type"><select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}><option value="text">Short text</option><option value="textarea">Long text</option><option value="email">Email</option><option value="tel">Phone</option><option value="buttons">Choice buttons</option><option value="select">Dropdown</option></select></Field>
                <Field label="Form step"><select value={draft.group} onChange={(event) => setDraft({ ...draft, group: event.target.value })}>{groups.map((group) => <option key={group.id} value={group.id}>{editorText(group, "title")}</option>)}</select></Field>
              </div>
              <label className="inquiry-required-toggle"><input type="checkbox" checked={draft.required} onChange={(event) => setDraft({ ...draft, required: event.target.checked })} /><span>Mandatory question</span></label>
            </div>
            <div className="sheet-foot"><span className="muted">Added to {editorText(groups.find((group) => group.id === draft.group) || {}, "title")}</span><div className="right"><button className="btn ghost" type="button" onClick={() => setAdding(false)}>Cancel</button><button className="btn primary" type="button" disabled={!draft.label.trim() || !draft.label_gr.trim()} onClick={addQuestion}>Add sub-section</button></div></div>
          </div>
        </div>
      )}
      {preview && (
        <div className="sheet-wrap inquiry-builder-modal" onMouseDown={(event) => event.target === event.currentTarget && setPreview(false)}>
          <div className="sheet inquiry-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="form-preview-title">
            <div className="sheet-head"><div><div className="eyebrow">/ Visitor view</div><h2 id="form-preview-title">Form preview</h2></div><div className="controls"><div className="inquiry-preview-language"><button className={previewLang === "en" ? "on" : ""} type="button" onClick={() => setPreviewLang("en")}>EN</button><button className={previewLang === "gr" ? "on" : ""} type="button" onClick={() => setPreviewLang("gr")}>GR</button></div><button className="icon-btn" type="button" aria-label="Close" onClick={() => setPreview(false)}>{Ic.close}</button></div></div>
            <div className="sheet-body inquiry-form-preview">
              {groups.map((group) => {
                const inGroup = questions.filter((question) => question.group === group.id);
                if (!inGroup.length) return null;
                return <section key={group.id}><span className="inquiry-preview-step">{previewText(group, "title")}</span>{inGroup.map((question) => <label key={question.id}><b>{previewText(question, "label")}{question.required ? " *" : ""}</b>{previewField(question)}</label>)}</section>;
              })}
            </div>
            <div className="sheet-foot"><span className="muted">Preview only — answers are not submitted</span><div className="right"><button className="btn primary" type="button" onClick={() => setPreview(false)}>Close preview</button></div></div>
          </div>
        </div>
      )}
    </>
  );
}

function InquiriesList({ data, onView, onDelete }) {
  if (!data.length) {
    return (
      <>
        <SectionHead eyebrow="/ Project inquiries from the website" title="Inquiries" />
        <div className="list"><div className="empty-row">No inquiries yet. Submissions from the “Start a project” form on the live site appear here.</div></div>
      </>
    );
  }
  return (
    <>
      <SectionHead eyebrow="/ Project inquiries from the website" title="Inquiries" />
      <div className="list">
        <div className="list-head head-inquiries">
          <span></span>
          <span>Name · contact</span>
          <span>Type</span>
          <span>Received</span>
          <span></span>
        </div>
        {data.map((q) => {
          const isNew = (q.status || "new") === "new";
          return (
            <div className={`row row-inquiries ${isNew ? "is-new" : ""}`} key={q.id} onClick={() => onView(q.id)}>
              <div className="inq-status"><span className={`inq-dot ${isNew ? "on" : ""}`} title={isNew ? "New" : "Read"}></span></div>
              <div className="name">{q.name || "—"}<span className="sub">{q.email}{q.phone ? ` · ${q.phone}` : ""}</span></div>
              <div className="meta">{q.type || "—"}{q.location ? <span className="sub">{q.location}</span> : null}</div>
              <div className="meta">{formatInquiryDate(q.createdAt)}</div>
              <button className="delete" onClick={(e) => { e.stopPropagation(); onDelete(q.id); }} title="Delete">{Ic.trash}</button>
            </div>
          );
        })}
      </div>
    </>
  );
}

function InquirySheet({ inquiry, onDelete, onClose }) {
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);
  if (!inquiry) return null;
  const q = inquiry;
  const legacyRows = [
    ["Project type", q.type],
    ["Location", q.location],
    ["Approx. size", q.size],
    ["Timeline", q.timeline],
    ["Budget", q.budget],
    ["Company", q.company],
  ].filter(([, v]) => v);
  const rows = q.answers && typeof q.answers === "object"
    ? Object.entries(q.answers)
      .filter(([key, value]) => value && !["name", "email", "phone", "message"].includes(key))
      .map(([key, value]) => [(q.questionLabels || {})[key] || key, value])
    : legacyRows;
  const mailHref = q.email ? `mailto:${q.email}?subject=${encodeURIComponent("Re: your Project58 inquiry")}` : null;
  return (
    <div className="sheet-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" onMouseDown={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <div className="eyebrow">/ Inquiry · {formatInquiryDate(q.createdAt)}</div>
            <h2>{q.name || "Unnamed"}</h2>
          </div>
          <div className="controls">
            <button className="btn ghost" onClick={onClose}>{Ic.close}</button>
          </div>
        </div>
        <div className="sheet-body">
          <div className="inq-contact-row">
            {mailHref ? <a className="btn primary" href={mailHref}>Reply by email</a> : null}
            {q.phone ? <a className="btn ghost" href={`tel:${String(q.phone).replace(/[^\d+]/g, "")}`}>Call {q.phone}</a> : null}
          </div>
          <div className="inq-detail-grid">
            <div className="inq-detail"><span>Email</span><b>{q.email || "—"}</b></div>
            <div className="inq-detail"><span>Phone</span><b>{q.phone || "—"}</b></div>
            {rows.map(([k, v]) => <div className="inq-detail" key={k}><span>{k}</span><b>{v}</b></div>)}
          </div>
          {q.message ? (
            <div className="inq-message">
              <span className="inq-message-label">Message</span>
              <p>{q.message}</p>
            </div>
          ) : null}
        </div>
        <div className="sheet-foot">
          <div className="left"><span>Stored in this browser · localStorage</span></div>
          <div className="right">
            <button className="btn ghost danger" onClick={() => onDelete(q.id)}>Delete</button>
            <button className="btn primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ eyebrow, title, children }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
      </div>
      {children ? <div className="section-head-actions">{children}</div> : null}
    </div>
  );
}

const WEBSITE_TEXT_GROUPS = [
  { id: "navigation", label: "Navigation", route: "home" },
  { id: "home", label: "Home", route: "home" },
  { id: "projects", label: "Project indexes", route: "projects" },
  { id: "architecture", label: "Architecture & services", route: "architecture" },
  { id: "studio", label: "People & studio", route: "agency" },
  { id: "project-ui", label: "Project interface", route: "projects" },
  { id: "footer", label: "Footer & contact", route: "contact" },
  { id: "inquiry", label: "Inquiry introduction", route: "start" },
  { id: "general", label: "General labels", route: "home" },
];

function websiteTextGroup(key) {
  if (["retail", "residential", "agency", "contact", "home", "menu", "more", "search_placeholder", "no_results", "nav", "open_kbd", "close_kbd", "retail_brands", "project_types", "projects", "all", "all_brands", "sort", "sort_date", "sort_region", "menu_eyebrow", "studio_location"].includes(key)) return "navigation";
  if (key.startsWith("home_") || ["see_more_projects", "see_all_projects", "all_rooms_cta", "view_project", "location", "year", "size", "status"].includes(key)) return "home";
  if (key.startsWith("interiors_") || ["two_operators", "rooms_plus_rooms", "proj_word", "pg_rollout", "dn_rollout"].includes(key)) return "projects";
  if (key.startsWith("arch_") || key.startsWith("svc_") || key === "work_with_us" || key === "cta_2026") return "architecture";
  if (key.startsWith("agency_") || ["team_eyebrow", "team_h", "headcount", "headcount_unit", "studios", "updated_label", "practice_eyebrow", "short_history", "news_eyebrow", "recently"].includes(key)) return "studio";
  if (key.startsWith("pd_") || ["next_project", "view"].includes(key)) return "project-ui";
  if (key.startsWith("foot_")) return "footer";
  if (key.startsWith("inquiry_")) return "inquiry";
  return "general";
}

function WebsiteTextsSettings({ site, onSave }) {
  const dictionaries = window.DICT_I18N || { en: {}, gr: {} };
  const makeDraft = (settings) => ({
    en: Object.fromEntries(Object.keys(dictionaries.en || {}).map((key) => [key, Array.isArray((settings.websiteTexts?.en || {})[key] ?? dictionaries.en[key]) ? ((settings.websiteTexts?.en || {})[key] ?? dictionaries.en[key]).join("\n") : String((settings.websiteTexts?.en || {})[key] ?? dictionaries.en[key] ?? "")])),
    gr: Object.fromEntries(Object.keys(dictionaries.en || {}).map((key) => [key, Array.isArray((settings.websiteTexts?.gr || {})[key] ?? dictionaries.gr?.[key] ?? dictionaries.en[key]) ? ((settings.websiteTexts?.gr || {})[key] ?? dictionaries.gr?.[key] ?? dictionaries.en[key]).join("\n") : String((settings.websiteTexts?.gr || {})[key] ?? dictionaries.gr?.[key] ?? dictionaries.en[key] ?? "")])),
  });
  const [draft, setDraft] = useState(() => makeDraft(site));
  const [group, setGroup] = useState("navigation");
  const [query, setQuery] = useState("");
  const [previewLang, setPreviewLang] = useState("en");
  const [pagePreview, setPagePreview] = useState(null);

  useEffect(() => { setDraft(makeDraft(site)); }, [site]);

  const keys = Object.keys(dictionaries.en || {}).filter((key) => websiteTextGroup(key) === group && (!query || `${key} ${draft.en[key]} ${draft.gr[key]}`.toLowerCase().includes(query.toLowerCase())));
  const serialise = () => ({
    en: Object.fromEntries(Object.keys(draft.en).map((key) => [key, Array.isArray(dictionaries.en[key]) ? draft.en[key].split("\n").map((line) => line.trim()).filter(Boolean) : draft.en[key]])),
    gr: Object.fromEntries(Object.keys(draft.gr).map((key) => [key, Array.isArray(dictionaries.gr?.[key] || dictionaries.en[key]) ? draft.gr[key].split("\n").map((line) => line.trim()).filter(Boolean) : draft.gr[key]])),
  });
  const changed = JSON.stringify(serialise()) !== JSON.stringify({
    en: { ...dictionaries.en, ...(site.websiteTexts?.en || {}) },
    gr: { ...dictionaries.gr, ...(site.websiteTexts?.gr || {}) },
  });
  const updateText = (lang, key, value) => setDraft((current) => ({ ...current, [lang]: { ...current[lang], [key]: value } }));
  const previewText = (key) => {
    const section = WEBSITE_TEXT_GROUPS.find((item) => item.id === websiteTextGroup(key));
    const base = dictionaries[previewLang]?.[key] ?? dictionaries.en?.[key];
    const value = Array.isArray(base)
      ? draft[previewLang][key].split("\n").map((line) => line.trim()).filter(Boolean)
      : draft[previewLang][key];
    try { localStorage.setItem("p58_website_text_preview", JSON.stringify({ key, lang: previewLang, value, createdAt: Date.now() })); } catch (error) {}
    const href = `index.html?textPreview=${encodeURIComponent(key)}&previewLang=${previewLang}&snapshot=${Date.now()}#${section?.route || "home"}`;
    setPagePreview({ href, key, section: section?.label || "Website", lang: previewLang });
  };

  return (
    <>
      <SectionHead eyebrow="/ All website copy · English + Greek" title="Website texts">
        <div className="website-text-preview-lang" aria-label="Preview language"><button className={previewLang === "en" ? "on" : ""} onClick={() => setPreviewLang("en")}>EN</button><button className={previewLang === "gr" ? "on" : ""} onClick={() => setPreviewLang("gr")}>GR</button></div>
      </SectionHead>
      <div className="website-texts-toolbar"><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search website texts…" /><span>{Object.keys(dictionaries.en || {}).length} texts · projects excluded</span></div>
      <div className="website-texts-workspace">
        <nav className="website-texts-menu" aria-label="Website text sections">
          {WEBSITE_TEXT_GROUPS.map((item) => {
            const count = Object.keys(dictionaries.en || {}).filter((key) => websiteTextGroup(key) === item.id).length;
            return <button className={group === item.id ? "on" : ""} type="button" key={item.id} onClick={() => setGroup(item.id)}><span>{item.label}</span><small>{count}</small></button>;
          })}
        </nav>
        <div className="website-texts-sheet">
          <div className="website-texts-table-scroll" tabIndex="0" aria-label="Scrollable website texts table">
            <div className="website-texts-table">
              <div className="website-texts-head"><span>Text key</span><span>English</span><span>Ελληνικά</span><span>Location</span></div>
              {keys.map((key) => <div className="website-text-row" key={key}><code>{key.replaceAll("_", " ")}</code><textarea rows={Array.isArray(dictionaries.en[key]) ? 4 : 2} value={draft.en[key] || ""} onChange={(event) => updateText("en", key, event.target.value)} /><textarea rows={Array.isArray(dictionaries.gr?.[key] || dictionaries.en[key]) ? 4 : 2} value={draft.gr[key] || ""} onChange={(event) => updateText("gr", key, event.target.value)} /><button className="btn ghost" type="button" onClick={() => previewText(key)}>Preview {previewLang.toUpperCase()}</button></div>)}
              {!keys.length && <div className="empty-row">No website texts match this search.</div>}
            </div>
          </div>
          <div className="settings-foot"><span className="muted">Changes appear after Save and Publish</span><button className="btn primary" type="button" disabled={!changed} onClick={() => onSave(serialise())}>Save website texts</button></div>
        </div>
      </div>
      {pagePreview && (
        <div className="sheet-wrap website-text-preview-modal" onMouseDown={(event) => event.target === event.currentTarget && setPagePreview(null)}>
          <div className="sheet website-text-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="website-preview-title">
            <div className="sheet-head"><div><div className="eyebrow">/ Page snapshot · {pagePreview.lang.toUpperCase()}</div><h2 id="website-preview-title">{pagePreview.section}</h2></div><button className="icon-btn" type="button" aria-label="Close page preview" onClick={() => setPagePreview(null)}>{Ic.close}</button></div>
            <div className="sheet-body website-text-preview-body"><div className="website-text-preview-browser"><div className="website-text-preview-browser-bar"><span></span><span></span><span></span><code>{pagePreview.key.replaceAll("_", " ")}</code></div><iframe key={pagePreview.href} src={pagePreview.href} title={`${pagePreview.section} page snapshot`} tabIndex="-1" /></div></div>
            <div className="sheet-foot"><span className="muted">Snapshot of where this text appears</span><div className="right"><a className="btn ghost" href={pagePreview.href} target="_blank" rel="noopener">Open full page ↗</a><button className="btn primary" type="button" onClick={() => setPagePreview(null)}>Close</button></div></div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   SITE SETTINGS
   ============================================================ */
/* The home page renders only the first six — pages.jsx slices there. */
const HOME_GALLERY_MAX = 6;

function HeroGallerySettings({ heroGallery, projects, onSave, onToggleFeatured, onReorder }) {
  const [interval, setInterval_] = useState(heroGallery.interval || 5200);
  const dirty = interval !== heroGallery.interval;
  const seconds = Math.round(interval / 100) / 10;

  const order = heroGallery.order || [];
  const chosen = useMemo(() => {
    const rank = new Map(order.map((id, i) => [id, i]));
    const at = (p) => (rank.has(p.id) ? rank.get(p.id) : Number.MAX_SAFE_INTEGER);
    return projects.filter((p) => p.featured).slice().sort((a, b) => at(a) - at(b));
  }, [projects, order]);

  const available = projects.filter((p) => !p.featured);

  const move = (index, dir) => {
    const next = chosen.slice();
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    onReorder(next.map((p) => p.id));
  };

  return (
    <>
      <SectionHead eyebrow="/ Home page hero" title="Hero gallery" />
      <div className="settings-card">
        <div className="form-section">
          <div className="form-section-title">Projects in the gallery</div>
          <p className="hero-hint">
            Each project's <b>hero image</b> is what the gallery shows. This is the same switch as
            “Show on home rail” inside a project — changing it here changes it there.
          </p>

          {chosen.length === 0 ? (
            <p className="hero-hint">
              Nothing is selected, so the home page falls back to the first {HOME_GALLERY_MAX} projects.
            </p>
          ) : (
            <div className="hero-picks">
              {chosen.map((p, i) => (
                <div className={`hero-pick ${i >= HOME_GALLERY_MAX ? "spare" : ""}`} key={p.id}>
                  <div className="hero-pick-slot">{i < HOME_GALLERY_MAX ? i + 1 : "—"}</div>
                  <div className="hero-pick-thumb">
                    {p.hero ? <img src={p.hero} alt="" /> : <span>no hero</span>}
                  </div>
                  <div className="hero-pick-name">
                    {p.name || p.id}
                    <span>{p.brand || ""}</span>
                  </div>
                  <div className="hero-pick-actions">
                    <button className="delete" title="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                    <button className="delete" title="Move down" disabled={i === chosen.length - 1} onClick={() => move(i, 1)}>↓</button>
                    <button className="delete" title="Remove from the gallery" onClick={() => onToggleFeatured(p.id, false)}>{Ic.trash}</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {chosen.length > HOME_GALLERY_MAX && (
            <p className="hero-hint hero-hint-warn">
              {chosen.length - HOME_GALLERY_MAX} project(s) past the first {HOME_GALLERY_MAX} won't appear.
              Move them up, or remove them.
            </p>
          )}

          {available.length > 0 && (
            <select
              className="hero-add"
              value=""
              onChange={(e) => { if (e.target.value) onToggleFeatured(e.target.value, true); }}
            >
              <option value="">Add a project to the gallery…</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>{p.name || p.id}</option>
              ))}
            </select>
          )}
        </div>

        <div className="form-section">
          <div className="form-section-title">Auto-rotate speed</div>
          <div className="field-group cols-1">
            <Field label={`Slide duration — ${seconds}s`} hint="How long each project image is shown before advancing. Range: 2–15 seconds.">
              <input
                type="range"
                min={2000}
                max={15000}
                step={100}
                value={interval}
                onChange={(e) => setInterval_(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </Field>
          </div>
        </div>
        <div className="settings-foot">
          <span className="muted">Changes take effect on the next page load.</span>
          <button className="btn primary" disabled={!dirty} onClick={() => onSave({ ...heroGallery, interval })}>Save</button>
        </div>
      </div>
    </>
  );
}

function HomeV2Settings({ homeV2, onSave }) {
  const normalise = window.normaliseHomeV2 || ((value) => value);
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(normalise(homeV2))));

  useEffect(() => {
    setDraft(JSON.parse(JSON.stringify(normalise(homeV2))));
  }, [homeV2]);

  const banners = draft.banners || [];
  const changed = JSON.stringify(normalise(draft)) !== JSON.stringify(normalise(homeV2));
  const updateBanner = (id, patch) => setDraft((current) => ({
    ...current,
    banners: current.banners.map((banner) => banner.id === id ? { ...banner, ...patch } : banner),
  }));
  const moveBanner = (index, direction) => setDraft((current) => {
    const next = current.banners.slice();
    const target = index + direction;
    if (target < 0 || target >= next.length) return current;
    [next[index], next[target]] = [next[target], next[index]];
    return { ...current, banners: next };
  });
  const addBanner = () => setDraft((current) => ({
    ...current,
    banners: [...current.banners, {
      id: newId("banner"),
      visible: true,
      eyebrow: "New field",
      title: "New banner",
      note: "Add a short description.",
      tone: "sand",
      image: "",
      destination: "projects",
    }],
  }));
  const removeBanner = (id) => {
    if (!confirm("Delete this V2 banner?")) return;
    setDraft((current) => ({ ...current, banners: current.banners.filter((banner) => banner.id !== id) }));
  };

  return (
    <>
      <SectionHead eyebrow="/ Home page · Selected fields" title="V2 banners">
        <button className="btn primary" type="button" onClick={addBanner}><span className="ic">{Ic.plus}</span>Add banner</button>
      </SectionHead>
      <div className="settings-card v2-settings">
        <div className="form-section v2-section-switch">
          <div>
            <div className="form-section-title">V2 section</div>
            <p className="hero-hint">Hide the whole “Where we work” section without deleting its banners.</p>
          </div>
          <button
            className={`visibility-toggle ${draft.enabled ? "is-visible" : "is-hidden"}`}
            type="button"
            role="switch"
            aria-checked={draft.enabled}
            onClick={() => setDraft((current) => ({ ...current, enabled: !current.enabled }))}>
            <span aria-hidden="true"></span>{draft.enabled ? "Visible" : "Hidden"}
          </button>
        </div>

        <div className="form-section">
          <div className="form-section-title">Section heading</div>
          <div className="field-group">
            <Field label="Section label"><input type="text" value={draft.kicker || ""} onChange={(event) => setDraft((current) => ({ ...current, kicker: event.target.value }))} /></Field>
            <Field label="Heading"><input type="text" value={draft.title || ""} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></Field>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Banners</div>
          <p className="hero-hint">The number is generated from this order. Hidden banners keep their content but are skipped on the site.</p>
          <div className="v2-banner-list">
            {banners.map((banner, index) => (
              <article className={`v2-banner-card ${banner.visible === false ? "is-hidden" : ""}`} key={banner.id}>
                <div className="v2-banner-card-head">
                  <span className="v2-banner-index">{String(index + 1).padStart(2, "0")}</span>
                  <strong>{banner.title || "Untitled banner"}</strong>
                  <div className="v2-banner-actions">
                    <button className={`visibility-toggle ${banner.visible === false ? "is-hidden" : "is-visible"}`} type="button" role="switch" aria-checked={banner.visible !== false} onClick={() => updateBanner(banner.id, { visible: banner.visible === false })}><span aria-hidden="true"></span>{banner.visible === false ? "Hidden" : "Visible"}</button>
                    <button className="delete" type="button" title="Move up" disabled={index === 0} onClick={() => moveBanner(index, -1)}>↑</button>
                    <button className="delete" type="button" title="Move down" disabled={index === banners.length - 1} onClick={() => moveBanner(index, 1)}>↓</button>
                    <button className="delete" type="button" title="Delete banner" onClick={() => removeBanner(banner.id)}>{Ic.trash}</button>
                  </div>
                </div>
                <div className="field-group">
                  <Field label="Small heading"><input type="text" value={banner.eyebrow || ""} onChange={(event) => updateBanner(banner.id, { eyebrow: event.target.value })} /></Field>
                  <Field label="Title"><input type="text" value={banner.title || ""} onChange={(event) => updateBanner(banner.id, { title: event.target.value })} /></Field>
                </div>
                <div className="field-group cols-1">
                  <Field label="Description"><textarea rows="2" value={banner.note || ""} onChange={(event) => updateBanner(banner.id, { note: event.target.value })} /></Field>
                </div>
                <div className="field-group">
                  <Field label="Style">
                    <select value={banner.tone || "sand"} onChange={(event) => updateBanner(banner.id, { tone: event.target.value })}>
                      <option value="sand">Sand graphic</option><option value="ink">Dark graphic</option><option value="image">Image</option>
                    </select>
                  </Field>
                  <Field label="Opens">
                    <select value={banner.destination || "projects"} onChange={(event) => updateBanner(banner.id, { destination: event.target.value })}>
                      <option value="projects">All projects</option><option value="architecture">Architecture</option><option value="protein-garden">Protein Garden</option><option value="dinas">DINAS</option><option value="contact">Contact / inquiry</option>
                    </select>
                  </Field>
                </div>
                <div className="field-group cols-1">
                  <Field label="Background image" hint="Optional. Existing Protein Garden and DINAS cards fall back to their current project hero."><ImageInput value={banner.image || ""} onChange={(value) => updateBanner(banner.id, { image: value })} placeholder="Banner background image" /></Field>
                </div>
              </article>
            ))}
            {!banners.length ? <div className="empty-row">No V2 banners yet. Use “Add banner” to create one.</div> : null}
          </div>
        </div>
        <div className="settings-foot">
          <span className="muted">Save, then Publish to make these changes public.</span>
          <button className="btn primary" type="button" disabled={!changed} onClick={() => onSave(normalise(draft))}>Save V2</button>
        </div>
      </div>
    </>
  );
}

function SiteSettings({ site, onSave }) {
  const [s, setS] = useState(site);
  const contact = s.contact || DEFAULT_SITE.contact;
  const setContact = (k, v) => setS((x) => ({ ...x, contact: { ...(x.contact || DEFAULT_SITE.contact), [k]: v } }));
  const setMenuImage = (k, v) => setS((x) => ({ ...x, menuImages: { ...(x.menuImages || DEFAULT_SITE.menuImages), [k]: v } }));
  const setPeopleField = (k, v) => setS((x) => ({ ...x, people: { ...(x.people || DEFAULT_SITE.people), [k]: v } }));
  const setDefaultProjectBadge = (v) => setS((x) => ({ ...x, defaultProjectBadge: v }));
  const setField = (k, v) => setS((x) => ({ ...x, [k]: v }));
  const dirty = JSON.stringify(s) !== JSON.stringify(site);
  return (
    <>
      <SectionHead eyebrow="/ Footer addresses · contact details" title="Site settings" />
      <div className="settings-card">
        <div className="form-section">
          <div className="form-section-title">Browser favicon</div>
          <div className="field-group cols-1">
            <Field label="Favicon" hint="Shown in browser tabs and bookmarks. Use a square SVG or PNG for the sharpest result.">
              <ImageInput value={s.favicon || ""} onChange={(value) => setField("favicon", value)} placeholder="Favicon · square SVG or PNG" />
            </Field>
          </div>
        </div>
        <div className="form-section">
          <div className="form-section-title">People mosaic</div>
          <div className="field-group cols-1">
            <Field label="Fallback group image" hint="Used for team cards that do not have their own portrait yet.">
              <ImageInput value={(s.people || DEFAULT_SITE.people).hero || ""} onChange={(v) => setPeopleField("hero", v)} placeholder="People mosaic fallback image" />
            </Field>
          </div>
        </div>
        <div className="form-section">
          <div className="form-section-title">Default project badge</div>
          <div className="field-group cols-1">
            <Field label="Default badge" hint="Used for every project that does not have its own badge or a sub-category badge.">
              <ImageInput value={s.defaultProjectBadge || ""} onChange={setDefaultProjectBadge} placeholder="Default project badge · square" />
            </Field>
          </div>
        </div>
        <div className="form-section">
          <div className="form-section-title">Desktop menu hover images</div>
          <div className="field-group">
            <Field label="Home image">
              <ImageInput value={(s.menuImages || DEFAULT_SITE.menuImages).home || ""} onChange={(v) => setMenuImage("home", v)} placeholder="Home menu image" />
            </Field>
            <Field label="Projects image">
              <ImageInput value={(s.menuImages || DEFAULT_SITE.menuImages).projects || ""} onChange={(v) => setMenuImage("projects", v)} placeholder="Projects menu image" />
            </Field>
          </div>
          <div className="field-group">
            <Field label="People image">
              <ImageInput value={(s.menuImages || DEFAULT_SITE.menuImages).agency || ""} onChange={(v) => setMenuImage("agency", v)} placeholder="People menu image" />
            </Field>
            <Field label="Contact image">
              <ImageInput value={(s.menuImages || DEFAULT_SITE.menuImages).contact || ""} onChange={(v) => setMenuImage("contact", v)} placeholder="Contact menu image" />
            </Field>
          </div>
        </div>
        <div className="form-section">
          <div className="form-section-title">Footer CTA text</div>
          <div className="field-group">
            <Field label="Lead-in text" hint="The smaller line above the big CTA.">
              <input type="text" value={s.foot_big || ""} onChange={(e) => setField("foot_big", e.target.value)} placeholder="Let's design your" />
            </Field>
            <Field label="CTA highlight" hint="The big bold coloured line.">
              <input type="text" value={s.foot_big_em || ""} onChange={(e) => setField("foot_big_em", e.target.value)} placeholder="next space!" />
            </Field>
          </div>
          <div className="form-section-title" style={{ marginTop: 20 }}>Copyright bar</div>
          <div className="field-group">
            <Field label="Left text">
              <input type="text" value={s.foot_copy_left || ""} onChange={(e) => setField("foot_copy_left", e.target.value)} placeholder="© 2025 — 2026 Project58 Architecture" />
            </Field>
            <Field label="Centre text">
              <input type="text" value={s.foot_copy_mid || ""} onChange={(e) => setField("foot_copy_mid", e.target.value)} placeholder="Architecture · Renovation · Retail" />
            </Field>
          </div>
          <div className="field-group cols-1">
            <Field label="Right text">
              <input type="text" value={s.foot_copy_right || ""} onChange={(e) => setField("foot_copy_right", e.target.value)} placeholder="Designed in-house · v1.0" />
            </Field>
          </div>
        </div>
        <div className="form-section">
          <div className="form-section-title">Final contact / CTA</div>
          <div className="field-group">
            <Field label="Location label">
              <input type="text" value={contact.location_label || ""} onChange={(e) => setContact("location_label", e.target.value)} placeholder="ATHENS" />
            </Field>
            <Field label="Address">
              <input type="text" value={contact.address || ""} onChange={(e) => setContact("address", e.target.value)} placeholder="Akademias 76 · 106 76" />
            </Field>
          </div>
          <div className="field-group">
            <Field label="Google Maps URL" hint="Optional. Leave empty to render address as plain text.">
              <input type="text" value={contact.address_url || ""} onChange={(e) => setContact("address_url", e.target.value)} placeholder="https://maps.google.com/..." />
            </Field>
            <Field label="Phone">
              <input type="text" value={contact.phone || ""} onChange={(e) => setContact("phone", e.target.value)} />
            </Field>
          </div>
          <div className="field-group">
            <Field label="Phone link" hint="Use tel:+302100005800 or leave empty for plain text.">
              <input type="text" value={contact.phone_url || ""} onChange={(e) => setContact("phone_url", e.target.value)} />
            </Field>
            <Field label="Email">
              <input type="text" value={contact.email || ""} onChange={(e) => setContact("email", e.target.value)} />
            </Field>
          </div>
          <div className="field-group">
            <Field label="Email link" hint="Use mailto:name@example.com or leave empty for plain text.">
              <input type="text" value={contact.email_url || ""} onChange={(e) => setContact("email_url", e.target.value)} />
            </Field>
            <Field label="Instagram text">
              <input type="text" value={contact.instagram_text || ""} onChange={(e) => setContact("instagram_text", e.target.value)} placeholder="Instagram → @project.58" />
            </Field>
          </div>
          <div className="field-group cols-1">
            <Field label="Instagram URL" hint="Optional external URL. Opens in a new tab.">
              <input type="text" value={contact.instagram_url || ""} onChange={(e) => setContact("instagram_url", e.target.value)} placeholder="https://instagram.com/project.58" />
            </Field>
          </div>
        </div>
        <div className="settings-foot">
          <span className="muted">Changes appear immediately on the live site (same browser).</span>
          <button className="btn primary" disabled={!dirty} onClick={() => onSave(s)}>Save settings</button>
        </div>
      </div>
    </>
  );
}

function Empty({ kind, onNew }) {
  return (
    <div className="empty">
      <h3>No {kind} yet</h3>
      <p>Add your first one to populate the site. Edits save instantly to your browser.</p>
      <button className="btn primary" onClick={onNew}><span className="ic">{Ic.plus}</span><span>Add {kind.replace(/s$/, "")}</span></button>
    </div>
  );
}

/* ============================================================
   PROJECT SHEET
   ============================================================ */
/* The only three statuses a project can carry. Both the label and the value
   are translated on the site, through the i18n dictionary — which is why this
   is a fixed list and not free text: a typed value has no dictionary entry
   and would appear untranslated in Greek. */
const STATUS_OPTIONS = ["Design Phase", "In Construction", "Built"];

/* Values saved before the list was fixed, mapped onto it. */
const STATUS_ALIASES = {
  "In design": "Design Phase",
  "Concept": "Design Phase",
  "In construction": "In Construction",
  "Completed": "Built",
};
const normaliseStatus = (value) => {
  const v = String(value || "").trim();
  if (STATUS_OPTIONS.includes(v)) return v;
  return STATUS_ALIASES[v] || STATUS_OPTIONS[0];
};
const SPAN_OPTIONS = [
  { v: "gal-12", l: "Full width" },
  { v: "gal-7",  l: "7 / 12" },
  { v: "gal-5",  l: "5 / 12" },
  { v: "gal-6",  l: "6 / 12" },
];

function ProjectSheet({ project, categories, defaultProjectBadge, onSave, onPublish, onTexts, onClose, uploadsActive, publishBusy }) {
  const [p, setP] = useState(() => project ? JSON.parse(JSON.stringify(project)) : ({
    id: newId("pj"),
    slug: "",
    code: "P58-" + String(Math.floor(Math.random() * 900) + 100),
    brand: "Protein Garden",
    category: "retail",
    order: 0,
    featured: false,
    visible: true,
    name: "",
    location: "Athens · ",
    type: "Fast Casual · Retail",
    typology: "retail",
    year: String(new Date().getFullYear()),
    status: "In design",
    status_gr: "",
    size: "",
    size_gr: "",
    contractor: "",
    contractor_gr: "",
    engineer: "",
    engineer_gr: "",
    lead_architect: "",
    lead_architect_gr: "",
    design_team: "",
    design_team_gr: "",
    summary: "",
    hero: "",
    icon: "",
    gallery: [],
  }));
  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));
  const sizeValue = String(p.size || "").replace(/\s*m(?:²|2)\s*$/i, "");

  // Every project shares one site-wide fallback unless it has an override.
  const fallbackBadge = defaultProjectBadge || "";
  const setGallery = (i, key, v) => setP((x) => ({ ...x, gallery: x.gallery.map((g, gi) => gi === i ? { ...g, [key]: v } : g) }));
  const addGallery = () => setP((x) => ({ ...x, gallery: [...x.gallery, { src: "", tag: "", span: "gal-6" }] }));
  const removeGallery = (i) => setP((x) => ({ ...x, gallery: x.gallery.filter((_, gi) => gi !== i) }));

  /* ----- gallery: thumbnails / list + drag to reorder ----- */
  const [galleryView, setGalleryView] = useState(() => {
    try { return localStorage.getItem(GALLERY_VIEW_KEY) === "grid" ? "grid" : "list"; }
    catch (e) { return "list"; }
  });
  const chooseGalleryView = (view) => {
    setGalleryView(view);
    try { localStorage.setItem(GALLERY_VIEW_KEY, view); } catch (e) { /* ignore */ }
  };

  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  // Items only become draggable while the handle is held, so the text
  // inputs inside a row stay selectable.
  const [handleHeld, setHandleHeld] = useState(null);

  const moveGallery = (from, to) => setP((x) => {
    if (from == null || to == null || from === to) return x;
    if (from < 0 || to < 0 || from >= x.gallery.length || to >= x.gallery.length) return x;
    const gallery = x.gallery.slice();
    const [moved] = gallery.splice(from, 1);
    gallery.splice(to, 0, moved);
    return { ...x, gallery };
  });

  const endDrag = () => { setDragIndex(null); setOverIndex(null); setHandleHeld(null); };

  const dragProps = (i) => ({
    draggable: handleHeld === i,
    onDragStart: (e) => {
      setDragIndex(i);
      e.dataTransfer.effectAllowed = "move";
      // Firefox needs data set for a drag to start at all.
      try { e.dataTransfer.setData("text/plain", String(i)); } catch (err) { /* ignore */ }
    },
    onDragOver: (e) => {
      if (dragIndex === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (overIndex !== i) setOverIndex(i);
    },
    onDrop: (e) => {
      e.preventDefault();
      moveGallery(dragIndex, i);
      endDrag();
    },
    onDragEnd: endDrag,
    className: [
      galleryView === "grid" ? "gal-card" : "gallery-item",
      dragIndex === i ? "is-dragging" : "",
      overIndex === i && dragIndex !== null && dragIndex !== i ? "is-over" : "",
    ].filter(Boolean).join(" "),
  });

  // The handle doubles as a keyboard control, so reordering works
  // without a mouse.
  const handleProps = (i) => ({
    className: "gal-drag",
    type: "button",
    title: "Drag to reorder · ↑ ↓ with the keyboard",
    "aria-label": `Reorder image ${i + 1} of ${p.gallery.length}`,
    onMouseDown: () => setHandleHeld(i),
    onMouseUp: () => setHandleHeld(null),
    onTouchStart: () => setHandleHeld(i),
    onTouchEnd: () => setHandleHeld(null),
    onKeyDown: (e) => {
      if (e.key === "ArrowUp" && i > 0) { e.preventDefault(); moveGallery(i, i - 1); }
      if (e.key === "ArrowDown" && i < p.gallery.length - 1) { e.preventDefault(); moveGallery(i, i + 1); }
    },
  });

  const suggestedSlug = descriptiveProjectSlug(p);
  const activeCat = (categories && categories.length ? categories : DEFAULT_CATEGORIES).find((cc) => cc.id === (p.category || p.typology || "retail"));
  const subOptions = (activeCat && activeCat.subcategories) || [];
  const subLabel = (activeCat && activeCat.subLabel && activeCat.subLabel !== "Sub-category") ? activeCat.subLabel : "Brand";
  const valid = p.name && p.code;
  const finished = () => ({ ...p, slug: p.slug || suggestedSlug || p.id, typology: p.category || p.typology || "retail" });
  const save = () => valid && onSave(finished());
  const previewHref = valid
    ? `/index.html?preview=${encodeURIComponent(p.id)}#project/${encodeURIComponent(p.slug || suggestedSlug || p.id)}`
    : "";
  const preparePreview = (event) => {
    if (!valid || uploadsActive) { event.preventDefault(); return; }
    const draft = { ...finished(), visible: true };
    try {
      localStorage.setItem(
        PROJECT_PREVIEW_PREFIX + draft.id,
        JSON.stringify({ project: draft, createdAt: Date.now() })
      );
    } catch (err) {
      event.preventDefault();
      alert("Couldn't open the project preview.\n\n" + err.message);
    }
  };

  /* Publish sits beside Save and only turns up once this sheet holds something
     the site does not have yet. It stays on screen while images are still
     uploading — dimmed and unclickable — because publishing mid-upload would
     put a project live pointing at pictures that are not there. */
  const changed = !project || JSON.stringify(p) !== JSON.stringify(project);
  const showPublish = valid && changed;
  const publishReady = showPublish && !uploadsActive && !publishBusy;
  const publish = () => publishReady && onPublish(finished());

  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);

  return (
    <div className="sheet-wrap">
      <div className="sheet" onMouseDown={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <div className="eyebrow">/ {project ? "Editing" : "New"} project</div>
            <h2>{p.name || "Untitled project"}</h2>
          </div>
          <div className="controls">
            <span className={`status-pill ${project ? "saved" : "draft"}`}>{project ? "Saved" : "Draft"}</span>
            {onTexts && <button className="btn ghost" type="button" onClick={onTexts}>Project texts →</button>}
            <button className="btn ghost" onClick={onClose}>{Ic.close}</button>
          </div>
        </div>

        <div className="sheet-body">
          <div className="form-section">
            <div className="form-section-title">Identity</div>
            <div className="field-group">
              <Field label="Name (EN)" required>
                <input type="text" value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Panormou" />
              </Field>
              <Field label="Name (GR)" hint="Greek translation — falls back to EN">
                <input type="text" value={p.name_gr || ""} onChange={(e) => set("name_gr", e.target.value)} placeholder="π.χ. Πανόρμου" />
              </Field>
            </div>
            <div className="field-group">
              <Field label="Code" required hint="Internal reference">
                <input type="text" value={p.code} onChange={(e) => set("code", e.target.value)} />
              </Field>
              <Field label="Descriptive URL slug" hint={`Public URL: /projects/${p.slug || suggestedSlug || "project-name-location"}`}>
                <input type="text" value={p.slug || ""} onChange={(e) => set("slug", slugify(e.target.value))} placeholder={suggestedSlug || "luxury-villa-mykonos"} />
              </Field>
            </div>
            <div className="field-group">
              <Field label={`${subLabel} (EN)`} hint={subOptions.length ? `Sub-category of ${activeCat.label} — manage the list in Categories` : "Shown over the project hero"}>
                {subOptions.length ? (
                  <select value={p.brand || ""} onChange={(e) => set("brand", e.target.value)}>
                    <option value="">— none —</option>
                    {subOptions.map((s) => (
                      <option key={s.id} value={s.label}>{s.label}</option>
                    ))}
                    {p.brand && !subOptions.some((s) => s.label === p.brand) ? <option value={p.brand}>{p.brand} (not listed)</option> : null}
                  </select>
                ) : (
                  <input type="text" value={p.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Protein Garden" />
                )}
              </Field>

            </div>
            <div className="field-group cols-3">
              <Field label="Category">
                <select value={p.category || p.typology || "retail"} onChange={(e) => set("category", e.target.value)}>
                  {(categories && categories.length ? categories : DEFAULT_CATEGORIES).map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Year">
                <input type="text" value={p.year} onChange={(e) => set("year", e.target.value)} />
              </Field>
              <Field label="Featured">
                <label className="checkline">
                  <input type="checkbox" checked={Boolean(p.featured)} onChange={(e) => set("featured", e.target.checked)} />
                  <span>Show on home rail</span>
                </label>
              </Field>
            </div>
            <div className="field-group cols-1">
              <Field label="Visible on site" hint="Turn this off to keep the project in the dashboard while removing it from the public site.">
                <label className="checkline">
                  <input type="checkbox" checked={p.visible !== false} onChange={(e) => set("visible", e.target.checked)} />
                  <span>{p.visible === false ? "Hidden from the live site" : "Shown on the live site"}</span>
                </label>
              </Field>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Project page details</div>
            <div className="field-group">
              <Field label="Location (EN)">
                <input type="text" value={p.location} onChange={(e) => set("location", e.target.value)} />
              </Field>
              <Field label="Location (GR)">
                <input type="text" value={p.location_gr || ""} onChange={(e) => set("location_gr", e.target.value)} placeholder="π.χ. Αθήνα · Πανόρμου" />
              </Field>
            </div>
            <div className="field-group">
              <Field label="Status" hint="Translated on the site, label and value">
                <select value={normaliseStatus(p.status)} onChange={(e) => set("status", e.target.value)}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <div className="field-group">
              <Field label="Size (EN)">
                <div className="size-input">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={sizeValue}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s*m(?:²|2)\s*$/i, "");
                      set("size", value ? `${value} m²` : "");
                    }}
                    placeholder="e.g. 142" />
                  <span className="size-input-unit" aria-hidden="true">m²</span>
                </div>
              </Field>

            </div>
            <div className="field-group">
              <Field label="Type (EN)">
                <input type="text" value={p.type} onChange={(e) => set("type", e.target.value)} />
              </Field>
              <Field label="Type (GR)" hint="Greek translation — falls back to EN">
                <input type="text" value={p.type_gr || ""} onChange={(e) => set("type_gr", e.target.value)} />
              </Field>
            </div>
            <div className="field-group">
              <Field label="Contractor (EN)">
                <input type="text" value={p.contractor || ""} onChange={(e) => set("contractor", e.target.value)} />
              </Field>
              <Field label="Contractor (GR)" hint="Greek translation — falls back to EN">
                <input type="text" value={p.contractor_gr || ""} onChange={(e) => set("contractor_gr", e.target.value)} />
              </Field>
            </div>
            <div className="field-group">
              <Field label="Engineer (EN)">
                <input type="text" value={p.engineer || ""} onChange={(e) => set("engineer", e.target.value)} />
              </Field>
              <Field label="Engineer / Μηχανολόγος (GR)" hint="Greek translation — falls back to EN">
                <input type="text" value={p.engineer_gr || ""} onChange={(e) => set("engineer_gr", e.target.value)} />
              </Field>
            </div>
            <div className="field-group">
              <Field label="Lead Architect (EN)">
                <input type="text" value={p.lead_architect || ""} onChange={(e) => set("lead_architect", e.target.value)} />
              </Field>
              <Field label="Lead Architect (GR)" hint="Greek translation — falls back to EN">
                <input type="text" value={p.lead_architect_gr || ""} onChange={(e) => set("lead_architect_gr", e.target.value)} />
              </Field>
            </div>
            <div className="field-group">
              <Field label="Design Team (EN)">
                <input type="text" value={p.design_team || ""} onChange={(e) => set("design_team", e.target.value)} />
              </Field>
              <Field label="Design Team (GR)" hint="Greek translation — falls back to EN">
                <input type="text" value={p.design_team_gr || ""} onChange={(e) => set("design_team_gr", e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Short description</div>
            <div className="field-group">
              <Field label="Description (EN)">
                <textarea value={p.summary} onChange={(e) => set("summary", e.target.value)} />
              </Field>
              <Field label="Description (GR)" hint="Greek translation — falls back to EN">
                <textarea value={p.summary_gr || ""} onChange={(e) => set("summary_gr", e.target.value)} placeholder="Ελληνική μετάφραση" />
              </Field>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Hero image</div>
            <ImageInput value={p.hero} onChange={(v) => set("hero", v)} placeholder="Hero · 16:9 recommended" uploadKey={p.id} />
          </div>

          <div className="form-section">
            <div className="form-section-title">Badge</div>
            <ImageInput
              value={p.icon || fallbackBadge}
              onChange={(v) => set("icon", v)}
              placeholder="Brand logo · square"
              uploadKey={p.id}
              extra={
                <div className="badge-extra">
                  <span>
                    {p.icon
                      ? "Custom badge for this project only."
                      : "Using the default project badge. Upload one to override it here."}
                  </span>
                  <button
                    type="button"
                    className="btn"
                    disabled={!p.icon}
                    onClick={() => set("icon", "")}>
                    Reset to default badge
                  </button>
                </div>
              }
            />
          </div>

          <div className="form-section">
            <div className="form-section-title">
              <span>Gallery</span>
              <div className="gal-tools">
                {p.gallery.length > 1 && (
                  <div className="gal-viewswitch" role="group" aria-label="Gallery view">
                    <button
                      type="button"
                      className={galleryView === "grid" ? "on" : ""}
                      onClick={() => chooseGalleryView("grid")}
                      aria-pressed={galleryView === "grid"}
                      title="Thumbnails"
                    >{Ic.grid}<span>Thumbnails</span></button>
                    <button
                      type="button"
                      className={galleryView === "list" ? "on" : ""}
                      onClick={() => chooseGalleryView("list")}
                      aria-pressed={galleryView === "list"}
                      title="List"
                    >{Ic.rows}<span>List</span></button>
                  </div>
                )}
                <button className="add" onClick={addGallery}>{Ic.plus} Add image</button>
              </div>
            </div>

            {p.gallery.length === 0 ? (
              <div className="muted" style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>No gallery images yet.</div>
            ) : null}

            {p.gallery.length > 1 && (
              <div className="gal-hint">Drag the handle to reorder · order here is the order on the site</div>
            )}

            <div className={galleryView === "grid" ? "gal-grid" : ""}>
              {p.gallery.map((g, i) => (
                galleryView === "grid" ? (
                  <div key={i} {...dragProps(i)}>
                    <div className="gal-card-top">
                      <button {...handleProps(i)}>{Ic.grip}</button>
                      <span className="gal-num">{i + 1}</span>
                      <button className="remove" onClick={() => removeGallery(i)} title="Remove">{Ic.trash}</button>
                    </div>
                    <GalleryThumb
                      value={g.src}
                      onChange={(v) => setGallery(i, "src", v)}
                      index={i}
                      uploadKey={p.id}
                    />
                    <input
                      type="text"
                      className="gal-caption"
                      value={g.tag || ""}
                      onChange={(e) => setGallery(i, "tag", e.target.value)}
                      placeholder="Caption (EN)"
                    />
                    <select className="span-select" value={g.span || "gal-6"} onChange={(e) => setGallery(i, "span", e.target.value)}>
                      {SPAN_OPTIONS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                    </select>
                  </div>
                ) : (
                  <div key={i} {...dragProps(i)}>
                    <button {...handleProps(i)}>{Ic.grip}</button>
                    <ImageInput
                      value={g.src}
                      onChange={(v) => setGallery(i, "src", v)}
                      placeholder={`Gallery ${i + 1}`}
                      uploadKey={p.id}
                      extra={
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                          <input
                            type="text"
                            value={g.tag || ""}
                            onChange={(e) => setGallery(i, "tag", e.target.value)}
                            placeholder="Caption (EN)"
                          />
                          <input
                            type="text"
                            value={g.tag_gr || ""}
                            onChange={(e) => setGallery(i, "tag_gr", e.target.value)}
                            placeholder="Caption (GR)"
                          />
                        </div>
                      }
                    />
                    <select className="span-select" value={g.span || "gal-6"} onChange={(e) => setGallery(i, "span", e.target.value)}>
                      {SPAN_OPTIONS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                    </select>
                    <button className="remove" onClick={() => removeGallery(i)} title="Remove">{Ic.trash}</button>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        <div className="sheet-foot">
          <div className="left">
            <span>Saves here, then publishes to the site</span>
            <span>·</span>
            <span>ID {p.id}</span>
          </div>
          <div className="right">
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            {!valid || uploadsActive ? (
              <button className="btn ghost" disabled title={uploadsActive ? "Waiting for images to finish uploading" : "Add a project name and code first"}>
                <span className="ic">{Ic.external}</span>
                <span>{uploadsActive ? "Uploading…" : "Preview"}</span>
              </button>
            ) : (
              <a className="btn ghost" href={previewHref} target="_blank" rel="noopener" onClick={preparePreview} title="Preview this draft without publishing it">
                <span className="ic">{Ic.external}</span>
                <span>Preview</span>
              </a>
            )}
            <button className="btn primary" onClick={save} disabled={!valid}>Save project</button>
            {showPublish && (
              <button
                className={"btn sheet-publish " + (publishReady ? "primary" : "waiting")}
                onClick={publish}
                disabled={!publishReady}
                title={uploadsActive
                  ? "Waiting for images to finish uploading"
                  : publishBusy
                    ? "Publishing…"
                    : "Save and publish this project to the live site"}>
                <span className="ic">{Ic.external}</span>
                <span>
                  {uploadsActive ? "Uploading…" : publishBusy ? "Publishing…" : "Save & publish"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   NEWS SHEET
   ============================================================ */
function NewsSheet({ item, onSave, onClose }) {
  const [n, setN] = useState(() => item ? { ...item } : ({
    _id: newId("nw"),
    date: new Date().toISOString().slice(0, 10).replace(/-/g, " — "),
    cat: "Project",
    title: "",
    deck: "",
  }));
  const set = (k, v) => setN((x) => ({ ...x, [k]: v }));
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);
  const valid = n.title && n.date;

  return (
    <div className="sheet-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" onMouseDown={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <div className="eyebrow">/ {item ? "Editing" : "New"} news item</div>
            <h2>{n.title || "Untitled"}</h2>
          </div>
          <div className="controls">
            <button className="btn ghost" onClick={onClose}>{Ic.close}</button>
          </div>
        </div>

        <div className="sheet-body">
          <div className="field-group">
            <Field label="Date" required hint="Format: 2026 — 05 — 06">
              <input type="text" value={n.date} onChange={(e) => set("date", e.target.value)} />
            </Field>
            <Field label="Category">
              <select value={n.cat} onChange={(e) => set("cat", e.target.value)}>
                <option>Project</option>
                <option>Press</option>
                <option>Studio</option>
                <option>Talk</option>
                <option>Award</option>
              </select>
            </Field>
          </div>
          <div className="field-group">
            <Field label="Title (EN)" required>
              <input type="text" value={n.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label="Title (GR)">
              <input type="text" value={n.title_gr || ""} onChange={(e) => set("title_gr", e.target.value)} />
            </Field>
          </div>
          <div className="field-group">
            <Field label="Deck (EN)" hint="Two-sentence summary shown on the Agency page">
              <textarea value={n.deck} onChange={(e) => set("deck", e.target.value)} />
            </Field>
            <Field label="Deck (GR)">
              <textarea value={n.deck_gr || ""} onChange={(e) => set("deck_gr", e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="sheet-foot">
          <div className="left"><span>Saves here, then publishes to the site</span></div>
          <div className="right">
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            <button className="btn primary" onClick={() => onSave(n)} disabled={!valid}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TEAM SHEET
   ============================================================ */
function TeamSheet({ member, onSave, onClose }) {
  const [t, setT] = useState(() => member ? { ...member } : ({
    _id: newId("tm"),
    name: "",
    role: "Architect",
    note: "",
    portrait: "",
  }));
  const set = (k, v) => setT((x) => ({ ...x, [k]: v }));
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);
  const valid = t.name && t.role;

  return (
    <div className="sheet-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" onMouseDown={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <div className="eyebrow">/ {member ? "Editing" : "New"} team member</div>
            <h2>{t.name || "Untitled"}</h2>
          </div>
          <div className="controls">
            <button className="btn ghost" onClick={onClose}>{Ic.close}</button>
          </div>
        </div>

        <div className="sheet-body">
          <div className="field-group">
            <Field label="Name" required hint="Personal names typically stay the same in both languages">
              <input type="text" value={t.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="ID">
              <input type="text" value={t._id} disabled />
            </Field>
          </div>
          <div className="field-group">
            <Field label="Role (EN)" required>
              <input type="text" value={t.role} onChange={(e) => set("role", e.target.value)} />
            </Field>
            <Field label="Role (GR)">
              <input type="text" value={t.role_gr || ""} onChange={(e) => set("role_gr", e.target.value)} />
            </Field>
          </div>
          <div className="field-group">
            <Field label="Note (EN)" hint="Education, credentials, or a short bio line">
              <textarea value={t.note} onChange={(e) => set("note", e.target.value)} />
            </Field>
            <Field label="Note (GR)">
              <textarea value={t.note_gr || ""} onChange={(e) => set("note_gr", e.target.value)} />
            </Field>
          </div>
          <div className="form-section">
            <div className="form-section-title">Portrait</div>
            <ImageInput value={t.portrait} onChange={(v) => set("portrait", v)} placeholder="Portrait · 4:5 recommended" />
          </div>
        </div>

        <div className="sheet-foot">
          <div className="left"><span>Saves here, then publishes to the site</span></div>
          <div className="right">
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            <button className="btn primary" onClick={() => onSave(t)} disabled={!valid}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CATEGORY SHEET
   ============================================================ */
function CategorySheet({ category, onSave, onClose }) {
  const [c, setC] = useState(() => category ? { ...category, subcategories: (category.subcategories || []).map((s) => ({ ...s })) } : ({
    id: "",
    label: "",
    description: "",
    subLabel: "Sub-category",
    subcategories: [],
  }));
  const set = (k, v) => setC((x) => ({ ...x, [k]: v }));
  const subs = c.subcategories || [];
  const setSub = (i, key, value) => setC((x) => ({ ...x, subcategories: x.subcategories.map((s, j) => j === i ? { ...s, [key]: value } : s) }));
  const addSub = () => setC((x) => ({ ...x, subcategories: [...(x.subcategories || []), { id: newId("sub"), label: "", order: (x.subcategories || []).length, icon: "" }] }));
  const removeSub = (i) => setC((x) => ({ ...x, subcategories: x.subcategories.filter((_, j) => j !== i) }));
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);
  const slugFromLabel = (c.label || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const valid = c.label && (c.id || slugFromLabel);

  return (
    <div className="sheet-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" onMouseDown={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <div className="eyebrow">/ {category ? "Editing" : "New"} category</div>
            <h2>{c.label || "Untitled category"}</h2>
          </div>
          <div className="controls">
            <button className="btn ghost" onClick={onClose}>{Ic.close}</button>
          </div>
        </div>

        <div className="sheet-body">
          <div className="field-group">
            <Field label="Label" required>
              <input type="text" value={c.label} onChange={(e) => set("label", e.target.value)} placeholder="Retail" />
            </Field>
            <Field label="ID" hint="Used by projects and URLs. Lowercase letters, numbers, and hyphens.">
              <input type="text" value={c.id || slugFromLabel} onChange={(e) => set("id", e.target.value)} placeholder="retail" />
            </Field>
          </div>
          <Field label="Description">
            <textarea value={c.description || ""} onChange={(e) => set("description", e.target.value)} placeholder="Short internal description for the dashboard grouping." />
          </Field>

          <div className="sheet-section-head">
            <h3>Sub-categories</h3>
            <p>Group projects within this category. For Retail this is the brand.</p>
          </div>
          <Field label="Sub-category name" hint="What this category is divided by — e.g. Brand, Collection, Phase.">
            <input type="text" value={c.subLabel || ""} onChange={(e) => set("subLabel", e.target.value)} placeholder="Brand" />
          </Field>
          <div className="sublist">
            {subs.length === 0 ? (
              <div className="sublist-empty">No sub-categories yet.</div>
            ) : subs.map((s, i) => (
              <div className="sublist-row" key={s.id || i}>
                <input type="text" value={s.label} onChange={(e) => setSub(i, "label", e.target.value)} placeholder={`${c.subLabel || "Sub-category"} ${i + 1}`} />
                <SubIconPicker value={s.icon || ""} onChange={(v) => setSub(i, "icon", v)} />
                <button className="delete" onClick={() => removeSub(i)} title="Remove">{Ic.trash}</button>
              </div>
            ))}
            <button className="btn ghost sublist-add" onClick={addSub}><span className="ic">{Ic.plus}</span><span>Add Sub-category</span></button>
          </div>
        </div>

        <div className="sheet-foot">
          <div className="left"><span>Saves here, then publishes to the site</span></div>
          <div className="right">
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            <button className="btn primary" onClick={() => onSave({ ...c, id: c.id || slugFromLabel, subcategories: subs.filter((s) => (s.label || "").trim()) })} disabled={!valid}>Save category</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SHARED FIELD + IMAGE INPUT
   ============================================================ */
function Field({ label, hint, required, children }) {
  return (
    <div className="field">
      <label>{label}{required && <span className="req">*</span>}</label>
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

/* A slot can hold a still or a clip — render whichever this is. Clips are
   muted and loop so a preview behaves like an animated thumbnail. */
function MediaPreview({ src, alt, className, lazy }) {
  if (window.isVideoSrc(src)) {
    return (
      <video
        className={className}
        src={src}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
      />
    );
  }
  return (
    <img
      className={className}
      src={src}
      alt={alt || ""}
      loading={lazy ? "lazy" : undefined}
      decoding="async"
      draggable="false"
    />
  );
}

// Shared by ImageInput and the compact gallery thumbnail.
/* Picks an image, downscales it, and puts it in the media library —
   what gets stored in the content is a URL, not the image itself.

   If the library isn't reachable (the local static server has no /api,
   or no Blob store is linked yet) it falls back to embedding the image
   so the dashboard still works, and says so: embedded images spend the
   shared ~5MB localStorage budget that all your content lives in. */
async function ensureProjectMediaAssignment(item, projectId) {
  if (!item || !item.id || !projectId) return item;
  const body = await updateMediaWithRetry(
    { id: item.id, projectId },
    (updated) => updated && updated.projectId === projectId
  );
  return body.item;
}

async function readImageFile(e, onChange, onBusy, uploadKey) {
  const file = e.target.files && e.target.files[0];
  e.target.value = "";
  if (!file) return;

  const setBusy = onBusy || function () {};
  setBusy(true);
  uploadRegistry.begin(uploadKey, 1);

  let shrunk;
  try {
    shrunk = await downscaleImage(file);
  } catch (err) {
    setBusy(false);
    uploadRegistry.step(uploadKey);
    alert(err.message);
    return;
  }

  const projectId = uploadKey && uploadKey !== BACKLOG_KEY ? uploadKey : null;
  let uploadedItem = null;
  try {
    const body = await mediaApi.upload({
      filename: file.name,
      dataUrl: shrunk.dataUrl,
      projectId,
    });
    uploadedItem = body.item;
  } catch (err) {
    onChange(shrunk.dataUrl);
    alert("This image was saved inside this browser rather than the media library.\n\n" + err.message);
    setBusy(false);
    uploadRegistry.step(uploadKey);
    return;
  }

  onChange(uploadedItem.url);
  if (projectId) {
    try {
      await ensureProjectMediaAssignment(uploadedItem, projectId);
    } catch (err) {
      alert("The image uploaded, but Media could not confirm its project assignment. Try Save project, then Refresh in Media.\n\n" + err.message);
    }
  }
  setBusy(false);
  uploadRegistry.step(uploadKey);
}

/* Compact tile used by the gallery's thumbnail view. The full editor
   (URL field, Greek caption) stays in the list view. */
function GalleryThumb({ value, onChange, index, uploadKey }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="gal-thumb">
      <input type="file" ref={ref} accept="image/*,video/mp4" onChange={(e) => readImageFile(e, onChange, setBusy, uploadKey)} style={{ display: "none" }} />
      {value
        ? <MediaPreview src={value} />
        : <div className="gal-thumb-empty">Image {index + 1}</div>}
      <button type="button" className="gal-thumb-btn" disabled={busy} onClick={() => ref.current && ref.current.click()}>
        {busy ? "Uploading…" : value ? "Replace" : "Upload"}
      </button>
    </div>
  );
}

/* The badge that sits beside a sub-category's name in the category editor.
   Deliberately smaller than ImageInput: this lives inside a list row, so a
   preview panel and a URL field would swamp the name it belongs to. */
function SubIconPicker({ value, onChange }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  return (
    <div className="sub-icon">
      {picking && <MediaPicker onPick={(item) => { onChange(item.url); setPicking(false); }} onClose={() => setPicking(false)} />}
      <input type="file" ref={ref} accept="image/*" onChange={(e) => readImageFile(e, onChange, setBusy)} style={{ display: "none" }} />
      <div className="sub-icon-preview">
        {value ? <img src={value} alt="" /> : <span>—</span>}
      </div>
      <button type="button" className="sub-icon-btn" disabled={busy} onClick={() => ref.current && ref.current.click()} title="Upload a logo for this sub-category">
        {busy ? "…" : "Upload"}
      </button>
      <button type="button" className="sub-icon-btn" onClick={() => setPicking(true)} title="Pick one already in the library">Library</button>
      {value ? <button type="button" className="sub-icon-btn" onClick={() => onChange("")} title="Remove logo">Clear</button> : null}
    </div>
  );
}

function ImageInput({ value, onChange, placeholder, extra, uploadKey }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const onFile = (e) => readImageFile(e, onChange, setBusy, uploadKey);
  const onLibraryPick = (item) => {
    onChange(item.url);
    if (!uploadKey || (item.projectId === uploadKey && item.kind === "image")) return;
    updateMediaWithRetry(
      { id: item.id, projectId: uploadKey, kind: "image" },
      (updated) => updated && updated.projectId === uploadKey && updated.kind === "image"
    ).catch((err) => {
      alert("The image was added to the project, but its Media assignment couldn't be updated.\n\n" + err.message);
    });
  };
  const isDataUrl = value && value.startsWith("data:");
  const sizeKb = isDataUrl ? Math.round(value.length / 1024) : null;

  return (
    <div className="img-input">
      {picking && <MediaPicker currentProjectId={uploadKey} onPick={onLibraryPick} onClose={() => setPicking(false)} />}
      <div className="preview">
        {value ? <MediaPreview src={value} /> : <div className="placeholder">{placeholder || "No image"}</div>}
      </div>
      <div className="right">
        <input
          type="file"
          ref={ref}
          accept="image/*,video/mp4"
          onChange={onFile}
          style={{ display: "none" }}
        />
        <div className="controls">
          <button className="btn ghost" type="button" disabled={busy} onClick={() => ref.current && ref.current.click()}>
            <span className="ic">{Ic.upload}</span><span>{busy ? "Uploading…" : value ? "Replace" : "Upload"}</span>
          </button>
          <button className="btn ghost" type="button" onClick={() => setPicking(true)} title="Pick an image already in the library">
            <span className="ic">{Ic.grid}</span><span>Library</span>
          </button>
          {value ? <button className="btn ghost" type="button" onClick={() => onChange("")}>{Ic.close}<span>Clear</span></button> : null}
        </div>
        <input
          type="text"
          value={value && !isDataUrl ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isDataUrl ? "(uploaded image)" : "Or paste image URL"}
        />
        {extra}
        <div className="meta-row">
          {isDataUrl
            ? `Embedded in this browser · ${sizeKb}kb — move it to the library from the Media section`
            : value ? "Linked" : "—"}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MEDIA LIBRARY
   ------------------------------------------------------------
   Two groups: images assigned to a project, and the backlog —
   everything not attached to one yet. Assignment is a field on
   the library entry, so moving an image between the two never
   changes its URL and never breaks a page already using it.
   ============================================================ */

/* Walks the content tree and collects the path to every embedded
   base64 image. Deliberately generic rather than a list of known
   fields (hero, gallery, photo…) so a field added later is still
   picked up without touching this code. */
function collectDataUrls(node, path, out) {
  if (typeof node === "string") {
    if (node.startsWith("data:image")) out.push({ path: path.slice(), value: node });
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach((child, i) => collectDataUrls(child, path.concat(i), out));
    return out;
  }
  if (node && typeof node === "object") {
    Object.keys(node).forEach((key) => collectDataUrls(node[key], path.concat(key), out));
  }
  return out;
}

/* Copy-on-write down a single path, so untouched branches keep their
   identity and React's change detection stays cheap. */
function setAtPath(root, path, value) {
  const clone = Array.isArray(root) ? root.slice() : { ...root };
  let cursor = clone;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const child = cursor[key];
    cursor[key] = Array.isArray(child) ? child.slice() : { ...child };
    cursor = cursor[key];
  }
  cursor[path[path.length - 1]] = value;
  return clone;
}

function MediaTile({ item, projects, onAssign, onDelete, onCaption, onKind, selected, onSelect }) {
  const [caption, setCaption] = useState(item.caption || "");
  useEffect(() => setCaption(item.caption || ""), [item.id, item.caption]);

  return (
    <div className={`media-tile ${selected ? "is-selected" : ""}`}>
      <label className="media-select" title="Select for bulk actions">
        <input type="checkbox" checked={!!selected} onChange={() => onSelect(item.id)} />
        <span>Select</span>
      </label>
      <a className="media-thumb" href={item.url} target="_blank" rel="noopener" title="Open full size">
        <MediaPreview src={item.url} alt={item.caption || item.filename} lazy />
      </a>
      <div className="media-body">
        <div className="media-name" title={item.filename}>{item.filename}</div>
        <div className="media-meta">
          {formatBytes(item.size)}
          {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
          {item.uploadedAt ? ` · ${new Date(item.uploadedAt).toLocaleDateString()}` : ""}
        </div>
        <input
          className="media-caption"
          type="text"
          value={caption}
          placeholder="Caption (optional)"
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => { if (caption !== (item.caption || "")) onCaption(item.id, caption); }}
        />
        <select
          className="media-assign"
          value={item.projectId || ""}
          onChange={(e) => onAssign(item.id, e.target.value || null)}
        >
          <option value="">Backlog — no project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name || p.id}</option>
          ))}
        </select>
        <select
          className="media-assign"
          value={item.kind === "logo" || item.kind === "icon" ? "graphic" : "image"}
          onChange={(e) => onKind(item.id, e.target.value === "graphic" ? "icon" : "image")}
          aria-label="Media type"
        >
          <option value="image">Project image</option>
          <option value="graphic">Graphic element</option>
        </select>
        <div className="media-actions">
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              if (navigator.clipboard) navigator.clipboard.writeText(item.url);
            }}
            title="Copy the image URL"
          >
            Copy URL
          </button>
          <button className="delete" type="button" onClick={() => onDelete(item)} title="Delete">{Ic.trash}</button>
        </div>
      </div>
    </div>
  );
}

function groupMediaItems(items, projects, query, projectFilter, dateFrom, dateTo) {
  const q = query.trim().toLowerCase();
  const from = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : null;
  const to = dateTo ? new Date(dateTo + "T23:59:59.999").getTime() : null;
  const known = new Set(projects.map((p) => p.id));
  const visible = items.filter((item) => {
    if (q && !((item.filename || "") + " " + (item.caption || "")).toLowerCase().includes(q)) return false;
    const effectiveProject = known.has(item.projectId) ? item.projectId : "backlog";
    if (projectFilter !== "all" && effectiveProject !== projectFilter) return false;
    const uploaded = Date.parse(item.uploadedAt || "");
    if (from && (!uploaded || uploaded < from)) return false;
    if (to && (!uploaded || uploaded > to)) return false;
    return true;
  });

  const assigned = new Map();
  const backlog = [];
  const graphics = [];
  visible.forEach((item) => {
    const name = item.filename || "";
    const inferredKind = item.kind === "logo" || /(^|[-_])logo([-_.]|$)/i.test(name)
      ? "logo"
      : item.kind === "icon" || item.contentType === "image/svg+xml" || /(^|[-_])icon([-_.]|$)/i.test(name)
        ? "icon"
        : "image";
    if (inferredKind === "logo" || inferredKind === "icon") { graphics.push(item); return; }
    if (item.projectId && known.has(item.projectId)) {
      if (!assigned.has(item.projectId)) assigned.set(item.projectId, []);
      assigned.get(item.projectId).push(item);
    } else {
      backlog.push(item);
    }
  });

  return {
    backlog,
    graphics,
    byProject: projects.filter((p) => assigned.has(p.id)).map((p) => ({ project: p, items: assigned.get(p.id) })),
    count: visible.length,
  };
}

function MediaLibrary({ projects, data, onReplaceData, onExport, onToast }) {
  const initialItems = useMemo(() => cachedMediaItems(), []);
  const [items, setItems] = useState(initialItems);
  const [status, setStatus] = useState(initialItems.length ? "ready" : "loading"); // loading | ready | error
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [collapsed, setCollapsed] = useState({});
  const [groupsDefaultCollapsed, setGroupsDefaultCollapsed] = useState(true);
  const [groupView, setGroupView] = useState("all");
  const [selected, setSelected] = useState([]);
  const [bulkProject, setBulkProject] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadDestination, setUploadDestination] = useState("graphics");
  const fileRef = useRef(null);

  const refresh = () => {
    if (!items.length) setStatus("loading");
    mediaApi
      .list(true)
      .then((body) => { setItems((body && body.items) || []); setError(null); setStatus("ready"); })
      .catch((err) => {
        setError(err);
        if (!items.length) setStatus("error");
      });
  };

  useEffect(() => { refresh(); }, []);

  /* ----- upload ----- */
  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    const existingNames = new Set(items.map((item) => String(item.filename || "").toLowerCase()));
    const batchNames = new Set();
    const duplicate = files.find((file) => {
      const name = normaliseMediaFilename(file.name).toLowerCase();
      if (existingNames.has(name) || batchNames.has(name)) return true;
      batchNames.add(name);
      return false;
    });
    if (duplicate) {
      alert(`A file named ${normaliseMediaFilename(duplicate.name)} already exists in Media or appears twice in this upload. Rename it before uploading.`);
      return;
    }

    const added = [];
    for (let i = 0; i < files.length; i++) {
      setBusy(files.length > 1 ? `Uploading ${i + 1} of ${files.length}…` : "Uploading…");
      try {
        const shrunk = await downscaleImage(files[i]);
        const body = await mediaApi.upload({
          filename: files[i].name,
          dataUrl: shrunk.dataUrl,
          width: shrunk.width,
          height: shrunk.height,
          kind: uploadDestination === "graphics" ? "icon" : "image",
          projectId: uploadDestination === "graphics" ? null : uploadDestination,
        });
        added.push(body.item);
      } catch (err) {
        // Stop on the first failure instead of one alert per file.
        setBusy(null);
        if (added.length) setItems((prev) => added.concat(prev));
        alert("Couldn't upload " + files[i].name + ".\n\n" + err.message);
        return;
      }
    }

    setBusy(null);
    setItems((prev) => added.concat(prev));
    onToast(added.length === 1 ? "Image uploaded" : added.length + " images uploaded");
  };

  /* ----- assign / caption / delete ----- */
  const patch = (id, changes, failureNote) => {
    const before = items;
    setItems(items.map((x) => (x.id === id ? { ...x, ...changes } : x)));
    updateMediaWithRetry(
      { id, ...changes },
      (updated) => updated && Object.keys(changes).every((key) => updated[key] === changes[key])
    )
      .then((body) => setItems((current) => current.map((x) => (x.id === id ? body.item : x))))
      .catch((err) => {
        setItems(before); // put it back — the server is the source of truth
        alert(failureNote + "\n\n" + err.message);
      });
  };

  const onAssign = (id, projectId) => patch(
    id,
    projectId ? { projectId, kind: "image" } : { projectId: null },
    "Couldn't move that image."
  );
  const onCaption = (id, caption) => patch(id, { caption }, "Couldn't save that caption.");
  const onKind = (id, kind) => patch(id, { kind }, "Couldn't change that media type.");

  const onDelete = (item) => {
    if (!confirm(
      "Delete " + item.filename + "?\n\n" +
      "If a project or news item already uses this image, it will show as broken. This cannot be undone."
    )) return;

    // The storage request can take a moment. Remove the card immediately so
    // the click always has visible feedback, and restore it only on failure.
    const previousIndex = items.findIndex((current) => current.id === item.id);
    setItems((current) => current.filter((x) => x.id !== item.id));
    setSelected((current) => current.filter((id) => id !== item.id));
    cacheMediaItems(mediaMemoryItems.filter((current) => current.id !== item.id));
    mediaApi
      .remove(item.id)
      .then(() => onToast("Image deleted"))
      .catch((err) => {
        setItems((current) => {
          if (current.some((x) => x.id === item.id)) return current;
          const restored = current.slice();
          restored.splice(Math.max(0, Math.min(previousIndex, restored.length)), 0, item);
          cacheMediaItems(restored);
          return restored;
        });
        alert("Couldn't delete that image. It has been restored.\n\n" + err.message);
      });
  };

  const toggleSelected = (id) => setSelected((current) =>
    current.includes(id) ? current.filter((x) => x !== id) : current.concat(id)
  );

  const bulkUpdate = async (changes, successMessage) => {
    const ids = selected.slice();
    if (!ids.length) return;
    setBusy(`Updating ${ids.length}…`);
    try {
      const updated = [];
      for (const id of ids) {
        const body = await updateMediaWithRetry(
          { id, ...changes },
          (item) => item && Object.keys(changes).every((key) => item[key] === changes[key])
        );
        updated.push(body.item);
      }
      const byId = new Map(updated.map((item) => [item.id, item]));
      setItems((current) => current.map((item) => byId.get(item.id) || item));
      setSelected([]);
      onToast(successMessage);
    } catch (err) {
      alert("Couldn't update all selected files.\n\n" + err.message);
      refresh();
    } finally {
      setBusy(null);
    }
  };

  const bulkDelete = async () => {
    const ids = selected.slice();
    if (!ids.length || !confirm(`Delete ${ids.length} selected file(s)?\n\nThis cannot be undone.`)) return;
    const removed = items.filter((item) => ids.includes(item.id));
    setBusy(`Deleting ${ids.length}…`);
    setItems((current) => current.filter((item) => !ids.includes(item.id)));
    setSelected([]);
    cacheMediaItems(mediaMemoryItems.filter((item) => !ids.includes(item.id)));
    try {
      for (const id of ids) await mediaApi.remove(id);
      onToast(`${ids.length} file(s) deleted`);
    } catch (err) {
      alert("Couldn't delete all selected files.\n\n" + err.message);
      setItems((current) => {
        const present = new Set(current.map((item) => item.id));
        const restored = current.concat(removed.filter((item) => !present.has(item.id)));
        cacheMediaItems(restored);
        return restored;
      });
      refresh();
    } finally {
      setBusy(null);
    }
  };

  /* ----- one-time migration out of localStorage ----- */
  const [migrating, setMigrating] = useState(null);
  const embedded = useMemo(() => collectDataUrls(data, [], []), [data]);

  const onMigrate = async () => {
    if (!embedded.length) return;
    if (!confirm(
      embedded.length + " embedded image(s) will be uploaded to storage and replaced with links.\n\n" +
      "Export a JSON backup first — this rewrites your content. Continue?"
    )) return;

    onExport(); // backup on disk before anything is rewritten

    // The same image can be embedded in several places; upload once.
    const uploaded = new Map();
    let next = data;
    let done = 0;

    for (const found of embedded) {
      setMigrating(`Uploading ${done + 1} of ${embedded.length}…`);
      try {
        if (!uploaded.has(found.value)) {
          // projects[3].hero -> tag the upload with that project's id
          let projectId = null;
          if (found.path[0] === "projects" && typeof found.path[1] === "number") {
            const owner = data.projects[found.path[1]];
            if (owner && owner.id) projectId = owner.id;
          }
          const body = await mediaApi.upload({
            filename: found.path.join("-") + ".jpg",
            dataUrl: found.value,
            projectId,
          });
          uploaded.set(found.value, body.item);
        }
        next = setAtPath(next, found.path, uploaded.get(found.value).url);
        done += 1;
      } catch (err) {
        setMigrating(null);
        // Keep whatever succeeded rather than losing the work.
        if (done) { onReplaceData(next); refresh(); }
        alert("Stopped after " + done + " of " + embedded.length + ".\n\n" + err.message);
        return;
      }
    }

    setMigrating(null);
    onReplaceData(next);
    refresh();
    onToast(done + " image(s) moved to storage");
  };

  /* ----- grouping ----- */
  const groups = useMemo(
    () => groupMediaItems(items, projects, query, projectFilter, dateFrom, dateTo),
    [items, projects, query, projectFilter, dateFrom, dateTo]
  );

  if (status === "loading") {
    return <div className="media-note">Loading the library…</div>;
  }

  if (status === "error") {
    return (
      <div className="media-note media-note-warn">
        <b>The media library isn't available.</b>
        <p>{error.message}</p>
        {error.code === "blob_not_configured" && (
          <p>In Vercel: <b>Storage → Create → Blob</b>, choose <b>Public</b>, connect it to this project, then redeploy.</p>
        )}
        <button className="btn ghost" type="button" onClick={refresh}>Try again</button>
      </div>
    );
  }

  const tileProps = { projects, onAssign, onDelete, onCaption, onKind, onSelect: toggleSelected };
  const visibleGroupKeys = [
    groups.graphics.length ? "graphics" : null,
    groups.backlog.length ? "backlog" : null,
    ...groups.byProject.map(({ project }) => project.id),
  ].filter(Boolean);
  const groupNav = [
    groups.graphics.length ? { key: "graphics", label: "Graphic Elements", count: groups.graphics.length } : null,
    groups.backlog.length ? { key: "backlog", label: "Backlog", count: groups.backlog.length } : null,
    ...groups.byProject.map(({ project, items: list }) => ({
      key: project.id,
      label: project.name || project.id,
      count: list.length,
    })),
  ].filter(Boolean);
  const activeGroupView = groupView === "all" || visibleGroupKeys.includes(groupView) ? groupView : "all";
  const isGroupCollapsed = (key) => Object.prototype.hasOwnProperty.call(collapsed, key)
    ? collapsed[key]
    : groupsDefaultCollapsed;
  const allGroupsHidden = visibleGroupKeys.length > 0 && visibleGroupKeys.every(isGroupCollapsed);
  const toggleAllGroups = () => {
    const hide = !allGroupsHidden;
    const next = { ...collapsed };
    visibleGroupKeys.forEach((key) => { next[key] = hide; });
    setCollapsed(next);
    setGroupsDefaultCollapsed(hide);
    // A global action must always return to the global view. Otherwise
    // "Show all" expands every group but a previously selected sidebar
    // filter still leaves only one of them visible.
    setGroupView("all");
  };
  const renderGroup = (key, title, note, list) => list.length > 0 && (activeGroupView === "all" || activeGroupView === key) && (
    <div className="media-group" id={`media-group-${key}`} key={key}>
      <button
        className="media-group-head"
        type="button"
        onClick={() => setCollapsed((current) => ({
          ...current,
          [key]: !(Object.prototype.hasOwnProperty.call(current, key) ? current[key] : groupsDefaultCollapsed),
        }))}
      >
        <b><span className="media-chevron">{isGroupCollapsed(key) ? "▸" : "▾"}</span>{title}</b>
        <span>{list.length} {note}</span>
      </button>
      {!isGroupCollapsed(key) && (
        <div className="media-grid">
          {list.map((item) => <MediaTile key={item.id} item={item} selected={selected.includes(item.id)} {...tileProps} />)}
        </div>
      )}
    </div>
  );

  return (
    <div className="media">
      <SectionHead
        eyebrow="Media"
        title={`${items.length} file${items.length === 1 ? "" : "s"} · ${groups.backlog.length} in backlog`}
      />

      <div className="media-bar">
        <input type="file" ref={fileRef} accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml,image/gif,video/mp4,.jpg,.jpeg,.png,.webp,.avif,.svg,.gif,.mp4" multiple onChange={onFiles} style={{ display: "none" }} />
        <button className="btn primary" type="button" disabled={!!busy} onClick={() => setUploadOpen(true)}>
          <span className="ic">{Ic.upload}</span><span>{busy || "Upload media"}</span>
        </button>
        <input
          className="media-search"
          type="search"
          value={query}
          placeholder="Search by filename or caption"
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="media-filter" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="all">All projects</option>
          <option value="backlog">Backlog</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
        </select>
        <label className="media-date">From <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
        <label className="media-date">To <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
        <button className="btn ghost" type="button" disabled={!visibleGroupKeys.length} onClick={toggleAllGroups}>
          {allGroupsHidden ? "Show all groups" : "Hide all groups"}
        </button>
        <button className="btn ghost" type="button" onClick={refresh}>Refresh</button>
      </div>

      {selected.length > 0 && (
        <div className="media-bulk">
          <b>{selected.length} selected</b>
          <select value={bulkProject} onChange={(e) => setBulkProject(e.target.value)}>
            <option value="">Move to backlog</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
          </select>
          <button className="btn ghost" onClick={() => bulkUpdate(bulkProject ? { projectId: bulkProject, kind: "image" } : { projectId: null }, "Selected files moved")}>Move</button>
          <button className="btn ghost" onClick={() => bulkUpdate({ kind: "image" }, "Selected files marked as project images")}>Project images</button>
          <button className="btn ghost" onClick={() => bulkUpdate({ kind: "icon", projectId: null }, "Selected files moved to Graphic Elements")}>Graphic Elements</button>
          <button className="btn ghost" onClick={() => setSelected([])}>Clear</button>
          <button className="btn danger" onClick={bulkDelete}>Delete</button>
        </div>
      )}

      {embedded.length > 0 && (
        <div className="media-note media-note-warn">
          <b>{embedded.length} image(s) are still stored inside this browser.</b>
          <p>
            They sit in localStorage as base64, which is capped at about 5MB for all your content
            together and never leaves this machine. Moving them into storage frees that space and
            makes them load faster on the live site.
          </p>
          <button className="btn primary" type="button" disabled={!!migrating} onClick={onMigrate}>
            {migrating || "Move them to storage"}
          </button>
        </div>
      )}

      {groups.count === 0 && (
        <div className="media-note">
          {query ? "Nothing matches that search." : "No images yet. Upload a few to get started."}
        </div>
      )}

      <div className="media-layout">
        <div className="media-groups">
          {renderGroup("graphics", "Graphic Elements", "file(s)", groups.graphics)}
          {renderGroup("backlog", "Backlog", "not assigned to a project", groups.backlog)}
          {groups.byProject.map(({ project, items: list }) => renderGroup(project.id, project.name || project.id, "image(s)", list))}
        </div>
        <aside className="media-group-nav" aria-label="Media groups">
          <div className="media-group-nav-title">Groups</div>
          <button className={activeGroupView === "all" ? "on" : ""} type="button" onClick={() => setGroupView("all")}>
            <span>View all</span><b>{groups.count}</b>
          </button>
          {groupNav.map((group) => (
            <button
              className={activeGroupView === group.key ? "on" : ""}
              type="button"
              key={group.key}
              onClick={() => {
                setGroupView(group.key);
                setCollapsed((current) => ({ ...current, [group.key]: false }));
              }}
            >
              <span>{group.label}</span><b>{group.count}</b>
            </button>
          ))}
        </aside>
      </div>

      {uploadOpen && (
        <div className="media-upload-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setUploadOpen(false); }}>
          <div className="media-upload-dialog" role="dialog" aria-modal="true" aria-labelledby="media-upload-title">
            <div className="eyebrow">/ Media destination</div>
            <h2 id="media-upload-title">Upload media</h2>
            <p>Choose the group where these files should appear.</p>
            <label>
              <span>Group</span>
              <select value={uploadDestination} onChange={(e) => setUploadDestination(e.target.value)} autoFocus>
                <option value="graphics">Graphic Elements</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name || project.id}</option>
                ))}
              </select>
            </label>
            <div className="media-upload-actions">
              <button className="btn ghost" type="button" onClick={() => setUploadOpen(false)}>Cancel</button>
              <button
                className="btn primary"
                type="button"
                onClick={() => {
                  setUploadOpen(false);
                  fileRef.current && fileRef.current.click();
                }}
              >
                Choose files
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Modal used by ImageInput so the editors can reuse an image that is
   already in the library instead of uploading a second copy of it. */
function MediaPicker({ currentProjectId, onPick, onClose }) {
  const initialItems = useMemo(() => cachedMediaItems(), []);
  const [items, setItems] = useState(initialItems);
  const [status, setStatus] = useState(initialItems.length ? "ready" : "loading");
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [groupView, setGroupView] = useState("all");
  const [collapsed, setCollapsed] = useState({});
  const projects = useMemo(() => {
    const saved = (load().projects || []).slice();
    if (currentProjectId && !saved.some((project) => project.id === currentProjectId)) {
      saved.unshift({ id: currentProjectId, name: "Current project" });
    }
    return saved;
  }, [currentProjectId]);

  useEffect(() => {
    mediaApi
      .list(true)
      .then((body) => { setItems((body && body.items) || []); setStatus("ready"); })
      .catch((err) => {
        // A cached index is still useful when a background refresh is slow or
        // temporarily unavailable. Only block the picker when nothing can be shown.
        if (!initialItems.length) { setError(err); setStatus("error"); }
      });
  }, []);

  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);

  const groups = useMemo(
    () => groupMediaItems(items, projects, query, projectFilter, dateFrom, dateTo),
    [items, projects, query, projectFilter, dateFrom, dateTo]
  );
  const projectNames = useMemo(() => new Map(projects.map((project) => [project.id, project.name || project.id])), [projects]);
  const groupNav = [
    groups.graphics.length ? { key: "graphics", label: "Graphic Elements", count: groups.graphics.length } : null,
    groups.backlog.length ? { key: "backlog", label: "Backlog", count: groups.backlog.length } : null,
    ...groups.byProject.map(({ project, items: list }) => ({ key: project.id, label: project.name || project.id, count: list.length })),
  ].filter(Boolean);
  const visibleGroupKeys = groupNav.map((group) => group.key);
  const activeGroupView = groupView === "all" || visibleGroupKeys.includes(groupView) ? groupView : "all";
  const choose = (item) => { onPick(item); onClose(); };
  const renderTile = (item) => {
    const owner = item.projectId && projectNames.get(item.projectId);
    const isCurrent = owner && item.projectId === currentProjectId;
    return (
      <button key={item.id} type="button" className={`media-pick${owner ? " is-assigned" : ""}`} onClick={() => choose(item)} title={item.filename}>
        <span className="media-pick-preview">
          <MediaPreview src={item.url} alt={item.caption || item.filename} lazy />
          {owner && <span className={`media-pick-assigned${isCurrent ? " is-current" : ""}`} title={`Already assigned to ${owner}`}><b>✓</b>{isCurrent ? "Current project" : owner}</span>}
        </span>
        <span className="media-pick-name">{item.filename}</span>
      </button>
    );
  };
  const renderGroup = (key, title, note, list) => list.length > 0 && (activeGroupView === "all" || activeGroupView === key) && (
    <div className="media-group media-picker-group" key={key}>
      <button className="media-group-head" type="button" onClick={() => setCollapsed((current) => ({ ...current, [key]: !current[key] }))}>
        <b><span className="media-chevron">{collapsed[key] ? "▸" : "▾"}</span>{title}</b>
        <span>{list.length} {note}</span>
      </button>
      {!collapsed[key] && <div className="media-grid picker">{list.map(renderTile)}</div>}
    </div>
  );

  return (
    <div className="sheet-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet media-picker" onMouseDown={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <div className="eyebrow">/ Media library</div>
            <h2>Choose an image</h2>
          </div>
          <div className="controls">
            <button className="btn ghost" type="button" onClick={onClose}>{Ic.close}</button>
          </div>
        </div>

        <div className="sheet-body">
          {status === "loading" && <div className="media-note">Loading…</div>}
          {status === "error" && <div className="media-note media-note-warn">{error.message}</div>}

          {status === "ready" && (
            <Fragment>
              <div className="media-bar media-picker-bar">
                <input className="media-search" type="search" value={query} placeholder="Search by filename or caption" onChange={(e) => setQuery(e.target.value)} autoFocus />
                <select className="media-filter" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
                  <option value="all">All projects</option>
                  <option value="backlog">Backlog</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name || project.id}</option>)}
                </select>
                <label className="media-date">From <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
                <label className="media-date">To <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
              </div>
              {groups.count === 0 && (
                <div className="media-note">
                  {items.length ? "Nothing matches that search." : "The library is empty. Upload images in the Media section first."}
                </div>
              )}
              <div className="media-layout media-picker-layout">
                <div className="media-groups">
                  {renderGroup("graphics", "Graphic Elements", "file(s)", groups.graphics)}
                  {renderGroup("backlog", "Backlog", "not assigned", groups.backlog)}
                  {groups.byProject.map(({ project, items: list }) => renderGroup(project.id, project.name || project.id, "image(s)", list))}
                </div>
                {groupNav.length > 0 && <aside className="media-group-nav media-picker-nav" aria-label="Media groups">
                  <div className="media-group-nav-title">Groups</div>
                  <button className={activeGroupView === "all" ? "on" : ""} type="button" onClick={() => setGroupView("all")}><span>View all</span><b>{groups.count}</b></button>
                  {groupNav.map((group) => <button className={activeGroupView === group.key ? "on" : ""} type="button" key={group.key} onClick={() => { setGroupView(group.key); setCollapsed((current) => ({ ...current, [group.key]: false })); }}><span>{group.label}</span><b>{group.count}</b></button>)}
                </aside>}
              </div>
            </Fragment>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   AUTH GATE
   ------------------------------------------------------------
   middleware.js already blocks unauthenticated requests to this
   page at the edge, so reaching here normally means a valid
   session. This resolves *who* you are for role gating, and
   catches the case where the session expires mid-session.
   ============================================================ */
function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function AuthGate() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    let live = true;
    window.P58Auth.fetchSession().then((next) => {
      if (!live) return;
      if (next.state === "anon") { window.P58Auth.goToLogin(); return; }
      setSession(next);
    });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!session || session.state !== "ok") return;
    return window.P58Auth.watchSession(session, () => window.P58Auth.goToLogin("expired"));
  }, [session]);

  if (!session) {
    return <div className="auth-splash"><span className="auth-splash-dot" />Checking your session…</div>;
  }

  if (session.state === "setup") {
    return (
      <div className="auth-splash auth-splash-setup">
        <b>Sign-in isn’t configured yet</b>
        <p>
          Add <code>SESSION_SECRET</code> and <code>P58_USERS</code> in the Vercel
          project settings, then redeploy. See <code>AUTH_SETUP.md</code>.
        </p>
      </div>
    );
  }

  if (session.state === "anon") {
    return <div className="auth-splash"><span className="auth-splash-dot" />Redirecting to sign in…</div>;
  }

  return <App session={session} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<AuthGate />);
