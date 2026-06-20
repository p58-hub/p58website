// ===== app.jsx — root routing =====
const { useState: aUseState, useEffect: aUseEffect, useRef: aUseRef } = React;

// legacy hash aliases — protein-garden / dinas / studio / news still navigate
const ALIAS = {
  "protein-garden": "interiors",
  "dinas": "interiors",
  "studio": "agency",
  "news": "agency",
  "people": "agency",
};
const ROUTES = ["home", "projects", "architecture", "interiors", "agency"];

function routeFromLegacyHash(h) {
  const [name, id] = h.split("/");
  if (name === "project" && id) return { name: "project", id };
  const resolved = ALIAS[name] || name;
  if (resolved && resolved.startsWith("interiors:")) {
    return { name: "interiors", brand: resolved.split(":")[1] };
  }
  if (resolved && resolved.startsWith("projects:")) {
    const [, type, brand] = resolved.split(":");
    return { name: "projects", type, ...(brand ? { brand } : {}) };
  }
  if (ROUTES.includes(resolved)) return { name: resolved };
  return { name: "home" };
}

function routeFromLocation() {
  const legacyHash = (location.hash || "").replace(/^#/, "");
  if (legacyHash) return routeFromLegacyHash(legacyHash);

  const parts = location.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const params = new URLSearchParams(location.search);
  if (parts[0] === "projects" && parts[1]) return { name: "project", id: parts[1] };
  if (parts[0] === "projects") {
    const type = params.get("type");
    const brand = params.get("brand");
    return { name: "projects", ...(type ? { type } : {}), ...(brand ? { brand } : {}) };
  }
  if (parts[0] === "interiors") {
    const brand = params.get("brand");
    return { name: "interiors", ...(brand ? { brand } : {}) };
  }
  if (parts[0] === "people") return { name: "agency" };
  if (ROUTES.includes(parts[0])) return { name: parts[0] };
  return { name: "home" };
}

function pathFromRoute(r) {
  const name = ALIAS[r.name] || r.name;
  if (name === "home") return "/";
  if (name === "project") return `/projects/${encodeURIComponent(r.id)}`;
  if (name === "agency") return "/people";
  const params = new URLSearchParams();
  if (r.type) params.set("type", r.type);
  if (r.brand) params.set("brand", r.brand);
  const query = params.toString();
  return `/${name}${query ? `?${query}` : ""}`;
}

function routeKey(r) {
  return pathFromRoute(r || routeFromLocation());
}

function App() {
  const [route, setRoute] = aUseState(() => routeFromLocation());
  const routeRef = aUseRef(route);
  const scrollMemory = aUseRef(new Map());
  const restoreRef = aUseRef(null);
  const [zoom, setZoom] = aUseState(null);
  const [contentVersion, setContentVersion] = aUseState(0);
  const [introVisible, setIntroVisible] = aUseState(true);

  aUseEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => {
      setIntroVisible(false);
      document.body.style.overflow = previousOverflow;
    }, reducedMotion ? 250 : 1500);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  aUseEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const sync = () => {
      const next = routeFromLocation();
      restoreRef.current = next;
      setRoute(next);
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  aUseEffect(() => { routeRef.current = route; }, [route]);

  const saveScroll = (r = routeRef.current) => {
    const hzone = document.querySelector(".hzone");
    scrollMemory.current.set(routeKey(r), {
      top: window.scrollY || 0,
      left: hzone ? hzone.scrollLeft : 0,
    });
  };

  const go = (r, opts = {}) => {
    saveScroll();
    const name = ALIAS[r.name] || r.name;
    // capture referrer when entering a project from a non-project page
    let from = r.from;
    if (name === "project" && !from && routeRef.current.name !== "project") {
      const cur = routeRef.current;
      from = {
        name: cur.name,
        ...(cur.brand ? { brand: cur.brand } : {}),
        ...(cur.type ? { type: cur.type } : {}),
      };
    }
    const next = { ...r, name, ...(from ? { from } : {}) };
    const nextPath = pathFromRoute(next);
    const currentPath = pathFromRoute(routeRef.current);

    if (name === "project" && opts.fromEl) {
      const rect = opts.fromEl.getBoundingClientRect();
      const src = opts.src || opts.fromEl.currentSrc || opts.fromEl.src;
      setZoom({ src, rect, on: false });
      requestAnimationFrame(() => setZoom({ src, rect, on: true }));
      setTimeout(() => setZoom(null), 760);
    }

    if (nextPath !== currentPath || `${location.pathname}${location.search}${location.hash}` !== nextPath) {
      history.pushState({ route: nextPath }, "", nextPath);
    }
    restoreRef.current = null;
    setRoute(next);
    if (name !== "project") {
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" }));
    }
  };

  aUseEffect(() => {
    const target = restoreRef.current;
    if (!target) return;
    restoreRef.current = null;
    const saved = scrollMemory.current.get(routeKey(target));
    requestAnimationFrame(() => {
      const hzone = document.querySelector(".hzone");
      if (hzone && saved) hzone.scrollLeft = saved.left || 0;
      window.scrollTo({ top: saved ? saved.top || 0 : 0, behavior: "instant" });
    });
  }, [route.name, route.id, route.brand]);

  aUseEffect(() => {
    const onStorage = (e) => {
      if (e.key !== "p58_data_v1") return;
      if (window.applyP58ContentFromStore) window.applyP58ContentFromStore();
      setContentVersion((v) => v + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  aUseEffect(() => {
    const project = route.name === "project"
      ? PROJECTS.find((p) => p.id === route.id || p.slug === route.id)
      : null;
    const title = project ? `${project.name} — Project58` : "Project58 — Architecture";
    const description = project && project.summary
      ? project.summary
      : "Project58 is an architecture studio working across retail, residential, renovation and hospitality projects.";
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = description;

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${location.origin}${pathFromRoute(route)}`;
  }, [route.name, route.id, route.brand, route.type, contentVersion]);

  let page = null;
  if (route.name === "home")         page = <HomePage go={go} />;
  if (route.name === "projects")     page = <ProjectsPage go={go} type={route.type} brand={route.brand} />;
  if (route.name === "architecture") page = <ArchitecturePage go={go} />;
  if (route.name === "interiors")    page = <InteriorsPage go={go} brand={route.brand} />;
  if (route.name === "agency")       page = <AgencyPage go={go} />;
  if (route.name === "project")      page = <ProjectPage id={route.id} go={go} from={route.from} transitionDirection={route.transitionDirection} />;

  return (
    <React.Fragment>
      {introVisible ? (
        <div className="site-intro" aria-label="Project58" role="status">
          <div className="site-intro-mark">
            <img src="assets/logo-black.svg" alt="Project58" />
            <span className="site-intro-subtitle" aria-label="architects">
              {"architects".split("").map((letter, index) => <i key={index} aria-hidden="true">{letter}</i>)}
            </span>
          </div>
        </div>
      ) : null}
      <Nav route={route} go={go} />
      <main key={route.name + (route.id || "") + (route.brand || "") + (route.type || "") + ":" + contentVersion} data-screen-label={pageLabel(route)}>{page}</main>
      {route.name !== "project" && route.name !== "projects" && route.name !== "interiors" && route.name !== "architecture" && route.name !== "agency" && <Footer go={go} />}
      {zoom ? (
        <div className={`zoom-flight ${zoom.on ? "on" : ""}`} aria-hidden="true">
          <img
            src={zoom.src}
            alt=""
            style={{
              left: zoom.rect.left,
              top: zoom.rect.top,
              width: zoom.rect.width,
              height: zoom.rect.height,
            }}
          />
        </div>
      ) : null}
    </React.Fragment>
  );
}

function pageLabel(r) {
  if (r.name === "home")         return "01 Home";
  if (r.name === "projects")     return "02 Projects";
  if (r.name === "architecture") return "02 Architecture";
  if (r.name === "interiors")    return "03 Interiors";
  if (r.name === "agency")       return "04 People";
  if (r.name === "project")      return "05 Project Detail · " + (r.id || "");
  return r.name;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <window.LangProvider>
    <App />
  </window.LangProvider>
);
