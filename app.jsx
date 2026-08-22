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
const ROUTES = ["home", "projects", "architecture", "interiors", "agency", "start", "contact"];

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
    const sort = params.get("sort");
    const view = params.get("view");
    return {
      name: "projects",
      ...(type ? { type } : {}),
      ...(brand ? { brand } : {}),
      ...(sort ? { sort } : {}),
      ...(view === "all" ? { view: "all" } : {}),
    };
  }
  if (parts[0] === "interiors") {
    const brand = params.get("brand");
    const sort = params.get("sort");
    return { name: "interiors", ...(brand ? { brand } : {}), ...(sort ? { sort } : {}) };
  }
  if (parts[0] === "people") return { name: "agency" };
  if (parts[0] === "start-a-project") return { name: "start" };
  if (ROUTES.includes(parts[0])) {
    const sort = params.get("sort");
    return { name: parts[0], ...(sort ? { sort } : {}) };
  }
  return { name: "home" };
}

function pathFromRoute(r) {
  const name = ALIAS[r.name] || r.name;
  if (name === "home") return "/";
  if (name === "project") return `/projects/${encodeURIComponent(r.id)}`;
  if (name === "agency") return "/people";
  if (name === "start") return "/start-a-project";
  const params = new URLSearchParams();
  if (r.type) params.set("type", r.type);
  if (r.brand) params.set("brand", r.brand);
  if (r.sort) params.set("sort", r.sort);
  if (name === "projects" && r.view === "all") params.set("view", "all");
  const query = params.toString();
  return `/${name}${query ? `?${query}` : ""}`;
}

function routeKey(r) {
  return pathFromRoute(r || routeFromLocation());
}

function resolveRoute(r) {
  return r;
}

/* WebGL backdrop for the site entrance — soft flowing paper-grain field.
   Falls back silently (plain #f7f5f0 screen) when WebGL is unavailable or
   the user prefers reduced motion. */
const INTRO_FRAG = `
precision mediump float;
uniform float u_time;
uniform vec2 u_res;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.02 + vec2(17.3, 9.1);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = uv;
  p.x *= u_res.x / u_res.y;
  float t = u_time * 0.10;

  // domain-warped flow
  vec2 q = vec2(fbm(p * 1.6 + vec2(t, -t * 0.7)), fbm(p * 1.6 + vec2(-t * 0.4, t)));
  float n = fbm(p * 2.2 + q * 1.4 + vec2(t * 0.5, 0.0));

  vec3 paper = vec3(0.969, 0.961, 0.941);  /* #f7f5f0 */
  vec3 warm  = vec3(0.914, 0.886, 0.835);  /* warm sand */
  vec3 ink   = vec3(0.227, 0.173, 0.133);  /* #3a2c22 */

  vec3 col = mix(paper, warm, smoothstep(0.30, 0.85, n));
  col = mix(col, ink, smoothstep(0.80, 1.05, n) * 0.06);

  // gentle vignette keeps focus on the wordmark
  float d = distance(uv, vec2(0.5, 0.52));
  col = mix(col, paper, smoothstep(0.55, 0.0, d) * 0.55);
  col *= 1.0 - d * 0.10;

  // animated film grain
  float g = hash(gl_FragCoord.xy + fract(u_time) * 61.7);
  col += (g - 0.5) * 0.028;

  gl_FragColor = vec4(col, 1.0);
}
`;

function IntroCanvas() {
  const ref = aUseRef(null);
  aUseEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false });
    if (!gl) return;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("intro shader:", gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, "attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }");
    const fs = compile(gl.FRAGMENT_SHADER, INTRO_FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // fullscreen triangle
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_res");

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf;
    const start = performance.now();
    const frame = (now) => {
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      const ext = gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
    };
  }, []);
  return <canvas ref={ref} className="site-intro-canvas" aria-hidden="true" />;
}

