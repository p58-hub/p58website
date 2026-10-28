// ===== pages.jsx — Home, Brand index, Project detail, Studio, News =====
const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM } = React;

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

/* ================== HOME — vertical scroll: full-screen hero → project cards ================== */
function startHomeIdleScroll(hero, settings = {}) {
  if (new URLSearchParams(location.search).get('visualTextEditor') === '1') return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!hero || reducedMotion.matches || settings.idleHintEnabled === false) return;
  const target = hero.closest('.dhome') || hero;
  if (!target.animate) return;
  const delay = Math.min(120000, Math.max(2000, Number(settings.idleHintDelay) || 15000));
  const duration = Math.min(6000, Math.max(1000, Number(settings.idleHintDuration) || 2400));
  let timer, animation, finished = false, pointerDown = false;
  const clear = () => window.clearTimeout(timer);
  const cancelMotion = () => { animation?.cancel(); animation = null; };
  const arm = () => {
    clear();
    cancelMotion();
    if (finished || document.hidden || reducedMotion.matches || window.scrollY > 8) return;
    timer = window.setTimeout(() => {
      if (finished || document.hidden || reducedMotion.matches || window.scrollY > 8) return;
      if (pointerDown || document.querySelector('dialog[open], [aria-modal="true"]') ||
          /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '') ||
          document.activeElement?.isContentEditable || window.getComputedStyle(document.body).overflowY === 'hidden') {
        arm();
        return;
      }
      finished = true;
      // Visual hint only: reveal a little of the next section, then return.
      // The actual scroll position is never changed.
      const distance = Math.min(56, hero.clientHeight * .06);
      animation = target.animate([
        {transform:'translateY(0)', offset:0, easing:'ease-in-out'},
        {transform:`translateY(-${distance}px)`, offset:.5, easing:'ease-in-out'},
        {transform:'translateY(0)', offset:1}
      ], {duration, easing:'linear', iterations:1});
    }, delay);
  };
  const onScroll = () => { if (window.scrollY > 8) { finished = true; clear(); cancelMotion(); } };
  const onDown = () => { pointerDown = true; arm(); };
  const onUp = () => { pointerDown = false; arm(); };
  const events = {pointermove:arm, pointerdown:onDown, pointerup:onUp, pointercancel:onUp, keydown:arm, wheel:arm, scroll:onScroll};
  Object.entries(events).forEach(([name, handler]) => window.addEventListener(name, handler, {passive:true}));
  document.addEventListener('visibilitychange', arm);
  reducedMotion.addEventListener?.('change', arm);
  arm();
  return () => {
    finished = true;
    clear();
    cancelMotion();
    Object.entries(events).forEach(([name, handler]) => window.removeEventListener(name, handler));
    document.removeEventListener('visibilitychange', arm);
    reducedMotion.removeEventListener?.('change', arm);
  };
}

