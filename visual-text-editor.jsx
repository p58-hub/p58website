function visualEditorDraft(site, content) {
  return {
    ...(content ? {contentBase:content,contentEdits:{}} : {}),
    websiteTexts: site.websiteTexts || {},
    websiteTypography: site.websiteTypography || {},
    projectsPage: window.normaliseSiteSettings(site).projectsPage,
  };
}

function visualProjectTextField(key) {
  return ['heroTitle','introTitle','introNote','centerText'].find(field=>key===`projectsPage.${field}`) || null;
}

function visualEditorText(draft, key, lang) {
  if (key?.startsWith('content:')) {
    const field=window.visualContentCatalogue(draft.contentBase).fields.find(item=>item.key===key);
    return draft.contentEdits?.[key]?.[lang] ?? field?.[lang] ?? '';
  }
  const field = visualProjectTextField(key);
  if (field) return draft.projectsPage[field + (lang === 'gr' ? '_gr' : '')] ?? '';
  return draft.websiteTexts[lang]?.[key] ?? window.DICT_I18N[lang]?.[key] ?? window.DICT_I18N.en[key] ?? '';
}

function updateVisualEditorText(draft, key, lang, value) {
  if (key?.startsWith('content:')) {
    if (!window.visualContentCatalogue(draft.contentBase).fields.some(item=>item.key===key)) return draft;
    return {...draft,contentEdits:{...draft.contentEdits,[key]:{...draft.contentEdits?.[key],[lang]:value}}};
  }
  const field = visualProjectTextField(key);
  if (field) return {...draft,projectsPage:{...draft.projectsPage,[field + (lang === 'gr' ? '_gr' : '')]:value}};
  return {...draft,websiteTexts:{...draft.websiteTexts,[lang]:{...draft.websiteTexts[lang],[key]:value}}};
}

function VisualBilingualText({draft, textKey, onChange}) {
  const id = React.useId();
  return <div className="visual-bilingual-text" role="group" aria-labelledby={id}>
    <div id={id} className="visual-bilingual-title">Κείμενο</div>
    <div className="visual-bilingual-input">
      {[{code:'gr',prefix:'GR',label:'Κείμενο στα ελληνικά'},{code:'en',prefix:'EN',label:'Κείμενο στα αγγλικά'}].map(language=>
        <div className="visual-bilingual-row" key={language.code}>
          <span className="visual-bilingual-prefix" aria-hidden="true">{language.prefix}<span>|</span></span>
          <textarea rows="1" lang={language.code==='gr'?'el':'en'} aria-label={language.label}
            value={visualEditorText(draft,textKey,language.code)} onChange={event=>onChange(language.code,event.target.value)}/>
        </div>
      )}
    </div>
  </div>;
}

