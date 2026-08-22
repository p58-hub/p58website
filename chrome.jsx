/* ===== chrome.jsx — Nav + Footer =====
   - Compact wordmark logo (uses logo-black.svg now — no black bounding box).
   - Center nav is a single PROJECTS link into the works index, which carries
     its own category row (All / Retail / Residential + brands) underneath.
   - Right side: a Spotlight-style search trigger + a sandwich menu that
     pops a minimal AGENCY / CONTACT card.
*/
const { useEffect, useState, useRef } = React;

function useIsMobile() {
  const [m, setM] = useState(() =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 720px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const fn = (e) => setM(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", fn);else
    mq.addListener(fn);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", fn);else
      mq.removeListener(fn);
    };
  }, []);
  return m;
}

function Nav({ route, go }) {
  const t = window.useT();
  const pick = window.usePick();
  const { lang, setLang } = window.useLang();
  const site = useSiteSettings();
  const isRetail = route.name === "interiors" || route.name === "project";
  const isResidential = route.name === "architecture";
  const isProjects = route.name === "projects";
  const isAgency = route.name === "agency";
  const isContact = route.name === "contact";
  const isHome = route.name === "home";

  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [pastHero, setPastHero] = useState(false);
  const [menuPreviewKey, setMenuPreviewKey] = useState("home");
  const menuRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const isProject = route.name === "project";

  // scroll detection — home: track atTop; project: show nav only while scrolling;
  // other vertical pages: hide on scroll down, show on scroll up
  useEffect(() => {
    const isVertical = !isHome && !isProject;
    if (isProject) {
      document.body.classList.remove("nav-scroll-hide");
      const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.6);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    }
    setPastHero(false);
    if (isHome) {
      document.body.classList.remove("nav-scroll-hide");
      const onScroll = () => setAtTop(window.scrollY < 80);
      setAtTop(window.scrollY < 80);
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }
    // project indexes: nav always visible (sticky top)
    if (route.name === "projects" || route.name === "interiors" || route.name === "architecture") {
      document.body.classList.remove("nav-scroll-hide");
      return;
    }
    // agency: smart hide on scroll-down, show on scroll-up
    document.body.classList.remove("nav-scroll-hide");
    setAtTop(false);
    lastScrollYRef.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const diff = y - lastScrollYRef.current;
      if (Math.abs(diff) > 6) {
        document.body.classList.toggle("nav-scroll-hide", diff > 0 && y > 80);
        lastScrollYRef.current = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.body.classList.remove("nav-scroll-hide");
    };
  }, [isHome, isProject, route.name]);

  // Header is always the full, standard nav now (no minimal "home-top" mode).
  const homeTop = false;

  // close sandwich on outside click / esc (desktop popup only)
  useEffect(() => {
    if (!menuOpen || isMobile) return;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {if (e.key === "Escape") setMenuOpen(false);};
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, isMobile]);

  useEffect(() => {
    if (!menuOpen) return;
    setMenuPreviewKey(isAgency ? "agency" : (isProjects || isRetail || isResidential) ? "projects" : "home");
  }, [menuOpen, isAgency, isProjects, isRetail, isResidential]);

  // close drawer with esc on mobile too
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {if (e.key === "Escape") setMenuOpen(false);};
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // lock body scroll while either menu is open
  useEffect(() => {
    if (menuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {document.body.style.overflow = prev;};
    }
  }, [menuOpen]);

  // Hide the header once the footer scrolls into view — direct DOM toggle, no React state.
  useEffect(() => {
    document.body.classList.remove("at-footer");
    const foots = Array.from(document.querySelectorAll("footer.foot, .hz-foot"));
    if (!foots.length) return;
    const ratios = new Map();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => ratios.set(e.target, e.intersectionRatio));
        let max = 0;
        ratios.forEach((v) => {if (v > max) max = v;});
        document.body.classList.toggle("at-footer", max > 0.4);
      },
      { threshold: [0, 0.2, 0.4, 0.7, 1] }
    );
    foots.forEach((f) => io.observe(f));
    return () => {
      io.disconnect();
      document.body.classList.remove("at-footer");
    };
  }, [route.name, route.id, route.brand]);

  // On project + interiors + architecture pages the nav is sticky/fixed (no layout space).
  const isInteriors = route.name === "interiors";
  const isArchitecture = route.name === "architecture";
  const isPortfolioIndex = isInteriors || isProjects;
  useEffect(() => {
    document.body.classList.toggle("project-page", isProject);
    document.body.classList.toggle("interiors-page", isPortfolioIndex);
    document.body.classList.toggle("architecture-page", isArchitecture);
    document.body.classList.toggle("contact-page-active", isContact);
    return () => {
      document.body.classList.remove("project-page");
      document.body.classList.remove("interiors-page");
      document.body.classList.remove("architecture-page");
      document.body.classList.remove("contact-page-active");
    };
  }, [isProject, isPortfolioIndex, isArchitecture, isContact]);

  const showTabBar = isMobile && !isProject && !menuOpen && !searchOpen;
  useEffect(() => {
    document.body.classList.toggle("mobile-tabbar-page", showTabBar);
    return () => document.body.classList.remove("mobile-tabbar-page");
  }, [showTabBar]);

  const visible = window.visibleProjects ? window.visibleProjects() : PROJECTS.filter((p) => p.visible !== false);
  const projectForRoute = route.name === "project" ? visible.find((p) => p.id === route.id || p.slug === route.id) : null;
  const currentBrand = route.brand || (projectForRoute ? (projectForRoute.brandKey || (projectForRoute.brand === "Dinas" ? "dn" : "pg")) : null);
  const menuProject = projectForRoute || visible.find((p) => p.featured) || visible[0];
  const menuImages = site.menuImages || {};
  const menuImageSrc = menuImages[menuPreviewKey] || (menuProject && menuProject.hero) || "";
  const menuPreviewLabel = menuPreviewKey === "projects" ? t("projects") : menuPreviewKey === "agency" ? t("agency") : menuPreviewKey === "contact" ? t("contact") : t("home");

  // Project pages always keep the back control in the header. The centred
  // wordmark changes to the project name only after the hero has scrolled.
  const showProjectBar = isProject && projectForRoute;
  const showProjectTitle = showProjectBar && pastHero;
  // A project opened from a deep link has no referrer — the index is the useful
  // way out, and on phones it is the only one.
  const backRoute = route.from || { name: "projects" };
  const backLabel = backRoute.name === "interiors" ? t("retail")
    : backRoute.name === "architecture" ? t("residential")
    : backRoute.name === "agency" ? t("agency")
    : backRoute.name === "home" ? t("home")
    : t("projects");
  useEffect(() => {
    document.body.classList.toggle("project-bar-active", !!showProjectBar);
    return () => document.body.classList.remove("project-bar-active");
  }, [showProjectBar]);

  // filters and sort order are independent — changing one keeps the other
  const keepSort = (r) => (route.sort ? { ...r, sort: route.sort } : r);
  const goToProjectsContact = () => {
    setMenuOpen(false);
    if (!isMobile) {
      go({ name: "contact" });
      return;
    }
    const target = route.name === "projects"
      ? {
          name: "projects",
          ...(route.type ? { type: route.type } : {}),
          ...(route.brand ? { brand: route.brand } : {}),
          ...(route.sort ? { sort: route.sort } : {}),
        }
      : { name: "projects" };
    go(target, {
      scrollTo: ".projects-contact-parallax",
      overlayScroll: true,
    });
  };

  return (
    <React.Fragment>
      <nav className={`nav ${homeTop ? "home-top" : ""} ${isHome && isMobile && atTop ? "mobile-home-top" : ""} ${showProjectBar ? "nav-project-bar" : ""}`} aria-label="Primary">
        {showProjectBar ? (
          <button className="nav-back" onClick={() => go(backRoute, { restoreScroll: true })}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 2L4 7l5 5" />
            </svg>
            <span>{backLabel}</span>
          </button>
        ) : (
          <div className="nav-logo" onClick={() => go({ name: "home" })} role="button" aria-label="Project58 home">
            <img src="assets/logo-black.svg" alt="Project58" style={{ objectFit: "contain" }} />
          </div>
        )}

        <div className="nav-center">
          {showProjectBar ? (
            showProjectTitle
              ? <span className="nav-project-title">{pick(projectForRoute, "name")}</span>
              : (
                <button className="nav-project-home" onClick={() => go({ name: "home" })} aria-label="Project58 home">
                  <img className="nav-project-logo" src="assets/logo-black.svg" alt="Project58" />
                </button>
              )
          ) : (
            <button
              className={`nav-link ${isProjects || isRetail || isResidential ? "active" : ""}`}
              onClick={() => go({ name: "projects" })}>
              {t("projects")}
            </button>
          )}
        </div>

        <div className="nav-right">
          <button className="nav-icon" aria-label="Search" onClick={() => setSearchOpen(true)}>
            <SearchIcon />
          </button>

          {/* burger lives on desktop only — on mobile the tab bar's MORE opens the drawer */}
          {!isMobile ? (
          <div className="nav-menu-wrap" ref={menuRef}>
            <button
              className={`nav-icon ${menuOpen ? "on" : ""}`}
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}>
              <SandwichIcon open={menuOpen} />
            </button>
            {menuOpen && !isMobile ?
            <div className="nav-menu-pop" role="menu">
              <div className="nav-menu-links">
                <button
                className={`nav-menu-item ${isHome ? "on" : ""}`}
                role="menuitem"
                onMouseEnter={() => setMenuPreviewKey("home")}
                onFocus={() => setMenuPreviewKey("home")}
                onClick={() => {setMenuOpen(false);go({ name: "home" });}}>
                  <span>{t("home")}</span><span className="ar">→</span>
                </button>
                <button
                className={`nav-menu-item ${isProjects || isRetail || isResidential ? "on" : ""}`}
                role="menuitem"
                onMouseEnter={() => setMenuPreviewKey("projects")}
                onFocus={() => setMenuPreviewKey("projects")}
                onClick={() => {setMenuOpen(false);go({ name: "projects" });}}>
                  <span>{t("projects")}</span><span className="ar">→</span>
                </button>
                <button
                className={`nav-menu-item ${isAgency ? "on" : ""}`}
                role="menuitem"
                onMouseEnter={() => setMenuPreviewKey("agency")}
                onFocus={() => setMenuPreviewKey("agency")}
                onClick={() => {setMenuOpen(false);go({ name: "agency" });}}>
                  <span>{t("agency")}</span><span className="ar">↗</span>
                </button>
                <button
                className={`nav-menu-item ${isContact ? "on" : ""}`}
                role="menuitem"
                onMouseEnter={() => setMenuPreviewKey("contact")}
                onFocus={() => setMenuPreviewKey("contact")}
                onClick={goToProjectsContact}>
                  <span>{t("contact")}</span><span className="ar">↗</span>
                </button>
                <button
                  className="nav-menu-language"
                  aria-label={`Switch language to ${lang === "en" ? "Greek" : "English"}`}
                  onClick={() => setLang(lang === "en" ? "gr" : "en")}>
                  <span className={lang === "en" ? "on" : ""}>EN</span>
                  <i>/</i>
                  <span className={lang === "gr" ? "on" : ""}>GR</span>
                </button>
              </div>
              {menuImageSrc ? (
                <div className="nav-menu-visual">
                  <img key={`${menuPreviewKey}-${menuImageSrc}`} src={menuImageSrc} alt="" />
                  <span>{menuPreviewLabel}</span>
                </div>
              ) : null}
              </div> :
            null}
          </div>
          ) : null}
        </div>

        {/* Filter row — lives inside nav so both share one backdrop-filter */}
        {isInteriors ? (() => {
          const activeBrand = route.brand;
          return (
            <div className="nav-filter-row">
              <div className="interiors-filter">
                <button className={`filter-btn ${!activeBrand ? "on" : ""}`} onClick={() => go(keepSort({ name: "interiors" }))}>{t("all")}</button>
                <button className={`filter-btn ${activeBrand === "pg" ? "on" : ""}`} onClick={() => go(keepSort({ name: "interiors", brand: "pg" }))}>Protein Garden</button>
                <button className={`filter-btn ${activeBrand === "dn" ? "on" : ""}`} onClick={() => go(keepSort({ name: "interiors", brand: "dn" }))}>Dinas</button>
              </div>
              <ProjectSort route={route} go={go} />
            </div>
          );
        })() : null}
        {isArchitecture ? (
          <div className="nav-filter-row">
            <div className="interiors-filter">
              <button className="filter-btn on" onClick={() => go(keepSort({ name: "architecture" }))}>{t("all")}</button>
            </div>
            <ProjectSort route={route} go={go} />
          </div>
        ) : null}
        {isProjects ? (() => {
          const activeType = route.type;
          const activeBrand = activeType === "retail" && (route.brand === "pg" || route.brand === "dn") ? route.brand : null;
          return (
            <div className="nav-filter-row">
              <div className="project-filter-groups">
                <div className="interiors-filter">
                  <button className={`filter-btn ${!activeType ? "on" : ""}`} onClick={() => go(keepSort({ name: "projects" }))}>{t("all")}</button>
                  <button className={`filter-btn ${activeType === "retail" ? "on" : ""}`} onClick={() => go(keepSort({ name: "projects", type: "retail" }))}>{t("retail")}</button>
                  <button className={`filter-btn ${activeType === "residential" ? "on" : ""}`} onClick={() => go(keepSort({ name: "projects", type: "residential" }))}>{t("residential")}</button>
                </div>
                {activeType === "retail" ? (
                  <div className="interiors-filter brand-filter">
                    <button className={`filter-btn ${!activeBrand ? "on" : ""}`} onClick={() => go(keepSort({ name: "projects", type: "retail" }))}>{t("all_brands")}</button>
                    <button className={`filter-btn ${activeBrand === "pg" ? "on" : ""}`} onClick={() => go(keepSort({ name: "projects", type: "retail", brand: "pg" }))}>Protein Garden</button>
                    <button className={`filter-btn ${activeBrand === "dn" ? "on" : ""}`} onClick={() => go(keepSort({ name: "projects", type: "retail", brand: "dn" }))}>Dinas</button>
                  </div>
                ) : null}
              </div>
              <ProjectSort route={route} go={go} />
            </div>
          );
        })() : null}
      </nav>

      {/* mobile fullscreen drawer */}
      {menuOpen && isMobile ?
      <div className="mobile-drawer" role="dialog" aria-label="Menu">
          <button className="close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </svg>
          </button>
          <div className="mobile-drawer-eyebrow">{t("menu_eyebrow")}</div>
          <button
          className={`mobile-drawer-link ${isProjects || isRetail || isResidential ? "on" : ""}`}
          onClick={() => {setMenuOpen(false);go({ name: "projects" });}}>
            <span>{t("projects")}</span><span className="ar">→</span>
          </button>
          <button
          className={`mobile-drawer-link ${isAgency ? "on" : ""}`}
          onClick={() => {setMenuOpen(false);go({ name: "agency" });}}>
            <span>{t("agency")}</span><span className="ar">→</span>
          </button>
          <button
          className={`mobile-drawer-link ${isContact ? "on" : ""}`}
          onClick={goToProjectsContact}>
            <span>{t("contact")}</span><span className="ar">↗</span>
          </button>
          <div className="mobile-drawer-footer">
            <span>{t("studio_location")}</span>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <window.LangToggle compact />
              <span>v1.0</span>
            </div>
          </div>
        </div> :
      null}

      {/* brand filter moved into InteriorsPage, below the title */}

      {searchOpen ? <SearchOverlay go={go} onClose={() => setSearchOpen(false)} /> : null}

      {showTabBar ? <MobileTabBar route={route} go={go} onMore={() => setMenuOpen(true)} introHidden={isHome && atTop} /> : null}
    </React.Fragment>);

}