function HomeHeroTitle({ text }) {
  const ref = useR(null);
  React.useLayoutEffect(() => {
    const title = ref.current;
    if (!title) return;
    const measure = () => {
      let previousTop = null, line = -1;
      title.querySelectorAll('.home-hero-word').forEach(word => {
        if (previousTop === null || Math.abs(word.offsetTop - previousTop) > 2) { line++; previousTop = word.offsetTop; }
        word.style.setProperty('--hero-line-delay', `${Math.min(line, 4) * .1}s`);
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(title);
    let live = true;
    document.fonts?.ready.then(() => { if (live) measure(); });
    return () => { live = false; observer.disconnect(); };
  }, [text]);
  return <h1 ref={ref} data-p58-text="home_hero_title">{String(text).split(/(\s+)/).map((word,index) => /\s/.test(word) ? word : <span className="home-hero-word" key={index}>{word}</span>)}</h1>;
}

function HomePage({ go }) {
  const t = window.useT();
  const pick = window.usePick();
  const isMobile = useHomeMobile();
  const selectedSectionRef = useR(null);
  useE(() => {
    const section = selectedSectionRef.current;
    const nav = document.querySelector(".nav");
    if (!section || !nav) return;
    const updateHeight = () => section.style.setProperty("--selected-nav-height", `${nav.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(updateHeight);
    observer.observe(nav);
    updateHeight();
    return () => observer.disconnect();
  });


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
  const [heroVisible, setHeroVisible] = useS(true);
  const [progress, setProgress] = useS(0);
  const heroRef = useR(null);
  const heroGesture = useR(null);
  const suppressHeroClick = useR(false);
  const trackRef = useR(null);
  const targetX = useR(0);
  const animRef = useR(null);

  useE(() => startHomeIdleScroll(heroRef.current, window.readP58Store?.()?.site?.heroGallery || {}), []);

  const changeHero = direction => setI(current => (current + direction + featured.length) % featured.length);
  const startHeroGesture = event => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressHeroClick.current = false;
    if (event.target.closest('button, [role="button"]')) return;
    heroGesture.current = {id:event.pointerId, x:event.clientX, y:event.clientY};
  };
  const moveHeroGesture = event => {
    const start = heroGesture.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.hypot(dx,dy) > 10) suppressHeroClick.current = true;
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) event.currentTarget.setPointerCapture(event.pointerId);
  };
  const endHeroGesture = event => {
    const start = heroGesture.current;
    heroGesture.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      suppressHeroClick.current = true;
      changeHero(dx < 0 ? 1 : -1);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  useE(() => {
    const hero = heroRef.current;
    if (!hero || featured.length < 2) return;
    let distance = 0, lastEvent = 0, lastChange = -Infinity;
    const wheel = event => {
      if (event.ctrlKey) return;
      const horizontal = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
      if (!horizontal || (!event.shiftKey && Math.abs(horizontal) <= Math.abs(event.deltaY))) return;
      event.preventDefault();
      const now = performance.now();
      if (now - lastEvent > 180 || Math.sign(distance) !== Math.sign(horizontal)) distance = 0;
      lastEvent = now;
      if (now - lastChange < 650) return;
      distance += horizontal * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? hero.clientWidth : 1);
      if (Math.abs(distance) >= 45) {
        changeHero(distance > 0 ? 1 : -1);
        distance = 0;
        lastChange = now;
      }
    };
    hero.addEventListener('wheel', wheel, {passive:false});
    return () => hero.removeEventListener('wheel', wheel);
  }, [featured.length]);

  // The v2 vertical presentation is shared by desktop and mobile. The header
  // remains hidden over the opening gallery and returns afterwards.
  useE(() => {
    document.body.dataset.route = "home";
    document.body.classList.add("hz-at-hero");
    document.body.classList.toggle("desktop-presentation-home", !isMobile);
    const onScroll = () => {
      setHeroVisible(window.scrollY < window.innerHeight * 0.95);
      if (!isMobile) document.body.classList.toggle("hz-at-hero", window.scrollY < window.innerHeight * 0.72);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      delete document.body.dataset.route;
      document.body.classList.remove("hz-at-hero");
      document.body.classList.remove("desktop-presentation-home");
    };
  }, [isMobile]);

  // hero auto-rotates while the hero pane is the one in view
  useE(() => {
    if (paused || !heroVisible || progress > 0.04) return;
    const id = setTimeout(() => setI((x) => (x + 1) % featured.length), heroIntervalMs);
    return () => clearTimeout(id);
  }, [i, paused, heroVisible, featured.length, progress, heroIntervalMs]);

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
  // The label under each hero pick is the project's own category, named where
  // categories are named.
  const catOf = (p) => pick(window.siteCategory(window.projectCategoryId(p)) || {}, "label");

  const pgLead = publicProjects().find((p) => BRAND_KEY(p) === "pg") || cur;
  const dnLead = publicProjects().find((p) => BRAND_KEY(p) === "dn") || cur;
  const storedSite = window.readP58Store ? window.readP58Store()?.site : null;
  const homeV2 = window.normaliseSiteSettings(storedSite || window.DEFAULT_SITE_SETTINGS).homeV2;
  const bannerAction = (banner) => {
    const destination = banner.destination;
    if (banner.id === "residences" || destination === "residential" || destination === "architecture") return () => go({ name: "projects", type: "residential", transition: "category-open" });
    if (banner.id === "workplaces" || destination === "workplace") return () => go({ name: "projects", type: "workplace", transition: "category-open" });
    if (destination === "hospitality") return () => go({ name: "projects", type: "hospitality", transition: "category-open" });
    if (destination === "retail") return () => go({ name: "projects", type: "retail", transition: "category-open" });
    if (banner.id === "protein-garden" || destination === "protein-garden") return () => go({ name: "brand", id: "protein-garden" });
    if (banner.id === "dinas" || destination === "dinas") return () => go({ name: "brand", id: "dinas" });
    if (destination === "contact") return () => go({ name: "start" });
    return () => go({ name: "projects" });
  };
  const banners = homeV2.banners
    .filter((banner) => banner.visible !== false && ["protein-garden", "dinas"].includes(banner.id))
    .map((banner) => ({
      ...banner,
      image: banner.image || (banner.id === "protein-garden" ? pgLead?.hero : banner.id === "dinas" ? dnLead?.hero : ""),
      action: bannerAction(banner),
    }))
    .sort((a, b) => {
      const order = { residences: 0, workplaces: 1, "protein-garden": 2, dinas: 3 };
      return (order[a.id] ?? 99) - (order[b.id] ?? 99);
    });

  return (
    <div className="dhome">
      <section
        className="dhome-hero"
        ref={heroRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onPointerDown={startHeroGesture}
        onPointerMove={moveHeroGesture}
        onPointerUp={endHeroGesture}
        onPointerCancel={() => { heroGesture.current = null; suppressHeroClick.current = true; }}
        onClickCapture={event => { if (suppressHeroClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); suppressHeroClick.current = false; } }}>
        {featured.map((p, idx) => (
          <div key={p.id} className={`vhome-slide ${idx === activeIndex ? "on" : ""}`}>
            <img src={p.hero} alt="" draggable={false} />
          </div>
        ))}
        <div className="dhome-hero-veil" aria-hidden="true" />
        <a className="dhome-hero-project-link" href={`/projects/${encodeURIComponent(cur.slug || cur.id)}`} aria-label={`${t("project")}: ${pick(cur, "name")}`}
          draggable={false}
          onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); go({ name:"project", id:cur.slug || cur.id, from:{name:"home"} }); }}
          onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); changeHero(event.key === 'ArrowRight' ? 1 : -1); } }} />
        {featured.length > 1 && [-1, 1].map(direction => <button
          key={direction}
          type="button"
          className={`dhome-hero-arrow ${direction < 0 ? 'previous' : 'next'}`}
          aria-label={pick(direction < 0 ? {label:'Previous project',label_gr:'Προηγούμενο έργο'} : {label:'Next project',label_gr:'Επόμενο έργο'}, 'label')}
          onClick={event => { event.stopPropagation(); changeHero(direction); }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={direction < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} /></svg>
        </button>)}
        <div className="vhome-brand" onClick={(event) => { event.stopPropagation(); go({ name: "home" }); }} role="button" aria-label="Project58 home">
          <img src="assets/logo-white.png" alt="Project58" />
        </div>
        <div className="dhome-hero-copy">
          <span className="dhome-kicker" data-p58-text="home_hero_kicker">{t("home_hero_kicker")}</span>
          <div className="dhome-hero-title-row">
            <HomeHeroTitle text={t("home_hero_title")} />
          </div>
        </div>
        <div className="vhome-loc"><span data-p58-text={window.siteContentKey("project",cur.id,"location")}>{pick(cur, "location")}</span></div>
        <div className="vhome-dots" onClick={(event) => event.stopPropagation()}>
          {featured.map((p, idx) => (
            <button key={p.id} className={`vhome-dot ${idx === activeIndex ? "on" : ""}`} onClick={() => setI(idx)} aria-label={`${t("project")} ${idx + 1}`} />
          ))}
        </div>
      </section>

      <section className="dhome-statement dhome-statement--practice">
        <h2 data-p58-text="home_practice_title">{t("home_practice_title")}</h2>
      </section>

      <section className="home-selected" ref={selectedSectionRef} aria-label={t("home_selected_title")}>
        <div className="home-selected-grid">
          {featured.slice(0, 4).map((project) => (
            <button key={project.id} className="home-selected-card" onClick={() => go({ name: "project", id: project.slug || project.id, from: { name: "home" } })}>
              <div className="home-selected-photo"><SiteMedia src={project.hero} alt="" lazy /></div>
              <div className="home-selected-caption">
              <span className="dhome-kicker">{catOf(project)}</span>
              <h3><span data-p58-text={window.siteContentKey("project",project.id,"name")}>{pick(project, "name")}</span></h3>
              <p><span data-p58-text={window.siteContentKey("project",project.id,"location")}>{pick(project, "location")}</span></p>
              </div>
            </button>
          ))}
        </div>
        <div className="home-selected-actions">
          <button type="button" className="home-explore-more" onClick={() => go({ name: "projects" })}>
            <span className="home-explore-label" data-p58-text="home_explore_more">{t("home_explore_more")}</span> <span className="ui-arrow-up-right" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="dhome-statement dhome-statement--systems home-approach home-conversation">
        <h2 data-p58-text="home_systems_body">{t("home_systems_body")}</h2>
      </section>

      {homeV2.enabled && banners.length ? <section className="dhome-work home-scalable" aria-label={t("home_scalable_title")}>
        <div className="home-scalable-layout">
          <div className="home-scalable-statement" tabIndex={0}>
            <span className="dhome-kicker" data-p58-text="home_scalable_kicker">{t("home_scalable_kicker")}</span>
            <p data-p58-text="home_scalable_text">{t("home_scalable_text")}</p>
          </div>
          <div className="home-scalable-brands">
            {banners.map((banner) => (
              <button key={banner.id} className="home-brand-card" onClick={banner.action}>
                {banner.image ? <SiteMedia src={banner.image} alt="" lazy /> : null}
                <span className="home-brand-shade" aria-hidden="true" />
                <span className="home-brand-copy">
                  <span className="dhome-kicker"><span data-p58-text={window.siteContentKey("banner",banner.id,"eyebrow")}>{pick(banner, "eyebrow")}</span></span>
                  <strong><span data-p58-text={window.siteContentKey("banner",banner.id,"title")}>{pick(banner, "title")}</span></strong>
                </span>
                <span className="ui-arrow-up-right" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </section> : null}


      <section className="dhome-contact hz-foot">
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
        <div className="vhome-loc"><span data-p58-text={window.siteContentKey("project",cur.id,"location")}>{pick(cur, "location")}</span></div>
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
        <h2 data-p58-text="recent_projects">{t("recent_projects")}</h2>
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
              <div className="vhome-name"><span data-p58-text={window.siteContentKey("project",p.id,"name")}>{pick(p, "name")}</span></div>
              <div className="vhome-loc-2"><span data-p58-text={window.siteContentKey("project",p.id,"location")}>{pick(p, "location")}</span></div>
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
          <span data-p58-text="see_all_projects">{t("see_all_projects")}</span><span aria-hidden="true">→</span>
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
  const statusLabel = pick(project,"status") !== rawStatus ? pick(project,"status") : (t(rawStatus) !== rawStatus ? t(rawStatus) : rawStatus);
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
            <div className="ovr-name"><em><span data-p58-text={window.siteContentKey("project",project.id,"name")}>{pick(project, "name")}</span></em></div>
            <div className="ovr-tag" style={{ marginTop: 14 }}>
              <span><span data-p58-text={window.siteContentKey("project",project.id,"location")}>{pick(project, "location")}</span></span>
              <span>·</span>
              <span><span data-p58-text={window.siteContentKey("project",project.id,"size")}>{pick(project, "size")}</span></span>
              <span>·</span>
              <span>{statusLabel}</span>
            </div>
          </div>
          <div className="ovr-tag" style={{ alignSelf: "end" }}>
            <span data-p58-text="view">{t("view")}</span><span className="ui-arrow-up-right" aria-hidden="true" />
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
  // Both the heading and the filter come from the dashboard's Categories
  // section: this page is the retail category under an older URL.
  const sub = window.siteSubcategory("retail", brand);
  const filtered = (sub ?
  publicProjects().filter((p) => String(p.brand || "").trim() === sub.label) :
  publicProjects()).sort(window.PROJECT_SORTS[order].compare(pick));
  const title = sub ? sub.label : pick(window.siteCategory("retail") || {}, "label");
  const eyebrow = sub ?
  `${t("interiors_brand_eyebrow_a")} ${sub.label} · ${filtered.length}${t("interiors_brand_eyebrow_b")}` :
  t("interiors_eyebrow");
  return (
    <div className="page-enter" key={`${(sub && sub.id) || "all"}:${order}`}>
      <div className="proj-list">
        {filtered.map((p, i) =>
        <ProjListRow key={p.id} project={p} go={go} idx={i + 1} />
        )}
      </div>
    </div>);
}

/* ================== PROJECTS — the works landing ==================
   The v1 home page, repurposed as the works landing: an opening gallery pane,
   then the categories as portrait cards. On a desktop wheel the panes run
   sideways; a phone gets the same panes stacked into one vertical scroll.
   Picking a category hands over to ProjectsPage, which lists that category's
   projects the ordinary way — scrolling down. */
function ProjectsRail({ go, transition }) {
  const pick = window.usePick();
  const t = window.useT();
  const isMobile = useHomeMobile();
  const [openingCategory, setOpeningCategory] = useS(false);
  const storedSite = (window.readP58Store ? window.readP58Store() : null)?.site || {};
  const [previewProjectsPage, setPreviewProjectsPage] = useS(null);
  const [previewFocus, setPreviewFocus] = useS(null);
  useE(() => {
    if (new URLSearchParams(location.search).get('visualTextEditor') !== '1' || parent === window) return;
    const receive = event => {
      if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'p58:text-preview' || !event.data.projectsPage) return;
      setPreviewProjectsPage(window.normaliseSiteSettings({projectsPage:event.data.projectsPage}).projectsPage);
      const focus = event.data.projectFocus;
      const next = focus && ['heroTitle','introTitle','introNote','centerText','categories'].includes(focus.field) && Number.isFinite(focus.request) ? focus : null;
      setPreviewFocus(current => current?.request === next?.request && current?.field === next?.field ? current : next);
    };
    window.addEventListener('message', receive);
    // Request the draft again when this route mounts, including after iframe navigation.
    parent.postMessage({type:'p58:text-ready'}, location.origin);
    return () => window.removeEventListener('message', receive);
  }, []);
  const projectsPage = previewProjectsPage || window.normaliseSiteSettings(storedSite).projectsPage;
  const heroTitleScale = Math.min(250, Math.max(50, Number(projectsPage.heroTitleScale) || 150));

  // The categories are the dashboard's, in the dashboard's order. Not cached:
  // a project hidden there has to leave the counts at once.
  const visible = publicProjects();
  const categories = window.siteCategories().map((c) => {
    const members = visible.filter((p) => window.projectCategoryId(p) === c.id);
    const automaticCover = members.find((p) => p.hero);
    return { ...c, count: members.length, cover: c.cover ? { hero: c.cover } : automaticCover };
  }).filter((category) => category.count > 0);

  // the opening pane cycles the featured set, in the order the dashboard pins
  const gallery = (() => {
    const visible = publicProjects();
    const picked = visible.filter((p) => p.featured);
    const list = (picked.length ? picked : visible).slice();
    const stored = window.readP58Store ? window.readP58Store() : null;
    const pinned = Array.isArray(stored?.site?.heroGallery?.order) ? stored.site.heroGallery.order : [];
    if (pinned.length) {
      const rank = new Map(pinned.map((id, idx) => [id, idx]));
      const at = (p) => (rank.has(p.id) ? rank.get(p.id) : Number.MAX_SAFE_INTEGER);
      list.sort((a, b) => at(a) - at(b));
    }
    return list.slice(0, 6);
  })();

  const galleryIntervalMs = useM(() => {
    const stored = window.readP58Store ? window.readP58Store() : null;
    return Math.max(2000, Number(stored?.site?.heroGallery?.interval) || 5200);
  }, []);

  const [i, setI] = useS(0);
  const [paused, setPaused] = useS(false);

  const rail = window.useHorizontalRail({
    storageKey: "hzone_scroll",
    enabled: !isMobile,
    // the header stays out of the way while the opening pane fills the screen
    onScroll: (el) => document.body.classList.toggle("hz-at-hero", el.scrollLeft < el.clientWidth * 0.62),
  });

  useE(() => {
    if (!previewFocus) return;
    const selectors = {heroTitle:'.hz-hero-title',introTitle:'.hz-intro .vhome-rail-title',introNote:'.hz-intro-note',centerText:'.hz-center-copy p',categories:'.hz-cat .vhome-name'};
    const target = rail.ref.current?.querySelector(selectors[previewFocus.field]);
    if (!target) return;
    target.classList.add('visual-project-target');
    const tick = requestAnimationFrame(() => {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
      if (isMobile) target.scrollIntoView({behavior,block:'center',inline:'center'});
      else {
        const container = rail.ref.current;
        const bounds = target.getBoundingClientRect();
        rail.scrollTo(container.scrollLeft + bounds.left - container.getBoundingClientRect().left - (container.clientWidth - bounds.width) / 2, behavior);
      }
    });
    return () => {cancelAnimationFrame(tick);target.classList.remove('visual-project-target');};
  }, [previewFocus, isMobile]);

  // on a phone the same panes are stacked, so the opening one is measured
  // against the page scroll instead of the rail's
  const [pageProgress, setPageProgress] = useS(0);
  useE(() => {
    if (!isMobile) return undefined;
    const onScroll = () => {
      const past = window.innerHeight ? window.scrollY / window.innerHeight : 0;
      setPageProgress(past);
      document.body.classList.toggle("hz-at-hero", past < 0.62);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile]);

  useE(() => {
    document.body.dataset.route = "projects";
    document.body.classList.add("hz-at-hero");
    return () => {
      delete document.body.dataset.route;
      document.body.classList.remove("hz-at-hero");
    };
  }, []);

  // the opening gallery only advances while it is the pane in view
  const openingPaneInView = isMobile ? pageProgress < 0.5 : rail.progress <= 0.04;
  useE(() => {
    if (paused || !gallery.length || !openingPaneInView) return undefined;
    const id = setTimeout(() => setI((x) => (x + 1) % gallery.length), galleryIntervalMs);
    return () => clearTimeout(id);
  }, [i, paused, gallery.length, openingPaneInView, galleryIntervalMs]);

  const activeIndex = gallery.length ? i % gallery.length : 0;
  const cur = gallery[activeIndex];
  if (!cur) return null;
  const openProject = (p, from) => {
    rail.save();
    go({ name: "project", id: p.slug || p.id, from });
  };

  return (
    <div className={`hzone ${projectsPage.categoryTitlesUppercase ? "hz-cat-uppercase" : ""} ${transition === "category-back" ? "category-return" : ""} ${openingCategory ? "category-leaving" : ""}`} ref={rail.ref}>
      {/* ===== opening pane — featured gallery (100vw) ===== */}
      <section
        className="hz-hero"
        style={{ cursor: "pointer" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onClick={() => openProject(cur, { name: "projects" })}>
        {gallery.map((p, idx) => (
          <div key={p.id} className={`vhome-slide ${idx === activeIndex ? "on" : ""}`}>
            <img src={p.hero} alt="" />
          </div>
        ))}
        <div className="vhome-veil" aria-hidden="true" />
        <div className="vhome-brand" onClick={(e) => { e.stopPropagation(); go({ name: "home" }); }} role="button" aria-label="Project58 home">
          <img src="assets/logo-white.png" alt="Project58" />
        </div>
        <h1
          className="hz-hero-title"
          data-p58-text="projectsPage.heroTitle"
          style={{
            "--projects-hero-title-min": `${56 * heroTitleScale / 100}px`,
            "--projects-hero-title-fluid": `${7 * heroTitleScale / 100}vw`,
            "--projects-hero-title-max": `${128 * heroTitleScale / 100}px`,
          }}>
          {pick(projectsPage, "heroTitle") || t("projects")}
        </h1>
        <div className="vhome-loc"><span data-p58-text={window.siteContentKey("project",cur.id,"location")}>{pick(cur, "location")}</span></div>
        <div className="vhome-cue">
          <svg className="mouse-icon" viewBox="0 0 18 28" width="18" height="28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="1" y="1" width="16" height="26" rx="8" stroke="white" strokeWidth="1.5" strokeOpacity="0.85" />
            <rect className="mouse-wheel" x="8" y="5" width="2" height="5" rx="1" fill="white" />
          </svg>
          <span data-p58-text="scroll">{t("scroll")}</span>
        </div>
        <div className="vhome-dots" onClick={(e) => e.stopPropagation()}>
          {gallery.map((p, idx) => (
            <button key={p.id} className={`vhome-dot ${idx === activeIndex ? "on" : ""}`} onClick={() => setI(idx)} aria-label={`${t("project")} ${idx + 1}`} />
          ))}
        </div>
      </section>

      {/* ===== optional intro pane, then portrait category cards ===== */}
      {previewFocus && <style>{`
        .visual-project-target {outline:2px solid #2867d8!important;outline-offset:7px;scroll-margin-block:100px;}
        .visual-preview-hidden::before {content:"Κρυφό στην ιστοσελίδα · μόνο προεπισκόπηση";display:block;font:11px/1.5 sans-serif;color:#2867d8;margin-bottom:16px;}
        .hz-center-copy.visual-preview-focus {display:flex;}
        @media(max-width:720px){.hz-center-copy.visual-preview-focus {height:auto;min-height:240px;padding:80px 24px;flex-direction:column;}}
      `}</style>}
      {projectsPage.showIntro || ['introTitle','introNote'].includes(previewFocus?.field) ? (
        <section className={`hz-intro ${!projectsPage.showIntro ? "visual-preview-hidden" : ""}`}>
          <h2 className="vhome-rail-title" data-p58-text="projectsPage.introTitle">{pick(projectsPage, "introTitle") || (previewFocus ? "Τίτλος εισαγωγής" : "")}</h2>
          <p className="hz-intro-note" data-p58-text="projectsPage.introNote">{pick(projectsPage, "introNote") || (previewFocus ? "Κείμενο εισαγωγής" : "")}</p>
        </section>
      ) : null}

      {pick(projectsPage, "centerText") || previewFocus?.field === "centerText" ? (
        <section className={`hz-center-copy ${previewFocus?.field === "centerText" ? "visual-preview-focus" : ""} ${previewFocus?.field === "centerText" && (!pick(projectsPage, "centerText") || isMobile) ? "visual-preview-hidden" : ""}`}>
          <p data-p58-text="projectsPage.centerText">{pick(projectsPage, "centerText") || "Κεντρικό κείμενο"}</p>
        </section>
      ) : null}

      {/* labels the run of category banners on a phone, where they follow the
          opening pane directly instead of a rail of separate columns */}
      <h2 className="hz-cat-heading" data-p58-text="categories_view">{t("categories_view")}</h2>

      {categories.map((c, idx) => (
        <a
          key={c.id}
          className={`vhome-hcard hz-card hz-cat ${c.count ? "" : "hz-cat--empty"}`}
          href={`/projects?type=${c.id}`}
          onClick={(e) => {
            e.preventDefault();
            if (openingCategory) return;
            rail.save();
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
              go({ name: "projects", type: c.id, transition: "category-open" });
              return;
            }
            setOpeningCategory(true);
            window.setTimeout(() => {
              go({ name: "projects", type: c.id, transition: "category-open" });
            }, 650);
          }}>
          <div className="vhome-hpic">
            {c.cover ? <img src={c.cover.hero} alt="" loading="lazy" draggable="false" /> : null}
            <span className="vhome-hpic-num">N°{String(idx + 1).padStart(2, "0")}</span>
          </div>
          <div className="vhome-hcap">
            <div className="vhome-name"><CategoryIcon id={c.id} /> {pick(c, "label")}</div>
            <div className="vhome-loc-2">
              {c.count ? `${c.count} ${t("proj_word")}` : t("arch_meta_b")}
            </div>
          </div>
        </a>
      ))}

      <div className="vhome-endcard hz-end">
        <div className="eyebrow" data-p58-text="rail_end_eyebrow">{t("rail_end_eyebrow")}</div>
        <h3 data-p58-text="rail_end_h">{t("rail_end_h")}</h3>
        <button onClick={() => go({ name: "start" })}><span data-p58-text="rail_end_cta">{t("rail_end_cta")}</span> <span className="ui-arrow-up-right" aria-hidden="true" /></button>
      </div>

      {/* ===== closing pane — the site footer (100vw) ===== */}
      <section className="hz-foot">
        {window.Footer ? <window.Footer go={go} /> : null}
      </section>

      <div className="hz-progress"><i style={{ width: `${rail.progress * 100}%` }} /></div>
    </div>
  );
}

/* The phone's category control: one button that names the section you are in,
   opens the full list when tapped, and steps a category at a time when you
   scroll or swipe across it. The label follows the page's own scroll — the
   sheet's observer keeps activeCategory in step with what is on screen. */
function MobileCategoryPicker({ categories, activeId, onPick }) {
  const pick = window.usePick();
  const [open, setOpen] = useS(false);
  const wrapRef = useR(null);
  const stepLockRef = useR(0);
  const touchRef = useR(null);
  const index = Math.max(0, categories.findIndex((category) => category.id === activeId));
  const active = categories[index] || categories[0];

  useE(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useE(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    // one category per gesture, or a trackpad flings through the whole set
    const step = (direction) => {
      const now = Date.now();
      if (now < stepLockRef.current) return;
      const next = categories[index + direction];
      if (!next) return;
      stepLockRef.current = now + 420;
      onPick(next.id);
    };
    const onWheel = (event) => {
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!delta) return;
      event.preventDefault(); // the button steps instead of scrolling the page
      step(delta > 0 ? 1 : -1);
    };
    const onTouchStart = (event) => {
      const touch = event.touches[0];
      touchRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
    };
    const onTouchMove = (event) => {
      const start = touchRef.current;
      const touch = event.touches[0];
      if (!start || !touch) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      event.preventDefault();
      touchRef.current = null;
      // dragging left, or up, moves forward — the direction the page travels
      step((Math.abs(dx) > Math.abs(dy) ? -dx : -dy) > 0 ? 1 : -1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [index, categories.length]);

  if (!active) return null;

  return (
    <div className={`cat-picker ${open ? "on" : ""}`} ref={wrapRef}>
      <button
        type="button"
        className="cat-picker-btn"
        aria-haspopup="listbox"
        aria-expanded={open ? "true" : "false"}
        onClick={() => setOpen((value) => !value)}>
        <CategoryIcon id={active.id} /><span className="cat-picker-name">{pick(active, "label")}</span>
        <span className="cat-picker-count">{active.projects.length}</span>
        <span className="cat-picker-chev" aria-hidden="true" />
      </button>
      {open ? (
        <div className="cat-picker-menu" role="listbox">
          {categories.map((category, categoryIndex) => (
            <button
              key={category.id}
              type="button"
              role="option"
              aria-selected={category.id === active.id ? "true" : "false"}
              className={`cat-picker-item ${category.id === active.id ? "on" : ""}`}
              onClick={() => { setOpen(false); onPick(category.id); }}>
              <CategoryIcon id={category.id} />
              <span className="cat-picker-item-name"><span data-p58-text={window.siteContentKey("category",category.id,"label")}>{pick(category, "label")}</span></span>
              <span className="cat-picker-item-count">{category.projects.length}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ================== PROJECTS — unified list with type filter ================== */
function ProjectsPage({ go, type, brand, sort, view, transition }) {
  const pick = window.usePick();
  const t = window.useT();
  // `type` is a dashboard category id — anything the dashboard publishes is a
  // valid filter here, not just the two the nav's category row happens to show.
  const categoryList = window.siteCategories().filter((category) =>
    publicProjects().some((project) => window.projectCategoryId(project) === category.id));
  const categoryIds = categoryList.map((c) => c.id);
  const normalisedType = categoryIds.includes(type) ? type : null;
  const normalisedBrand = normalisedType === "retail" && (brand === "pg" || brand === "dn") ? brand : null;
  const order = window.PROJECT_SORTS[sort] ? sort : window.PROJECT_SORT_DEFAULT;
  const sortedProjects = publicProjects().slice().sort(window.PROJECT_SORTS[order].compare(pick));
  const filtered = sortedProjects.filter((p) => {
    if (!normalisedType) return true;
    if (window.projectCategoryId(p) !== normalisedType) return false;
    return !normalisedBrand || BRAND_KEY(p) === normalisedBrand;
  });
  const categoryGroups = categoryList.map((category) => {
    const projects = sortedProjects.filter((project) => window.projectCategoryId(project) === category.id);
    const definedSubs = (category.subcategories || []).map((subcategory, index) => ({
      ...subcategory,
      id: subcategory.id || `sub-${index}`,
    }));
    const definedLabels = definedSubs.map((subcategory) => subcategory.label);
    const extraLabels = [...new Set(projects.map((project) => String(project.brand || "").trim()).filter(Boolean))]
      .filter((label) => !definedLabels.includes(label));
    const extraSubs = extraLabels.map((label, index) => ({ id: `extra-${index}`, label }));
    const subcategories = [...definedSubs, ...extraSubs].map((subcategory) => ({
      ...subcategory,
      projects: projects.filter((project) => String(project.brand || "").trim() === subcategory.label),
    }));
    const subcategoryLabels = new Set(subcategories.map((subcategory) => subcategory.label));
    const uncategorisedProjects = projects.filter((project) => !subcategoryLabels.has(String(project.brand || "").trim()));
    return { ...category, projects, subcategories, uncategorisedProjects };
  });
  const firstCategoryId = categoryGroups.find((category) => category.projects.length)?.id || categoryGroups[0]?.id || null;
  const [activeCategory, setActiveCategory] = useS(normalisedType || firstCategoryId);
  const [activeSubcategory, setActiveSubcategory] = useS(null);
  const [collapsedCategories, setCollapsedCategories] = useS({});
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

  useE(() => {
    const sections = Array.from(document.querySelectorAll(".projects-category-section[data-category-id]"));
    if (!sections.length || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top - window.innerHeight * 0.3) - Math.abs(b.boundingClientRect.top - window.innerHeight * 0.3));
      const current = visibleEntries[0];
      if (current) setActiveCategory(current.target.dataset.categoryId);
    }, { rootMargin: "-22% 0px -62% 0px", threshold: [0, 0.01, 0.2] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [normalisedType, categoryGroups.map((category) => `${category.id}:${category.projects.length}`).join("|")]);

  useE(() => {
    const sections = Array.from(document.querySelectorAll(".projects-subcategory-section[data-subcategory-key]"));
    if (!sections.length || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver((entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top - window.innerHeight * 0.34) - Math.abs(b.boundingClientRect.top - window.innerHeight * 0.34))[0];
      if (!current) return;
      setActiveCategory(current.target.dataset.categoryId);
      setActiveSubcategory(current.target.dataset.subcategoryKey);
    }, { rootMargin: "-26% 0px -58% 0px", threshold: [0, 0.01, 0.2] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [normalisedType, categoryGroups.map((category) => `${category.id}:${category.subcategories.length}`).join("|")]);

  useE(() => {
    if (!normalisedType || normalisedBrand) return undefined;
    setCollapsedCategories(current => ({ ...current, [normalisedType]: false }));
    const timer = window.setTimeout(() => {
      const section = document.getElementById(`projects-category-${normalisedType}`);
      if (section) section.scrollIntoView({ block: "start", behavior: "instant" });
    }, 40);
    return () => window.clearTimeout(timer);
  }, [normalisedType, normalisedBrand]);

  useE(() => {
    if (!normalisedBrand) return undefined;
    const subcategoryId = normalisedBrand === "pg" ? "protein-garden" : "dinas";
    const timer = window.setTimeout(() => {
      const section = document.getElementById(`projects-subcategory-retail-${subcategoryId}`);
      if (!section) return;
      setActiveCategory("retail");
      setActiveSubcategory(`retail:${subcategoryId}`);
      section.scrollIntoView({ block: "start", behavior: "instant" });
    }, 40);
    return () => window.clearTimeout(timer);
  }, [normalisedBrand]);

  const jumpToCategory = (categoryId) => {
    setCollapsedCategories(current => ({ ...current, [categoryId]: false }));
    const section = document.getElementById(`projects-category-${categoryId}`);
    if (!section) return;
    setActiveCategory(categoryId);
    setActiveSubcategory(null);
    section.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const jumpToSubcategory = (categoryId, subcategoryId) => {
    const key = `${categoryId}:${subcategoryId}`;
    const section = document.getElementById(`projects-subcategory-${categoryId}-${subcategoryId}`);
    if (!section) return;
    setActiveCategory(categoryId);
    setActiveSubcategory(key);
    section.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const keepSort = (route) => (sort ? { ...route, sort } : route);
  const sheetRoute = {
    name: "projects",
    ...(normalisedType ? { type: normalisedType } : {}),
    ...(normalisedBrand ? { brand: normalisedBrand } : {}),
    ...(sort ? { sort } : {}),
    ...(view === "all" ? { view: "all" } : {}),
  };
  return (
    <div className={`projects-page page-enter ${transition === "category-open" ? "category-page-enter" : ""}`} key={`${normalisedType || "all"}:${normalisedBrand || "all"}:${order}`}>
      <div className="projects-sheet">
        <div className="mobile-projects-sheet-head">
          <MobileCategoryPicker
            categories={categoryGroups}
            activeId={activeCategory}
            onPick={jumpToCategory} />
          <window.ProjectSort route={sheetRoute} go={go} />
        </div>
        <div className="projects-category-browser">
          <div className="projects-category-column">
            {categoryGroups.map((category) => (
              <section
                key={category.id}
                id={`projects-category-${category.id}`}
                data-category-id={category.id}
                className={`projects-category-section ${collapsedCategories[category.id] ? "is-collapsed" : ""}`}>
                <header className="projects-category-heading">
                  <SiteMedia className="projects-category-cover" src={category.cover || category.projects.find(project => project.hero)?.hero} alt="" lazy />
                  <CategoryIcon id={category.id} />
                  <h2><button
                    className="projects-category-toggle"
                    type="button"
                    aria-expanded={!collapsedCategories[category.id]}
                    aria-controls={`projects-category-content-${category.id}`}
                    onClick={() => setCollapsedCategories(current => ({ ...current, [category.id]: !current[category.id] }))}>
                    <span data-p58-text={window.siteContentKey("category",category.id,"label")}>{pick(category, "label")}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                  </button></h2>
                  <span>{category.projects.length} <span data-p58-text={"proj_word"}>{t("proj_word")}</span></span>
                </header>
                <div className="projects-category-reveal" id={`projects-category-content-${category.id}`} aria-hidden={!!collapsedCategories[category.id]} inert={collapsedCategories[category.id] ? "" : undefined}>
                  <div className="projects-category-reveal-inner">
                    <div className="projects-category-content">
                      <CategoryProjectPreview category={category} go={go} from={keepSort({ name: "projects", type: category.id })} />
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
          <aside className="projects-category-jump" aria-label={t("categories_view")}>
            <div className="projects-category-sort">
              <window.ProjectSort route={sheetRoute} go={go} />
            </div>
            <div className="projects-category-jump-label" data-p58-text="categories_view">{t("categories_view")}</div>
            {categoryGroups.map((category, index) => (
              <div className="projects-category-jump-group" key={category.id}>
                <button
                  type="button"
                  className={`projects-category-jump-main ${activeCategory === category.id ? "on" : ""}`}
                  onClick={() => jumpToCategory(category.id)}>
                  <CategoryIcon id={category.id} />
                  <b><span data-p58-text={window.siteContentKey("category",category.id,"label")}>{pick(category, "label")}</span></b>
                </button>
                {category.subcategories.length ? (
                  <div className="projects-category-jump-subs">
                    {category.subcategories.map((subcategory) => {
                      const subcategoryKey = `${category.id}:${subcategory.id}`;
                      return (
                        <button
                          key={subcategory.id}
                          type="button"
                          className={activeSubcategory === subcategoryKey ? "on" : ""}
                          onClick={() => { const collection = projectCollectionEntries(category.projects, category).find(entry => entry.kind === "brand" && entry.label === subcategory.label); if (collection) go({ name: "brand", id: collection.id }); else jumpToCategory(category.id); }}>
                          <i />
                          <b data-p58-text={window.siteContentKey("brand",subcategory.id,"label")}>{pick(subcategory,"label")}</b>
                          <span>{subcategory.projects.length}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </aside>
        </div>
      </div>
      <section className="projects-contact-parallax" aria-label={t("contact")}>
        <div className="projects-contact-parallax-inner">
          <window.ContactPage go={go} />
        </div>
      </section>
    </div>
  );
}

function ProjListRow({ project, go, idx, from }) {
  const pick = window.usePick();
  const t = window.useT();
  const site = useSiteSettings();
  const bk = BRAND_KEY(project);
  const monogram = bk === "pg" ? "PG" : "DN";
  const stored = window.readP58Store ? window.readP58Store() : null;
  const iconSrc = window.projectIconFor(project, site, stored && stored.categories);
  const [iconFailed, setIconFailed] = useS(false);
  useE(() => setIconFailed(false), [iconSrc]);
  const builtInIconSrc = bk === "pg" ? "assets/proteingarden/Protein Garden New logo_final-03.png" : "";
  const visibleIconSrc = iconSrc && !iconFailed ? iconSrc : builtInIconSrc;
  // Format location as "GREECE, ATHENS, NEIGHBORHOOD"
  const rawLoc = pick(project, "location") || "";
  const locParts = rawLoc.split(/\s*·\s*/);
  const locFormatted = [t("country_greece"), ...locParts].join(", ").toUpperCase();
  const rawStatus = project.status || "";
  const statusLabel = pick(project,"status") !== rawStatus ? pick(project,"status") : (t(rawStatus) !== rawStatus ? t(rawStatus) : rawStatus);
  return (
    <div
      className="proj-list-row"
      role="link" tabIndex={0}
      onKeyDown={event => { if (event.key === "Enter") go({ name: "project", id: project.slug || project.id, ...(from ? { from } : {}) }); }}
      onClick={() => go({ name: "project", id: project.slug || project.id, ...(from ? { from } : {}) })}>
      <div className="proj-list-info">
        {project.icon !== null && (visibleIconSrc
          ? <img className="proj-list-icon proj-list-icon--img" src={visibleIconSrc} alt={project.brand} onError={() => { if (visibleIconSrc === iconSrc) setIconFailed(true); }} />
          : <div className={`proj-list-icon proj-list-icon--${bk}`}>{monogram}</div>
        )}
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
            <p data-p58-text="residential_coming_soon">{t("residential_coming_soon")}</p>
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
  const statusLabel = pick(p,"status") !== rawStatus ? pick(p,"status") : (t(rawStatus) !== rawStatus ? t(rawStatus) : rawStatus);
  const projectMeta = [
    ["location", pick(p, "location")],
    ["status", statusLabel],
    ["size", pick(p,"size")],
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
        <h1 className="pd-page-title-outside"><span data-p58-text={window.siteContentKey("project",p.id,"name")}>{pick(p, "name")}</span></h1>
        <h2 className="pd-section-title" data-p58-text="pd_details">{t("pd_details")}</h2>
        <dl className="pd-meta-grid">
          {projectMeta.map(([label, value]) => (
            <div className="pd-meta-card" key={label}>
              <dt><span data-p58-text={label}>{t(label)}</span></dt>
              <dd data-p58-text={window.siteContentKey("project",p.id,label.replace(/^pd_/,""))}>{value || "—"}</dd>
            </div>
          ))}
        </dl>
        {pick(p, "summary") ? (
          <section className="pd-description">
            <h2 className="pd-section-title" data-p58-text="pd_description">{t("pd_description")}</h2>
            <p className="pd-split-summary"><span data-p58-text={window.siteContentKey("project",p.id,"summary")}>{pick(p, "summary")}</span></p>
          </section>
        ) : null}
      </div>

      {/* Gallery rows — full bleed */}
      {p.gallery.map((g, i) =>
      <div key={i} className="pd-page-gallery-row">
          <SiteMedia src={g.src} alt={pick(g, "tag")} lazy />
          {pick(g, "tag") ? <span className="pd-page-tag"><span data-p58-text={window.siteContentKey("gallery",`${p.id}/${i}`,"tag")}>{pick(g, "tag")}</span></span> : null}
        </div>
      )}

      {ReactDOM.createPortal(
        <div
          className={`pd-scroll-progress ${transitioning ? "is-transitioning" : ""}`}
          role="progressbar"
          aria-label={t("page_progress")}
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
  const t = window.useT();
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
      <h1 className="people-mosaic-title" data-p58-text={window.siteContentKey("people","page","title")}>{pick(peopleSettings, "title")}</h1>
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
              aria-label={`${t("view_profile")}: ${person.name}`}
              onClick={() => setSelectedPerson(person)}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedPerson(person); }}>
              <div className="people-mosaic-media">
                {image ? <img src={image} alt={person.name} /> : <span className="people-mosaic-initials">{initials}</span>}
              </div>
              <div className="people-mosaic-caption">
                <p><span data-p58-text={window.siteContentKey("team",person._id || TEAM.indexOf(person),"role")}>{pick(person, "role")}</span></p>
                <h2 data-p58-text={window.siteContentKey("team",person._id || TEAM.indexOf(person),"name")}>{pick(person,"name")}</h2>
              </div>
            </article>
          );
        })}
      </div>
      {selectedPerson ? ReactDOM.createPortal(
        <div className="people-profile-modal" role="dialog" aria-modal="true" aria-labelledby="people-profile-name" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedPerson(null); }}>
          <div className="people-profile-modal-card">
            <header className="people-profile-modal-nav">
              <button className="people-profile-modal-back" aria-label={t("back_to_people")} onClick={() => setSelectedPerson(null)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.5 2.5L5 8l5.5 5.5" />
                </svg>
                <span data-p58-text="back">{t("back")}</span>
              </button>
              <img className="people-profile-modal-logo" src="assets/logo-black.svg" alt="Project58" />
              <span aria-hidden="true" />
            </header>
            <div className="people-profile-modal-image">
              {(selectedPerson.portrait || peopleSettings.hero) ? <img src={selectedPerson.portrait || peopleSettings.hero} alt="" /> : null}
            </div>
            <div className="people-profile-modal-copy">
              <h2 id="people-profile-name" data-p58-text={window.siteContentKey("team",selectedPerson._id || TEAM.indexOf(selectedPerson),"name")}>{pick(selectedPerson,"name")}</h2>
              <p><span data-p58-text={window.siteContentKey("team",selectedPerson._id || TEAM.indexOf(selectedPerson),"role")}>{pick(selectedPerson, "role")}</span></p>
              <div data-p58-text={window.siteContentKey("team",selectedPerson._id || TEAM.indexOf(selectedPerson),"note")}>{pick(selectedPerson, "note") || "—"}</div>
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
        <div className="eyebrow" data-p58-text="agency_eyebrow">{t("agency_eyebrow")}</div>
        <h1><span data-p58-text={"agency_h_a"}>{t("agency_h_a")}</span> <em data-p58-text="agency_h_em">{t("agency_h_em")}</em> <span data-p58-text={"agency_h_b"}>{t("agency_h_b")}</span></h1>
      </section>

      <section className="bleed">
        <div className="studio-cols">
          <div className="col">
            <p>
              <span data-p58-text={"agency_p1"}>{t("agency_p1")}</span> <em data-p58-text="agency_p1_em">{t("agency_p1_em")}</em><span data-p58-text={"agency_p1_b"}>{t("agency_p1_b")}</span> <em data-p58-text="agency_p1_em2">{t("agency_p1_em2")}</em><span data-p58-text={"agency_p1_c"}>{t("agency_p1_c")}</span>
            </p>
          </div>
          <div className="col">
            <p data-p58-text="agency_p2">{t("agency_p2")}</p>
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
          <div><span data-p58-text="team_eyebrow">{t("team_eyebrow")}</span><span className="v" data-p58-text="team_h">{t("team_h")}</span></div>
          <div><span data-p58-text="headcount">{t("headcount")}</span><span className="v">{TEAM.length} <span data-p58-text={"headcount_unit"}>{t("headcount_unit")}</span></span></div>
          <div><span data-p58-text="studios">{t("studios")}</span><span className="v" data-p58-text="studio_location">{t("studio_location")}</span></div>
          <div style={{ justifyContent: "flex-end" }}><span className="muted mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em" }} data-p58-text="updated_label">{t("updated_label")}</span></div>
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
        <div className="eyebrow" data-p58-text="practice_eyebrow">{t("practice_eyebrow")}</div>
        <h2 style={{ fontFamily: "var(--sans)", fontWeight: 500, fontSize: "clamp(40px, 5vw, 76px)", letterSpacing: "-0.04em", margin: "12px 0 32px" }}>
          <span data-p58-text={"short_history"}>{t("short_history")}</span>
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
      <section className="bleed agency-news-head" style={{ padding: "60px var(--gutter) 24px", borderTop: "1px solid var(--rule-strong)", marginTop: 40 }}>
        <div className="eyebrow" data-p58-text="news_eyebrow">{t("news_eyebrow")}</div>
        <h2 style={{ fontFamily: "var(--sans)", fontWeight: 500, fontSize: "clamp(40px, 5vw, 76px)", letterSpacing: "-0.04em", margin: "12px 0 32px" }}>
          <span data-p58-text={"recently"}>{t("recently")}</span>
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
            <div className="mono" style={{ fontSize: 18, justifySelf: "end", color: "var(--ink-3)" }}><span className="ui-arrow-up-right" aria-hidden="true" /></div>
          </article>
        )}
      </section>

      {/* CTA */}
      <section className="bleed" style={{ padding: "60px var(--gutter) 96px", borderTop: "1px solid var(--rule-strong)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gutter)", alignItems: "end" }}>
          <div>
            <div className="eyebrow" data-p58-text="work_with_us">{t("work_with_us")}</div>
            <h3 style={{ fontFamily: "var(--sans)", fontWeight: 500, fontSize: "clamp(36px, 4.5vw, 64px)", letterSpacing: "-0.04em", margin: "12px 0 0", lineHeight: 1.05 }}>
              <span data-p58-text={"agency_cta"}>{t("agency_cta")}</span> <em style={{ color: "var(--clay)" }} data-p58-text="cta_2026">{t("cta_2026")}</em> <span data-p58-text={"agency_cta_tail"}>{t("agency_cta_tail")}</span>
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
  const t = window.useT();
  const { lang } = window.useLang();
  const [contactOpen, setContactOpen] = useS(false);
  const site = window.normaliseSiteSettings ? window.normaliseSiteSettings(
    (() => { const r = window.readP58Store ? window.readP58Store() : null; return r && r.site ? r.site : {}; })()
  ) : window.DEFAULT_SITE_SETTINGS || {};
  const contact = site.contact || {};
  const contactCopy = (key) => lang === "gr" ? (contact[`${key}_gr`] || contact[key] || "") : (contact[key] || "");

  return (
    <footer className="agency-foot">
      {/* Contact panel — slides in above the footer */}
      <div className={`agency-foot-contact ${contactOpen ? "open" : ""}`}>
        <div className="agency-foot-contact-inner">
          <div className="agency-foot-contact-col">
            <div className="agency-foot-contact-label"><span data-p58-text={window.siteContentKey("contact","footer","location_label")}>{contactCopy("location_label")}</span></div>
            <div className="agency-foot-contact-item"><span data-p58-text={window.siteContentKey("contact","footer","address")}>{contactCopy("address")}</span></div>
            <a className="agency-foot-contact-item" href={contact.phone_url}>{contact.phone}</a>
            <a className="agency-foot-contact-item" href={contact.email_url}>{contact.email}</a>
            {contact.instagram_url
              ? <a className="agency-foot-contact-item" href={contact.instagram_url} target="_blank" rel="noopener noreferrer"><span data-p58-text={window.siteContentKey("contact","footer","instagram_text")}>{contactCopy("instagram_text")}</span></a>
              : <span className="agency-foot-contact-item"><span data-p58-text={window.siteContentKey("contact","footer","instagram_text")}>{contactCopy("instagram_text")}</span></span>
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
            {contactOpen ? t("inquiry_close") : t("contact")} {contactOpen ? "×" : <span className="ui-arrow-up-right" aria-hidden="true" />}
          </button>
          <button
            className="agency-foot-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <span data-p58-text={"back_to_top"}>{t("back_to_top")}</span> ↑
          </button>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { SiteMedia, ProjListRow, HomePage, AllProjectsGrid, Tile, ProjectsPage, InteriorsPage, ArchitecturePage, AgencyPage, AgencyFooter, ProjectPage });