const VISUAL_EDITOR_PAGES = [
  {value:'home', label:'Αρχική', path:'m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8'},
  {value:'projects', label:'Έργα', path:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z'},
  {value:'agency', label:'Ομάδα & γραφείο', path:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0'},
  {value:'contact', label:'Επικοινωνία', path:'M3 5h18v14H3zM3 5l9 7 9-7'},
  {value:'start', label:'Φόρμα επικοινωνίας', path:'M14 2H5v20h14V7zM14 2v5h5M8 12h8M8 16h8'},
];

function VisualPageIcon({path}) {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path}/></svg>;
}

function VisualPagePicker({value, onChange, extraPages = []}) {
  const pages = [...VISUAL_EDITOR_PAGES,...extraPages];
  const [expanded, setExpanded] = React.useState(false);
  const root = React.useRef(null);
  const trigger = React.useRef(null);
  const items = React.useRef([]);
  const menuId = React.useId();
  const selectedIndex = pages.findIndex(page=>page.value===value);
  const selectedPage = pages[selectedIndex] || pages[0];
  React.useEffect(()=>{
    if (!expanded) return;
    items.current[selectedIndex]?.focus();
    const outside = event => {if (!root.current?.contains(event.target)) setExpanded(false);};
    const blur = () => setExpanded(false); // Also dismiss when the preview iframe receives focus.
    document.addEventListener('pointerdown', outside);
    window.addEventListener('blur', blur);
    return ()=>{document.removeEventListener('pointerdown',outside);window.removeEventListener('blur',blur);};
  },[expanded, selectedIndex]);
  const dismiss = () => {setExpanded(false);trigger.current?.focus();};
  const navigate = (event, index) => {
    let next;
    if (event.key==='ArrowDown') next=(index+1)%pages.length;
    else if (event.key==='ArrowUp') next=(index+pages.length-1)%pages.length;
    else if (event.key==='Home') next=0;
    else if (event.key==='End') next=pages.length-1;
    else if (event.key==='Escape') {event.preventDefault();event.stopPropagation();dismiss();return;}
    if (next!==undefined) {event.preventDefault();items.current[next]?.focus();}
  };
  return <div className="visual-page-picker" ref={root} onBlur={event=>{
    if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false);
  }}>
    <button className="visual-page-trigger" type="button" ref={trigger}
      aria-label={`Σελίδα προεπισκόπησης: ${selectedPage.label}`} aria-haspopup="menu" aria-expanded={expanded} aria-controls={expanded?menuId:undefined}
      onClick={()=>setExpanded(current=>!current)} onKeyDown={event=>{
        if (event.key==='ArrowDown'||event.key==='ArrowUp') {event.preventDefault();setExpanded(true);}
      }}>
      <VisualPageIcon path={selectedPage.path}/><span>{selectedPage.label}</span>
      <svg className="visual-page-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    {expanded && <div className="visual-page-menu" id={menuId} role="menu" aria-label="Σελίδα προεπισκόπησης">
      <div className="visual-page-menu-heading" role="presentation">Σελίδες ιστοσελίδας</div>
      {pages.map((page,index)=><button key={page.value} type="button" role="menuitemradio" aria-checked={value===page.value}
        tabIndex={-1} ref={node=>{items.current[index]=node;}} onKeyDown={event=>navigate(event,index)}
        onClick={()=>{onChange(page.value);dismiss();}}>
        <span className="visual-page-icon"><VisualPageIcon path={page.path}/></span><span>{page.label}</span>
        {value===page.value && <svg className="visual-page-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>}
      </button>)}
    </div>}
  </div>;
}

function VisualEditorHelp({compact, selected}) {
  const [expanded, setExpanded] = React.useState(false);
  const helpId = React.useId();
  React.useEffect(()=>{setExpanded(false);},[compact]);
  return <div className={`visual-editor-help${selected ? ' is-selected' : ''}`}>
    <div className="visual-editor-help-heading">
      <h3>{selected ? (compact ? 'Κείμενο' : 'Επεξεργασία κειμένου') : 'Πάτησε ένα κείμενο στην προεπισκόπηση'}</h3>
      {compact && <button type="button" className="visual-editor-info" aria-label="Οδηγίες επεξεργασίας" title="Οδηγίες επεξεργασίας"
        aria-expanded={expanded} aria-controls={helpId} onClick={()=>setExpanded(current=>!current)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7" r=".8" fill="currentColor" stroke="none"/></svg>
      </button>}
    </div>
    <div id={helpId} className="visual-editor-help-copy" hidden={compact && !expanded}>
      <p>Πάτησε ένα κείμενο με περίγραμμα για να το αλλάξεις. Διάλεξε σελίδα και γλώσσα από το μενού. Οι αλλαγές αποθηκεύονται αυτόματα ως πρόχειρο.</p>
      <p>Για να ανοίξεις ένα κουμπί ή σύνδεσμο στην προεπισκόπηση, κράτησε Alt / Option καθώς πατάς. Με το πληκτρολόγιο, χρησιμοποίησε Tab και Enter.</p>
      {compact && selected && <p>Το σταθερό μέγεθος ισχύει και στο κινητό. Η επαναφορά επαναφέρει την αυτόματη προσαρμογή.</p>}
    </div>
  </div>;
}

function VisualFontDialog({value, onChange, onClose}) {
  const dialog = React.useRef(null);
  const titleId = React.useId();
  React.useLayoutEffect(()=>{
    const element = dialog.current;
    const returnFocus = document.activeElement;
    element.showModal();
    element.querySelector('[aria-pressed="true"]')?.focus();
    return ()=>{element.close();if(returnFocus?.isConnected) returnFocus.focus();};
  },[]);
  const fonts = [
    {value:'',label:'Προεπιλογή ιστοσελίδας',family:'inherit'},
    {value:'sans',label:'Inter Tight',family:'"Inter Tight", sans-serif'},
    {value:'mono',label:'JetBrains Mono',family:'"JetBrains Mono", monospace'},
    {value:'serif',label:'Georgia',family:'Georgia, serif'},
  ];
  return ReactDOM.createPortal(<dialog ref={dialog} className="visual-font-dialog" aria-labelledby={titleId}
    onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{
      if(event.target!==event.currentTarget) return;
      const bounds=event.currentTarget.getBoundingClientRect();
      if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom) onClose();
    }}>
    <div className="visual-font-heading"><h2 id={titleId}>Γραμματοσειρά</h2><button type="button" aria-label="Κλείσιμο επιλογής γραμματοσειράς" onClick={onClose}>×</button></div>
    <div className="visual-font-options">{fonts.map(font=><button type="button" key={font.value} aria-pressed={(value || '')===font.value}
      onClick={()=>{onChange(font.value);onClose();}}>
      <span>{font.label}</span><span className="visual-font-sample" style={{fontFamily:font.family}} aria-hidden="true">Αα Bb 123</span>
      {(value || '')===font.value && <span className="visual-font-check" aria-hidden="true">✓</span>}
    </button>)}</div>
  </dialog>,document.body);
}

