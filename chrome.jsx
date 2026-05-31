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
  const isRetail = route.name === "interiors" || route.name === "project";
  const isResidential = route.name === "architecture";
  const isAgency = route.name === "agency";
  const isHome = route.name === "home";

  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [hideForFooter, setHideForFooter] = useState(false);
  const menuRef = useRef(null);

  // scroll detection — only meaningful on home (which has the full-bleed hero)
  useEffect(() => {
    if (!isHome) {setAtTop(false);return;}
    const onScroll = () => setAtTop(window.scrollY < 80);
    setAtTop(window.scrollY < 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

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

  // close drawer with esc on mobile too
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {if (e.key === "Escape") setMenuOpen(false);};
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // lock body scroll while mobile drawer is open
  useEffect(() => {
    if (menuOpen && isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {document.body.style.overflow = prev;};
    }
  }, [menuOpen, isMobile]);

  // open search on ⌘K / Ctrl+K — feels macOS-native
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Hide the header once the footer scrolls into view (works for both the
  // vertical pages' <footer.foot> and the home page's horizontal .hz-foot pane).
  useEffect(() => {
    const foots = Array.from(document.querySelectorAll("footer.foot, .hz-foot"));
    const ratios = new Map();
    setHideForFooter(false);
    if (!foots.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => ratios.set(e.target, e.intersectionRatio));
        let max = 0;
        ratios.forEach((v) => {if (v > max) max = v;});
        setHideForFooter(max > 0.4);
      },
      { threshold: [0, 0.2, 0.4, 0.7, 1] }
    );
    foots.forEach((f) => io.observe(f));
    return () => io.disconnect();
  }, [route.name, route.id, route.brand]);

  // Toggle a body flag so the footer can expand fullscreen + header leaves flow.
  useEffect(() => {
    document.body.classList.toggle("at-footer", hideForFooter);
    return () => document.body.classList.remove("at-footer");
  }, [hideForFooter]);

  const currentBrand = route.brand || null;

  return (
    <React.Fragment>
      <nav className={`nav ${homeTop ? "home-top" : ""} ${hideForFooter ? "nav-hidden" : ""}`} aria-label="Primary">
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
          <window.LangToggle />
          <button className="nav-icon" aria-label="Search" onClick={() => setSearchOpen(true)}>
            <SearchIcon />
            <span className="kbd">⌘K</span>
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
                <button
                className={`nav-menu-item ${isAgency ? "on" : ""}`}
                role="menuitem"
                onClick={() => {setMenuOpen(false);go({ name: "agency" });}}>
                  <span>{t("agency")}</span><span className="ar">↗</span>
                </button>
                <button
                className="nav-menu-item"
                role="menuitem"
                onClick={() => {setMenuOpen(false);window.location.href = "mailto:g.grigoriadis@project58.gr";}}>
                  <span>{t("contact")}</span><span className="ar">↗</span>
                </button>
              </div> :
            null}
          </div>
        </div>
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
          className={`mobile-drawer-link ${isRetail ? "on" : ""}`}
          onClick={() => {setMenuOpen(false);go({ name: "interiors" });}}>
            <span>{t("retail")}</span><span className="ar">→</span>
          </button>
          <button
          className={`mobile-drawer-link ${isResidential ? "on" : ""}`}
          onClick={() => {setMenuOpen(false);go({ name: "architecture" });}}>
            <span>{t("residential")}</span><span className="ar">→</span>
          </button>
          <button
          className={`mobile-drawer-link ${isAgency ? "on" : ""}`}
          onClick={() => {setMenuOpen(false);go({ name: "agency" });}}>
            <span>{t("agency")}</span><span className="ar">→</span>
          </button>
          <button
          className="mobile-drawer-link"
          onClick={() => {setMenuOpen(false);window.location.href = "mailto:g.grigoriadis@project58.gr";}}>
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

      {/* RETAIL sub-nav — brand strip */}
      {isRetail ?
      <div className="subnav" aria-label="Retail brands">
          <button
          className={`sub-chip ${!currentBrand ? "on" : ""}`}
          onClick={() => go({ name: "interiors" })}>
            {t("all")}
          </button>
          <button
          className={`sub-chip ${currentBrand === "pg" ? "on" : ""}`}
          onClick={() => go({ name: "interiors", brand: "pg" })}>
            Protein Garden
          </button>
          <button
          className={`sub-chip ${currentBrand === "dn" ? "on" : ""}`}
          onClick={() => go({ name: "interiors", brand: "dn" })}>
            Dinas
          </button>
        </div> :
      null}

      {searchOpen ? <SearchOverlay go={go} onClose={() => setSearchOpen(false)} /> : null}
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
    const projects = (window.PROJECTS || []).map((p) => ({
      kind: "project",
      label: pick(p, "name"),
      sub: `${p.brand} · ${pick(p, "location")} · ${p.year}`,
      code: p.code,
      onPick: () => go({ name: "project", id: p.id })
    }));
    const brands = [
    { kind: "brand", label: "Protein Garden", sub: "8 rooms · 2023–2026", onPick: () => go({ name: "interiors", brand: "pg" }) },
    { kind: "brand", label: "Dinas", sub: "4 rooms · 2025–2026", onPick: () => go({ name: "interiors", brand: "dn" }) }];

    return [...brands, ...projects];
  }, [pick]);

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
  const groupOrder = ["brand", "project"];
  const groupTitles = { brand: t("retail_brands"), project: t("projects") };

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
      if (raw && raw.site) return raw.site;
    } catch (e) {}
    return null;
  });
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== "p58_data_v1") return;
      try {
        const raw = JSON.parse(e.newValue || "null");
        setSite(raw && raw.site ? raw.site : null);
      } catch (err) {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return site || {};
}

function Footer({ go }) {
  const t = window.useT();
  const site = useSiteSettings();
  const athensAddr = site.athens_address || t("foot_addr_athens");
  const athensPhone = site.athens_phone || "+30 210 000 5800";
  const email = site.email || "g.grigoriadis@project58.gr";
  return (
    <footer className="foot">
      <div className="foot-top foot-top-2col" style={{ padding: "0px", textAlign: "left" }}>
        <div className="foot-big">
          <img src="assets/logo-black.svg" alt="Project58" className="foot-logo" style={{ height: 28, marginBottom: 24, display: "block", filter: "invert(1)" }} />
          {t("foot_big")} <em style={{ fontSize: "122px" }}>{t("foot_big_em")}</em>
        </div>
        <div className="foot-col">
          <h4>{t("foot_athens")}</h4>
          <p>{athensAddr.split("\n").map((line, i) => <React.Fragment key={i}>{i > 0 ? <br /> : null}{line}</React.Fragment>)}</p>
          <p style={{ marginTop: 8 }}>{athensPhone}</p>
          <p style={{ marginTop: 4 }}><a href={`mailto:${email}`}>{email}</a></p>
          <a style={{ marginTop: 14 }} href="#">{t("foot_instagram")}</a>
        </div>
      </div>
      <div className="foot-bot">
        <span>{t("foot_copy_left")}</span>
        <span className="center">{t("foot_copy_mid")}</span>
        <span className="right">{t("foot_copy_right")}</span>
      </div>
    </footer>);

}

Object.assign(window, { Nav, Footer });