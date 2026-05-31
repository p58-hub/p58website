// =========================================================
// Project58 Dashboard — content admin
// =========================================================
// Manages Projects / News / Team. Persists to localStorage
// under "p58_data_v1"; the live site (data.jsx) reads from
// the same key, so saves here surface immediately on the
// public pages.
// =========================================================

const { useState, useEffect, useMemo, useRef, Fragment } = React;

const STORE_KEY = "p58_data_v1";

/* ---------- Seed data (defaults from data.jsx) ---------- */
const DEFAULT_SITE = {
  athens_address: "Akademias 76\n106 76 Athens\nGreece",
  athens_phone: "+30 210 000 5800",
  email: "g.grigoriadis@project58.gr",
  instagram: "@project.58",
};
const seed = () => ({
  projects: (window.PROJECTS || []).map((p) => ({ ...p, body: p.body.map((b) => [...b]), gallery: p.gallery.map((g) => ({ ...g })) })),
  news: (window.NEWS || []).map((n) => ({ ...n })),
  team: (window.TEAM || []).map((t) => ({ ...t })),
  site: { ...DEFAULT_SITE },
});

const load = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (stored && stored.projects && stored.news && stored.team) {
      return { ...stored, site: { ...DEFAULT_SITE, ...(stored.site || {}) } };
    }
  } catch (e) { /* fallthrough */ }
  return seed();
};

const persist = (data) => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
  catch (e) { alert("Couldn't save — localStorage is full. Try removing some images."); }
};

const newId = (prefix) => prefix + "-" + Math.random().toString(36).slice(2, 8);

/* ---------- Icons ---------- */
const Ic = {
  plus:   <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg>,
  trash:  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M3 4l.6 8.2A1 1 0 0 0 4.6 13h4.8a1 1 0 0 0 1-0.8L11 4"/><line x1="2" y1="4" x2="12" y2="4"/><path d="M5.5 4V2.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1V4"/></svg>,
  upload: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 9V2M4 5l3-3 3 3"/><path d="M2 9v2.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9"/></svg>,
  download: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 2v7M4 6l3 3 3-3"/><path d="M2 9v2.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9"/></svg>,
  external: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 2H2v10h10V9"/><path d="M8 2h4v4M12 2L7 7"/></svg>,
  reset: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7a5 5 0 1 0 1.5-3.5"/><path d="M2 2v3h3"/></svg>,
  close: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg>,
};

/* ============================================================
   ROOT APP
   ============================================================ */
