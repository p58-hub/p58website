function VisualTextEditor({ site, onSave, onPublish }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(() => ({websiteTexts: site.websiteTexts || {}, websiteTypography: site.websiteTypography || {}}));
  const [lang, setLang] = React.useState('en');
  const [route, setRoute] = React.useState('home');
  const [mobile, setMobile] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [status, setStatus] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const frame = React.useRef(null);
  const draftRef = React.useRef(draft);
  draftRef.current = draft;
  const send = () => frame.current?.contentWindow?.postMessage({type:'p58:text-preview', ...draftRef.current, selected: selected?.key}, location.origin);
  React.useEffect(() => { send(); }, [draft, selected]);
  React.useEffect(() => {
    const receive = event => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === 'p58:text-ready') send();
      if (event.data?.type === 'p58:text-selected' && typeof window.DICT_I18N?.en?.[event.data.key] === 'string') setSelected(event.data);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [selected]);
  const key = selected?.key;
  const text = key ? (draft.websiteTexts[lang]?.[key] ?? window.DICT_I18N[lang]?.[key] ?? window.DICT_I18N.en[key]) : '';
  const typography = draft.websiteTypography[lang]?.[key] || {};
  const change = (field, value) => {
    setStatus('Unsaved changes');
    setDraft(current => ({...current, [field]: {...current[field], [lang]: {...current[field][lang], [key]: value}}}));
  };
  const save = () => { onSave(draft); setStatus('Draft saved. Not published.'); };
  const publish = async () => {
    setBusy(true); setStatus('Publishing text changes…');
    try { onSave(draft); await onPublish(draft); setStatus('Text and typography published.'); }
    catch(error) { setStatus(error.message); }
    finally { setBusy(false); }
  };
  return <>
    <button className="btn primary" type="button" onClick={() => {setDraft({websiteTexts:site.websiteTexts || {}, websiteTypography:site.websiteTypography || {}});setOpen(true);}}>Open visual text editor</button>
    {open && <div className="visual-editor" role="dialog" aria-modal="true" aria-label="Visual text editor">
      <header><strong>Visual text editor</strong><select aria-label="Preview page" value={route} onChange={e=>{setRoute(e.target.value);setSelected(null);}}><option value="home">Home</option><option value="projects">Projects</option><option value="agency">People & studio</option><option value="contact">Contact</option><option value="start">Inquiry</option></select><select aria-label="Editor language" value={lang} onChange={e=>{setLang(e.target.value);setSelected(null);}}><option value="en">English</option><option value="gr">Ελληνικά</option></select><button className="btn ghost" onClick={()=>setMobile(!mobile)}>{mobile ? 'Desktop preview' : 'Mobile preview'}</button><button className="btn ghost" disabled={busy} onClick={()=>{setOpen(false);setSelected(null);setStatus('');}}>Discard & close</button><button className="btn ghost" disabled={busy} onClick={()=>{save();setOpen(false);}}>Save & close</button></header>
      <div className="visual-editor-body"><div className="visual-editor-preview"><iframe ref={frame} key={`${route}-${lang}`} onLoad={send} style={{width:mobile?'390px':'100%'}} src={`index.html?visualTextEditor=1&previewLang=${lang}#${route}`} title="Live website text preview" /></div>
      <aside><h3>{key ? 'Edit selected text' : 'Click text in the preview'}</h3><p>Outlined text is editable. Layout and images are locked. Use the page menu to navigate.</p>
        {key && <><label>Text<textarea rows="7" value={text} onChange={e=>change('websiteTexts',e.target.value)} /></label><label>Font<select value={typography.font || ''} onChange={e=>change('websiteTypography',{...typography,font:e.target.value})}><option value="">Site default</option><option value="sans">Inter Tight</option><option value="mono">JetBrains Mono</option><option value="serif">Georgia</option></select></label><label>Size (px)<input type="number" min="10" max="160" placeholder={String(Math.round(selected.size))} value={typography.size ?? ''} onChange={e=>{const n=Number(e.target.value);if(!e.target.value || n>=10&&n<=160)change('websiteTypography',{...typography,size:e.target.value?n:undefined});}} /></label><label>Weight<select value={typography.weight || ''} onChange={e=>change('websiteTypography',{...typography,weight:Number(e.target.value)||undefined})}><option value="">Site default</option>{[300,400,500,600,700].map(w=><option key={w} value={w}>{w}</option>)}</select></label><button className="btn ghost" onClick={()=>change('websiteTypography',{})}>Reset typography</button><small>Fixed sizes apply at all screen widths. Reset typography to restore responsive sizing.</small></>}
        <div className="visual-editor-save"><button className="btn ghost" disabled={busy} onClick={save}>Save draft</button><button className="btn primary" disabled={busy} onClick={publish}>Publish text only</button><p role="status">{status}</p></div>
      </aside></div></div>}
  </>;
}
window.VisualTextEditor = VisualTextEditor;
