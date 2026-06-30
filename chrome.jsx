/* ===== chrome.jsx — Nav + Footer =====
   - Compact wordmark logo (uses logo-black.svg now — no black bounding box).
   - Center nav now reads RETAIL / RESIDENTIAL. RETAIL reveals a horizontal
     brand strip (Protein Garden, Dinas) underneath.
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
  const [projectNavVisible, setProjectNavVisible] = useState(false);
  const [menuPreviewKey, setMenuPreviewKey] = useState("home");
  const menuRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const isProject = route.name === "project";

  // scroll detection — home: track atTop; project: show nav only while scrolling;
  // other vertical pages: hide on scroll down, show on scroll up
  useEffect(() => {
    const isVertical = !isHome && !isProject;
    if (isProject) {
      // Nav always visible on project pages (split layout)
      setProjectNavVisible(true);
      return;
    }
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

  const projectForRoute = route.name === "project" ? PROJECTS.find((p) => p.id === route.id || p.slug === route.id) : null;
  const currentBrand = route.brand || (projectForRoute ? (projectForRoute.brandKey || (projectForRoute.brand === "Dinas" ? "dn" : "pg")) : null);
  const menuProject = projectForRoute || PROJECTS.find((p) => p.featured) || PROJECTS[0];
  const menuImages = site.menuImages || {};
  const menuImageSrc = menuImages[menuPreviewKey] || (menuProject && menuProject.hero) || "";
  const menuPreviewLabel = menuPreviewKey === "projects" ? t("projects") : menuPreviewKey === "agency" ? t("agency") : menuPreviewKey === "contact" ? t("contact") : t("home");

  return (
    <React.Fragment>
      <nav className={`nav ${homeTop ? "home-top" : ""} ${isHome && isMobile && atTop ? "mobile-home-top" : ""} ${isProject && !projectNavVisible ? "nav-hidden" : ""}`} aria-label="Primary">
        <div className="nav-logo" onClick={() => go({ name: "home" })} role="button" aria-label="Project58 home">
          <img src="assets/logo-black.svg" alt="Project58" style={{ objectFit: "contain" }} />
        </div>

        <div className="nav-center">
          <button
            className={`nav-link ${isRetail ? "active" : ""}`}
            onClick={() => go({ name: "interiors" })}>
            {t("retail")}
          </button>
          <button
            className={`nav-link ${isResidential ? "active" : ""}`}
            onClick={() => go({ name: "architecture" })}>
            {t("residential")}
          </button>
        </div>

        <div className="nav-right">
          <button className="nav-icon" aria-label="Search" onClick={() => setSearchOpen(true)}>
            <SearchIcon />
          </button>

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
                onClick={() => {setMenuOpen(false);go({ name: "contact" });}}>
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
        </div>

        {/* Filter row — lives inside nav so both share one backdrop-filter */}
        {isInteriors ? (() => {
          const allProjects = window.PROJECTS || [];
          const activeBrand = route.brand;
          const count = activeBrand
            ? allProjects.filter(p => (p.brandKey || (p.brand === "Dinas" ? "dn" : "pg")) === activeBrand).length
            : allProjects.length;
          return (
            <div className="nav-filter-row">
              <div className="interiors-filter">
                <button className={`filter-btn ${!activeBrand ? "on" : ""}`} onClick={() => go({ name: "interiors" })}>{t("all")}</button>
                <button className={`filter-btn ${activeBrand === "pg" ? "on" : ""}`} onClick={() => go({ name: "interiors", brand: "pg" })}>Protein Garden</button>
                <button className={`filter-btn ${activeBrand === "dn" ? "on" : ""}`} onClick={() => go({ name: "interiors", brand: "dn" })}>Dinas</button>
              </div>
              <div className="meta"><b>{count}</b> {t("proj_word")}</div>
            </div>
          );
        })() : null}
        {isArchitecture ? (() => {
          const archProjects = (window.PROJECTS || []).filter(p => {
            const cat = (p.typology || p.category || "retail").toLowerCase();
            return cat === "residential" || cat === "architecture";
          });
          const count = archProjects.length;
          return (
            <div className="nav-filter-row">
              <div className="interiors-filter">
                <button className="filter-btn on" onClick={() => go({ name: "architecture" })}>{t("all")}</button>
              </div>
              <div className="meta"><b>{count}</b> {t("proj_word")}</div>
            </div>
          );
        })() : null}
        {isProjects ? (() => {
          const activeType = route.type;
          const activeBrand = activeType === "retail" && (route.brand === "pg" || route.brand === "dn") ? route.brand : null;
          const projects = window.PROJECTS || [];
          const visible = projects.filter((p) => {
            if (!activeType) return true;
            const category = (p.category || p.typology || "retail").toLowerCase();
            const matchesType = activeType === "residential"
              ? category === "residential" || category === "architecture"
              : category === "retail";
            if (!matchesType || !activeBrand) return matchesType;
            return (p.brandKey || (p.brand === "Dinas" ? "dn" : "pg")) === activeBrand;
          });
          return (
            <div className="nav-filter-row">
              <div className="project-filter-groups">
                <div className="interiors-filter">
                  <button className={`filter-btn ${!activeType ? "on" : ""}`} onClick={() => go({ name: "projects" })}>{t("all")}</button>
                  <button className={`filter-btn ${activeType === "retail" ? "on" : ""}`} onClick={() => go({ name: "projects", type: "retail" })}>{t("retail")}</button>
                  <button className={`filter-btn ${activeType === "residential" ? "on" : ""}`} onClick={() => go({ name: "projects", type: "residential" })}>{t("residential")}</button>
                </div>
                {activeType === "retail" ? (
                  <div className="interiors-filter brand-filter">
                    <button className={`filter-btn ${!activeBrand ? "on" : ""}`} onClick={() => go({ name: "projects", type: "retail" })}>{t("all_brands")}</button>
                    <button className={`filter-btn ${activeBrand === "pg" ? "on" : ""}`} onClick={() => go({ name: "projects", type: "retail", brand: "pg" })}>Protein Garden</button>
                    <button className={`filter-btn ${activeBrand === "dn" ? "on" : ""}`} onClick={() => go({ name: "projects", type: "retail", brand: "dn" })}>Dinas</button>
                  </div>
                ) : null}
              </div>
              <div className="meta"><b>{visible.length}</b> {t("proj_word")}</div>
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
          className={`mobile-drawer-link ${isHome ? "on" : ""}`}
          onClick={() => {setMenuOpen(false);go({ name: "home" });}}>
            <span>{t("home")}</span><span className="ar">→</span>
          </button>
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
          onClick={() => {setMenuOpen(false);go({ name: "contact" });}}>
            <span>{t("contact")}</span><span className="ar">↗</span>
          </button>
          <div className="mobile-drawer-footer">
            <span>{t("two_cities")}</span>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <window.LangToggle compact />
              <span>v1.0</span>
            </div>
          </div>
        </div> :
      null}

      {/* brand filter moved into InteriorsPage, below the title */}

      {searchOpen ? <SearchOverlay go={go} onClose={() => setSearchOpen(false)} /> : null}

      {showTabBar ? <MobileTabBar route={route} go={go} /> : null}
    </React.Fragment>);

}

/* ============ Spotlight-style search ============ */
function SearchOverlay({ go, onClose }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const t = window.useT();
  const pick = window.usePick();

  useEffect(() => {inputRef.current && inputRef.current.focus();}, []);

  const all = React.useMemo(() => {
    const sourceProjects = window.PROJECTS || [];
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
  }, [pick, t]);

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

function MobileTabBar({ route, go }) {
  const t = window.useT();
  const isHome = route.name === "home";
  const isProjects = route.name === "projects" || route.name === "interiors" || route.name === "architecture";
  const isAgency = route.name === "agency";
  return (
    <nav className="mobile-tab-bar" aria-label="Mobile primary">
      <button className={`mobile-tab ${isHome ? "on" : ""}`} aria-label={t("home")} aria-current={isHome ? "page" : undefined} onClick={() => go({ name: "home" })}>
        <TabHomeIcon on={isHome} />
        <span>{t("home")}</span>
      </button>
      <button className={`mobile-tab ${isProjects ? "on" : ""}`} aria-label={t("projects")} aria-current={isProjects ? "page" : undefined} onClick={() => go({ name: "projects" })}>
        <TabProjectsIcon on={isProjects} />
        <span>{t("projects")}</span>
      </button>
      <button className={`mobile-tab ${isAgency ? "on" : ""}`} aria-label={t("agency")} aria-current={isAgency ? "page" : undefined} onClick={() => go({ name: "agency" })}>
        <TabPeopleIcon on={isAgency} />
        <span>{t("agency")}</span>
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
    try {
      const raw = JSON.parse(localStorage.getItem("p58_data_v1") || "null");
      if (raw && raw.site) return window.normaliseSiteSettings ? window.normaliseSiteSettings(raw.site) : raw.site;
    } catch (e) {}
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
  const site = useSiteSettings();
  const contact = site.contact || {};
  return (
    <footer className="foot">
      <div className="foot-top foot-top-2col" style={{ padding: "0px", textAlign: "left" }}>
        <div className="foot-big">
          <img src="assets/logo-black.svg" alt="Project58" className="foot-logo" style={{ height: 28, marginBottom: 24, display: "block", filter: "invert(1)" }} />
          {site.foot_big || t("foot_big")} <em style={{ fontSize: "clamp(48px, 7vw, 90px)" }}>{site.foot_big_em || t("foot_big_em")}</em>
          <div className="foot-cta">
            <button className="foot-start-btn" onClick={() => go({ name: "start" })}>Start a project<span className="ar">→</span></button>
          </div>
        </div>
        <div className="foot-col">
          <h4>{contact.location_label}</h4>
          <p><ContactItem href={contact.address_url}>{contact.address}</ContactItem></p>
          <p style={{ marginTop: 8 }}><ContactItem href={contact.phone_url}>{contact.phone}</ContactItem></p>
          <p style={{ marginTop: 4 }}><ContactItem href={contact.email_url}>{contact.email}</ContactItem></p>
          <p style={{ marginTop: 14 }}><ContactItem href={contact.instagram_url}>{contact.instagram_text}</ContactItem></p>
        </div>
      </div>
      <div className="foot-bot">
        <span>{site.foot_copy_left || t("foot_copy_left")}</span>
        <span className="center">{site.foot_copy_mid || t("foot_copy_mid")}</span>
        <span className="right">{site.foot_copy_right || t("foot_copy_right")}</span>
      </div>
    </footer>);

}

/* ===== Contact page — same content/design as the footer, as its own destination ===== */
function ContactPage({ go }) {
  const t = window.useT();
  const site = useSiteSettings();
  const contact = site.contact || {};
  return (
    <div className="contact-page page-enter">
      <div className="foot-top foot-top-2col" style={{ padding: "0px", textAlign: "left" }}>
        <div className="foot-big">
          <img src="assets/logo-black.svg" alt="Project58" className="foot-logo" style={{ height: 28, marginBottom: 24, display: "block", filter: "invert(1)" }} />
          {site.foot_big || t("foot_big")} <em style={{ fontSize: "clamp(48px, 7vw, 90px)" }}>{site.foot_big_em || t("foot_big_em")}</em>
          <div className="foot-cta">
            <button className="foot-start-btn" onClick={() => go({ name: "start" })}>Start a project<span className="ar">→</span></button>
          </div>
        </div>
        <div className="foot-col">
          <h4>{contact.location_label}</h4>
          <p><ContactItem href={contact.address_url}>{contact.address}</ContactItem></p>
          <p style={{ marginTop: 8 }}><ContactItem href={contact.phone_url}>{contact.phone}</ContactItem></p>
          <p style={{ marginTop: 4 }}><ContactItem href={contact.email_url}>{contact.email}</ContactItem></p>
          <p style={{ marginTop: 14 }}><ContactItem href={contact.instagram_url}>{contact.instagram_text}</ContactItem></p>
        </div>
      </div>
      <div className="foot-bot">
        <span>{site.foot_copy_left || t("foot_copy_left")}</span>
        <span className="center">{site.foot_copy_mid || t("foot_copy_mid")}</span>
        <span className="right">{site.foot_copy_right || t("foot_copy_right")}</span>
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
        submitted_at: new Date(inquiry.createdAt).toLocaleString(),
      }, { publicKey: cfg.publicKey });
      return "sent";
    } catch (e) { console.warn("EmailJS send failed:", e); return "error"; }
  }
  return "skipped";
}

