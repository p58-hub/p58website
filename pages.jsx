// ===== pages.jsx — Home, Brand index, Project detail, Studio, News =====
const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM } = React;

const BRAND_OF = { pg: "Protein Garden", dn: "Dinas" };
const BRAND_KEY = (p) => p.id.startsWith("pg-") ? "pg" : "dn";

const pgProjects = () => PROJECTS.filter((p) => BRAND_KEY(p) === "pg");
const dnProjects = () => PROJECTS.filter((p) => BRAND_KEY(p) === "dn");

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

  const featured = useM(() => [
  PROJECTS.find((p) => p.id === "pg-panormou"),
  PROJECTS.find((p) => p.id === "dn-kolonaki"),
  PROJECTS.find((p) => p.id === "pg-glyfada"),
  PROJECTS.find((p) => p.id === "dn-dousmani"),
  PROJECTS.find((p) => p.id === "pg-tsamadou"),
  PROJECTS.find((p) => p.id === "pg-kolokotroni")].
  filter(Boolean), []);

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
    const id = setTimeout(() => setI((x) => (x + 1) % featured.length), 5200);
    return () => clearTimeout(id);
  }, [i, paused, featured.length, progress]);

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

  // mouse / pen drag-to-scroll (touch uses native pan-x momentum scrolling)
  useE(() => {
    const el = trackRef.current;
    if (!el) return;
    let down = false,sx = 0,ss = 0,moved = 0;
    const dn = (e) => {
      if (e.pointerType === "touch" || e.button !== 0) return;
      if (animRef.current) {clearInterval(animRef.current);animRef.current = null;}
      down = true;moved = 0;sx = e.clientX;ss = el.scrollLeft;
      el.classList.add("dragging");
      try {el.setPointerCapture(e.pointerId);} catch (_) {}
    };
    const mv = (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      moved = Math.max(moved, Math.abs(dx));
      el.scrollLeft = ss - dx;
      targetX.current = el.scrollLeft;
    };
    const up = (e) => {
      if (!down) return;
      down = false;
      el.classList.remove("dragging");
      try {el.releasePointerCapture(e.pointerId);} catch (_) {}
    };
    const clk = (e) => {if (moved > 8) {e.preventDefault();e.stopPropagation();}};
    el.addEventListener("pointerdown", dn);
    el.addEventListener("pointermove", mv);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("click", clk, true);
    return () => {
      el.removeEventListener("pointerdown", dn);
      el.removeEventListener("pointermove", mv);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("click", clk, true);
    };
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

  const cur = featured[i];
  if (!cur) return null;
  const catOf = (p) => BRAND_KEY(p) === "pg" ? "Retail" : "Hospitality";

  return (
    <div className="hzone" ref={trackRef}>
      {/* ===== ZONE 1 — LANDING / HERO (100vw) ===== */}
      <section
        className="hz-hero"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}>
        {featured.map((p, idx) =>
        <div key={p.id} className={`vhome-slide ${idx === i ? "on" : ""}`}>
            <img src={p.hero} alt="" />
          </div>
        )}
        <div className="vhome-veil" aria-hidden="true"></div>
        <div className="vhome-brand" onClick={() => go({ name: "home" })} role="button" aria-label="Project58 home">
          <img src="assets/logo-white.png" alt="Project58" />
        </div>
        <div className="vhome-loc">{pick(cur, "location")}</div>
        <div className="vhome-cue"><span>Scroll</span><span className="ln" /></div>
        <div className="vhome-dots">
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
        <div className="eyebrow">{t("home_strip_eyebrow")}</div>
        <h2 className="vhome-rail-title">Recent Projects</h2>
        <button className="vhome-more-link" onClick={() => go({ name: "interiors" })}>
          {t("see_more_projects")}<span className="ar">↗</span>
        </button>
        <div className="hz-intro-foot">
          <span><b>{String(featured.length).padStart(2, "0")}</b> Projects</span>
          <span>Athens · Piraeus</span>
        </div>
      </section>

      {featured.map((p, idx) =>
      <a
        key={p.id}
        className="vhome-hcard hz-card"
        href={`#project/${p.id}`}
        onClick={(e) => {e.preventDefault();go({ name: "project", id: p.id, brand: BRAND_KEY(p) });}}>
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

      {/* fixed controls + progress (outside the scrolled flow) */}
      <div className="hz-ctrl">
        <button onClick={() => nudge(-1)} aria-label="Previous">←</button>
        <button onClick={() => nudge(1)} aria-label="Next">→</button>
      </div>
      <div className="hz-progress"><i style={{ width: `${progress * 100}%` }} /></div>
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
    <div className={`bg-tile ${cls || ""}`} onClick={() => go({ name: "project", id: project.id })}>
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
function ProjectPage({ id, go }) {
  const t = window.useT();
  const pick = window.usePick();
  const p = PROJECTS.find((x) => x.id === id) || PROJECTS[0];
  const idx = PROJECTS.findIndex((x) => x.id === p.id);
  const next = PROJECTS[(idx + 1) % PROJECTS.length];

  const [wiping, setWiping] = useS(false);

  useE(() => {window.scrollTo({ top: 0, behavior: "instant" });}, [id]);

  const handleNext = () => {
    setWiping(true);
    setTimeout(() => {
      go({ name: "project", id: next.id });
    }, 360);
  };

  // body sections may be localised: pick(p, "body") returns array of [h, par]; falls back to p.body
  const bodyArr = pick(p, "body") && pick(p, "body").length ? pick(p, "body") : p.body;

  return (
    <div className="page-enter" key={p.id}>
      {wiping ? <div className="wipe-overlay" /> : null}

      {/* HERO */}
      <section className="pd-hero">
        <img src={p.hero} alt={pick(p, "name")} />
        <div className="pd-hero-ovr">
          <div className="pd-hero-top">
            <span>{p.code} <span style={{ margin: "0 10px", color: "var(--clay)" }}>◆</span> {p.brand}</span>
            <span style={{ textAlign: "right" }}>
              <b>{pick(p, "location")}</b> &nbsp;·&nbsp; {p.year} &nbsp;·&nbsp; {t(p.status)}
            </span>
          </div>
          <div className="pd-hero-bot">
            <h1 className="pd-hero-title"><em>{pick(p, "name")}</em></h1>
            <div className="pd-hero-meta">
              <span>{t("pd_type")} &nbsp; <b style={{ color: "var(--paper)" }}>{pick(p, "type")}</b></span>
              <span>{t("size")} &nbsp; <b style={{ color: "var(--paper)" }}>{p.size}</b></span>
              <span>{t("pd_role")} &nbsp; <b style={{ color: "var(--paper)" }}>{pick(p, "role")}</b></span>
            </div>
          </div>
        </div>
      </section>

      {/* META BAR */}
      <section className="pd-info">
        <div><div className="k">{t("pd_code")}</div><div className="v">{p.code}</div></div>
        <div><div className="k">{t("location")}</div><div className="v">{pick(p, "location")}</div></div>
        <div><div className="k">{t("year")}</div><div className="v">{p.year}</div></div>
        <div><div className="k">{t("status")}</div><div className="v">{t(p.status)}</div></div>
      </section>

      {/* SHORT NOTES (kept minimal) */}
      <section className="pd-summary">
        <div className="lede">{pick(p, "summary")}</div>
        <div className="pd-notes">
          {bodyArr.slice(0, 2).map(([h, par], i) =>
          <React.Fragment key={i}>
              <h3>§ 0{i + 1} — {t(h) !== h ? t(h) : h}</h3>
              <p>{par}</p>
            </React.Fragment>
          )}
        </div>
      </section>

      {/* GALLERY */}
      <section className="pd-gallery">
        {p.gallery.map((g, i) =>
        <div key={i} className={g.span}>
            <figure className="img-frame">
              <img src={g.src} alt={pick(g, "tag")} loading="lazy" />
              <span className="img-corner">{p.code} / {String(i + 2).padStart(2, "0")}</span>
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