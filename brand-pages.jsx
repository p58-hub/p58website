// Brand collections use the same published projects as the individual pages.
function projectCollectionEntries(projects, category) {
  const visible = projects.filter(project => project.visible !== false);
  if (category.id !== "retail") return visible.map(project => ({ kind: "project", id: project.id, project }));
  const groups = new Map();
  for (const project of visible) {
    const label = String(project.brand || "").trim();
    if (label) {
      const key = label.toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(project);
    }
  }
  const emitted = new Set();
  return visible.flatMap(project => {
    const label = String(project.brand || "").trim();
    const key = label.toLowerCase();
    const members = groups.get(key) || [];
    const definition = (category.subcategories || []).find(sub => sub.label.toLowerCase() === key);
    const isChain = members.length > 1 || ["protein-garden", "dinas"].includes(definition?.id);
    if (!isChain) return [{ kind: "project", id: project.id, project }];
    if (emitted.has(key)) return [];
    emitted.add(key);
    const id = definition?.id || encodeURIComponent(key);
    return [{ ...window.normaliseBrandPresentation(definition || {id, label}), kind: "brand", id, label: definition?.label || label, label_gr: definition?.label_gr ?? definition?.label ?? label, icon: definition?.icon, projects: members }];
  });
}

function publishedBrand(id) {
  const category = window.siteCategory("retail");
  if (!category) return null;
  const projects = window.visibleProjects().filter(project => window.projectCategoryId(project) === "retail");
  return projectCollectionEntries(projects, category).find(entry => entry.kind === "brand" && entry.id === id) || null;
}

function CategoryIcon({ id }) {
  const paths = {
    retail: "M3 10h18l-2-6H5l-2 6Zm1 0v11h16V10M9 21v-7h6v7M3 10c0 4 6 4 6 0 0 4 6 4 6 0 0 4 6 4 6 0",
    hospitality: "M3 20v-9m18 9v-9M3 17h18M5 13V6h14v7M5 10h14M8 6V3m8 3V3",
    residential: "m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7",
    workplace: "M3 21h18M5 21V3h14v18M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M10 21v-3h4v3",
  };
  return <svg className="category-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[id] || "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"} /></svg>;
}

function CollectionCard({ entry, go, from }) {
  const t = window.useT();
  const pick = window.usePick();
  if (entry.kind === "project") return <ProjListRow project={entry.project} go={go} from={from} />;
  const project = entry.projects[0];
  const storeCount = entry.brandStoreCount ?? entry.projects.length;
  return <a className="collection-card" href={pathFromRoute({ name: "brand", id: entry.id })} onClick={event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); go({ name: "brand", id: entry.id });
  }}>
    <div className="collection-card-copy">
      <span className="collection-eyebrow"><span data-p58-text={"brand_brand_collection"}>{t("brand_brand_collection")}</span></span>
      <h3 data-p58-text={window.siteContentKey("brand",entry.id,"label")}>{pick(entry,"label")}</h3>
      <span><span className="collection-store-count" style={{fontSize:`${entry.brandStoreCountSize ?? 18}px`}}>{storeCount} <span data-p58-text={storeCount === 1 ? "brand_location" : "brand_locations"}>{t(storeCount === 1 ? "brand_location" : "brand_locations")}</span></span> · <span data-p58-text={"brand_explore_the_brand"}>{t("brand_explore_the_brand")}</span> ↗</span>
    </div>
    <SiteMedia src={entry.brandCover || project.hero} alt={entry.label} lazy />
  </a>;
}

