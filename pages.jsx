// ===== pages.jsx — Home, Brand index, Project detail, Studio, News =====
const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM } = React;

const BRAND_OF = { pg: "Protein Garden", dn: "Dinas" };

/* Project slots accept a still or an MP4. Clips play silently on loop so they
   read as moving imagery rather than a video the visitor has to start. */
function SiteMedia({ src, alt, className, lazy }) {
  if (window.isVideoSrc(src)) {
    return <video className={className} src={src} muted loop playsInline autoPlay preload="metadata" aria-label={alt || undefined} />;
  }
  return <img className={className} src={src} alt={alt || ""} loading={lazy ? "lazy" : undefined} />;
}
const BRAND_KEY = (p) => p.brandKey || (p.id.startsWith("pg-") ? "pg" : "dn");

const publicProjects = () => window.visibleProjects ? window.visibleProjects() : PROJECTS.filter((p) => p.visible !== false);
const pgProjects = () => publicProjects().filter((p) => BRAND_KEY(p) === "pg");
const dnProjects = () => publicProjects().filter((p) => BRAND_KEY(p) === "dn");

const PROJECT_PROGRESS_STOPS = [
  [0, "#3a2c22"],
  [28, "#8f5324"],
  [50, "#ffb08e"],
  [72, "#8f5324"],
  [100, "#3a2c22"],
];
const PROJECT_PROGRESS_GRADIENT = "linear-gradient(90deg, #3a2c22 0%, #8f5324 28%, #ffb08e 50%, #8f5324 72%, #3a2c22 100%)";

