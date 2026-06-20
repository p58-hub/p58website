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
const DEFAULT_CATEGORIES = [
  { id: "retail", label: "Retail", description: "Multi-site retail and fast casual interiors", order: 0 },
  { id: "hospitality", label: "Hospitality", description: "Restaurants, cafes, bars, and service-led rooms", order: 1 },
  { id: "residential", label: "Residential", description: "Homes, renovations, and private commissions", order: 2 },
  { id: "workplace", label: "Workplace", description: "Studios, offices, and work environments", order: 3 },
];
const normaliseCategories = (items) => {
  const source = Array.isArray(items) && items.length ? items : DEFAULT_CATEGORIES;
  return source
    .map((c, order) => ({
      id: c.id || String(c.label || "category").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || newId("cat"),
      label: c.label || c.id || "Category",
      description: c.description || "",
      order: Number.isFinite(Number(c.order)) ? Number(c.order) : order,
    }))
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
};
const seed = () => ({
  projects: (window.PROJECTS || []).map((p, order) => ({
    slug: p.slug || p.id,
    category: p.category || p.typology || "retail",
    order: p.order != null ? p.order : order,
    featured: p.featured != null ? p.featured : order < 6,
    ...p,
    body: p.body.map((b) => [...b]),
    gallery: p.gallery.map((g) => ({ ...g })),
  })),
  news: (window.NEWS || []).map((n) => ({ ...n })),
  team: (window.TEAM || []).map((t) => ({ ...t })),
  categories: normaliseCategories(DEFAULT_CATEGORIES),
  site: normaliseSite(DEFAULT_SITE),
});