function App() {
  const [data, setData] = useState(load);
  const [section, setSection] = useState("projects");
  const [editing, setEditing] = useState(null); // { kind, id|null }
  const [toast, setToast] = useState(null);
  const [dirty, setDirty] = useState(false);

  // persist on every data change
  useEffect(() => {
    if (dirty) {
      persist(data);
      setToast("Saved");
      const t = setTimeout(() => setToast(null), 1600);
      return () => clearTimeout(t);
    }
  }, [data, dirty]);

  const update = (next) => { setData(next); setDirty(true); };

  /* ----- handlers ----- */
  const onSaveProject = (proj) => {
    const exists = data.projects.findIndex((p) => p.id === proj.id);
    const projects = exists >= 0
      ? data.projects.map((p, i) => i === exists ? proj : p)
      : [proj, ...data.projects];
    update({ ...data, projects });
    setEditing(null);
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
    if (kind === "news") update({ ...data, news: data.news.filter((n) => n._id !== idOrIdx) });
    if (kind === "team") update({ ...data, team: data.team.filter((t) => t._id !== idOrIdx) });
  };

  /* ----- export / import / reset ----- */
  const onExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project58-content-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const fileInputRef = useRef(null);
  const onImport = () => fileInputRef.current && fileInputRef.current.click();
  const onImportFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = JSON.parse(reader.result);
        if (!next.projects || !next.news || !next.team) throw new Error("missing keys");
        update(next);
        setToast("Imported");
      } catch (err) {
        alert("Couldn't read that JSON. Make sure it has projects, news, team keys.");
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  };
  const onReset = () => {
    if (!confirm("Reset all content to the bundled defaults? Your edits will be lost.")) return;
    localStorage.removeItem(STORE_KEY);
    location.reload();
  };

  const counts = {
    projects: data.projects.length,
    news: data.news.length,
    team: data.team.length,
  };

  const onSaveSite = (site) => {
    update({ ...data, site });
    setToast("Settings saved");
  };

  return (
    <div className="app">
      <aside className="side">
        <div className="side-brand">
          <img src="assets/logo-black.svg" alt="Project58" />
          <span className="tag">CMS</span>
        </div>

        <div className="side-section-title">Content</div>
        <button className={`side-btn ${section === "projects" ? "on" : ""}`} onClick={() => setSection("projects")}>
          <span>Projects</span><span className="count">{counts.projects}</span>
        </button>
        <button className={`side-btn ${section === "news" ? "on" : ""}`} onClick={() => setSection("news")}>
          <span>News &amp; press</span><span className="count">{counts.news}</span>
        </button>
        <button className={`side-btn ${section === "team" ? "on" : ""}`} onClick={() => setSection("team")}>
          <span>Team</span><span className="count">{counts.team}</span>
        </button>
        <button className={`side-btn ${section === "site" ? "on" : ""}`} onClick={() => setSection("site")}>
          <span>Site settings</span><span className="count">⚙</span>
        </button>

        <div className="side-footer">
          <a className="side-link" href="index.html" target="_blank" rel="noopener">
            <span>Live site</span><span>↗</span>
          </a>
          <a className="side-link" href="mobile.html" target="_blank" rel="noopener">
            <span>Mobile preview</span><span>↗</span>
          </a>
          <div className="side-meta">localStorage · v1</div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="crumbs">
            <span>Project58</span>
            <span className="sep">/</span>
            <span>Dashboard</span>
            <span className="sep">/</span>
            <b>{section === "projects" ? "Projects" : section === "news" ? "News" : section === "site" ? "Site settings" : "Team"}</b>
          </div>
          <div className="actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={onImportFile}
            />
            <button className="btn ghost" onClick={onImport} title="Import JSON">
              <span className="ic">{Ic.upload}</span><span>Import</span>
            </button>
            <button className="btn ghost" onClick={onExport} title="Export JSON">
              <span className="ic">{Ic.download}</span><span>Export</span>
            </button>
            <button className="btn ghost" onClick={onReset} title="Reset to defaults">
              <span className="ic">{Ic.reset}</span><span>Reset</span>
            </button>
            <button className="btn primary" style={section === "site" ? { display: "none" } : null} onClick={() => setEditing({ kind: section.slice(0, -1) === "newss" ? "news" : (section === "projects" ? "project" : section === "news" ? "news" : "team"), id: null })}>
              <span className="ic">{Ic.plus}</span><span>New {section === "projects" ? "project" : section === "news" ? "news item" : section === "site" ? "—" : "person"}</span>
            </button>
          </div>
        </div>

        <div className="content">
          {section === "projects" && (
            <ProjectsList data={data.projects} onEdit={(id) => setEditing({ kind: "project", id })} onDelete={(id) => onDelete("project", id)} onNew={() => setEditing({ kind: "project", id: null })} />
          )}
          {section === "news" && (
            <NewsList data={data.news} onEdit={(id) => setEditing({ kind: "news", id })} onDelete={(id) => onDelete("news", id)} onNew={() => setEditing({ kind: "news", id: null })} />
          )}
          {section === "team" && (
            <TeamList data={data.team} onEdit={(id) => setEditing({ kind: "team", id })} onDelete={(id) => onDelete("team", id)} onNew={() => setEditing({ kind: "team", id: null })} />
          )}
          {section === "site" && (
            <SiteSettings site={data.site || DEFAULT_SITE} onSave={onSaveSite} />
          )}
        </div>
      </main>

      {editing && editing.kind === "project" && (
        <ProjectSheet
          project={editing.id ? data.projects.find((p) => p.id === editing.id) : null}
          onSave={onSaveProject}
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

      {toast && (
        <div className="toast"><span className="dot"></span><span>{toast}</span></div>
      )}
    </div>
  );
}

/* ============================================================
   LISTS
   ============================================================ */
function ProjectsList({ data, onEdit, onDelete, onNew }) {
  if (!data.length) return <Empty kind="projects" onNew={onNew} />;
  return (
    <>
      <SectionHead eyebrow="/ Retail rooms · two operators" title="Projects" />
      <div className="list">
        <div className="list-head">
          <span></span>
          <span>Name</span>
          <span>Location</span>
          <span>Year · status</span>
          <span>Code</span>
          <span></span>
        </div>
        {data.map((p) => (
          <div className="row" key={p.id} onClick={() => onEdit(p.id)}>
            <div className="thumb">
              {p.hero ? <img src={p.hero} alt="" /> : <div className="placeholder">no img</div>}
            </div>
            <div className="name">
              {p.name}
              <span className="sub">{p.brand}</span>
            </div>
            <div className="meta">{p.location}</div>
            <div className="meta">{p.year} · {p.status}</div>
            <div className="meta">{p.code}</div>
            <button className="delete" onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} title="Delete">{Ic.trash}</button>
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

function TeamList({ data, onEdit, onDelete, onNew }) {
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
        {data.map((t) => (
          <div className="row row-team" key={t._id} onClick={() => onEdit(t._id)}>
            <div className="thumb">
              {t.portrait ? <img src={t.portrait} alt="" /> : <div className="placeholder">{t.name ? t.name.split(" ").map((s) => s[0]).slice(0, 2).join("") : "—"}</div>}
            </div>
            <div className="name">{t.name}<span className="sub">{t.note}</span></div>
            <div className="meta">{t.role}</div>
            <button className="delete" onClick={(e) => { e.stopPropagation(); onDelete(t._id); }} title="Delete">{Ic.trash}</button>
          </div>
        ))}
      </div>
    </>
  );
}

function SectionHead({ eyebrow, title }) {
  return (
    <div className="section-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
      </div>
    </div>
  );
}

/* ============================================================
   SITE SETTINGS
   ============================================================ */
function SiteSettings({ site, onSave }) {
  const [s, setS] = useState(site);
  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));
  const dirty = JSON.stringify(s) !== JSON.stringify(site);
  return (
    <>
      <SectionHead eyebrow="/ Footer addresses · contact details" title="Site settings" />
      <div className="settings-card">
        <div className="form-section">
          <div className="form-section-title">Athens studio</div>
          <div className="field-group">
            <Field label="Address" hint="Use line breaks for multi-line addresses">
              <textarea value={s.athens_address || ""} onChange={(e) => set("athens_address", e.target.value)} rows={3} />
            </Field>
            <div>
              <Field label="Phone">
                <input type="text" value={s.athens_phone || ""} onChange={(e) => set("athens_phone", e.target.value)} />
              </Field>
              <Field label="Email">
                <input type="text" value={s.email || ""} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field label="Instagram">
                <input type="text" value={s.instagram || ""} onChange={(e) => set("instagram", e.target.value)} />
              </Field>
            </div>
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
const STATUS_OPTIONS = ["Completed", "In construction", "In design", "Concept"];
const SPAN_OPTIONS = [
  { v: "gal-12", l: "Full width" },
  { v: "gal-7",  l: "7 / 12" },
  { v: "gal-5",  l: "5 / 12" },
  { v: "gal-6",  l: "6 / 12" },
];

function ProjectSheet({ project, onSave, onClose }) {
  const [p, setP] = useState(() => project ? JSON.parse(JSON.stringify(project)) : ({
    id: newId("pj"),
    code: "P58-" + String(Math.floor(Math.random() * 900) + 100),
    brand: "Protein Garden",
    name: "",
    location: "Athens · ",
    type: "Fast Casual · Retail",
    typology: "retail",
    year: String(new Date().getFullYear()),
    status: "In design",
    size: "",
    client: "",
    role: "Architecture",
    summary: "",
    body: [["Brief", ""]],
    hero: "",
    gallery: [],
  }));
  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));
  const setBody = (i, j, v) => setP((x) => ({ ...x, body: x.body.map((b, bi) => bi === i ? (j === 0 ? [v, b[1]] : [b[0], v]) : b) }));
  const addBody = () => setP((x) => ({ ...x, body: [...x.body, ["", ""]], body_gr: [...(x.body_gr || []), ["", ""]] }));
  const removeBody = (i) => setP((x) => ({ ...x, body: x.body.filter((_, bi) => bi !== i), body_gr: (x.body_gr || []).filter((_, bi) => bi !== i) }));
  const setBodyGr = (i, j, v) => setP((x) => {
    const arr = (x.body_gr || []).slice();
    while (arr.length < x.body.length) arr.push(["", ""]);
    arr[i] = j === 0 ? [v, arr[i][1] || ""] : [arr[i][0] || "", v];
    return { ...x, body_gr: arr };
  });
  const setGallery = (i, key, v) => setP((x) => ({ ...x, gallery: x.gallery.map((g, gi) => gi === i ? { ...g, [key]: v } : g) }));
  const addGallery = () => setP((x) => ({ ...x, gallery: [...x.gallery, { src: "", tag: "", span: "gal-6" }] }));
  const removeGallery = (i) => setP((x) => ({ ...x, gallery: x.gallery.filter((_, gi) => gi !== i) }));

  const valid = p.name && p.code;
  const save = () => valid && onSave(p);

  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);

  return (
    <div className="sheet-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" onMouseDown={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <div className="eyebrow">/ {project ? "Editing" : "New"} project</div>
            <h2>{p.name || "Untitled project"}</h2>
          </div>
          <div className="controls">
            <span className={`status-pill ${project ? "saved" : "draft"}`}>{project ? "Saved" : "Draft"}</span>
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
              <Field label="Year">
                <input type="text" value={p.year} onChange={(e) => set("year", e.target.value)} />
              </Field>
            </div>
            <div className="field-group">
              <Field label="Brand">
                <select value={p.brand} onChange={(e) => set("brand", e.target.value)}>
                  <option>Protein Garden</option>
                  <option>Dinas</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Type">
                <input type="text" value={p.type} onChange={(e) => set("type", e.target.value)} />
              </Field>
            </div>
            <div className="field-group">
              <Field label="Location (EN)">
                <input type="text" value={p.location} onChange={(e) => set("location", e.target.value)} />
              </Field>
              <Field label="Location (GR)">
                <input type="text" value={p.location_gr || ""} onChange={(e) => set("location_gr", e.target.value)} placeholder="π.χ. Αθήνα · Πανόρμου" />
              </Field>
            </div>
            <div className="field-group cols-3">
              <Field label="Status">
                <select value={p.status} onChange={(e) => set("status", e.target.value)}>
                  {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Size">
                <input type="text" value={p.size} onChange={(e) => set("size", e.target.value)} placeholder="e.g. 142 m²" />
              </Field>
              <Field label="Role">
                <input type="text" value={p.role} onChange={(e) => set("role", e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Summary &amp; body</div>
            <div className="field-group">
              <Field label="Summary (EN)" hint="Shown on tiles & detail lede">
                <textarea value={p.summary} onChange={(e) => set("summary", e.target.value)} />
              </Field>
              <Field label="Summary (GR)" hint="Greek translation — optional">
                <textarea value={p.summary_gr || ""} onChange={(e) => set("summary_gr", e.target.value)} placeholder="Ελληνική μετάφραση" />
              </Field>
            </div>
            <div className="form-section-title" style={{ marginTop: 20 }}>
              <span>Body sections</span>
              <button className="add" onClick={addBody}>{Ic.plus} Add section</button>
            </div>
            {p.body.map((b, i) => {
              const gr = (p.body_gr && p.body_gr[i]) || ["", ""];
              return (
                <div className="body-block" key={i}>
                  <div>
                    <div className="field-group">
                      <Field label={`Heading ${i + 1} (EN)`}>
                        <input type="text" value={b[0]} onChange={(e) => setBody(i, 0, e.target.value)} placeholder="e.g. Brief / Move / Material" />
                      </Field>
                      <Field label={`Heading ${i + 1} (GR)`}>
                        <input type="text" value={gr[0]} onChange={(e) => setBodyGr(i, 0, e.target.value)} />
                      </Field>
                    </div>
                    <div className="field-group">
                      <Field label="Paragraph (EN)">
                        <textarea value={b[1]} onChange={(e) => setBody(i, 1, e.target.value)} />
                      </Field>
                      <Field label="Paragraph (GR)">
                        <textarea value={gr[1]} onChange={(e) => setBodyGr(i, 1, e.target.value)} />
                      </Field>
                    </div>
                  </div>
                  <button className="remove" onClick={() => removeBody(i)} title="Remove">{Ic.trash}</button>
                </div>);
            })}
          </div>

          <div className="form-section">
            <div className="form-section-title">Hero image</div>
            <ImageInput value={p.hero} onChange={(v) => set("hero", v)} placeholder="Hero · 16:9 recommended" />
          </div>

          <div className="form-section">
            <div className="form-section-title">
              <span>Gallery</span>
              <button className="add" onClick={addGallery}>{Ic.plus} Add image</button>
            </div>
            {p.gallery.length === 0 ? (
              <div className="muted" style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>No gallery images yet.</div>
            ) : null}
            {p.gallery.map((g, i) => (
              <div className="gallery-item" key={i}>
                <ImageInput
                  value={g.src}
                  onChange={(v) => setGallery(i, "src", v)}
                  placeholder={`Gallery ${i + 1}`}
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
            ))}
          </div>
        </div>

        <div className="sheet-foot">
          <div className="left">
            <span>Saves to localStorage</span>
            <span>·</span>
            <span>ID {p.id}</span>
          </div>
          <div className="right">
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            <button className="btn primary" onClick={save} disabled={!valid}>Save project</button>
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
          <div className="left"><span>Saves to localStorage</span></div>
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
          <div className="left"><span>Saves to localStorage</span></div>
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

function ImageInput({ value, onChange, placeholder, extra }) {
  const ref = useRef(null);
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      if (!confirm("Image is " + Math.round(f.size / 1024) + "kb. Large images bloat localStorage — keep going?")) return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(f);
    e.target.value = "";
  };
  const isDataUrl = value && value.startsWith("data:");
  const sizeKb = isDataUrl ? Math.round(value.length / 1024) : null;

  return (
    <div className="img-input">
      <div className="preview">
        {value ? <img src={value} alt="" /> : <div className="placeholder">{placeholder || "No image"}</div>}
      </div>
      <div className="right">
        <input
          type="file"
          ref={ref}
          accept="image/*"
          onChange={onFile}
          style={{ display: "none" }}
        />
        <div className="controls">
          <button className="btn ghost" type="button" onClick={() => ref.current && ref.current.click()}>
            <span className="ic">{Ic.upload}</span><span>{value ? "Replace" : "Upload"}</span>
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
          {isDataUrl ? `Uploaded · ${sizeKb}kb base64` : value ? "URL" : "—"}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