const INQUIRY_TYPES = ["Retail", "Hospitality", "Residential", "Workplace", "Renovation", "Other"];
const INQUIRY_TIMELINES = ["As soon as possible", "Within 1–3 months", "Within 3–6 months", "Flexible / exploring"];
const INQUIRY_BUDGETS = ["Not sure yet", "Under €50k", "€50k–€150k", "€150k–€400k", "€400k+"];

function StartProjectPage({ go }) {
  const site = useSiteSettings();
  const phone = (site && site.contact && site.contact.phone) || "";
  const phoneUrl = (site && site.contact && site.contact.phone_url) || (phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "");
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [f, setF] = useState({ type: "", location: "", size: "", timeline: "", budget: "", message: "", name: "", email: "", phone: "", company: "" });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const onClose = () => go({ name: "home" });

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim());
  const steps = [
    { title: "What are you planning?", valid: !!f.type },
    { title: "About the space", valid: true },
    { title: "A few details", valid: true },
    { title: "How can we reach you?", valid: f.name.trim() && emailValid },
  ];
  const last = steps.length - 1;
  const canNext = steps[step].valid;

  const submit = async () => {
    if (sending) return;
    setSending(true);
    const inquiry = { id: "inq-" + Date.now().toString(36), createdAt: Date.now(), status: "new", ...f };
    saveInquiry(inquiry);
    await notifyInquiry(inquiry);
    setSending(false);
    setDone(true);
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
  ) : (
    <React.Fragment>
      <div className="inquiry-progress">
        {steps.map((s, i) => <span key={i} className={`inquiry-dot ${i === step ? "on" : ""} ${i < step ? "done" : ""}`} />)}
      </div>
      <div className="inquiry-step-kind">Step {step + 1} of {steps.length}</div>
      <h2 className="inquiry-title">{steps[step].title}</h2>

      {step === 0 && (
        <div className="inquiry-types">
          {INQUIRY_TYPES.map((tp) => (
            <button key={tp} className={`inquiry-type ${f.type === tp ? "on" : ""}`} onClick={() => { set("type", tp); }}>{tp}</button>
          ))}
        </div>
      )}
      {step === 1 && (
        <div className="inquiry-fields">
          <label>Location<input type="text" value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="City / neighbourhood" /></label>
          <label>Approximate size<input type="text" value={f.size} onChange={(e) => set("size", e.target.value)} placeholder="e.g. 120 m²" /></label>
          <label>Timeline
            <select value={f.timeline} onChange={(e) => set("timeline", e.target.value)}>
              <option value="">Select…</option>
              {INQUIRY_TIMELINES.map((tl) => <option key={tl} value={tl}>{tl}</option>)}
            </select>
          </label>
        </div>
      )}
      {step === 2 && (
        <div className="inquiry-fields">
          <label>Budget range
            <select value={f.budget} onChange={(e) => set("budget", e.target.value)}>
              <option value="">Select…</option>
              {INQUIRY_BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label>Tell us about the project<textarea rows="4" value={f.message} onChange={(e) => set("message", e.target.value)} placeholder="What you have in mind, the space, goals…" /></label>
        </div>
      )}
      {step === 3 && (
        <div className="inquiry-fields">
          <label>Name<input type="text" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" /></label>
          <label>Email<input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" /></label>
          <label>Phone<input type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Optional" /></label>
          <label>Company<input type="text" value={f.company} onChange={(e) => set("company", e.target.value)} placeholder="Optional" /></label>
        </div>
      )}

      <div className="inquiry-nav">
        {step > 0 ? <button className="inquiry-btn ghost" onClick={() => setStep(step - 1)}>Back</button> : <span />}
        {step < last
          ? <button className="inquiry-btn primary" onClick={() => canNext && setStep(step + 1)} disabled={!canNext}>Continue</button>
          : <button className="inquiry-btn primary" onClick={submit} disabled={!canNext || sending}>{sending ? "Sending…" : "Send inquiry"}</button>}
      </div>
    </React.Fragment>
  );

  return (
    <div className="start-page page-enter">
      <div className="inquiry-card">
        <button className="inquiry-close" aria-label="Back to home" onClick={onClose}>×</button>
        {body}
      </div>
    </div>
  );
}

Object.assign(window, { Nav, Footer, StartProjectPage, ContactPage });