const load = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (stored && stored.projects && stored.news && stored.team) {
      const projects = stored.projects.map((p) => ({
        ...p,
        slug: !p.slug || p.slug === p.id ? descriptiveProjectSlug(p) : p.slug,
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
      return { ...stored, projects, team, categories: normaliseCategories(stored.categories), site: normaliseSite(stored.site || DEFAULT_SITE) };
    }
  } catch (e) { /* fallthrough */ }
  return seed();
};

const persist = (data) => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
  catch (e) { alert("Couldn't save — localStorage is full. Try removing some images."); }
};

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
    update({ ...data, projects: projects.map((p, order) => ({ ...p, order })) });
    setEditing(null);
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
    categories: data.categories.length,
    news: data.news.length,
    team: data.team.length,
  };

  const onSaveSite = (site) => {
    update({ ...data, site: normaliseSite(site) });
    setToast("Settings saved");
  };

  const onSaveHeroGallery = (heroGallery) => {
    const site = normaliseSite({ ...(data.site || DEFAULT_SITE), heroGallery });
    update({ ...data, site });
    setToast("Hero gallery saved");
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
        <button className={`side-btn ${section === "categories" ? "on" : ""}`} onClick={() => setSection("categories")}>
          <span>Categories</span><span className="count">{counts.categories}</span>
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
        <button className={`side-btn ${section === "hero" ? "on" : ""}`} onClick={() => setSection("hero")}>
          <span>Hero gallery</span><span className="count">▶</span>
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
            <b>{section === "projects" ? "Projects" : section === "categories" ? "Categories" : section === "news" ? "News" : section === "site" ? "Site settings" : section === "hero" ? "Hero gallery" : "Team"}</b>
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
            <button className="btn primary" style={(section === "site" || section === "hero") ? { display: "none" } : null} onClick={() => setEditing({ kind: section === "projects" ? "project" : section === "categories" ? "category" : section === "news" ? "news" : "team", id: null })}>
              <span className="ic">{Ic.plus}</span><span>New {section === "projects" ? "project" : section === "categories" ? "category" : section === "news" ? "news item" : section === "site" ? "—" : "person"}</span>
            </button>
          </div>
        </div>

        <div className="content">
          {section === "projects" && (
            <ProjectsList data={data.projects} categories={data.categories} onEdit={(id) => setEditing({ kind: "project", id })} onDelete={(id) => onDelete("project", id)} onMove={onMoveProject} onNew={() => setEditing({ kind: "project", id: null })} />
          )}
          {section === "categories" && (
            <CategoriesList data={data.categories} projects={data.projects} onEdit={(id) => setEditing({ kind: "category", id })} onDelete={(id) => onDelete("category", id)} onMove={onMoveCategory} onNew={() => setEditing({ kind: "category", id: null })} />
          )}
          {section === "news" && (
            <NewsList data={data.news} onEdit={(id) => setEditing({ kind: "news", id })} onDelete={(id) => onDelete("news", id)} onNew={() => setEditing({ kind: "news", id: null })} />
          )}
          {section === "team" && (
            <TeamList data={data.team} onEdit={(id) => setEditing({ kind: "team", id })} onDelete={(id) => onDelete("team", id)} onNew={() => setEditing({ kind: "team", id: null })} />
          )}
          {section === "site" && (
            <SiteSettings site={normaliseSite(data.site || DEFAULT_SITE)} onSave={onSaveSite} />
          )}
          {section === "hero" && (
            <HeroGallerySettings heroGallery={normaliseSite(data.site || DEFAULT_SITE).heroGallery} onSave={onSaveHeroGallery} />
          )}
        </div>
      </main>

      {editing && editing.kind === "project" && (
        <ProjectSheet
          project={editing.id ? data.projects.find((p) => p.id === editing.id) : null}
          categories={data.categories}
          onSave={onSaveProject}
          onClose={() => setEditing(null)}
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

      {toast && (
        <div className="toast"><span className="dot"></span><span>{toast}</span></div>
      )}
    </div>
  );
}

/* ============================================================
   LISTS
   ============================================================ */
function categoryLabel(categories, id) {
  const cat = categories.find((c) => c.id === id);
  return cat ? cat.label : id || "Uncategorised";
}

function ProjectsList({ data, categories, onEdit, onDelete, onMove, onNew }) {
  if (!data.length) return <Empty kind="projects" onNew={onNew} />;
  const groups = categories.map((cat) => ({
    category: cat,
    projects: data.filter((p) => (p.category || p.typology || "retail") === cat.id),
  }));
  const uncategorised = data.filter((p) => !categories.find((c) => c.id === (p.category || p.typology || "retail")));
  if (uncategorised.length) groups.push({ category: { id: "uncategorised", label: "Uncategorised", description: "Projects without a matching category" }, projects: uncategorised });
  return (
    <>
      <SectionHead eyebrow="/ Projects grouped by category" title="Projects" />
      {groups.map((group) => (
        <div className="category-group" key={group.category.id}>
          <div className="category-group-head">
            <div>
              <h2>{group.category.label}</h2>
              <p>{group.category.description || "No description"}</p>
            </div>
            <span>{group.projects.length}</span>
          </div>
          <div className="list">
            <div className="list-head">
              <span></span>
              <span>Name</span>
              <span>Location</span>
              <span>Year · status</span>
              <span>Code · flags</span>
              <span></span>
            </div>
            {group.projects.length === 0 ? (
              <div className="empty-row">No projects in {group.category.label}.</div>
            ) : group.projects.map((p, i) => {
              const globalIndex = data.findIndex((x) => x.id === p.id);
              return (
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
                  <div className="meta">{p.code}{p.featured ? " · Featured" : ""}<span className="sub">{categoryLabel(categories, p.category || p.typology || "retail")} · /projects/{p.slug || p.id}</span></div>
                  <div className="row-actions">
                    <button className="delete" onClick={(e) => { e.stopPropagation(); onMove(p.id, -1); }} title="Move up" disabled={globalIndex === 0}>↑</button>
                    <button className="delete" onClick={(e) => { e.stopPropagation(); onMove(p.id, 1); }} title="Move down" disabled={globalIndex === data.length - 1}>↓</button>
                    <button className="delete" onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} title="Delete">{Ic.trash}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
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
function HeroGallerySettings({ heroGallery, onSave }) {
  const [interval, setInterval_] = useState(heroGallery.interval || 5200);
  const dirty = interval !== heroGallery.interval;
  const seconds = Math.round(interval / 100) / 10;
  return (
    <>
      <SectionHead eyebrow="/ Home page hero" title="Hero gallery" />
      <div className="settings-card">
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
          <button className="btn primary" disabled={!dirty} onClick={() => onSave({ interval })}>Save</button>
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
  const setField = (k, v) => setS((x) => ({ ...x, [k]: v }));
  const dirty = JSON.stringify(s) !== JSON.stringify(site);
  return (
    <>
      <SectionHead eyebrow="/ Footer addresses · contact details" title="Site settings" />
      <div className="settings-card">
        <div className="form-section">
          <div className="form-section-title">People mosaic</div>
          <div className="field-group cols-1">
            <Field label="Fallback group image" hint="Used for team cards that do not have their own portrait yet.">
              <ImageInput value={(s.people || DEFAULT_SITE.people).hero || ""} onChange={(v) => setPeopleField("hero", v)} placeholder="People mosaic fallback image" />
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
const STATUS_OPTIONS = ["Completed", "In construction", "In design", "Concept"];
const SPAN_OPTIONS = [
  { v: "gal-12", l: "Full width" },
  { v: "gal-7",  l: "7 / 12" },
  { v: "gal-5",  l: "5 / 12" },
  { v: "gal-6",  l: "6 / 12" },
];

function ProjectSheet({ project, categories, onSave, onClose }) {
  const [p, setP] = useState(() => project ? JSON.parse(JSON.stringify(project)) : ({
    id: newId("pj"),
    slug: "",
    code: "P58-" + String(Math.floor(Math.random() * 900) + 100),
    brand: "Protein Garden",
    category: "retail",
    order: 0,
    featured: false,
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
    gallery: [],
  }));
  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));
  const setGallery = (i, key, v) => setP((x) => ({ ...x, gallery: x.gallery.map((g, gi) => gi === i ? { ...g, [key]: v } : g) }));
  const addGallery = () => setP((x) => ({ ...x, gallery: [...x.gallery, { src: "", tag: "", span: "gal-6" }] }));
  const removeGallery = (i) => setP((x) => ({ ...x, gallery: x.gallery.filter((_, gi) => gi !== i) }));

  const suggestedSlug = descriptiveProjectSlug(p);
  const valid = p.name && p.code;
  const save = () => valid && onSave({ ...p, slug: p.slug || suggestedSlug || p.id, typology: p.category || p.typology || "retail" });

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
              <Field label="Descriptive URL slug" hint={`Public URL: /projects/${p.slug || suggestedSlug || "project-name-location"}`}>
                <input type="text" value={p.slug || ""} onChange={(e) => set("slug", slugify(e.target.value))} placeholder={suggestedSlug || "luxury-villa-mykonos"} />
              </Field>
            </div>
            <div className="field-group">
              <Field label="Brand (EN)" hint="Shown over the project hero">
                <input type="text" value={p.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Protein Garden" />
              </Field>
              <Field label="Brand (GR)" hint="Greek translation — falls back to EN">
                <input type="text" value={p.brand_gr || ""} onChange={(e) => set("brand_gr", e.target.value)} />
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
              <Field label="Status (EN)">
                <input list="project-status-options" type="text" value={p.status} onChange={(e) => set("status", e.target.value)} />
                <datalist id="project-status-options">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s} />)}
                </datalist>
              </Field>
              <Field label="Status (GR)" hint="Greek translation — falls back to EN">
                <input type="text" value={p.status_gr || ""} onChange={(e) => set("status_gr", e.target.value)} />
              </Field>
            </div>
            <div className="field-group">
              <Field label="Size (EN)">
                <input type="text" value={p.size} onChange={(e) => set("size", e.target.value)} placeholder="e.g. 142 m²" />
              </Field>
              <Field label="Size (GR)" hint="Greek translation — falls back to EN">
                <input type="text" value={p.size_gr || ""} onChange={(e) => set("size_gr", e.target.value)} />
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
   CATEGORY SHEET
   ============================================================ */
function CategorySheet({ category, onSave, onClose }) {
  const [c, setC] = useState(() => category ? { ...category } : ({
    id: "",
    label: "",
    description: "",
  }));
  const set = (k, v) => setC((x) => ({ ...x, [k]: v }));
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
        </div>

        <div className="sheet-foot">
          <div className="left"><span>Saves to localStorage</span></div>
          <div className="right">
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            <button className="btn primary" onClick={() => onSave({ ...c, id: c.id || slugFromLabel })} disabled={!valid}>Save category</button>
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