function progressColorAt(value) {
  const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  for (let i = 1; i < PROJECT_PROGRESS_STOPS.length; i += 1) {
    const [endAt, endHex] = PROJECT_PROGRESS_STOPS[i];
    if (value <= endAt) {
      const [startAt, startHex] = PROJECT_PROGRESS_STOPS[i - 1];
      const amount = (value - startAt) / Math.max(1, endAt - startAt);
      const start = hexToRgb(startHex);
      const end = hexToRgb(endHex);
      const rgb = start.map((channel, index) => Math.round(channel + (end[index] - channel) * amount));
      return `rgb(${rgb.join(", ")})`;
    }
  }
  return PROJECT_PROGRESS_STOPS[PROJECT_PROGRESS_STOPS.length - 1][1];
}

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

  // PROJECTS is updated in place when dashboard content changes. Do not cache
  // this list: an open home page must drop a newly hidden project immediately.
  const featured = (() => {
    const visible = publicProjects();
    const picked = visible.filter((p) => p.featured);
    const list = (picked.length ? picked : visible).slice();

    // The dashboard's Hero gallery section can pin an explicit order. Anything
    // it doesn't mention keeps its own position, after the ones it does.
    let order = [];
    const s = window.readP58Store ? window.readP58Store() : null;
    if (Array.isArray(s?.site?.heroGallery?.order)) order = s.site.heroGallery.order;

    if (order.length) {
      const rank = new Map(order.map((id, idx) => [id, idx]));
      const at = (p) => (rank.has(p.id) ? rank.get(p.id) : Number.MAX_SAFE_INTEGER);
      list.sort((a, b) => at(a) - at(b));
    }
    return list.slice(0, 6);
  })();

  const heroIntervalMs = useM(() => {
    const s = window.readP58Store ? window.readP58Store() : null;
    return Math.max(2000, Number(s?.site?.heroGallery?.interval) || 5200);
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

  const activeIndex = featured.length ? i % featured.length : 0;
  const cur = featured[activeIndex];
  if (!cur) return null;
  const catOf = (p) => BRAND_KEY(p) === "pg" ? "Retail" : "Hospitality";

  if (isMobile) {
    return <MobileHomePage go={go} featured={featured} active={activeIndex} setActive={setI} cur={cur} catOf={catOf} />;
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
        <div key={p.id} className={`vhome-slide ${idx === activeIndex ? "on" : ""}`}>
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
            className={`vhome-dot ${idx === activeIndex ? "on" : ""}`}
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
        href={`/projects/${p.slug || p.id}`}
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

/* ================== V2 HOME — three-part presentation ================== */
function V2HomePage({ go }) {
  const { lang } = window.useLang();
  const isMobile = useHomeMobile();
  const visible = publicProjects();
  const featured = visible.filter((project) => project.featured);
  const lead = (featured.length ? featured : visible)[0];
  const [chapter, setChapter] = useS(0);
  const chapterRatios = useR(new Map());
  const trackRef = useR(null);
  const targetX = useR(0);
  const scrollAnimation = useR(null);

  const copy = lang === "gr" ? {
    practice: "Το γραφείο",
    works: "Τα έργα",
    contact: "Επικοινωνία",
    statement: "Το Project58 είναι ένα αρχιτεκτονικό γραφείο που σχεδιάζει χώρους για την καθημερινή ζωή — από την κλίμακα ενός δωματίου έως την κλίμακα ενός κτιρίου.",
    detail: "Αρχιτεκτονική, εσωτερικοί χώροι και επαναλαμβανόμενες εμπορικές εφαρμογές. Με έδρα την Αθήνα, εργαζόμαστε με σαφείς ιδέες, υλικά που αντέχουν και προσεκτική υλοποίηση.",
    index: "Όλα τα έργα",
  } : {
    practice: "The practice",
    works: "The works",
    contact: "Contact",
    statement: "Project58 is an architectural practice designing places for everyday life — from the scale of a room to the scale of a building.",
    detail: "Architecture, interiors and repeatable retail environments. Based in Athens, we work through clear ideas, durable materials and careful delivery.",
    index: "View all works",
  };

  useE(() => {
    document.body.dataset.route = "v2-home";
    document.body.classList.add("v2-home-active");
    const panels = Array.from(document.querySelectorAll(".v2-panel"));
    chapterRatios.current.clear();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        chapterRatios.current.set(entry.target, entry.intersectionRatio);
      });
      let nextChapter = 0;
      let bestRatio = -1;
      chapterRatios.current.forEach((ratio, panel) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          nextChapter = Number(panel.dataset.chapter || 0);
        }
      });
      setChapter(nextChapter);
    }, {
      root: isMobile ? null : trackRef.current,
      threshold: [0, 0.2, 0.45, 0.7],
    });
    panels.forEach((panel) => observer.observe(panel));
    return () => {
      observer.disconnect();
      delete document.body.dataset.route;
      document.body.classList.remove("v2-home-active");
    };
  }, [isMobile]);

  // Preserve the original desktop interaction: vertical wheel/trackpad input
  // advances a single horizontal presentation rail.
  useE(() => {
    const track = trackRef.current;
    if (!track || isMobile) return undefined;
    targetX.current = track.scrollLeft;

    const stopAnimation = () => {
      if (!scrollAnimation.current) return;
      clearInterval(scrollAnimation.current);
      scrollAnimation.current = null;
    };
    const animateToTarget = () => {
      if (scrollAnimation.current) return;
      scrollAnimation.current = setInterval(() => {
        const difference = targetX.current - track.scrollLeft;
        if (Math.abs(difference) < 0.5) {
          track.scrollLeft = targetX.current;
          stopAnimation();
          return;
        }
        track.scrollLeft += difference * 0.18;
      }, 16);
    };
    const clamp = (value) => Math.max(0, Math.min(track.scrollWidth - track.clientWidth, value));
    const onWheel = (event) => {
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!delta) return;
      event.preventDefault();
      targetX.current = clamp((scrollAnimation.current ? targetX.current : track.scrollLeft) + delta);
      animateToTarget();
    };
    const onScroll = () => {
      if (!scrollAnimation.current) targetX.current = track.scrollLeft;
    };
    const onKeyDown = (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const direction = event.key === "ArrowRight" ? 1 : -1;
      targetX.current = clamp(track.scrollLeft + direction * track.clientWidth);
      animateToTarget();
    };

    track.addEventListener("wheel", onWheel, { passive: false });
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      stopAnimation();
      track.removeEventListener("wheel", onWheel);
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobile]);

  const scrollToChapter = (index) => {
    const panel = document.querySelector(`.v2-panel[data-chapter="${index}"]`);
    if (!panel) return;
    if (!isMobile && trackRef.current) {
      setChapter(index);
      targetX.current = panel.offsetLeft;
      trackRef.current.scrollLeft = panel.offsetLeft;
      return;
    }
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="v2-home page-enter" ref={trackRef}>
      <aside className={`v2-chapters v2-chapters--${chapter}`} aria-label="Presentation chapters">
        {[copy.practice, copy.works, copy.contact].map((label, index) => (
          <button key={label} className={chapter === index ? "on" : ""} onClick={() => scrollToChapter(index)}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <em>{label}</em>
          </button>
        ))}
      </aside>

      <section className={`v2-panel v2-practice ${chapter === 0 ? "v2-panel--active" : ""}`} data-chapter="0">
        {lead ? (
          <div className="v2-practice-media" aria-hidden="true">
            <SiteMedia src={lead.hero} alt="" />
          </div>
        ) : null}
        <div className="v2-practice-wash" aria-hidden="true" />
        <div className="v2-practice-copy">
          <span className="v2-kicker">01 / {copy.practice}</span>
          <h1>{copy.statement}</h1>
          <div className="v2-practice-note">
            <p>{copy.detail}</p>
            <button onClick={() => go({ name: "agency" })}>{copy.practice}<span>↗</span></button>
          </div>
        </div>
        <button className="v2-next" onClick={() => scrollToChapter(1)} aria-label={copy.works}>
          <span>Scroll</span><i>↓</i>
        </button>
      </section>

      <section className={`v2-panel v2-works ${chapter === 1 ? "v2-panel--active" : ""}`} data-chapter="1">
        <header className="v2-works-head">
          <span className="v2-kicker">02 / {copy.works}</span>
          <h2>{copy.works}</h2>
        </header>
        <div className="v2-works-gateway">
          {lead ? (
            <div className="v2-works-gateway-media" aria-hidden="true">
              <SiteMedia src={lead.hero} alt="" lazy />
            </div>
          ) : null}
          <div className="v2-works-gateway-copy">
            <span>{String(visible.length).padStart(2, "0")} / Project58</span>
            <button onClick={() => go({ name: "projects" })}>{copy.index}<i>↗</i></button>
          </div>
        </div>
      </section>

      <section className={`v2-panel v2-contact ${chapter === 2 ? "v2-panel--active" : ""}`} data-chapter="2">
        <span className="v2-contact-label">03 / {copy.contact}</span>
        {window.Footer ? <window.Footer go={go} /> : null}
      </section>
    </div>
  );
}

