/* Text-only preview bridge. No HTML, selectors or layout CSS accepted from messages. */
(() => {
  const editing = new URLSearchParams(location.search).get('visualTextEditor') === '1' && parent !== window;
  const fonts = { sans: '"Inter Tight", "Helvetica Neue", Helvetica, Arial, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace', serif: 'Georgia, serif' };
  let draft = null, selected = null, scheduled = false;
  let lastMetrics = '';
  let contentTexts = new Map(), previewInitialised = false;
  const originals = new WeakMap();
  // These texts are rendered by ProjectsRail from projectsPage, including language fallback.
  const projectTexts = new Set(['projectsPage.heroTitle','projectsPage.introTitle','projectsPage.introNote','projectsPage.centerText']);
  function apply() {
    scheduled = false;
    const site = draft || window.readP58Store?.()?.site || {};
    const lang = document.documentElement.lang === 'el' ? 'gr' : 'en';
    if (editing) document.querySelectorAll('[data-p58-placeholder]').forEach(el => {
      const text = contentTexts.get(el.dataset.p58Placeholder)?.[lang];
      if (typeof text === 'string' && el.getAttribute('placeholder') !== text) el.setAttribute('placeholder', text);
    });
    let measured = false;
    document.querySelectorAll('[data-p58-text]').forEach(el => {
      const key = el.dataset.p58Text;
      if (!originals.has(el)) originals.set(el, { text: el.textContent, style: el.getAttribute('style') });
      const original = originals.get(el);
      const text = contentTexts.get(key)?.[lang] ?? site.websiteTexts?.[lang]?.[key] ?? window.DICT_I18N?.[lang]?.[key] ?? original.text;
      if (editing && !projectTexts.has(key) && typeof text === 'string' && el.textContent !== text) el.textContent = text;
      const style = site.websiteTypography?.[lang]?.[key] || {};
      
      if (original.style === null) el.removeAttribute('style'); else el.setAttribute('style', original.style);
      if (fonts[style.font]) el.style.setProperty('font-family', fonts[style.font], 'important');
      if (Number.isFinite(style.size) && style.size >= 10 && style.size <= 160) el.style.setProperty('font-size', style.size + 'px', 'important');
      if ([300,400,500,600,700].includes(style.weight)) el.style.setProperty('font-weight', style.weight, 'important');
      if (editing) el.classList.toggle('visual-text-selected', key === selected);
      if (editing && key === selected && !measured) {
        measured = true;
        const computed = getComputedStyle(el);
        const metrics = {type:'p58:text-metrics',key,lang,size:parseFloat(computed.fontSize),weight:computed.fontWeight};
        const signature = JSON.stringify(metrics);
        if (signature !== lastMetrics) {lastMetrics=signature;parent.postMessage(metrics,location.origin);}
      }
    });
  }
  const schedule = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(apply); } };
  new MutationObserver(schedule).observe(document.body || document.getElementById('root'), { childList: true, subtree: true, characterData: true });
  window.addEventListener('storage', schedule);
  if (editing) {
    window.addEventListener('resize', schedule);
    const css = document.createElement('style');
    css.textContent = '[data-p58-text]{cursor:text!important;pointer-events:auto!important}[data-p58-text]:hover{outline:1px dashed #2867d8;outline-offset:4px}.visual-text-selected{outline:2px solid #2867d8!important;outline-offset:4px}';
    document.head.append(css);
    window.addEventListener('message', event => {
      if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'p58:text-preview') return;
      draft = { websiteTexts: event.data.websiteTexts, websiteTypography: event.data.websiteTypography };
      if (event.data.contentBase && window.applyVisualContentEdits) {
        const base = event.data.contentBase;
        window.P58_VISUAL_CONTENT = window.applyVisualContentEdits({...base,site:{...base.site,...draft,projectsPage:event.data.projectsPage}},event.data.contentEdits);
        contentTexts = new Map(window.visualContentCatalogue(window.P58_VISUAL_CONTENT).fields.map(field=>[field.key,field]));
        window.applyP58ContentFromStore?.();
        if (!previewInitialised) {
          previewInitialised = true;
          window.dispatchEvent(new Event('p58:visual-content'));
        }
      }
      selected = event.data.selected;
      schedule();
    });
    document.addEventListener('click', event => {
      if (event.altKey) return;
      const el = event.target.closest('[data-p58-text]');
      if (!el) return;
      event.preventDefault(); event.stopImmediatePropagation();
      selected = el.dataset.p58Text;
      const computed = getComputedStyle(el);
      parent.postMessage({ type:'p58:text-selected', key:selected, size:parseFloat(computed.fontSize), weight:computed.fontWeight }, location.origin);
      schedule();
    }, true);
    parent.postMessage({type:'p58:text-ready'}, location.origin);
  }
  schedule();
})();