function CategoryProjectPreview({ category, go, from }) {
  const t = window.useT();
  const pick = window.usePick();
  const [expanded, setExpanded] = React.useState(false);
  const entries = projectCollectionEntries(category.projects, category);
  const preview = !expanded && entries.length > 2;
  const listId = `category-preview-${category.id}`;
  return <div className="category-project-preview">
    <div id={listId} className="collection-list">
      {(expanded ? entries : entries.slice(0, 2)).map(entry => <CollectionCard key={`${entry.kind}:${entry.id}`} entry={entry} go={go} from={from} />)}
      {preview && <div className="collection-teaser" aria-hidden="true">
        <SiteMedia src={entries[2].kind === "brand" ? entries[2].projects[0].hero : entries[2].project.hero} alt="" lazy />
        <span>{entries[2].kind === "brand" ? entries[2].label : pick(entries[2].project,"name")}</span>
      </div>}
    </div>
    {entries.length > 2 && <button className={`collection-more ${preview ? "is-preview" : ""}`} aria-expanded={expanded} aria-controls={listId} onClick={() => setExpanded(value => !value)}>
      <span data-p58-text={expanded ? "brand_show_less" : "brand_show_more"}>{t(expanded ? "brand_show_less" : "brand_show_more")}</span> <span aria-hidden="true">{expanded ? "−" : "+"}</span>
    </button>}
  </div>;
}

// Area centres for the preview, never storefront coordinates. Unknown locations
// remain in the list. Published, explicit coordinates take precedence.
const BRAND_MAP_AREAS = [
  [/panormou/i, [37.993, 23.763]],
  [/kolonaki|skoufa/i, [37.979, 23.741]],
  [/glyfada|dou[sm]mani/i, [37.862, 23.754]],
  [/koukaki/i, [37.963, 23.724]],
  [/kolokotroni/i, [37.979, 23.731]],
  [/nea smyrni/i, [37.945, 23.714]],
  [/piraeus|tsamadou/i, [37.944, 23.648]],
  [/akadimias/i, [37.984, 23.733]],
];
function brandProjectPoint(project) {
  if (project.address && project.coordinates?.address !== project.address.trim()) return null;
  const lat = project.coordinates?.lat;
  const lng = project.coordinates?.lng;
  if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { point: [lat, lng], approximate: project.coordinates.approximate === true };
  if (project.address) return null;
  const area = BRAND_MAP_AREAS.find(([pattern]) => pattern.test(project.location || ""));
  return area ? { point: area[1], approximate: true } : null;
}