function VisualTypographySettings({value, size, weight, compact, onChange}) {
  const [active, setActive] = React.useState(null);
  const panelId = React.useId();
  const panel = React.useRef(null);
  React.useEffect(()=>{
    if (compact && active) panel.current?.querySelector('select,input')?.focus();
  },[active,compact]);
  const settings = [
    {id:'font', icon:'Aa', label:'Γραμματοσειρά'},
    {id:'size', icon:Number.isFinite(value.size ?? size) ? `${Math.round(value.size ?? size)} px` : 'Auto', label:'Μέγεθος'},
    {id:'weight', icon:String(value.weight || weight || 'Auto'), label:'Πάχος'},
  ];
  return <div className="visual-typography">
    {compact && <div className="visual-typography-buttons" role="group" aria-label="Ρυθμίσεις κειμένου">
      {settings.map(setting=><button key={setting.id} type="button" aria-expanded={active===setting.id}
        aria-haspopup={setting.id==='font'?'dialog':undefined}
        aria-controls={active===setting.id&&setting.id!=='font'?panelId:undefined} onClick={()=>setActive(current=>current===setting.id?null:setting.id)}>
        <span aria-hidden={setting.id==='font'?true:undefined} className={`visual-typography-icon is-${setting.id}`}>{setting.icon}</span>{setting.label}
      </button>)}
    </div>}
    {compact && active==='font' && <VisualFontDialog value={value.font} onChange={font=>onChange({...value,font})} onClose={()=>setActive(null)}/>}
    {(!compact || active && active!=='font') && <div ref={panel} id={panelId} className={compact?'visual-typography-panel':undefined}>
      {(!compact || active==='font') && <label>Γραμματοσειρά<select value={value.font || ''} onChange={e=>onChange({...value,font:e.target.value})}><option value="">Προεπιλογή ιστοσελίδας</option><option value="sans">Inter Tight</option><option value="mono">JetBrains Mono</option><option value="serif">Georgia</option></select></label>}
      {(!compact || active==='size') && <label>Μέγεθος (px)<input type="number" min="10" max="160" placeholder={Number.isFinite(size)?String(Math.round(size)):'Auto'} value={value.size ?? ''} onChange={e=>{const n=Number(e.target.value);if(!e.target.value || n>=10&&n<=160)onChange({...value,size:e.target.value?n:undefined});}} /></label>}
      {(!compact || active==='weight') && <label>Πάχος<select value={value.weight || ''} onChange={e=>onChange({...value,weight:Number(e.target.value)||undefined})}><option value="">Προεπιλογή ιστοσελίδας</option>{[300,400,500,600,700].map(w=><option key={w} value={w}>{w}</option>)}</select></label>}
    </div>}
    <button type="button" className="btn ghost visual-typography-reset" onClick={()=>onChange({})}>Επαναφορά τυπογραφίας</button>
    {!compact && <small>Το σταθερό μέγεθος ισχύει και στο κινητό. Η επαναφορά επαναφέρει την αυτόματη προσαρμογή.</small>}
  </div>;
}

