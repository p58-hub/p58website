// ===== horizontal-rail.jsx — reusable sideways-scrolling section =====
//
// Turns any container into a rail of full-height panes that the visitor moves
// through by scrolling *down* — vertical wheel/trackpad delta is translated to
// horizontal movement and eased, so it feels like momentum rather than a jump.
//
// Load it before the file that uses it (same pattern as the other .jsx files):
//   <script type="text/babel" src="horizontal-rail.jsx?v=1"></script>
//
// Usage inside a component:
//   const rail = useHorizontalRail({ storageKey: "hzone_scroll" });
//   return (
//     <div className="hrail" ref={rail.ref}>
//       <section className="hrail-pane hrail-pane--full"> ... </section>
//       <section className="hrail-pane"> ... </section>
//       <div className="hrail-progress"><i style={{ width: `${rail.progress * 100}%` }} /></div>
//     </div>
//   );
//
// Before navigating away from a pane, call rail.save() so returning to the page
// lands on the same pane instead of back at the start.

function useHorizontalRail(options) {
  const opts = options || {};
  const storageKey = opts.storageKey || "hrail_scroll";
  const ease = opts.ease || 0.18;            // 0..1 — higher is snappier
  const enabled = opts.enabled !== false;    // pass false on mobile to opt out

  const { useState, useEffect, useRef } = React;
  const ref = useRef(null);
  const targetX = useRef(0);
  const animRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const clampTarget = (x) => {
    const el = ref.current;
    const max = el ? el.scrollWidth - el.clientWidth : 0;
    return Math.max(0, Math.min(max, x));
  };

  // Timer-based rather than rAF so the tween keeps running when the tab is
  // not focused — otherwise the rail freezes mid-pane on tab switch.
  const ensureLoop = () => {
    if (animRef.current) return;
    animRef.current = setInterval(() => {
      const el = ref.current;
      if (!el) { clearInterval(animRef.current); animRef.current = null; return; }
      const diff = targetX.current - el.scrollLeft;
      if (Math.abs(diff) < 0.5) {
        el.scrollLeft = targetX.current;
        clearInterval(animRef.current);
        animRef.current = null;
        return;
      }
      el.scrollLeft = el.scrollLeft + diff * ease;
    }, 16);
  };

  // move by a fraction of a viewport — used by arrow keys and any prev/next UI
  const nudge = (dir) => {
    const el = ref.current;
    if (!el) return;
    const base = animRef.current ? targetX.current : el.scrollLeft;
    targetX.current = clampTarget(base + dir * Math.min(el.clientWidth * 0.7, 560));
    ensureLoop();
  };

  // wheel / trackpad → horizontal only (down ⇒ right, up ⇒ left), eased
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return undefined;
    targetX.current = el.scrollLeft;
    const onWheel = (e) => {
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (!delta) return;
      e.preventDefault(); // no vertical scroll inside the rail
      targetX.current = clampTarget((animRef.current ? targetX.current : el.scrollLeft) + delta);
      ensureLoop();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [enabled]);

  // keep the tween target synced when native touch scroll moves the rail
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return undefined;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
      if (!animRef.current) targetX.current = el.scrollLeft;
      if (opts.onScroll) opts.onScroll(el);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") nudge(1);
      else if (e.key === "ArrowLeft") nudge(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);

  useEffect(() => () => { if (animRef.current) clearInterval(animRef.current); }, []);

  // restore the pane the visitor left from
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const saved = sessionStorage.getItem(storageKey);
    if (!saved) return;
    el.scrollLeft = Number(saved);
    targetX.current = Number(saved);
    sessionStorage.removeItem(storageKey);
  }, [enabled]);

  return {
    ref,
    progress,
    nudge,
    save: () => { if (ref.current) sessionStorage.setItem(storageKey, ref.current.scrollLeft); },
    scrollLeft: () => (ref.current ? ref.current.scrollLeft : 0),
  };
}

window.useHorizontalRail = useHorizontalRail;