function brandMapColorMatrix(dark, light) {
  const channel = (hex, index) => parseInt(hex.slice(index, index + 2), 16) / 255;
  return [1, 3, 5].map(index => {
    const start = channel(dark, index);
    const range = channel(light, index) - start;
    return `${.2126 * range} ${.7152 * range} ${.0722 * range} 0 ${start}`;
  }).join(" ") + " 0 0 0 1 0";
}
function brandMapCardPosition(point, card, bounds) {
  const left = Math.max(bounds.left, Math.min(point.x - card.width / 2, bounds.right - card.width));
  const above = point.y - card.height - 28;
  const preferred = above >= bounds.top ? above : point.y + 28;
  const top = Math.max(bounds.top, Math.min(preferred, bounds.bottom - card.height));
  return { left, top };
}
function BrandLocationMap({ projects, selectedId, panToSelection, onSelect, pick, color, background, children }) {
  const t = window.useT();
  const filterId = React.useId().replace(/:/g, "");
  const ref = React.useRef(null);
  const mapRef = React.useRef(null);
  const markersRef = React.useRef(new Map());
  const detailRef = React.useRef(null);
  const [cardPosition, setCardPosition] = React.useState(null);
  const [failed, setFailed] = React.useState(!window.L);
  React.useEffect(() => {
    if (!window.L || !ref.current) return;
    const map = window.L.map(ref.current, { scrollWheelZoom: false, zoomControl: false }).setView([37.97,23.73],11);
    mapRef.current = map;
    window.L.control.zoom({ position: "bottomleft" }).addTo(map);
    const tiles = window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    tiles.on("tileerror", () => setFailed(true));
    const points = [];
    projects.forEach((project, index) => {
      const position = brandProjectPoint(project);
      if (!position) return;
      points.push(position.point);
      const marker = window.L.marker(position.point, { title:pick(project,"name"), icon:window.L.divIcon({className:"brand-map-marker",html:`<span>${String(index + 1).padStart(2,"0")}</span>`,iconSize:[36,36],iconAnchor:[18,18]}) }).addTo(map);
      marker.on("click", () => onSelect(project.id));
      // Preview without moving the map underneath the pointer.
      marker.on("mouseover", () => onSelect(project.id, false));
      marker.getElement()?.addEventListener("focus", () => onSelect(project.id, false));
      markersRef.current.set(project.id,marker);
    });
    if (points.length) map.fitBounds(points, { padding:[45,45], maxZoom:13 });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(ref.current);
    return () => { observer.disconnect(); map.remove(); mapRef.current = null; markersRef.current.clear(); };
  }, [projects, pick, onSelect]);
  React.useEffect(() => {
    markersRef.current.forEach((marker,id) => marker.getElement()?.classList.toggle("selected", id === selectedId));
    const marker = markersRef.current.get(selectedId);
    if (marker && panToSelection) mapRef.current?.panTo(marker.getLatLng());
  }, [selectedId, panToSelection, projects, pick]);
  React.useEffect(() => {
    const map = mapRef.current;
    const card = detailRef.current;
    if (!map || !card) return;
    let frame;
    const update = () => {
      if (!window.matchMedia('(max-width: 720px)').matches) { setCardPosition(null); return; }
      const rect = ref.current.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportTop = viewport?.offsetTop || 0;
      const viewportBottom = viewportTop + (viewport?.height || window.innerHeight);
      const dock = document.querySelector('.mobile-tab-bar')?.getBoundingClientRect();
      const dockTop = !document.fullscreenElement && dock?.height && dock.top < viewportBottom ? dock.top : viewportBottom;
      const head = ref.current.closest('.brand-locations')?.querySelector('.brand-locations-head')?.getBoundingClientRect();
      const top = Math.max(12, viewportTop - rect.top + 12, head && head.bottom > viewportTop ? head.bottom - rect.top + 12 : 0);
      const bottom = Math.min(rect.height - 12, dockTop - rect.top - 12);
      const marker = markersRef.current.get(selectedId);
      const point = marker ? map.latLngToContainerPoint(marker.getLatLng()) : { x: rect.width / 2, y: rect.height / 2 };
      const height = Math.min(card.scrollHeight, Math.max(0, bottom - top));
      const position = brandMapCardPosition(point, { width: card.offsetWidth, height }, { left: 12, right: rect.width - 12, top, bottom });
      setCardPosition({ ...position, maxHeight: Math.max(0, bottom - top), visibility: bottom - top < 80 ? 'hidden' : 'visible' });
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(card);
    map.on('move zoom resize', schedule);
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    update();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); map.off('move zoom resize', schedule);
      window.removeEventListener('scroll', schedule, true); window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule); window.visualViewport?.removeEventListener('scroll', schedule);
    };
  }, [selectedId, projects, pick]);
  return <div className="brand-map-wrap" style={{"--brand-map-filter":`url(#${filterId})`}}>
    <svg width="0" height="0" aria-hidden="true" style={{position:"absolute"}}><defs><filter id={filterId} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={brandMapColorMatrix(color,background)} /></filter></defs></svg>
    <div ref={ref} className="brand-map" role="region" aria-label={t("brand_map_of_project_areas")} />
    <div ref={detailRef} className="brand-map-detail" style={cardPosition}>{children}</div>
    {failed && <p className="brand-map-error"><span data-p58-text={"brand_the_map_could_not_load_all_locations_are_available_in_list_view"}>{t("brand_the_map_could_not_load_all_locations_are_available_in_list_view")}</span></p>}
  </div>;
}