function VisualTextEditor({ site, content, onSave, onPublish, draftState = "saved", disabled = false }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(() => visualEditorDraft(site, content));
  const [lang, setLang] = React.useState('en');
  const [route, setRoute] = React.useState('home');
  const [mobile, setMobile] = React.useState(false);
  const [narrow, setNarrow] = React.useState(()=>window.matchMedia('(max-width:760px)').matches);
  const compact = mobile || narrow;
  React.useEffect(()=>{
    const query = window.matchMedia('(max-width:760px)');
    const update = () => setNarrow(query.matches);
    query.addEventListener('change',update);
    return ()=>query.removeEventListener('change',update);
  },[]);
  const [textSearch, setTextSearch] = React.useState('');
  const contentFields = React.useMemo(()=>content ? window.visualContentCatalogue(content).fields : [],[content]);
  const extraPages = React.useMemo(()=>{const routes=new Map();contentFields.forEach(field=>{if(field.route.startsWith('brand/')||field.route.startsWith('project/'))routes.set(field.route,{value:field.route,label:field.label.split(' · ')[0],path:VISUAL_EDITOR_PAGES[1].path});});return [...routes.values()];},[contentFields]);
  const [selected, setSelected] = React.useState(null);
  const [status, setStatus] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const frame = React.useRef(null);
  const lastSaved = React.useRef(JSON.stringify(draft));
  const saveCallback = React.useRef(onSave);
  saveCallback.current = onSave;
  React.useEffect(() => {
    if (!open || JSON.stringify(draft) === lastSaved.current) return;
    lastSaved.current = JSON.stringify(draft);
    saveCallback.current(draft);
  }, [draft, open]);
  const draftRef = React.useRef(draft);
  draftRef.current = draft;
  const send = () => frame.current?.contentWindow?.postMessage({type:'p58:text-preview', ...draftRef.current, selected: selected?.key}, location.origin);
  React.useEffect(() => { send(); }, [draft, selected]);
  React.useEffect(() => {
    const receive = event => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === 'p58:text-ready') send();
      if (event.data?.type === 'p58:text-metrics' && event.data.lang === lang) setSelected(current=>
        current?.key===event.data.key && (current.size!==event.data.size || current.weight!==event.data.weight)
          ? {...current,size:event.data.size,weight:event.data.weight} : current);
      if (event.data?.type === 'p58:text-selected' && (contentFields.some(field=>field.key===event.data.key) || visualProjectTextField(event.data.key) || typeof window.DICT_I18N?.en?.[event.data.key] === 'string')) setSelected(event.data);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [selected,lang,contentFields]);
  const key = selected?.key;
  const typography = draft.websiteTypography[lang]?.[key] || {};
  const changeText = (language, value) => {
    setStatus('');
    setDraft(current=>updateVisualEditorText(current,key,language,value));
  };
  const change = (field, value) => {
    setStatus('');
    setDraft(current => ({...current, [field]: {...current[field], [lang]: {...current[field][lang], [key]: value}}}));
  };
  const close = () => { if (JSON.stringify(draft) !== lastSaved.current) onSave(draft); setOpen(false); setSelected(null); setStatus(''); };
  const publish = async () => {
    setBusy(true); setStatus('Δημοσίευση αλλαγών…');
    try { onSave(draft); await onPublish(draft); setStatus('Οι αλλαγές δημοσιεύτηκαν.'); }
    catch(error) { setStatus(error.message); }
    finally { setBusy(false); }
  };
  return <>
    <button className="btn primary" type="button" disabled={disabled} onClick={() => {const next = visualEditorDraft(site, content);lastSaved.current=JSON.stringify(next);setDraft(next);setOpen(true);}}>Επεξεργασία ιστοσελίδας</button>
    {open && ReactDOM.createPortal(<div className="visual-editor" role="dialog" aria-modal="true" aria-label="Επεξεργασία ιστοσελίδας">
      <header><button className="btn ghost visual-editor-close" type="button" aria-label="Κλείσιμο" title="Κλείσιμο" disabled={busy} onClick={close}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button><strong>Επεξεργασία ιστοσελίδας</strong><VisualPagePicker extraPages={extraPages} value={route} onChange={value=>{setRoute(value);setSelected(null);}}/><select aria-label="Γλώσσα προεπισκόπησης" value={lang} onChange={e=>setLang(e.target.value)}><option value="en">{narrow ? 'EN' : 'Αγγλικά'}</option><option value="gr">{narrow ? 'GR' : 'Ελληνικά'}</option></select><div className="visual-device-toggle" role="group" aria-label="Συσκευή προεπισκόπησης">
        <button type="button" aria-label="Προβολή υπολογιστή" title="Προβολή υπολογιστή" aria-pressed={!mobile} onClick={()=>setMobile(false)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="13" rx="2"/><path d="M12 16v5M8 21h8"/></svg></button>
        <button type="button" aria-label="Προβολή κινητού" title="Προβολή κινητού" aria-pressed={mobile} onClick={()=>setMobile(true)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4M11 19h2"/></svg></button>
      </div></header>
      <div className="visual-editor-body"><div className="visual-editor-preview"><iframe ref={frame} key={`${route}-${lang}`} onLoad={send} style={{width:mobile?'390px':'100%'}} src={`index.html?visualTextEditor=1&previewLang=${lang}#${route}`} title="Προεπισκόπηση κειμένων ιστοσελίδας" /></div>
      <aside>
        <div className="visual-text-catalogue"><label htmlFor="visual-text-search">Όλα τα κείμενα · EN / EL</label><input id="visual-text-search" type="search" placeholder="Αναζήτηση κειμένου ή πεδίου…" value={textSearch} onChange={event=>setTextSearch(event.target.value)}/><select aria-label="Επιλογή κειμένου" value={selected?.key || ''} onChange={event=>{const field=contentFields.find(item=>item.key===event.target.value);setSelected({key:event.target.value});if(field)setRoute(field.route);}}><option value="">Διάλεξε κείμενο ή πάτησε στην προεπισκόπηση</option>{[...Object.keys(window.DICT_I18N.en).filter(key=>typeof window.DICT_I18N.en[key]==='string').map(key=>({key,label:key.replaceAll('_',' ')})),...contentFields].filter(field=>`${field.label} ${visualEditorText(draft,field.key,'en')} ${visualEditorText(draft,field.key,'gr')}`.toLocaleLowerCase().includes(textSearch.toLocaleLowerCase())).map(field=><option key={field.key} value={field.key}>{field.label}</option>)}</select></div>
        <VisualEditorHelp key={`${route}-${lang}-${key || 'none'}`} compact={compact} selected={!!key}/>
        {key && <><VisualBilingualText key={key} draft={draft} textKey={key} onChange={changeText}/>
          <VisualTypographySettings key={`${key}-${lang}`} value={typography} size={selected.size} weight={selected.weight} compact={compact} onChange={value=>change('websiteTypography',value)} />
        </>}
        <div className="visual-editor-save"><p role="status">{draftState === "saving" ? "Αποθήκευση προχείρου…" : draftState === "error" ? "Δεν αποθηκεύτηκε στο cloud. Κλείσε τον επεξεργαστή και πάτησε Δοκιμή ξανά." : narrow ? "Αποθηκεύτηκε ως πρόχειρο" : "Το πρόχειρο αποθηκεύτηκε. Η δημοσίευση είναι ξεχωριστή."}</p><button className="btn primary" disabled={busy || draftState !== "saved"} onClick={publish}>{narrow ? "Δημοσίευση" : "Δημοσίευση αλλαγών"}</button>{status && <p className="visual-publish-status" role="status">{status}</p>}</div>
      </aside></div></div>, document.body)}
  </>;
}
window.VisualTextEditor = VisualTextEditor;