function App() {
  const [route, setRoute] = aUseState(() => resolveRoute(routeFromLocation()));
  const routeRef = aUseRef(route);
  // true while the index on screen is only standing in for the home landing,
  // so a viewport that grows back past the breakpoint can restore the hero
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
      const target = routeFromLocation();
      const next = resolveRoute(target);
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
        ...(cur.sort ? { sort: cur.sort } : {}),
      };
    }
    const next = resolveRoute({ ...r, name, ...(from ? { from } : {}) });
    const nextPath = pathFromRoute(next);
    const currentPath = pathFromRoute(routeRef.current);

    if (name === "project" && opts.fromEl && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const rect = opts.fromEl.getBoundingClientRect();
      const src = opts.src || opts.fromEl.currentSrc || opts.fromEl.src;
      setZoom({ src, rect, on: false });
      requestAnimationFrame(() => setZoom({ src, rect, on: true }));
      setTimeout(() => setZoom(null), 760);
    }

    if (nextPath !== currentPath || `${location.pathname}${location.search}${location.hash}` !== nextPath) {
      history.pushState({ route: nextPath }, "", nextPath);
    }
    restoreRef.current = opts.restoreScroll ? next : null;
    setRoute(next);
    if (name !== "project") {
      if (opts.scrollTo) {
        const sel = opts.scrollTo;
        const tryScroll = (n) => {
          const el = document.querySelector(sel);
          if (el) {
            if (opts.overlayScroll) {
              const destination = window.scrollY + el.getBoundingClientRect().top;
              const start = Math.max(0, destination - window.innerHeight);
              window.scrollTo({ top: start, behavior: "instant" });
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  window.scrollTo({ top: destination, behavior: "smooth" });
                });
              });
            } else {
              el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          } else if (n > 0) requestAnimationFrame(() => tryScroll(n - 1));
        };
        requestAnimationFrame(() => tryScroll(30));
      } else if (!opts.restoreScroll) {
        requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" }));
      }
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
  }, [route.name, route.id, route.brand, route.type, route.sort]);

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
    const params = new URLSearchParams(location.search);
    const key = params.get("textPreview");
    if (!key) return undefined;
    const lang = params.get("previewLang") === "gr" ? "gr" : "en";
    const stored = window.readP58Store ? window.readP58Store() : null;
    let previewValue = null;
    try {
      const preview = JSON.parse(localStorage.getItem("p58_website_text_preview") || "null");
      if (preview && preview.key === key && preview.lang === lang && Date.now() - preview.createdAt < 60 * 60 * 1000) previewValue = preview.value;
    } catch (error) {}
    const custom = previewValue ?? stored?.site?.websiteTexts?.[lang]?.[key];
    const fallback = window.DICT_I18N?.[lang]?.[key] ?? window.DICT_I18N?.en?.[key];
    const value = custom != null && custom !== "" ? custom : fallback;
    const needle = String(Array.isArray(value) ? value[0] || "" : value || "").trim();
    if (!needle) return undefined;
    const timer = setTimeout(() => {
      const root = document.body;
      if (!root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (!String(node.nodeValue || "").includes(needle)) continue;
        const element = node.parentElement;
        if (!element) continue;
        element.classList.add("text-preview-highlight");
        element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        break;
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [route.name, contentVersion]);

  // A hidden project must not remain reachable through an old bookmark or a
  // previously shared URL. Replace that route with the public project index.
  aUseEffect(() => {
    if (route.name !== "project") return;
    const exists = PROJECTS.some((p) => p.visible !== false && (p.id === route.id || p.slug === route.id));
    if (exists) return;
    const next = { name: "projects" };
    history.replaceState({ route: pathFromRoute(next) }, "", pathFromRoute(next));
    setRoute(next);
  }, [route.name, route.id, contentVersion]);

  aUseEffect(() => {
    const project = route.name === "project"
      ? PROJECTS.find((p) => p.visible !== false && (p.id === route.id || p.slug === route.id))
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
  }, [route.name, route.id, route.brand, route.type, route.view, contentVersion]);

  let page = null;
  if (route.name === "home")         page = (window.visibleProjects ? window.visibleProjects() : PROJECTS.filter((p) => p.visible !== false)).length ? <HomePage go={go} /> : <ProjectsPage go={go} />;
  // Unfiltered /projects is the category rail on every viewport — sideways on a
  // desktop wheel, stacked vertically on a phone; picking a category adds a
  // filter and hands over to the ordinary vertical list.
  if (route.name === "projects")     page = route.view !== "all" && !route.type && !route.brand
    ? <ProjectsRail go={go} transition={route.transition} />
    : <ProjectsPage go={go} type={route.type} brand={route.brand} sort={route.sort} view={route.view} transition={route.transition} />;
  if (route.name === "architecture") page = <ArchitecturePage go={go} sort={route.sort} />;
  if (route.name === "interiors")    page = <InteriorsPage go={go} brand={route.brand} sort={route.sort} />;
  if (route.name === "agency")       page = <AgencyPage go={go} />;
  if (route.name === "start")        page = <StartProjectPage go={go} />;
  if (route.name === "contact")      page = <ContactPage go={go} />;
  if (route.name === "project") {
    const projectIsVisible = PROJECTS.some((p) => p.visible !== false && (p.id === route.id || p.slug === route.id));
    page = projectIsVisible
      ? <ProjectPage id={route.id} go={go} from={route.from} transitionDirection={route.transitionDirection} />
      : <ProjectsPage go={go} />;
  }

  return (
    <React.Fragment>
      {introVisible ? (
        <div className="site-intro" aria-label="Project58" role="status">
          <IntroCanvas />
          <div className="site-intro-mark">
            <img src="assets/logo-black.svg" alt="Project58" />
            <span className="site-intro-subtitle" aria-label="architects">
              {"architects".split("").map((letter, index) => <i key={index} aria-hidden="true">{letter}</i>)}
            </span>
          </div>
        </div>
      ) : null}
      <Nav route={route} go={go} />
      <main key={route.name + (route.id || "") + (route.brand || "") + (route.type || "") + (route.sort || "") + ":" + contentVersion} data-screen-label={pageLabel(route)}>{page}</main>
      {route.name !== "project" && route.name !== "projects" && route.name !== "interiors" && route.name !== "architecture" && route.name !== "agency" && route.name !== "start" && route.name !== "contact" && <Footer go={go} />}
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
  if (r.name === "start")        return "05 Start a Project";
  if (r.name === "contact")      return "06 Contact";
  if (r.name === "project")      return "07 Project Detail · " + (r.id || "");
  return r.name;
}

/* Wait for /api/content before the first paint. Rendering immediately would
   show the bundled defaults and then visibly swap to the published content a
   moment later — most obvious on the hero images. The promise always resolves,
   so a deployment with no API is delayed by one failed fetch, not forever. */
(window.P58_CONTENT_READY || Promise.resolve()).then(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <window.LangProvider>
      <App />
    </window.LangProvider>
  );
});