function BrandMotionImage({ src, alt }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (window.isVideoSrc(src)) return;
    return window.startBrandMotion?.(ref.current, src);
  }, [src]);
  return <div className="brand-modal-media" ref={ref}><SiteMedia src={src} alt={alt} /></div>;
}

function BrandStorySections({ sections, pick, brandId }) {
  return sections.map((section,index) => {
    const title = pick(section,'title');
    const text = pick(section,'text');
    const images = section.images.filter(image => image.src);
    if (!title && !text && !images.length) return null;
    const copy = <div className="brand-section-copy">{title && <h3 data-p58-text={window.siteContentKey("section",`${brandId}/${section.id}`,"title")}>{title}</h3>}{text && <p data-p58-text={window.siteContentKey("section",`${brandId}/${section.id}`,"text")}>{text}</p>}</div>;
    const figure = (image,i) => <figure key={`${image.src}-${i}`}><SiteMedia src={image.src} alt={pick(image,'caption') || title || ''} lazy />{pick(image,'caption') && <figcaption data-p58-text={window.siteContentKey("section-image",`${brandId}/${section.id}/${section.images.indexOf(image)}`,"caption")}>{pick(image,'caption')}</figcaption>}</figure>;
    if (section.type === 'text') return <section key={section.id} className="brand-modal-copy brand-editable-section"><span className="collection-eyebrow">{String(index+1).padStart(2,'0')}</span>{copy}</section>;
    if (section.type === 'image-text') return <section key={section.id} className={`brand-modal-split brand-editable-section image-${section.imageSide}`}>{images[0] && figure(images[0],0)}{copy}</section>;
    return <section key={section.id} className="brand-editable-section brand-gallery-section">{(title || text) && copy}<div className="brand-modal-gallery">{images.map(figure)}</div></section>;
  });
}

function BrandConceptModal({ brand, concept, pick, onClose }) {
  const t = window.useT();
  const dialogRef = React.useRef(null);
  const closeRef = React.useRef(null);
  const closingRef = React.useRef(false);
  const timerRef = React.useRef(null);
  const [closing, setClosing] = React.useState(false);
  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    timerRef.current = window.setTimeout(onClose, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220);
  };
  React.useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    closeRef.current?.focus({preventScroll:true});
    return () => {
      window.clearTimeout(timerRef.current);
      dialog.close();
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
    };
  }, []);
  const intro = window.brandStoryIntro(brand, brand.projects);
  const sections = window.brandStorySections(brand, brand.projects);
  return ReactDOM.createPortal(<dialog ref={dialogRef} className={`brand-concept-modal${closing ? ' is-closing' : ''}`} aria-labelledby="brand-modal-title" onCancel={event => {event.preventDefault(); close();}} onClick={event => {if (event.target === event.currentTarget) close();}} style={{'--brand-color':brand.mapColor}}>
    <article className="brand-modal-sheet">
      <header className="brand-modal-bar"><span><span data-p58-text={window.siteContentKey("brand",brand.id,"label")}>{pick(brand,"label")}</span> / <span data-p58-text={"brand_architecture"}>{t("brand_architecture")}</span></span>
        <button ref={closeRef} className="brand-modal-close" type="button" aria-label={t("brand_close_brand_story")} onClick={close}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" /></svg></button>
      </header>
      <div className="brand-modal-intro"><span className="collection-eyebrow"><span data-p58-text={"brand_behind_the_spaces"}>{t("brand_behind_the_spaces")}</span></span><h2 id="brand-modal-title"><span data-p58-text={window.siteContentKey("brand",brand.id,"brandStoryTitle")}>{pick(intro,"title")}</span><br /><em><span data-p58-text={window.siteContentKey("brand",brand.id,"brandStorySubtitle")}>{pick(intro,"subtitle")}</span></em></h2></div>
      {intro.image?.src && <BrandMotionImage src={intro.image.src} alt={pick(intro.image,"caption")} />}
      <BrandStorySections sections={sections} pick={pick} brandId={brand.id} />
      <footer className="brand-modal-foot"><button type="button" className="brand-continue" onClick={close}><span data-p58-text={"brand_back_to_the_collection"}>{t("brand_back_to_the_collection")}</span><svg width="22" height="16" viewBox="0 0 22 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M21 8H2m6-6L2 8l6 6" /></svg></button></footer>
    </article>
  </dialog>, document.body);
}