function MobileHomePage({ go, featured, active, setActive, cur, catOf }) {
  const pick = window.usePick();
  const t = window.useT();
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
          href={`/projects/${p.slug || p.id}`}
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
      <div className="mhome-all-projects">
        <a
          href="/projects"
          onClick={(e) => {
            e.preventDefault();
            go({ name: "projects" });
          }}>
          <span>{t("see_all_projects")}</span><span aria-hidden="true">→</span>
        </a>
      </div>
    </div>);
}

/* ================== PROJECT RIBBONS — all full-width ================== */
function AllProjectsGrid({ limit, go, compact = false, projects }) {
  const visible = projects ? projects.filter((p) => p.visible !== false) : publicProjects();
  const list = limit ? visible.slice(0, limit) : visible;
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
  const rawStatus = project.status || "";
  const statusLabel = t(rawStatus) !== rawStatus ? t(rawStatus) : rawStatus;
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
              <span>{pick(project, "size")}</span>
              <span>·</span>
              <span>{statusLabel}</span>
            </div>
          </div>
          <div className="ovr-tag" style={{ alignSelf: "end" }}>
            <span>{t("view")}</span><span>↗</span>
          </div>
        </div>
      </div>
    </div>);
}

/* ================== INTERIORS — card grid with inline brand filter ================== */
function InteriorsPage({ go, brand, sort }) {
  const t = window.useT();
  const pick = window.usePick();
  const order = window.PROJECT_SORTS[sort] ? sort : window.PROJECT_SORT_DEFAULT;
  const filtered = (brand ?
  publicProjects().filter((p) => BRAND_KEY(p) === brand) :
  publicProjects()).sort(window.PROJECT_SORTS[order].compare(pick));
  const title = brand ? BRAND_OF[brand] : t("interiors_h");
  const eyebrow = brand ?
  `${t("interiors_brand_eyebrow_a")} ${BRAND_OF[brand]} · ${filtered.length}${t("interiors_brand_eyebrow_b")}` :
  t("interiors_eyebrow");
  return (
    <div className="page-enter" key={`${brand || "all"}:${order}`}>
      <div className="proj-list">
        {filtered.map((p, i) =>
        <ProjListRow key={p.id} project={p} go={go} idx={i + 1} />
        )}
      </div>
    </div>);
}

