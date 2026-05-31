// ===== pages.jsx — Home, Brand index, Project detail, Studio, News =====
const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM } = React;

const BRAND_OF = { pg: "Protein Garden", dn: "Dinas" };
const BRAND_KEY = (p) => p.brandKey || (p.id.startsWith("pg-") ? "pg" : "dn");

const pgProjects = () => PROJECTS.filter((p) => BRAND_KEY(p) === "pg");
const dnProjects = () => PROJECTS.filter((p) => BRAND_KEY(p) === "dn");

function useHomeMobile() {
  const [isMobile, setIsMobile] = useS(() =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 720px)").matches
  );
  useE(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const onChange = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return isMobile;
}

// service translation map — each SERVICE has an `i18n` key linking to dictionary entries
const SERVICE_I18N_MAP = {
  "01": { t: "svc_arch", d: "svc_arch_d", b: "svc_arch_b" },
  "02": { t: "svc_reno", d: "svc_reno_d", b: "svc_reno_b" },
  "03": { t: "svc_ret", d: "svc_ret_d", b: "svc_ret_b" },
  "04": { t: "svc_wp", d: "svc_wp_d", b: "svc_wp_b" }
};

/* ================== HOME — vertical scroll: full-screen hero → project cards ================== */
function HomePage({ go }) {
  const t = window.useT();
  const pick = window.usePick();
  const isMobile = useHomeMobile();

  const featured = useM(() => {
    const picked = PROJECTS.filter((p) => p.featured);
    return (picked.length ? picked : PROJECTS).slice(0, 6);
  }, []);

  const heroIntervalMs = useM(() => {
    try {
      const s = JSON.parse(localStorage.getItem("p58_data_v1") || "null");
      return Math.max(2000, Number(s?.site?.heroGallery?.interval) || 5200);
    } catch { return 5200; }
  }, []);

  const [i, setI] = useS(0);
  const [paused, setPaused] = useS(false);
  const [progress, setProgress] = useS(0);
  const trackRef = useR(null);
  const targetX = useR(0);
  const animRef = useR(null);

  // home route flag (locks the page to a single horizontal viewport via CSS)
  useE(() => {
    document.body.dataset.route = "home";
    document.body.classList.add("hz-at-hero");
    return () => {
      delete document.body.dataset.route;
      document.body.classList.remove("hz-at-hero");
    };
  }, []);

  // Hide the header on the landing (hero) pane; reveal it once you scroll into work.
  useE(() => {
    document.body.classList.toggle("hz-at-hero", progress < 0.04);
  }, [progress]);

  // hero auto-rotates while the hero pane is the one in view
  useE(() => {
    if (paused || progress > 0.04) return;
    const id = setTimeout(() => setI((x) => (x + 1) % featured.length), heroIntervalMs);
    return () => clearTimeout(id);
  }, [i, paused, featured.length, progress, heroIntervalMs]);

  // eased loop: tween actual scrollLeft toward targetX (timer-based so it runs
  // even when the tab isn't focused; gives momentum/smoothness to wheel + buttons)
  const ensureLoop = () => {
    if (animRef.current) return;
    animRef.current = setInterval(() => {
      const el = trackRef.current;
      if (!el) {clearInterval(animRef.current);animRef.current = null;return;}
      const cur = el.scrollLeft;
      const diff = targetX.current - cur;
      if (Math.abs(diff) < 0.5) {el.scrollLeft = targetX.current;clearInterval(animRef.current);animRef.current = null;return;}
      el.scrollLeft = cur + diff * 0.18;
    }, 16);
  };
  const clampTarget = (x) => {
    const el = trackRef.current;
    const max = el ? el.scrollWidth - el.clientWidth : 0;
    return Math.max(0, Math.min(max, x));
  };
  const nudge = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const base = animRef.current ? targetX.current : el.scrollLeft;
    targetX.current = clampTarget(base + dir * Math.min(el.clientWidth * 0.7, 560));
    ensureLoop();
  };

  // wheel / trackpad → horizontal only (down ⇒ right, up ⇒ left), eased
  useE(() => {
    const el = trackRef.current;
    if (!el) return;
    targetX.current = el.scrollLeft;
    const onWheel = (e) => {
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (!delta) return;
      e.preventDefault(); // no vertical scroll inside this section
      targetX.current = clampTarget((animRef.current ? targetX.current : el.scrollLeft) + delta);
      ensureLoop();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // (drag-to-scroll removed — cards must be clickable; use wheel/trackpad to scroll)
  useE(() => {
    return () => {};
  }, []);

  // keep target synced when native touch scroll moves the track; update progress
  useE(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const m = el.scrollWidth - el.clientWidth;
      setProgress(m > 0 ? el.scrollLeft / m : 0);
      if (!animRef.current) targetX.current = el.scrollLeft;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // arrow keys
  useE(() => {
    const onKey = (e) => {
      const tag = e.target && e.target.tagName || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") {nudge(1);} else
      if (e.key === "ArrowLeft") {nudge(-1);}
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // stop the loop on unmount
  useE(() => () => {if (animRef.current) clearInterval(animRef.current);}, []);

  // restore horizontal scroll position when returning from a project page
  useE(() => {
    const el = trackRef.current;
    if (!el) return;
    const saved = sessionStorage.getItem("hzone_scroll");
    if (saved) {
      const x = Number(saved);
      el.scrollLeft = x;
      targetX.current = x;
      sessionStorage.removeItem("hzone_scroll");
    }
  }, []);

  const cur = featured[i];
  if (!cur) return null;
  const catOf = (p) => BRAND_KEY(p) === "pg" ? "Retail" : "Hospitality";

  if (isMobile) {
    return <MobileHomePage go={go} featured={featured} active={i} setActive={setI} cur={cur} catOf={catOf} />;
  }

  return (
    <div className="hzone" ref={trackRef}>
      {/* ===== ZONE 1 — LANDING / HERO (100vw) ===== */}
      <section
        className="hz-hero"
        style={{ cursor: "pointer" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onClick={() => { sessionStorage.setItem("hzone_scroll", trackRef.current ? trackRef.current.scrollLeft : 0); go({ name: "project", id: cur.slug || cur.id, from: { name: "home" } }); }}>
        {featured.map((p, idx) =>
        <div key={p.id} className={`vhome-slide ${idx === i ? "on" : ""}`}>
            <img src={p.hero} alt="" />
          </div>
        )}
        <div className="vhome-veil" aria-hidden="true"></div>
        <div className="vhome-brand" onClick={(e) => { e.stopPropagation(); go({ name: "home" }); }} role="button" aria-label="Project58 home">
          <img src="assets/logo-white.png" alt="Project58" />
        </div>
        <div className="vhome-loc">{pick(cur, "location")}</div>
        <div className="vhome-cue">
          <svg className="mouse-icon" viewBox="0 0 18 28" width="18" height="28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="1" y="1" width="16" height="26" rx="8" stroke="white" strokeWidth="1.5" strokeOpacity="0.85"/>
            <rect className="mouse-wheel" x="8" y="5" width="2" height="5" rx="1" fill="white"/>
          </svg>
          <span>SCROLL</span>
        </div>
        <div className="vhome-dots" onClick={(e) => e.stopPropagation()}>
          {featured.map((p, idx) =>
          <button
            key={p.id}
            className={`vhome-dot ${idx === i ? "on" : ""}`}
            onClick={() => setI(idx)}
            aria-label={`Project ${idx + 1}`} />

          )}
        </div>
      </section>

      {/* ===== ZONE 2 — HORIZONTAL GALLERY (intro panel + portrait cards) ===== */}
      <section className="hz-intro">
        <h2 className="vhome-rail-title">Recent Projects</h2>
      </section>

      {featured.map((p, idx) =>
      <a
        key={p.id}
        className="vhome-hcard hz-card"
        href={`#project/${p.slug || p.id}`}
        onClick={(e) => {
          e.preventDefault();
          sessionStorage.setItem("hzone_scroll", trackRef.current ? trackRef.current.scrollLeft : 0);
          go({ name: "project", id: p.slug || p.id, brand: BRAND_KEY(p) });
        }}>
          <div className="vhome-hpic">
            <img src={p.hero} alt={pick(p, "name")} loading="lazy" draggable="false" />
            <span className="vhome-hpic-num">N°{String(idx + 1).padStart(2, "0")}</span>
            <span className="vhome-hpic-cat">{catOf(p)}</span>
          </div>
          <div className="vhome-hcap">
            <div className="vhome-name">{pick(p, "name")}</div>
            <div className="vhome-loc-2">{pick(p, "location")}</div>
          </div>
        </a>
      )}

      <div className="vhome-endcard hz-end">
        <div className="eyebrow">End of selection</div>
        <h3>See the full index of work.</h3>
        <button onClick={() => go({ name: "interiors" })}>All projects ↗</button>
      </div>

      {/* ===== ZONE 3 — FOOTER (100vw) ===== */}
      <section className="hz-foot">
        {window.Footer ? <window.Footer go={go} /> : null}
      </section>

      <div className="hz-progress"><i style={{ width: `${progress * 100}%` }} /></div>
    </div>);

}

function MobileHomePage({ go, featured, active, setActive, cur, catOf }) {
  const pick = window.usePick();
  return (
    <div className="mhome">
      <section
        className="mhome-hero"
        style={{ cursor: "pointer" }}
        onClick={() => go({ name: "project", id: cur.slug || cur.id, from: { name: "home" } })}>
        {featured.map((p, idx) =>
        <div key={p.id} className={`vhome-slide ${idx === active ? "on" : ""}`}>
            <img src={p.hero} alt="" />
          </div>
        )}
        <div className="vhome-veil" aria-hidden="true"></div>
        <div className="vhome-brand" onClick={(e) => { e.stopPropagation(); go({ name: "home" }); }} role="button" aria-label="Project58 home">
          <img src="assets/logo-white.png" alt="Project58" />
        </div>
        <div className="vhome-loc">{pick(cur, "location")}</div>
        <div className="vhome-dots" onClick={(e) => e.stopPropagation()}>
          {featured.map((p, idx) =>
          <button
            key={p.id}
            className={`vhome-dot ${idx === active ? "on" : ""}`}
            onClick={() => setActive(idx)}
            aria-label={`Project ${idx + 1}`} />
          )}
        </div>
      </section>

      <section className="mhome-intro">
        <h2>Recent Projects</h2>
      </section>

      <section className="mhome-list">
        {featured.map((p, idx) =>
        <a
          key={p.id}
          className="mhome-card"
          href={`#project/${p.slug || p.id}`}
          onClick={(e) => {
            e.preventDefault();
            go({ name: "project", id: p.slug || p.id, brand: BRAND_KEY(p) }, { fromEl: e.currentTarget.querySelector("img"), src: p.hero });
          }}>
            <div className="mhome-pic">
            <img src={p.hero} alt={pick(p, "name")} loading="lazy" draggable="false" />
            <span className="vhome-hpic-num">N°{String(idx + 1).padStart(2, "0")}</span>
            <span className="vhome-hpic-cat">{catOf(p)}</span>
            </div>
            <div className="vhome-hcap">
              <div className="vhome-name">{pick(p, "name")}</div>
              <div className="vhome-loc-2">{pick(p, "location")}</div>
            </div>
            </a>
        )}
      </section>
    </div>);
}

/* ================== PROJECT RIBBONS — all full-width ================== */
function AllProjectsGrid({ limit, go, compact = false, projects }) {
  const list = projects ? projects : limit ? PROJECTS.slice(0, limit) : PROJECTS;
  return (
    <div className="brand-grid">
      {list.map((p, i) =>
      <Tile key={p.id} project={p} cls={compact ? "compact" : ""} go={go} idx={i + 1} />
      )}
    </div>);
}

function Tile({ project, cls, go, idx }) {
  const t = window.useT();
  const pick = window.usePick();
  return (
    <div
      className={`bg-tile ${cls || ""}`}
      onClick={(e) => go({ name: "project", id: project.slug || project.id }, { fromEl: e.currentTarget.querySelector("img"), src: project.hero })}>
      <div className="img-frame">
        <img src={project.hero} alt={pick(project, "name")} loading="lazy" />
      </div>
      <div className="ovr">
        <div className="ovr-top">
          <span>N°{String(idx).padStart(2, "0")} · {project.code} · {project.brand}</span>
          <span>{project.year}</span>
        </div>
        <div className="ovr-bot">
          <div>
            <div className="ovr-name"><em>{pick(project, "name")}</em></div>
            <div className="ovr-tag" style={{ marginTop: 14 }}>
              <span>{pick(project, "location")}</span>
              <span>·</span>
              <span>{project.size}</span>
              <span>·</span>
              <span>{t(project.status)}</span>
            </div>
          </div>
          <div className="ovr-tag" style={{ alignSelf: "end" }}>
            <span>{t("view")}</span><span>↗</span>
          </div>
        </div>
      </div>
    </div>);
}

/* ================== INTERIORS — all projects in full-width ribbons, optional brand filter ================== */
function InteriorsPage({ go, brand }) {
  const t = window.useT();
  const filtered = brand ?
  PROJECTS.filter((p) => BRAND_KEY(p) === brand) :
  PROJECTS;
  const title = brand ? BRAND_OF[brand] : t("interiors_h");
  const eyebrow = brand ?
  `${t("interiors_brand_eyebrow_a")} ${BRAND_OF[brand]} · ${filtered.length}${t("interiors_brand_eyebrow_b")}` :
  t("interiors_eyebrow");
  return (
    <div className="page-enter" key={brand || "all"}>
      <section className="brand-head">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1><em>{title}</em></h1>
        </div>
        <div className="meta">
          <div><b>{filtered.length}</b> {t("proj_word")}</div>
          {brand ?
          <div>{brand === "pg" ? t("pg_rollout") : t("dn_rollout")}</div> :
          <div>{t("two_operators")} · {pgProjects().length} + {dnProjects().length}</div>}
        </div>
      </section>
      <div className="brand-grid">
        {filtered.map((p, i) =>
        <Tile key={p.id} project={p} go={go} idx={i + 1} />
        )}
      </div>
    </div>);
}

/* ================== ARCHITECTURE — placeholder while ground-up work is in development ================== */
function ArchitecturePage({ go }) {
  const t = window.useT();
  return (
    <div className="page-enter">
      <section className="brand-head">
        <div>
          <div className="eyebrow">{t("arch_eyebrow")}</div>
          <h1><em>{t("arch_h")}</em></h1>
        </div>
        <div className="meta">
          <div>{t("arch_meta_a")}</div>
          <div>{t("arch_meta_b")}</div>
        </div>
      </section>

      <section className="bleed" style={{ padding: "80px var(--gutter)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "var(--gutter)", alignItems: "start" }}>
          <div className="eyebrow">{t("arch_note_eyebrow")}</div>
          <p style={{ fontFamily: "var(--sans)", fontWeight: 500, fontSize: "clamp(28px, 3vw, 48px)", lineHeight: 1.15, letterSpacing: "-0.035em", margin: 0, textWrap: "pretty", maxWidth: "28ch" }}>
            {t("arch_note_a")} <em style={{ color: "var(--clay)" }}>{t("arch_note_em")}</em> {t("arch_note_b")}
          </p>
        </div>
      </section>

      <section className="bleed">
        <div className="svc-list">
          {SERVICES.map((s) => {
            const map = SERVICE_I18N_MAP[s.n] || {};
            return (
              <div className="svc-row" key={s.n}>
                <div className="n">/{s.n}</div>
                <div className="t">{map.t ? t(map.t) : s.t}</div>
                <div className="d">
                  <div>{map.d ? t(map.d) : s.d}</div>
                  <ul>{(map.b ? t(map.b) : s.bul).map((b, i) => <li key={i}>{b}</li>)}</ul>
                </div>
                <div className="a">↗</div>
              </div>);
          })}
        </div>
      </section>

      <section className="bleed" style={{ padding: "60px var(--gutter) 96px", borderTop: "1px solid var(--rule-strong)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gutter)", alignItems: "end" }}>
          <div>
            <div className="eyebrow">{t("work_with_us")}</div>
            <h3 style={{ fontFamily: "var(--sans)", fontWeight: 500, fontSize: "clamp(36px, 4.5vw, 64px)", letterSpacing: "-0.04em", margin: "12px 0 0", lineHeight: 1.05 }}>
              {t("arch_cta")} <em style={{ color: "var(--clay)" }}>{t("cta_2026")}</em> {t("arch_cta_tail")}
            </h3>
          </div>
          <div style={{ textAlign: "right" }}>
            <a className="btn" href="mailto:g.grigoriadis@project58.gr">
              <span>g.grigoriadis@project58.gr</span><span className="ar">→</span>
            </a>
          </div>
        </div>
      </section>
    </div>);
}

/* ================== PROJECT DETAIL ================== */
function ProjectPage({ id, go, from }) {
  const t = window.useT();
  const pick = window.usePick();
  const p = PROJECTS.find((x) => x.id === id || x.slug === id) || PROJECTS[0];
  const idx = PROJECTS.findIndex((x) => x.id === p.id);
  const next = PROJECTS[(idx + 1) % PROJECTS.length];

  const [wiping, setWiping] = useS(false);

  useE(() => {window.scrollTo({ top: 0, behavior: "instant" });}, [id]);

  const backRoute = from || { name: "home" };
  const backLabel = backRoute.name === "interiors" ? "Interiors"
    : backRoute.name === "architecture" ? "Architecture"
    : backRoute.name === "agency" ? "Agency"
    : "Home";

  const handleNext = () => {
    setWiping(true);
    setTimeout(() => {
      go({ name: "project", id: next.slug || next.id, from: backRoute });
    }, 360);
  };

  const bodyArr = pick(p, "body") && pick(p, "body").length ? pick(p, "body") : p.body;
  const asideImg = p.gallery && p.gallery[0];

  return (
    <div className="page-enter" key={p.id}>
      {wiping ? <div className="wipe-overlay" /> : null}

      {/* HERO — fullscreen image, back button only */}
      <section className="pd-hero">
        <img src={p.hero} alt={pick(p, "name")} />
        <div className="pd-hero-ovr">
          <div className="pd-hero-top">
            <button className="pd-back" onClick={() => go(backRoute)}>← {backLabel}</button>
          </div>
          <h1 className="pd-hero-title"><em>{pick(p, "name")}</em></h1>
        </div>
      </section>

      {/* CONTENT — title + two-col body */}
      <section className="pd-content">
        <h2 className="pd-project-name">{pick(p, "name")}</h2>
        <div className="pd-body-row">
          <div className="pd-body-text">
            {pick(p, "summary") ? <p className="pd-lede">{pick(p, "summary")}</p> : null}
            {bodyArr.map(([h, par], i) =>
            <div key={i} className="pd-body-section">
                <h3 className="pd-section-h">{t(h) !== h ? t(h) : h}</h3>
                <p>{par}</p>
              </div>
            )}
          </div>
          {asideImg ?
          <div className="pd-body-aside">
              <img src={asideImg.src} alt={pick(asideImg, "tag")} loading="lazy" />
            </div> :
          null}
        </div>
      </section>

      {/* METADATA STRIP */}
      <section className="pd-meta-strip">
        <div>
          <div className="pd-meta-label">{t("location")}</div>
          <div className="pd-meta-value">{pick(p, "location")}</div>
        </div>
        <div>
          <div className="pd-meta-label">{t("year")}</div>
          <div className="pd-meta-value">{p.year}</div>
        </div>
        <div>
          <div className="pd-meta-label">{t("pd_type")}</div>
          <div className="pd-meta-value">{pick(p, "type")}</div>
        </div>
        <div>
          <div className="pd-meta-label">{t("pd_role")}</div>
          <div className="pd-meta-value">{pick(p, "role")}</div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="pd-gallery">
        {(asideImg ? p.gallery.slice(1) : p.gallery).map((g, i) =>
        <div key={i} className={g.span}>
            <figure className="img-frame">
              <img src={g.src} alt={pick(g, "tag")} loading="lazy" />
              <figcaption className="img-cap">
                <span className="img-tag">{pick(g, "tag")}</span>
              </figcaption>
            </figure>
          </div>
        )}
      </section>

      {/* NEXT */}
      <section className="pd-next" onClick={handleNext}>
        <img src={next.hero} alt={pick(next, "name")} />
        <div className="pd-next-ovr">
          <div className="pd-next-info">
            <span className="label"><span>{t("next_project")}</span><span className="arrow">→</span></span>
            <span><b>{next.code}</b> &nbsp;·&nbsp; {next.brand}</span>
          </div>
          <h2 className="pd-next-title"><em>{pick(next, "name")}</em></h2>
          <div className="pd-next-info">
            <span>{pick(next, "location")}</span>
            <span><b>{next.year}</b> &nbsp;·&nbsp; {next.size}</span>
          </div>
        </div>
      </section>
    </div>);

}

/* ================== AGENCY — studio + team + news combined ================== */
function AgencyPage({ go }) {
  const t = window.useT();
  const pick = window.usePick();
  const portraitHero = PROJECTS.find((p) => p.id === "dn-kolonaki").hero;
  return (
    <div className="page-enter">
      <section className="studio-hero" style={{ padding: "80px var(--gutter) 32px" }}>
        <div className="eyebrow">{t("agency_eyebrow")}</div>
        <h1>{t("agency_h_a")} <em>{t("agency_h_em")}</em> {t("agency_h_b")}</h1>
      </section>

      <section className="bleed">
        <div className="studio-cols">
          <div className="col">
            <p>
              {t("agency_p1")} <em>{t("agency_p1_em")}</em>{t("agency_p1_b")} <em>{t("agency_p1_em2")}</em>{t("agency_p1_c")}
            </p>
          </div>
          <div className="col">
            <p>{t("agency_p2")}</p>
          </div>
        </div>
      </section>

      <section className="bleed">
        <figure className="img-frame" style={{ height: "72vh", minHeight: 520, margin: "48px 0" }}>
          <img src={portraitHero} alt="Studio portrait" />
          <span className="img-corner">AGENCY · THESSALONIKI</span>
        </figure>
      </section>

      {/* Team */}
      <section className="bleed">
        <div className="hero-meta-row" style={{ borderBottom: 0, marginTop: 24 }}>
          <div><span>{t("team_eyebrow")}</span><span className="v">{t("team_h")}</span></div>
          <div><span>{t("headcount")}</span><span className="v">{TEAM.length} {t("headcount_unit")}</span></div>
          <div><span>{t("studios")}</span><span className="v">{t("two_cities")}</span></div>
          <div style={{ justifyContent: "flex-end" }}><span className="muted mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em" }}>{t("updated_label")}</span></div>
        </div>

        <div className="team-grid">
          {TEAM.map((m, i) => {
            const role = pick(m, "role");
            return (
              <div className="team-card" key={i}>
                <Ph corner={`#${String(i + 1).padStart(2, "0")}`} label="PORTRAIT · 4:5" tag={(role || "").toUpperCase()} src={m.portrait} />
                <div className="nm">{m.name}</div>
                <div className="rl">{role}</div>
                <div className="rl" style={{ color: "var(--ink-2)", textTransform: "none", letterSpacing: 0, marginTop: 6, fontSize: 12 }}>{pick(m, "note")}</div>
              </div>);
          })}
        </div>
      </section>

      {/* Timeline */}
      <section className="bleed timeline">
        <div className="eyebrow">{t("practice_eyebrow")}</div>
        <h2 style={{ fontFamily: "var(--sans)", fontWeight: 500, fontSize: "clamp(40px, 5vw, 76px)", letterSpacing: "-0.04em", margin: "12px 0 32px" }}>
          {t("short_history")}
        </h2>
        {TIMELINE.map((r, i) =>
        <div className="timeline-row" key={i}>
            <div className="yr">{r.yr}</div>
            <div className="ev">{pick(r, "ev")}</div>
            <div className="nt">{pick(r, "nt")}</div>
          </div>
        )}
      </section>

      {/* News */}
      <section className="bleed" style={{ padding: "60px var(--gutter) 24px", borderTop: "1px solid var(--rule-strong)", marginTop: 40 }}>
        <div className="eyebrow">{t("news_eyebrow")}</div>
        <h2 style={{ fontFamily: "var(--sans)", fontWeight: 500, fontSize: "clamp(40px, 5vw, 76px)", letterSpacing: "-0.04em", margin: "12px 0 32px" }}>
          {t("recently")}
        </h2>
      </section>
      <section className="bleed" style={{ padding: "0 var(--gutter) 80px" }}>
        {NEWS.map((n, i) =>
        <article key={i} className="news-row">
            <div className="mono" style={{ fontSize: 12, letterSpacing: "0.08em", color: "var(--ink-3)" }}>{n.date}</div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--clay)" }}>{n.cat}</div>
            <div>
              <h3 style={{ fontFamily: "var(--sans)", fontWeight: 500, fontSize: "clamp(24px, 2.2vw, 34px)", letterSpacing: "-0.04em", lineHeight: 1.08, margin: "0 0 10px" }}>{pick(n, "title")}</h3>
              <p style={{ margin: 0, color: "var(--ink-2)", maxWidth: "60ch", textWrap: "pretty" }}>{pick(n, "deck")}</p>
            </div>
            <div className="mono" style={{ fontSize: 18, justifySelf: "end", color: "var(--ink-3)" }}>↗</div>
          </article>
        )}
      </section>

      {/* CTA */}
      <section className="bleed" style={{ padding: "60px var(--gutter) 96px", borderTop: "1px solid var(--rule-strong)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gutter)", alignItems: "end" }}>
          <div>
            <div className="eyebrow">{t("work_with_us")}</div>
            <h3 style={{ fontFamily: "var(--sans)", fontWeight: 500, fontSize: "clamp(36px, 4.5vw, 64px)", letterSpacing: "-0.04em", margin: "12px 0 0", lineHeight: 1.05 }}>
              {t("agency_cta")} <em style={{ color: "var(--clay)" }}>{t("cta_2026")}</em> {t("agency_cta_tail")}
            </h3>
          </div>
          <div style={{ textAlign: "right" }}>
            <a className="btn" href="mailto:g.grigoriadis@project58.gr">
              <span>g.grigoriadis@project58.gr</span><span className="ar">→</span>
            </a>
          </div>
        </div>
      </section>
    </div>);
}
Object.assign(window, { HomePage, AllProjectsGrid, Tile, InteriorsPage, ArchitecturePage, AgencyPage, ProjectPage });
