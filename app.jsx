// ===== app.jsx — root: routing + tweaks =====
const { useState: aUseState, useEffect: aUseEffect } = React;

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

function App() {
  const [route, setRoute] = aUseState({ name: "home" });
  const [t, setTweak] = (window.useTweaks || (() => [TWEAK_DEFAULTS, () => {}]))(TWEAK_DEFAULTS);

  aUseEffect(() => {
    const fromHash = () => {
      const h = (location.hash || "#home").replace("#", "");
      const [name, id] = h.split("/");
      if (name === "project" && id) { setRoute({ name: "project", id }); return; }
      const resolved = ALIAS[name] || name;
      // brand sub-routes: interiors:pg / interiors:dn
      if (resolved && resolved.startsWith("interiors:")) {
        const brand = resolved.split(":")[1];
        setRoute({ name: "interiors", brand });
        return;
      }
      if (ROUTES.includes(resolved)) setRoute({ name: resolved });
      else setRoute({ name: "home" });
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const go = (r) => {
    const name = ALIAS[r.name] || r.name;
    const next = { ...r, name };
    setRoute(next);
    let h;
    if (name === "project") h = `project/${r.id}`;
    else if (name === "interiors" && r.brand) h = `interiors:${r.brand}`;
    else h = name;
    history.pushState(null, "", `#${h}`);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  aUseEffect(() => {
    document.documentElement.dataset.accent = t.accent || "clay";
    document.documentElement.dataset.paper = t.paper || "bone";
  }, [t.accent, t.paper]);

  let page = null;
  if (route.name === "home")         page = <HomePage go={go} />;
  if (route.name === "architecture") page = <ArchitecturePage go={go} />;
  if (route.name === "interiors")    page = <InteriorsPage go={go} brand={route.brand} />;
  if (route.name === "agency")       page = <AgencyPage go={go} />;
  if (route.name === "project")      page = <ProjectPage id={route.id} go={go} />;

  return (
    <React.Fragment>
      <Nav route={route} go={go} />
      <main key={route.name + (route.id || "") + (route.brand || "")} data-screen-label={pageLabel(route)}>{page}</main>
      <Footer go={go} />
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
