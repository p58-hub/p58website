// ===== app.jsx — root: routing + tweaks =====
const { useState: aUseState, useEffect: aUseEffect, useRef: aUseRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "clay",
  "paper": "bone"
}/*EDITMODE-END*/;

// legacy hash aliases — protein-garden / dinas / studio / news still navigate
const ALIAS = {
  "protein-garden": "interiors",
  "dinas": "interiors",
  "studio": "agency",
  "news": "agency",
};
const ROUTES = ["home", "architecture", "interiors", "agency"];

function routeFromHash() {
  const h = (location.hash || "#home").replace("#", "");
  const [name, id] = h.split("/");
  if (name === "project" && id) return { name: "project", id };
  const resolved = ALIAS[name] || name;
  if (resolved && resolved.startsWith("interiors:")) {
    return { name: "interiors", brand: resolved.split(":")[1] };
  }
  if (ROUTES.includes(resolved)) return { name: resolved };
  return { name: "home" };
}

function hashFromRoute(r) {
  const name = ALIAS[r.name] || r.name;
  if (name === "project") return `project/${r.id}`;
  if (name === "interiors" && r.brand) return `interiors:${r.brand}`;
  return name;
}

function routeKey(r) {
  return hashFromRoute(r || routeFromHash());
}

function App() {
  const [route, setRoute] = aUseState(() => routeFromHash());
  const routeRef = aUseRef(route);
  const scrollMemory = aUseRef(new Map());
  const restoreRef = aUseRef(null);
  const [zoom, setZoom] = aUseState(null);
  const [contentVersion, setContentVersion] = aUseState(0);
  const [t, setTweak] = (window.useTweaks || (() => [TWEAK_DEFAULTS, () => {}]))(TWEAK_DEFAULTS);

  aUseEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const sync = () => {
      const next = routeFromHash();
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
      from = { name: cur.name, ...(cur.brand ? { brand: cur.brand } : {}) };
    }
    const next = { ...r, name, ...(from ? { from } : {}) };
    const nextHash = hashFromRoute(next);
    const currentHash = hashFromRoute(routeRef.current);

    if (name === "project" && opts.fromEl) {
      const rect = opts.fromEl.getBoundingClientRect();
      const src = opts.src || opts.fromEl.currentSrc || opts.fromEl.src;
      setZoom({ src, rect, on: false });
      requestAnimationFrame(() => setZoom({ src, rect, on: true }));
      setTimeout(() => setZoom(null), 760);
    }

    if (nextHash !== currentHash || location.hash.replace("#", "") !== nextHash) {
      history.pushState({ route: nextHash }, "", `#${nextHash}`);
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
    document.documentElement.dataset.accent = t.accent || "clay";
    document.documentElement.dataset.paper = t.paper || "bone";
  }, [t.accent, t.paper]);

  let page = null;
  if (route.name === "home")         page = <HomePage go={go} />;
  if (route.name === "architecture") page = <ArchitecturePage go={go} />;
  if (route.name === "interiors")    page = <InteriorsPage go={go} brand={route.brand} />;
  if (route.name === "agency")       page = <AgencyPage go={go} />;
  if (route.name === "project")      page = <ProjectPage id={route.id} go={go} from={route.from} />;

  return (
    <React.Fragment>
      <Nav route={route} go={go} />
      <main key={route.name + (route.id || "") + (route.brand || "") + ":" + contentVersion} data-screen-label={pageLabel(route)}>{page}</main>
      {route.name !== "project" && route.name !== "interiors" && route.name !== "architecture" && <Footer go={go} />}
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
      {window.TweaksPanel ? (
        <window.TweaksPanel title="Tweaks" defaultOpen={false}>
          <window.TweakSection title="Palette">
            <window.TweakRadio
              label="Accent"
              value={t.accent}
              onChange={(v) => setTweak("accent", v)}
              options={[
                { value: "clay",   label: "Clay" },
                { value: "moss",   label: "Moss" },
                { value: "ink",    label: "Ink" },
                { value: "cobalt", label: "Cobalt" },
              ]}
            />
            <window.TweakRadio
              label="Paper"
              value={t.paper}
              onChange={(v) => setTweak("paper", v)}
              options={[
                { value: "bone",  label: "Bone" },
                { value: "mist",  label: "Mist" },
                { value: "cream", label: "Cream" },
                { value: "dark",  label: "Dark" },
              ]}
            />
          </window.TweakSection>
          <window.TweakSection title="Jump to">
            <window.TweakButton onClick={() => go({ name: "home" })}>Home</window.TweakButton>
            <window.TweakButton onClick={() => go({ name: "architecture" })}>Architecture</window.TweakButton>
            <window.TweakButton onClick={() => go({ name: "interiors" })}>Interiors</window.TweakButton>
            <window.TweakButton onClick={() => go({ name: "agency" })}>Agency</window.TweakButton>
            <window.TweakButton onClick={() => go({ name: "project", id: "pg-panormou" })}>Project detail</window.TweakButton>
          </window.TweakSection>
        </window.TweaksPanel>
      ) : null}
    </React.Fragment>
  );
}

function pageLabel(r) {
  if (r.name === "home")         return "01 Home";
  if (r.name === "architecture") return "02 Architecture";
  if (r.name === "interiors")    return "03 Interiors";
  if (r.name === "agency")       return "04 Agency";
  if (r.name === "project")      return "05 Project Detail · " + (r.id || "");
  return r.name;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <window.LangProvider>
    <App />
  </window.LangProvider>
);