function BrandHeroTitle({ brand }) {
  const pick = window.usePick();
  const logo = brand.brandLogo || brand.icon || (brand.id === "protein-garden" ? "assets/proteingarden/Protein Garden New logo_final-03.png" : "");
  const [failedLogo, setFailedLogo] = React.useState(null);
  return <h1>{logo && failedLogo !== logo
    ? <img className="brand-hero-logo" src={logo} alt={brand.label} onError={() => setFailedLogo(logo)} />
    : <span data-p58-text={window.siteContentKey("brand",brand.id,"label")}>{pick(brand,"label")}</span>}</h1>;
}

function BrandPage({ id, go }) {
  const t = window.useT();
  const pick = window.usePick();
  const brand = React.useMemo(() => publishedBrand(id), [id]);
  const [view, setView] = React.useState("map");
  const [selectedId, setSelectedId] = React.useState(null);
  const [panToSelection, setPanToSelection] = React.useState(false);
  const selectLocation = React.useCallback((projectId, pan = true) => {
    setSelectedId(projectId);
    setPanToSelection(pan);
  }, []);
  const [conceptModalOpen, setConceptModalOpen] = React.useState(false);
  const [fullscreen, setFullscreen] = React.useState(false);
  const locationsRef = React.useRef(null);
  React.useEffect(() => {
    const update = () => {
      const active = document.fullscreenElement === locationsRef.current;
      setFullscreen(active);
      if (active) setView("map");
    };
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await locationsRef.current?.requestFullscreen();
    } catch { locationsRef.current?.scrollIntoView({block: "start"}); }
  };
  if (!brand) return <div className="brand-page brand-missing"><h1><span data-p58-text={"brand_collection_unavailable"}>{t("brand_collection_unavailable")}</span></h1><a href="/projects?type=retail"><span data-p58-text={"retail"}>{t("retail")}</span></a></div>;
  const selected = brand.projects.find(project => project.id === selectedId) || brand.projects[0];
  const openProject = project => go({name:"project", id:project.slug || project.id, from:{name:"brand",id}});
  const concept = window.brandConceptCopy(brand);
  return <div className="brand-page page-enter" style={{"--brand-color":brand.mapColor,"--brand-map-background":brand.mapBackground,"--brand-accent":brand.mapAccent}}>
    {conceptModalOpen && <BrandConceptModal brand={brand} concept={concept} pick={pick} onClose={() => setConceptModalOpen(false)} />}
    <header className="brand-hero">
      <SiteMedia src={brand.brandCover || brand.projects[0].hero} alt="" className="brand-cover" />
      <BrandHeroTitle brand={brand} />
    </header>
    <section className="brand-story" aria-label={t("brand_about_the_brand")}>
      <div className="brand-concept" id="brand-architecture-concept">
        <SiteMedia src={brand.projects[0].gallery?.[0]?.src || brand.projects[0].hero} alt={t("brand_architectural_details")} lazy />
        <div><span className="collection-eyebrow">01 / <span data-p58-text={"brand_architecture"}>{t("brand_architecture")}</span></span><h2><span data-p58-text={"brand_a_shared_design_language"}>{t("brand_a_shared_design_language")}</span></h2><p data-p58-text={window.siteContentKey("brand",brand.id,"brandConcept")}>{pick(concept,"text")}</p>
          <div className="brand-story-actions">
            <button className="brand-continue" type="button" aria-haspopup="dialog" aria-expanded={conceptModalOpen} onClick={() => setConceptModalOpen(true)}><span data-p58-text={"brand_continue"}>{t("brand_continue")}</span><svg width="22" height="16" viewBox="0 0 22 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 8h19m-6-6 6 6-6 6" /></svg></button>
            {brand.instagram && <a className="brand-instagram" href={brand.instagram} target="_blank" rel="noopener noreferrer"><span data-p58-text="brand_instagram">{t("brand_instagram")}</span> <span>@{brand.instagram.split("/").filter(Boolean).pop()}</span></a>}
          </div>
        </div>
      </div>
    </section>
    <section ref={locationsRef} id="brand-locations" tabIndex={-1} className={`brand-locations brand-locations--${view}`}>
      <header className="brand-locations-head"><div><span className="collection-eyebrow"><span data-p58-text={"brand_explore_the_collection"}>{t("brand_explore_the_collection")}</span></span><h2><span data-p58-text={"brand_places_spaces"}>{t("brand_places_spaces")}</span></h2></div>
        <div className="brand-view-toggle" aria-label={t("brand_location_view")}>
          <button aria-pressed={view === "map"} onClick={() => setView("map")}>◎ <span data-p58-text={"brand_map"}>{t("brand_map")}</span></button>
          {!fullscreen && <button aria-pressed={view === "list"} onClick={() => setView("list")}>☰ <span data-p58-text={"brand_list"}>{t("brand_list")}</span></button>}
          {document.fullscreenEnabled && <button onClick={toggleFullscreen} aria-label={t(fullscreen ? "brand_exit_fullscreen" : "brand_fullscreen_map")}>{fullscreen ? "↙" : "⛶"}</button>}
        </div>
      </header>
      {view === "map" ? <>
        <div className="brand-map-layout"><BrandLocationMap projects={brand.projects} selectedId={selected.id} panToSelection={panToSelection} onSelect={selectLocation} pick={pick} color={brand.mapColor} background={brand.mapBackground}>
          <SiteMedia src={selected.hero} alt={pick(selected,"name")} lazy /><div className="brand-map-detail-copy"><span className="collection-eyebrow"><span data-p58-text={window.siteContentKey("project",selected.id,"location")}>{pick(selected,"location")}</span></span><h3><span data-p58-text={window.siteContentKey("project",selected.id,"name")}>{pick(selected,"name")}</span></h3>{selected.address && <p>{selected.address}</p>}<p><span data-p58-text={window.siteContentKey("project",selected.id,"summary")}>{pick(selected,"summary")}</span></p><button onClick={() => openProject(selected)}><span data-p58-text={"brand_view_project"}>{t("brand_view_project")}</span> ↗</button></div>
          </BrandLocationMap>
        </div>
      </> : <div className="brand-location-list">{brand.projects.map((project,index) => <a key={project.id} href={pathFromRoute({name:"project",id:project.slug || project.id})} onClick={event => {if (event.metaKey || event.ctrlKey) return; event.preventDefault(); openProject(project);}}><span className="collection-eyebrow">{String(index+1).padStart(2,"0")}</span><SiteMedia src={project.hero} alt="" lazy /><div><h3><span data-p58-text={window.siteContentKey("project",project.id,"name")}>{pick(project,"name")}</span></h3><p><span data-p58-text={window.siteContentKey("project",project.id,"location")}>{pick(project,"location")}</span></p>{project.address && <p>{project.address}</p>}</div><span aria-hidden="true">↗</span></a>)}</div>}
    </section>
    <div className="brand-map-support">        <p className="brand-map-note"><span data-p58-text={"brand_markers_indicate_neighbourhoods_not_exact_store_addresses_locatio"}>{t("brand_markers_indicate_neighbourhoods_not_exact_store_addresses_locatio")}</span></p>
    </div>
  </div>;
}
Object.assign(window,{CategoryIcon,CategoryProjectPreview,BrandPage,publishedBrand});