/* ================== PROJECTS — unified list with type filter ================== */
function ProjectsPage({ go, type, brand, sort }) {
  const pick = window.usePick();
  const t = window.useT();
  const normalisedType = type === "retail" || type === "residential" ? type : null;
  const normalisedBrand = normalisedType === "retail" && (brand === "pg" || brand === "dn") ? brand : null;
  const order = window.PROJECT_SORTS[sort] ? sort : window.PROJECT_SORT_DEFAULT;
  const filtered = publicProjects().filter((p) => {
    if (!normalisedType) return true;
    const category = (p.category || p.typology || "retail").toLowerCase();
    if (normalisedType === "residential") {
      return category === "residential" || category === "architecture";
    }
    if (category !== "retail") return false;
    return !normalisedBrand || BRAND_KEY(p) === normalisedBrand;
  }).sort(window.PROJECT_SORTS[order].compare(pick));
  const coverGallery = (() => {
    const visible = publicProjects();
    const featured = visible.filter((p) => p.featured);
    const gallery = (featured.length ? featured : visible).slice();
    const stored = window.readP58Store ? window.readP58Store() : null;
    const galleryOrder = Array.isArray(stored?.site?.heroGallery?.order) ? stored.site.heroGallery.order : [];
    if (galleryOrder.length) {
      const rank = new Map(galleryOrder.map((id, index) => [id, index]));
      gallery.sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER));
    }
    return gallery.slice(0, 6);
  })();
  const [coverIndex, setCoverIndex] = useS(0);
  const coverGestureRef = useR({ start: null, ignoreClickUntil: 0 });
  const activeCoverIndex = coverGallery.length ? coverIndex % coverGallery.length : 0;
  const coverProject = coverGallery[activeCoverIndex] || filtered[0];
  const showMobileCover = !normalisedType && !normalisedBrand && coverProject;
  const coverIntervalMs = (() => {
    const stored = window.readP58Store ? window.readP58Store() : null;
    return Math.max(2000, Number(stored?.site?.heroGallery?.interval) || 5200);
  })();

  useE(() => {
    if (!showMobileCover || coverGallery.length < 2) return undefined;
    const timer = setTimeout(() => setCoverIndex((index) => (index + 1) % coverGallery.length), coverIntervalMs);
    return () => clearTimeout(timer);
  }, [activeCoverIndex, coverGallery.length, coverIntervalMs, !!showMobileCover]);

  useE(() => {
    const className = "mobile-projects-cover-active";
    if (!showMobileCover) {
      document.body.classList.remove(className);
      return undefined;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const onPhone = window.matchMedia("(max-width: 720px)").matches;
      const list = document.querySelector(".projects-sheet");
      const nav = document.querySelector(".nav");
      const navHeight = nav ? nav.getBoundingClientRect().height : 0;
      const coverIsActive = onPhone && list && list.getBoundingClientRect().top > navHeight + 1;
      document.body.classList.toggle(className, !!coverIsActive);
      const theme = document.querySelector('meta[name="theme-color"]');
      if (theme) theme.setAttribute("content", coverIsActive ? "#14130f" : "#f7f5f0");
    };
    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      document.body.classList.remove(className);
      const theme = document.querySelector('meta[name="theme-color"]');
      if (theme) theme.setAttribute("content", "#f7f5f0");
    };
  }, [!!showMobileCover]);

  useE(() => {
    const className = "projects-contact-active";
    const headerClassName = "projects-contact-header-active";
    const contactStage = document.querySelector(".projects-contact-parallax");
    if (!contactStage || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      document.body.classList.toggle(className, entry.intersectionRatio > 0.42);
      document.body.classList.toggle(headerClassName, entry.intersectionRatio > 0.985);
    }, { threshold: [0, 0.2, 0.42, 0.7, 0.985, 1] });
    observer.observe(contactStage);
    return () => {
      observer.disconnect();
      document.body.classList.remove(className);
      document.body.classList.remove(headerClassName);
    };
  }, []);

  const keepSort = (route) => (sort ? { ...route, sort } : route);
  const sheetRoute = {
    name: "projects",
    ...(normalisedType ? { type: normalisedType } : {}),
    ...(normalisedBrand ? { brand: normalisedBrand } : {}),
    ...(sort ? { sort } : {}),
  };
  const finalProject = showMobileCover && filtered.length ? filtered[filtered.length - 1] : null;
  const precedingProjects = finalProject ? filtered.slice(0, -1) : filtered;
  const openCoverProject = () => {
    if (!coverProject) return;
    go({ name: "project", id: coverProject.slug || coverProject.id, from: sheetRoute });
  };
  const handleCoverTouchStart = (event) => {
    const touch = event.touches[0];
    coverGestureRef.current.start = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };
  const handleCoverTouchEnd = (event) => {
    const start = coverGestureRef.current.start;
    const touch = event.changedTouches[0];
    coverGestureRef.current.start = null;
    if (!start || !touch || coverGallery.length < 2) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 42 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.15) return;

    coverGestureRef.current.ignoreClickUntil = Date.now() + 450;
    setCoverIndex((index) => {
      const direction = deltaX < 0 ? 1 : -1;
      return (index + direction + coverGallery.length) % coverGallery.length;
    });
  };

  return (
    <div className="page-enter" key={`${normalisedType || "all"}:${normalisedBrand || "all"}:${order}`}>
      {showMobileCover ? (
        <section
          className="mobile-projects-cover"
          aria-label={pick(coverProject, "name")}
          role="link"
          tabIndex="0"
          onClick={() => {
            if (Date.now() < coverGestureRef.current.ignoreClickUntil) return;
            openCoverProject();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openCoverProject();
            }
          }}
          onTouchStart={handleCoverTouchStart}
          onTouchEnd={handleCoverTouchEnd}
          onTouchCancel={() => { coverGestureRef.current.start = null; }}>
          <div className="mobile-projects-cover-slides">
            {coverGallery.map((project, index) => (
              <div key={project.id} className={`mobile-projects-cover-slide ${index === activeCoverIndex ? "on" : ""}`}>
                <SiteMedia src={project.hero} alt={pick(project, "name")} className="mobile-projects-cover-media" />
              </div>
            ))}
          </div>
          <div className="mobile-projects-cover-veil" aria-hidden="true" />
          <div className="mobile-projects-cover-loc">{pick(coverProject, "location")}</div>
          <div className="mobile-projects-cover-cue" aria-hidden="true">
            <span>Scroll</span>
            <svg viewBox="0 0 16 26" width="16" height="26" fill="none">
              <path d="M8 1v22M3 18l5 5 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="mobile-projects-cover-dots">
            {coverGallery.map((project, index) => (
              <button
                key={project.id}
                type="button"
                className={`mobile-projects-cover-dot ${index === activeCoverIndex ? "on" : ""}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setCoverIndex(index);
                }}
                aria-label={`Project ${index + 1}`} />
            ))}
          </div>
        </section>
      ) : null}
      <div className="projects-sheet">
        <div className="mobile-projects-sheet-head">
          <div className="project-filter-groups">
            <div className="interiors-filter">
              <button className={`filter-btn ${!normalisedType ? "on" : ""}`} onClick={() => go(keepSort({ name: "projects" }))}>{t("all")}</button>
              <button className={`filter-btn ${normalisedType === "retail" ? "on" : ""}`} onClick={() => go(keepSort({ name: "projects", type: "retail" }))}>{t("retail")}</button>
              <button className={`filter-btn ${normalisedType === "residential" ? "on" : ""}`} onClick={() => go(keepSort({ name: "projects", type: "residential" }))}>{t("residential")}</button>
            </div>
            {normalisedType === "retail" ? (
              <div className="interiors-filter brand-filter">
                <button className={`filter-btn ${!normalisedBrand ? "on" : ""}`} onClick={() => go(keepSort({ name: "projects", type: "retail" }))}>{t("all_brands")}</button>
                <button className={`filter-btn ${normalisedBrand === "pg" ? "on" : ""}`} onClick={() => go(keepSort({ name: "projects", type: "retail", brand: "pg" }))}>Protein Garden</button>
                <button className={`filter-btn ${normalisedBrand === "dn" ? "on" : ""}`} onClick={() => go(keepSort({ name: "projects", type: "retail", brand: "dn" }))}>Dinas</button>
              </div>
            ) : null}
          </div>
          <window.ProjectSort route={sheetRoute} go={go} />
        </div>
        <div className={`proj-list ${showMobileCover && finalProject ? "proj-list-before-last" : ""}`}>
          {precedingProjects.map((p, i) =>
            <ProjListRow key={p.id} project={p} go={go} idx={i + 1} />
          )}
          {filtered.length === 0 && (
            <div className="proj-list-empty">No projects in this category yet.</div>
          )}
        </div>
        {showMobileCover ? (
          <div className={`projects-contact-stack ${finalProject ? "has-project-backdrop" : ""}`}>
            {finalProject ? (
              <div className="proj-list proj-list-last">
                <ProjListRow project={finalProject} go={go} idx={filtered.length} />
              </div>
            ) : null}
            <section className="projects-contact-parallax" aria-label={t("contact")}>
              <div className="projects-contact-parallax-inner">
                <window.ContactPage go={go} />
              </div>
            </section>
          </div>
        ) : null}
      </div>
      {!showMobileCover ? (
        <section className="projects-contact-parallax" aria-label={t("contact")}>
          <div className="projects-contact-parallax-inner">
            <window.ContactPage go={go} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ProjListRow({ project, go, idx }) {
  const pick = window.usePick();
  const t = window.useT();
  const site = useSiteSettings();
  const bk = BRAND_KEY(project);
  const monogram = bk === "pg" ? "PG" : "DN";
  const stored = window.readP58Store ? window.readP58Store() : null;
  const iconSrc = window.projectIconFor(project, site, stored && stored.categories);
  // Format location as "GREECE, ATHENS, NEIGHBORHOOD"
  const rawLoc = pick(project, "location") || "";
  const locParts = rawLoc.split(/\s*·\s*/);
  const locFormatted = ["Greece", ...locParts].join(", ").toUpperCase();
  const rawStatus = project.status || "";
  const statusLabel = t(rawStatus) !== rawStatus ? t(rawStatus) : rawStatus;
  return (
    <div
      className="proj-list-row"
      onClick={() => go({ name: "project", id: project.slug || project.id })}>
      <div className="proj-list-info">
        {iconSrc
          ? <img className="proj-list-icon proj-list-icon--img" src={iconSrc} alt={project.brand} />
          : <div className={`proj-list-icon proj-list-icon--${bk}`}>{monogram}</div>
        }
        <div className="proj-list-text">
          <div className="proj-list-brand-name">{project.brand}</div>
          <div className="proj-list-loc">{locFormatted}</div>
          <div className="proj-list-status">{statusLabel}</div>
        </div>
      </div>
      <div className="proj-list-img">
        <img src={project.hero} alt={pick(project, "name")} loading="lazy" />
      </div>
    </div>);
}

/* ================== ARCHITECTURE / RESIDENTIAL — proj-list layout (mirrors InteriorsPage) ================== */
function ArchitecturePage({ go, sort }) {
  const t = window.useT();
  const pick = window.usePick();
  const order = window.PROJECT_SORTS[sort] ? sort : window.PROJECT_SORT_DEFAULT;
  // Show projects with typology/category of "residential" or "architecture".
  // All current projects are "retail"; this list will populate once arch projects are added.
  const filtered = publicProjects().filter(p => {
    const cat = (p.typology || p.category || "retail").toLowerCase();
    return cat === "residential" || cat === "architecture";
  }).sort(window.PROJECT_SORTS[order].compare(pick));
  return (
    <div className="page-enter" key={`architecture:${order}`}>
      <div className="proj-list">
        {filtered.map((p, i) =>
          <ProjListRow key={p.id} project={p} go={go} idx={i + 1} />
        )}
        {filtered.length === 0 && (
          <div className="proj-list-empty">
            <p>Residential projects coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================== PROJECT DETAIL — BIG-style centered rows ================== */
function ProjectPage({ id, go, from, transitionDirection }) {
  const t = window.useT();
  const pick = window.usePick();
  const projects = publicProjects();
  const p = projects.find((x) => x.id === id || x.slug === id) || projects[0];
  const idx = projects.findIndex((x) => x.id === p.id);
  const prev = projects[(idx - 1 + projects.length) % projects.length];
  const next = projects[(idx + 1) % projects.length];

  const [transitioning, setTransitioning] = useS(null);
  const [scrollProgress, setScrollProgress] = useS(0);
  const swipeStartRef = useR(null);

  useE(() => {window.scrollTo({ top: 0, behavior: "instant" });}, [id]);
  useE(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScrollProgress(Math.min(100, Math.max(0, window.scrollY / max * 100)));
    };
    const update = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    if (resizeObserver) resizeObserver.observe(document.body);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [id]);

  const backRoute = from || { name: "projects" };

  const navigateProject = (target, direction) => {
    if (transitioning) return;
    setTransitioning({ direction, target });
    setTimeout(() => {
      go({ name: "project", id: target.slug || target.id, from: backRoute, transitionDirection: "none" });
    }, 520);
  };

  const handleHeroTouchStart = (event) => {
    const touch = event.touches[0];
    swipeStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };
  const handleHeroTouchEnd = (event) => {
    const start = swipeStartRef.current;
    const touch = event.changedTouches[0];
    swipeStartRef.current = null;
    if (!start || !touch || transitioning) return;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 56 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return;
    if (deltaX < 0) navigateProject(next, "next");
    else navigateProject(prev, "prev");
  };

  // Status, size and brand carry one value each — the Greek comes from the
  // dictionary, not from a parallel _gr field on the project.
  const rawStatus = p.status || "";
  const statusLabel = t(rawStatus) !== rawStatus ? t(rawStatus) : rawStatus;
  const projectMeta = [
    ["location", pick(p, "location")],
    ["status", statusLabel],
    ["size", p.size],
    ["pd_type", pick(p, "type")],
    ["pd_lead_architect", pick(p, "lead_architect")],
    ["pd_design_team", pick(p, "design_team")],
    ["pd_contractor", pick(p, "contractor")],
    ["pd_engineer", pick(p, "engineer")],
  ];

  return (
    <div
      className={`project-page-view ${transitioning ? `project-exit-${transitioning.direction}` : transitionDirection ? `project-enter-${transitionDirection}` : "project-enter-initial"}`}
      key={p.id}>
      {transitioning ? ReactDOM.createPortal(
        <div className="project-push-transition" aria-hidden="true">
          <div className={`project-push-track project-push-track--${transitioning.direction}`}>
            {(transitioning.direction === "next" ? [p, transitioning.target] : [transitioning.target, p]).map((project, index) => (
              <div className="project-push-panel" key={`${project.id}-${index}`}>
                <img src={project.hero} alt="" />
              </div>
            ))}
          </div>
        </div>,
        document.body
      ) : null}

      {/* Fullscreen cover — still or clip */}
      <div className="pd-hero" onTouchStart={handleHeroTouchStart} onTouchEnd={handleHeroTouchEnd}>
        <SiteMedia src={p.hero} alt={pick(p, "name")} />
      </div>

      {/* Info + gallery in a centered container */}
      <div className="pd-page">
        <h1 className="pd-page-title-outside">{pick(p, "name")}</h1>
        <h2 className="pd-section-title">{t("pd_details")}</h2>
        <dl className="pd-meta-grid">
          {projectMeta.map(([label, value]) => (
            <div className="pd-meta-card" key={label}>
              <dt>{t(label)}</dt>
              <dd>{value || "—"}</dd>
            </div>
          ))}
        </dl>
        {pick(p, "summary") ? (
          <section className="pd-description">
            <h2 className="pd-section-title">{t("pd_description")}</h2>
            <p className="pd-split-summary">{pick(p, "summary")}</p>
          </section>
        ) : null}
      </div>

      {/* Gallery rows — full bleed */}
      {p.gallery.map((g, i) =>
      <div key={i} className="pd-page-gallery-row">
          <SiteMedia src={g.src} alt={pick(g, "tag")} lazy />
          {pick(g, "tag") ? <span className="pd-page-tag">{pick(g, "tag")}</span> : null}
        </div>
      )}

      {ReactDOM.createPortal(
        <div
          className={`pd-scroll-progress ${transitioning ? "is-transitioning" : ""}`}
          role="progressbar"
          aria-label="Page progress"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={Math.round(scrollProgress)}>
          <span className="pd-scroll-progress-track" aria-hidden="true">
            <span
              className="pd-scroll-progress-fill"
              style={{
                transform: `scaleX(${scrollProgress / 100})`,
                background: scrollProgress >= 99.5 ? PROJECT_PROGRESS_GRADIENT : progressColorAt(scrollProgress),
              }} />
          </span>
        </div>,
        document.body
      )}
    </div>);

}

/* ================== PEOPLE — three dashboard-managed profiles ================== */
function AgencyPage() {
  const pick = window.usePick();
  const people = TEAM;
  const [selectedPerson, setSelectedPerson] = useS(null);
  const site = window.normaliseSiteSettings ? window.normaliseSiteSettings(
    (() => { const stored = window.readP58Store ? window.readP58Store() : null; return stored && stored.site ? stored.site : {}; })()
  ) : window.DEFAULT_SITE_SETTINGS || {};
  const peopleSettings = site.people || { title: "People", title_gr: "Άνθρωποι", hero: "assets/people/people-hero-v2.png" };
  useE(() => {
    if (!selectedPerson) return undefined;
    const previousOverflow = document.body.style.overflow;
    const onKey = (event) => { if (event.key === "Escape") setSelectedPerson(null); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [selectedPerson]);
  return (
    <div className="people-mosaic-page page-enter">
      <h1 className="people-mosaic-title">{pick(peopleSettings, "title")}</h1>
      <div className="people-mosaic-grid">
        {people.map((person, index) => {
          const initials = String(person.name || "")
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("");
          const image = person.portrait || peopleSettings.hero;
          return (
            <article
              className={`people-mosaic-card people-mosaic-card--${index + 1}`}
              key={person._id || person.name || index}
              role="button"
              tabIndex="0"
              aria-label={`View profile: ${person.name}`}
              onClick={() => setSelectedPerson(person)}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedPerson(person); }}>
              <div className="people-mosaic-media">
                {image ? <img src={image} alt={person.name} /> : <span className="people-mosaic-initials">{initials}</span>}
              </div>
              <div className="people-mosaic-caption">
                <p>{pick(person, "role")}</p>
                <h2>{person.name}</h2>
              </div>
            </article>
          );
        })}
      </div>
      {selectedPerson ? ReactDOM.createPortal(
        <div className="people-profile-modal" role="dialog" aria-modal="true" aria-labelledby="people-profile-name" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedPerson(null); }}>
          <div className="people-profile-modal-card">
            <header className="people-profile-modal-nav">
              <button className="people-profile-modal-back" aria-label="Back to People" onClick={() => setSelectedPerson(null)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.5 2.5L5 8l5.5 5.5" />
                </svg>
                <span>Back</span>
              </button>
              <img className="people-profile-modal-logo" src="assets/logo-black.svg" alt="Project58" />
              <span aria-hidden="true" />
            </header>
            <div className="people-profile-modal-image">
              {(selectedPerson.portrait || peopleSettings.hero) ? <img src={selectedPerson.portrait || peopleSettings.hero} alt="" /> : null}
            </div>
            <div className="people-profile-modal-copy">
              <h2 id="people-profile-name">{selectedPerson.name}</h2>
              <p>{pick(selectedPerson, "role")}</p>
              <div>{pick(selectedPerson, "note") || "—"}</div>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}

/* Legacy studio page retained outside the active route. */
function LegacyAgencyPage({ go }) {
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
          <div><span>{t("studios")}</span><span className="v">{t("studio_location")}</span></div>
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

      {/* Block footer */}
      <AgencyFooter />
    </div>);
}
/* ================== AGENCY BLOCK FOOTER ================== */
function AgencyFooter() {
  const [contactOpen, setContactOpen] = useS(false);
  const site = window.normaliseSiteSettings ? window.normaliseSiteSettings(
    (() => { const r = window.readP58Store ? window.readP58Store() : null; return r && r.site ? r.site : {}; })()
  ) : window.DEFAULT_SITE_SETTINGS || {};
  const contact = site.contact || {};

  return (
    <footer className="agency-foot">
      {/* Contact panel — slides in above the footer */}
      <div className={`agency-foot-contact ${contactOpen ? "open" : ""}`}>
        <div className="agency-foot-contact-inner">
          <div className="agency-foot-contact-col">
            <div className="agency-foot-contact-label">{contact.location_label || "ATHENS"}</div>
            <div className="agency-foot-contact-item">{contact.address}</div>
            <a className="agency-foot-contact-item" href={contact.phone_url}>{contact.phone}</a>
            <a className="agency-foot-contact-item" href={contact.email_url}>{contact.email}</a>
            {contact.instagram_url
              ? <a className="agency-foot-contact-item" href={contact.instagram_url} target="_blank" rel="noopener noreferrer">{contact.instagram_text}</a>
              : <span className="agency-foot-contact-item">{contact.instagram_text}</span>
            }
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="agency-foot-bar">
        <img src="assets/logo-black.svg" alt="Project58" className="agency-foot-logo" />
        <div className="agency-foot-actions">
          <button
            className={`agency-foot-btn ${contactOpen ? "on" : ""}`}
            onClick={() => setContactOpen(v => !v)}>
            {contactOpen ? "Close" : "Contact"} {contactOpen ? "×" : "↗"}
          </button>
          <button
            className="agency-foot-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { HomePage, AllProjectsGrid, Tile, ProjectsPage, InteriorsPage, ArchitecturePage, AgencyPage, AgencyFooter, ProjectPage });