/* ============ Sort control for the projects index ============ */
function ProjectSort({ route, go }) {
  const t = window.useT();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const orders = window.PROJECT_SORTS || {};
  const active = orders[route.sort] ? route.sort : window.PROJECT_SORT_DEFAULT;

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // stay on whichever index we are on — only the order changes
  const choose = (key) => {
    setOpen(false);
    go({
      name: route.name,
      ...(route.type ? { type: route.type } : {}),
      ...(route.brand ? { brand: route.brand } : {}),
      ...(key === window.PROJECT_SORT_DEFAULT ? {} : { sort: key }),
    });
  };

  return (
    <div className="sort-wrap" ref={wrapRef}>
      <button
        className={`sort-btn ${open ? "on" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}>
        <SortIcon />
        <span>{t("sort")}</span>
      </button>
      {open ? (
        <div className="sort-menu" role="listbox" aria-label={t("sort")}>
          {Object.keys(orders).map((key) => (
            <button
              key={key}
              className={`sort-option ${key === active ? "on" : ""}`}
              role="option"
              aria-selected={key === active}
              onClick={() => choose(key)}>
              <span>{t(orders[key].label)}</span>
              <i aria-hidden="true">✓</i>
            </button>
          ))}
        </div>
      ) : null}
    </div>);
}

function SortIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <line x1="2" y1="4" x2="12" y2="4" />
      <line x1="3.5" y1="7" x2="10.5" y2="7" />
      <line x1="5.5" y1="10" x2="8.5" y2="10" />
    </svg>);
}

/* ============ Spotlight-style search ============ */
function SearchOverlay({ go, onClose }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const t = window.useT();
  const pick = window.usePick();

  useEffect(() => {inputRef.current && inputRef.current.focus();}, []);

  // The project array is mutated in place when dashboard content arrives, so
  // memoising by language alone leaves hidden projects in an open search.
  const all = (() => {
    const sourceProjects = window.visibleProjects ? window.visibleProjects() : (window.PROJECTS || []).filter((p) => p.visible !== false);
    const newestFirst = (a, b) =>
      (Number(b.year) || 0) - (Number(a.year) || 0) ||
      String(b.code || "").localeCompare(String(a.code || ""), undefined, { numeric: true });
    const projects = sourceProjects.slice().sort(newestFirst).map((p) => ({
      kind: "project",
      label: pick(p, "name"),
      sub: `${p.brand} · ${pick(p, "location")} · ${p.year}`,
      code: p.code,
      onPick: () => go({ name: "project", id: p.slug || p.id })
    }));
    const countType = (type) => sourceProjects.filter((p) => {
      const category = (p.category || p.typology || "retail").toLowerCase();
      return type === "residential"
        ? category === "residential" || category === "architecture"
        : category === "retail";
    }).length;
    const types = [
      { kind: "type", label: t("retail"), sub: `${countType("retail")} ${t("proj_word")}`, onPick: () => go({ name: "projects", type: "retail" }) },
      { kind: "type", label: t("residential"), sub: `${countType("residential")} ${t("proj_word")}`, onPick: () => go({ name: "projects", type: "residential" }) }
    ];

    return [...types, ...projects];
  })();

  const filtered = React.useMemo(() => {
    if (!q.trim()) return all.slice(0, 8);
    const needle = q.toLowerCase();
    return all.filter((r) =>
    r.label.toLowerCase().includes(needle) ||
    r.sub && r.sub.toLowerCase().includes(needle) ||
    r.code && r.code.toLowerCase().includes(needle)
    ).slice(0, 12);
  }, [q, all]);

  useEffect(() => {setActive(0);}, [q]);

  const pickResult = (r) => {r && r.onPick && r.onPick();onClose();};

  const onKey = (e) => {
    if (e.key === "Escape") onClose();else
    if (e.key === "ArrowDown") {e.preventDefault();setActive((i) => Math.min(filtered.length - 1, i + 1));} else
    if (e.key === "ArrowUp") {e.preventDefault();setActive((i) => Math.max(0, i - 1));} else
    if (e.key === "Enter") {e.preventDefault();pickResult(filtered[active]);}
  };

  const groups = filtered.reduce((acc, r) => {
    (acc[r.kind] = acc[r.kind] || []).push(r);return acc;
  }, {});
  const groupOrder = ["type", "project"];
  const groupTitles = { type: t("project_types"), project: t("projects") };

  // build flat index → group/row mapping for highlight
  let flatIdx = -1;

  return (
    <div className="spot-wrap" onMouseDown={(e) => {if (e.target === e.currentTarget) onClose();}}>
      <div className="spot" onKeyDown={onKey}>
        <div className="spot-input">
          <SearchIcon big />
          <input
            ref={inputRef}
            placeholder={t("search_placeholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey} />
          
          <span className="spot-esc" onClick={onClose}>esc</span>
        </div>

        <div className="spot-results">
          {filtered.length === 0 ?
          <div className="spot-empty">{t("no_results")} "<em>{q}</em>"</div> :

          groupOrder.map((g) => groups[g] && groups[g].length ?
          <div key={g} className="spot-group">
                <div className="spot-group-title">{groupTitles[g]}</div>
                {groups[g].map((r) => {
              flatIdx += 1;
              const idx = flatIdx;
              return (
                <div
                  key={g + idx}
                  className={`spot-row ${idx === active ? "on" : ""}`}
                  onMouseEnter={() => setActive(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickResult(r)}>
                      <div className="spot-row-icon"><KindIcon kind={r.kind} /></div>
                      <div className="spot-row-text">
                        <div className="spot-row-label">{r.label}</div>
                        <div className="spot-row-sub">{r.sub}</div>
                      </div>
                      <div className="spot-row-meta">
                        {r.code ? <span className="mono">{r.code}</span> : null}
                        <span className="ret">↵</span>
                      </div>
                    </div>);

            })}
              </div> :
          null)
          }
        </div>

        <div className="spot-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> {t("nav")}</span>
          <span><kbd>↵</kbd> {t("open_kbd")}</span>
          <span><kbd>esc</kbd> {t("close_kbd")}</span>
        </div>
      </div>
    </div>);

}

function SearchIcon({ big }) {
  const s = big ? 22 : 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ height: "30px", width: "30px", fill: "none" }}>
      <circle cx="11" cy="11" r="7"></circle>
      <line x1="20" y1="20" x2="16.5" y2="16.5"></line>
    </svg>);

}
function SandwichIcon({ open }) {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="2" y1={open ? "7" : "3"} x2={open ? "16" : "16"} y2={open ? "7" : "3"} />
      <line x1="2" y1="7" x2="16" y2="7" style={{ opacity: open ? 0 : 1, transition: "opacity 160ms" }} />
      <line x1="2" y1={open ? "7" : "11"} x2={open ? "16" : "12"} y2={open ? "7" : "11"} />
    </svg>);

}
function TabHomeIcon({ on }) {
  return on ? (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
      <path d="M11.2 2.3a1.2 1.2 0 0 1 1.6 0l8 7.2c.4.36.2 1-.3 1-.5 0-.5.4-.5.9V20a1 1 0 0 1-1 1h-4.5a.5.5 0 0 1-.5-.5V15a1.5 1.5 0 0 0-1.5-1.5h-1A1.5 1.5 0 0 0 10 15v5.5a.5.5 0 0 1-.5.5H5a1 1 0 0 1-1-1v-8.6c0-.5 0-.9-.5-.9-.5 0-.7-.64-.3-1z" />
    </svg>
  ) : (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11.3 12 4l8 7.3" />
      <path d="M5.5 9.8V20h13V9.8" />
      <path d="M10 20v-5.5h4V20" />
    </svg>
  );
}
function TabProjectsIcon({ on }) {
  return on ? (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
    </svg>
  ) : (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
    </svg>
  );
}
function TabPeopleIcon({ on }) {
  return on ? (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="7.8" r="3.8" />
      <path d="M4.2 20.5c.9-4 3.9-6.2 7.8-6.2s6.9 2.2 7.8 6.2c.1.5-.3.9-.8.9H5c-.5 0-.9-.4-.8-.9z" />
    </svg>
  ) : (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7.8" r="3.8" />
      <path d="M4.5 20.3c.8-3.9 3.8-6 7.5-6s6.7 2.1 7.5 6" />
    </svg>
  );
}

function TabMoreIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function MobileTabBar({ route, go, onMore, introHidden = false }) {
  const t = window.useT();
  const { lang, setLang } = window.useLang();
  const isHome = route.name === "home";
  const isProjects = route.name === "projects" || route.name === "interiors" || route.name === "architecture";
  return (
    <nav
      className={`mobile-tab-bar ${introHidden ? "mobile-tab-bar--intro-hidden" : ""}`}
      aria-label="Mobile primary"
      aria-hidden={introHidden ? "true" : undefined}
      inert={introHidden ? true : undefined}>
      <button
        className={`mobile-tab ${isHome ? "on" : ""}`}
        type="button"
        aria-label={t("home")}
        aria-current={isHome ? "page" : undefined}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          go({ name: "home" });
        }}>
        <TabHomeIcon on={isHome} />
        <span>{t("home")}</span>
      </button>
      <button
        className="mobile-tab mobile-tab-language"
        type="button"
        aria-label={`Language: ${lang === "en" ? "English" : "Greek"}. Switch to ${lang === "en" ? "Greek" : "English"}`}
        onClick={() => setLang(lang === "en" ? "gr" : "en")}>
        <span className="mobile-language-value" aria-hidden="true">
          <b className={lang === "en" ? "on" : ""}>EN</b>
          <i>/</i>
          <b className={lang === "gr" ? "on" : ""}>GR</b>
        </span>
        <span>Language</span>
      </button>
      <button className={`mobile-tab ${isProjects ? "on" : ""}`} aria-label={t("projects")} aria-current={isProjects ? "page" : undefined} onClick={() => go({ name: "projects" })}>
        <TabProjectsIcon on={isProjects} />
        <span>{t("projects")}</span>
      </button>
      <button className="mobile-tab" aria-label={t("more")} aria-haspopup="dialog" onClick={onMore}>
        <TabMoreIcon />
        <span>{t("more")}</span>
      </button>
    </nav>);
}

function KindIcon({ kind }) {
  if (kind === "project") return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="1.5" width="11" height="11" />
      <line x1="1.5" y1="5" x2="12.5" y2="5" />
    </svg>);

  if (kind === "brand") return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="7" cy="7" r="5.5" />
      <circle cx="7" cy="7" r="1.6" fill="currentColor" />
    </svg>);

  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
      <line x1="2" y1="3.5" x2="12" y2="3.5" />
      <line x1="2" y1="7" x2="12" y2="7" />
      <line x1="2" y1="10.5" x2="9" y2="10.5" />
    </svg>);

}

/* Read dashboard-editable site settings from the same store the dashboard writes to.
   Falls back to sensible defaults so the footer always renders. */
function useSiteSettings() {
  const [site, setSite] = useState(() => {
    const raw = window.readP58Store ? window.readP58Store() : null;
    if (raw && raw.site) return window.normaliseSiteSettings ? window.normaliseSiteSettings(raw.site) : raw.site;
    return null;
  });
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== "p58_data_v1") return;
      try {
        const raw = JSON.parse(e.newValue || "null");
        setSite(raw && raw.site ? (window.normaliseSiteSettings ? window.normaliseSiteSettings(raw.site) : raw.site) : null);
      } catch (err) {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return window.normaliseSiteSettings ? window.normaliseSiteSettings(site || window.DEFAULT_SITE_SETTINGS || {}) : site || {};
}

function ContactItem({ href, children }) {
  if (!children) return null;
  if (!href) return <span>{children}</span>;
  const external = /^https?:\/\//i.test(href);
  return (
    <a href={href} target={external ? "_blank" : null} rel={external ? "noopener noreferrer" : null}>
      {children}
    </a>
  );
}

function Footer({ go }) {
  const t = window.useT();
  const { lang } = window.useLang();
  const site = useSiteSettings();
  const contact = site.contact || {};
  const siteCopy = (key) => site.websiteTexts?.[lang]?.[key] || site[key] || t(key);
  return (
    <footer className="foot">
      <div className="foot-top foot-top-2col" style={{ padding: "0px", textAlign: "left" }}>
        <div className="foot-big">
          <img src="assets/logo-black.svg" alt="Project58" className="foot-logo" style={{ height: 28, marginBottom: 24, display: "block", filter: "invert(1)" }} />
          {siteCopy("foot_big")} <em style={{ fontSize: "clamp(48px, 7vw, 90px)" }}>{siteCopy("foot_big_em")}</em>
          <div className="foot-cta foot-cta-center">
            <button className="foot-start-btn" onClick={() => go({ name: "start" })}>Let’s meet!<span className="ar">→</span></button>
          </div>
        </div>
        <div className="foot-col foot-col-split">
          <div>
            <h4>{contact.location_label}</h4>
            <p><ContactItem href={contact.address_url}>{contact.address}</ContactItem></p>
            <p style={{ marginTop: 8 }}><ContactItem href={contact.phone_url}>{contact.phone}</ContactItem></p>
          </div>
          <div className="foot-col-b">
            <p><ContactItem href={contact.email_url}>{contact.email}</ContactItem></p>
            <p style={{ marginTop: 14 }}><ContactItem href={contact.instagram_url}>{contact.instagram_text}</ContactItem></p>
          </div>
        </div>
      </div>
      <div className="foot-bot foot-bot-2">
        <span>{siteCopy("foot_copy_left")}</span>
        <span className="right">{siteCopy("foot_copy_right")}</span>
      </div>
    </footer>);

}

/* ===== Contact page — same content/design as the footer, as its own destination ===== */
function ContactPage({ go }) {
  const t = window.useT();
  const { lang } = window.useLang();
  const site = useSiteSettings();
  const contact = site.contact || {};
  const siteCopy = (key) => site.websiteTexts?.[lang]?.[key] || site[key] || t(key);
  return (
    <div className="contact-page page-enter">
      <div className="foot-top foot-top-2col" style={{ padding: "0px", textAlign: "left" }}>
        <div className="foot-big">
          {siteCopy("foot_big")} <em style={{ fontSize: "clamp(48px, 7vw, 90px)" }}>{siteCopy("foot_big_em")}</em>
          <div className="foot-cta foot-cta-center">
            <button className="foot-start-btn" onClick={() => go({ name: "start" })}>Let’s meet!<span className="ar">→</span></button>
          </div>
        </div>
        <div className="foot-col foot-col-split">
          <div>
            <h4>{contact.location_label}</h4>
            <p><ContactItem href={contact.address_url}>{contact.address}</ContactItem></p>
            <p style={{ marginTop: 8 }}><ContactItem href={contact.phone_url}>{contact.phone}</ContactItem></p>
          </div>
          <div className="foot-col-b">
            <p><ContactItem href={contact.email_url}>{contact.email}</ContactItem></p>
            <p style={{ marginTop: 14 }}><ContactItem href={contact.instagram_url}>{contact.instagram_text}</ContactItem></p>
          </div>
        </div>
      </div>
      <div className="foot-bot foot-bot-2">
        <span>{siteCopy("foot_copy_left")}</span>
        <span className="right">{siteCopy("foot_copy_right")}</span>
      </div>
    </div>);

}

/* ===== Project inquiry form ===== */
const INQUIRY_STORE_KEY = "p58_inquiries_v1";

function saveInquiry(inquiry) {
  try {
    const list = JSON.parse(localStorage.getItem(INQUIRY_STORE_KEY) || "[]");
    list.unshift(inquiry);
    localStorage.setItem(INQUIRY_STORE_KEY, JSON.stringify(list));
    return true;
  } catch (e) { return false; }
}

async function notifyInquiry(inquiry) {
  const cfg = window.P58_EMAILJS || {};
  if (window.emailjs && cfg.publicKey && cfg.serviceId && cfg.templateId) {
    try {
      await window.emailjs.send(cfg.serviceId, cfg.templateId, {
        to_email: cfg.toEmail || "g.grigoriadis@project58.gr",
        from_name: inquiry.name,
        reply_to: inquiry.email,
        subject: `New project inquiry — ${inquiry.type || "General"}`,
        project_type: inquiry.type,
        location: inquiry.location,
        size: inquiry.size,
        timeline: inquiry.timeline,
        budget: inquiry.budget,
        message: inquiry.message,
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        company: inquiry.company,
        custom_answers: Object.entries(inquiry.answers || {}).map(([key, value]) => `${(inquiry.questionLabels || {})[key] || key}: ${value}`).join("\n"),
        submitted_at: new Date(inquiry.createdAt).toLocaleString(),
      }, { publicKey: cfg.publicKey });
      return "sent";
    } catch (e) { console.warn("EmailJS send failed:", e); return "error"; }
  }
  return "skipped";
}

function StartProjectPage({ go }) {
  const t = window.useT();
  const { lang } = window.useLang();
  const site = useSiteSettings();
  const inquiryForm = window.normaliseInquiryForm
    ? window.normaliseInquiryForm(site.inquiryForm)
    : (site.inquiryForm || window.DEFAULT_INQUIRY_FORM || { questions: [] });
  const questions = inquiryForm.questions || [];
  const groupDefinitions = inquiryForm.groups || window.INQUIRY_FORM_GROUPS || [
    { id: "planning", title: "What are you planning?" },
    { id: "space", title: "About the space" },
    { id: "details", title: "A few details" },
    { id: "contact", title: "How can we reach you?" },
  ];
  const phone = (site && site.contact && site.contact.phone) || "";
  const phoneUrl = (site && site.contact && site.contact.phone_url) || (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "");
  const [step, setStep] = useState(0);
  const [intro, setIntro] = useState(true);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [f, setF] = useState(() => Object.fromEntries(questions.map((question) => [question.id, ""])));
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const onClose = () => go({ name: "contact" });
  const localText = (item, field) => lang === "gr" ? (item[`${field}_gr`] || item[field] || "") : (item[field] || "");

  useEffect(() => {
    setF((current) => ({ ...Object.fromEntries(questions.map((question) => [question.id, ""])), ...current }));
  }, [JSON.stringify(questions.map((question) => question.id))]);

  const questionValid = (question) => {
    const value = String(f[question.id] || "").trim();
    if (question.required && !value) return false;
    if (question.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return false;
    return true;
  };
  const steps = groupDefinitions
    .map((group) => ({ ...group, title: localText(group, "title"), questions: questions.filter((question) => question.group === group.id) }))
    .filter((group) => group.questions.length)
    .map((group) => ({ ...group, valid: group.questions.every(questionValid) }));
  const last = steps.length - 1;
  const activeStep = steps[Math.min(step, Math.max(last, 0))];
  const canNext = activeStep ? activeStep.valid : false;

  const submit = async () => {
    if (sending) return;
    setSending(true);
    const inquiry = {
      id: "inq-" + Date.now().toString(36), createdAt: Date.now(), status: "new", ...f,
      answers: Object.fromEntries(questions.map((question) => [question.id, f[question.id] || ""])),
      questionLabels: Object.fromEntries(questions.map((question) => [question.id, localText(question, "label")])),
    };
    saveInquiry(inquiry);
    await notifyInquiry(inquiry);
    setSending(false);
    setDone(true);
  };

  const renderQuestion = (question) => {
    const value = f[question.id] || "";
    const questionLabel = localText(question, "label");
    const questionPlaceholder = localText(question, "placeholder");
    const questionOptions = lang === "gr" ? (question.options_gr || question.options || []) : (question.options || []);
    const label = <span className="inquiry-question-label">{questionLabel}{question.required ? <b> *</b> : null}</span>;
    if (question.type === "buttons") {
      return (
        <div className="inquiry-question" key={question.id}>
          {label}
          <div className="inquiry-types">
            {questionOptions.map((option) => <button type="button" key={option} className={`inquiry-type ${value === option ? "on" : ""}`} onClick={() => set(question.id, option)}>{option}</button>)}
          </div>
        </div>
      );
    }
    if (question.type === "select") {
      return <label key={question.id}>{label}<select value={value} required={question.required} onChange={(event) => set(question.id, event.target.value)}><option value="">{lang === "gr" ? "Επιλέξτε…" : "Select…"}</option>{questionOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
    }
    if (question.type === "textarea") {
      return <label key={question.id}>{label}<textarea rows="4" value={value} required={question.required} onChange={(event) => set(question.id, event.target.value)} placeholder={questionPlaceholder} /></label>;
    }
    return <label key={question.id}>{label}<input type={question.type === "email" ? "email" : question.type === "tel" ? "tel" : "text"} value={value} required={question.required} onChange={(event) => set(question.id, event.target.value)} placeholder={questionPlaceholder} /></label>;
  };

  const body = done ? (
    <div className="inquiry-done">
      <div className="inquiry-done-mark">✓</div>
      <h2>Thank you — we’ve got your details.</h2>
      <p>We’ll review your project and get back to you by email within two business days.</p>
      {phone ? (
        <p className="inquiry-call">Prefer to talk now? Call us at <a href={phoneUrl}>{phone}</a>.</p>
      ) : null}
      <button className="inquiry-btn primary" onClick={onClose}>Close</button>
    </div>
  ) : intro ? (
    <div className="inquiry-intro">
      <div className="inquiry-step-kind">{t("inquiry_intro_kicker")}</div>
      <h2 className="inquiry-title">{t("inquiry_intro_title")}</h2>
      <p className="inquiry-intro-body">{t("inquiry_intro_body")}</p>
      <div className="inquiry-nav">
        <span />
        <button className="inquiry-btn primary" onClick={() => setIntro(false)}>{t("inquiry_intro_cta")}</button>
      </div>
    </div>
  ) : (
    <React.Fragment>
      <div className="inquiry-progress">
        {steps.map((s, i) => <span key={i} className={`inquiry-dot ${i === step ? "on" : ""} ${i < step ? "done" : ""}`} />)}
      </div>
      <div className="inquiry-step-kind">Step {step + 1} of {steps.length}</div>
      <h2 className="inquiry-title">{activeStep ? activeStep.title : "Project inquiry"}</h2>
      <div className="inquiry-fields inquiry-dynamic-fields">{activeStep ? activeStep.questions.map(renderQuestion) : <p>This form has no questions yet.</p>}</div>

      <div className="inquiry-nav">
        <button className="inquiry-btn ghost" onClick={() => (step > 0 ? setStep(step - 1) : setIntro(true))}>Back</button>
        {step < last
          ? <button className="inquiry-btn primary" onClick={() => canNext && setStep(step + 1)} disabled={!canNext}>Continue</button>
          : <button className="inquiry-btn primary" onClick={submit} disabled={!canNext || sending}>{sending ? "Sending…" : "Send inquiry"}</button>}
      </div>
    </React.Fragment>
  );

  return (
    <div className="start-page page-enter">
      <div className="inquiry-card">
        <button className="inquiry-close" aria-label="Back to contact" onClick={onClose}>×</button>
        {body}
      </div>
    </div>
  );
}

Object.assign(window, { Nav, Footer, StartProjectPage, ContactPage, ProjectSort });
