// Member cards publish independently of the website draft.
window.BusinessCardSettings = function BusinessCardSettings({ team, ImageField, onDirty, onEditMember, onManageTeam }) {
  const [model, setModel] = React.useState(null);
  const [cards, setCards] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [memberView, setMemberView] = React.useState('website');
  const [profile, setProfile] = React.useState(null);
  const [id, setId] = React.useState('');
  const [memberId, setMemberId] = React.useState('');
  const [savedId, setSavedId] = React.useState('');
  const [dirty, setDirty] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState('');
  const [attempt, setAttempt] = React.useState(0);
  const formRef = React.useRef(null);
  React.useEffect(() => {
    let active = true;
    const abort = new AbortController();
    setLoading(true); setStatus('Φόρτωση καρτών…');
    Promise.all([window.P58CardModelReady, fetch('/api/card?list=1', { cache: 'no-store', credentials: 'same-origin', signal: abort.signal }).then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(response.status === 401 ? 'Η σύνδεση έληξε. Συνδέσου ξανά στο dashboard.' : body.message || 'Δεν ήταν δυνατή η φόρτωση των καρτών.');
      return body.cards;
    })]).then(([helpers, saved]) => { if (active) { setModel(helpers); setCards(saved); setStatus(''); setLoading(false); } }).catch(error => { if (active) { setLoading(false); setStatus(error.message); } });
    return () => { active = false; abort.abort(); };
  }, [attempt]);
  React.useEffect(() => { onDirty(dirty); return () => onDirty(false); }, [dirty]);
  React.useEffect(() => {
    const warn = event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const rows = model ? team.map((member, index) => {
    const saved = cards.find(card => (member._id && card.memberId === member._id) || model.fullName(card.profile).toLowerCase() === String(member.name).trim().toLowerCase());
    return { key: 'team:' + (member._id || index), member, saved, name: member.name };
  }) : [];
  for (const card of cards) if (!rows.some(row => row.saved?.id === card.id)) rows.push({ key: 'card:' + card.id, saved: card, name: model?.fullName(card.profile) || card.id });
  const selectedMember = rows.find(row => row.key === selected)?.member;
  function choose(row) {
    if (busy || (dirty && !window.confirm('Υπάρχουν μη αποθηκευμένες αλλαγές στην κάρτα. Να τις αφήσω και να ανοίξω το άλλο μέλος;'))) return;
    setSelected(row.key); setProfile(row.saved ? { ...row.saved.profile } : model.memberProfile(row.member));
    setId(row.saved?.id || model.suggestedCardId(row.member)); setSavedId(row.saved?.id || '');
    setMemberId(row.member?._id || row.saved?.memberId || ''); setDirty(false); setStatus('');
    if (!row.member) setMemberView('card');
  }
  const change = (key, value) => { setProfile(current => ({ ...current, [key]: value })); setDirty(true); };
  async function save() {
    if (!model.validCardId(id)) { setStatus('Ο σύνδεσμος δέχεται μικρά λατινικά γράμματα, αριθμούς και παύλες, έως 64 χαρακτήρες.'); return; }
    if (!profile.firstName.trim() && !profile.lastName.trim()) { setStatus('Συμπλήρωσε το όνομα του μέλους.'); return; }
    for (const input of formRef.current.querySelectorAll('input')) if (!input.reportValidity()) return;
    setBusy(true); setStatus('Αποθήκευση…');
    try {
      const response = await fetch('/api/card?id=' + encodeURIComponent(id), { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile, memberId, create: !savedId }), signal: AbortSignal.timeout(15000) });
      const body = await response.json();
      if (!response.ok) throw new Error(response.status === 401 ? 'Η σύνδεση έληξε. Συνδέσου ξανά στο dashboard.' : body.message || 'Η αποθήκευση δεν έγινε.');
      const card = { id: body.id, profile: body.profile, memberId, updatedAt: body.updatedAt };
      setCards(current => [...current.filter(item => item.id !== card.id), card]); setProfile(body.profile); setSavedId(card.id); setDirty(false);
      setStatus('Η κάρτα δημοσιεύτηκε. Μπορείς να ανοίξεις την κάρτα του μέλους ή του παραλήπτη.');
    } catch (error) {
      setStatus(error.name === 'TimeoutError' ? 'Η σύνδεση καθυστέρησε. Έλεγξε ξανά τις κάρτες πριν επαναλάβεις την αποθήκευση.' : error.message);
    } finally { setBusy(false); }
  }
  return <>
    <div className="section-head"><div><div className="eyebrow">/ Ομάδα Project58</div><h1>Ομάδα & κάρτες μελών</h1><p>Επίλεξε μέλος για να επεξεργαστείς τα κείμενά του στην ιστοσελίδα και την ψηφιακή κάρτα του.</p></div><div className="section-head-actions"><button className="btn ghost" type="button" onClick={onManageTeam}>Διαχείριση ομάδας</button></div></div>
    <div className="member-cards-layout">
      <div className="settings-card member-cards-list" aria-label="Μέλη και κάρτες">
        {loading ? <p>Φόρτωση…</p> : !model ? <button className="btn" type="button" onClick={() => setAttempt(value => value + 1)}>Δοκίμασε ξανά</button> : rows.map(row => <button key={row.key} type="button" disabled={busy} className={'member-card-row' + (selected === row.key ? ' selected' : '')} onClick={() => choose(row)} aria-pressed={selected === row.key}>
          <img src={model.safePhoto(row.saved?.profile.photo || row.member?.portrait) || '/card/avatar.svg'} alt="" /><span><strong>{row.name}</strong><small>{row.saved ? 'Δημοσιευμένη κάρτα' : 'Δημιουργία κάρτας'}</small></span>
        </button>)}
      </div>
      <div className="settings-card member-card-editor" ref={formRef}>
        {!profile ? <p>Επίλεξε μέλος από τη λίστα για τα κείμενα της ιστοσελίδας ή την κάρτα του.</p> : <>
          <h2>{selectedMember?.name || model.fullName(profile) || 'Νέα κάρτα'}</h2>
          {selectedMember && <div className="member-editor-tabs" role="group" aria-label="Περιεχόμενο μέλους">
            <button className={`btn ${memberView === 'website' ? 'primary' : 'ghost'}`} type="button" aria-pressed={memberView === 'website'} onClick={() => setMemberView('website')}>Κείμενα ιστοσελίδας</button>
            <button className={`btn ${memberView === 'card' ? 'primary' : 'ghost'}`} type="button" aria-pressed={memberView === 'card'} onClick={() => setMemberView('card')}>Ψηφιακή κάρτα</button>
          </div>}
          {selectedMember && memberView === 'website' && <section className="member-website-content" aria-label="Κείμενα μέλους στην ιστοσελίδα">
            <p className="muted">Αυτά εμφανίζονται στην ενότητα της ομάδας στην ιστοσελίδα. Αποθήκευσε τις αλλαγές και πάτησε «Δημοσίευση αλλαγών» στην πάνω μπάρα.</p>
            <div className="member-website-languages">{[['en','Αγγλικά','role','note'],['gr','Ελληνικά','role_gr','note_gr']].map(([lang,label,roleKey,noteKey]) => <div key={lang}><h3>{label}</h3><dl><dt>Ρόλος</dt><dd>{selectedMember[roleKey] || 'Δεν έχει συμπληρωθεί'}</dd><dt>Βιογραφικό / περιγραφή</dt><dd>{selectedMember[noteKey] || 'Δεν έχει συμπληρωθεί'}</dd></dl></div>)}</div>
            <button className="btn primary" type="button" onClick={() => onEditMember(selectedMember._id)}><window.P58DashboardIcon name="website" size={18}/> Επεξεργασία κειμένων ιστοσελίδας</button>
          </section>}
          <div hidden={Boolean(selectedMember) && memberView !== 'card'}>
          <p className="muted">Αυτά τα στοιχεία θα είναι δημόσια στην κάρτα. Η αποθήκευση τα δημοσιεύει αμέσως, ξεχωριστά από το πρόχειρο της ιστοσελίδας.</p>
          <fieldset disabled={busy} className="member-card-fields">
            <div className="field-group"><label className="field">Όνομα<input aria-label="Όνομα κάρτας" value={profile.firstName} maxLength="180" onChange={e => change('firstName', e.target.value)} /></label><label className="field">Επώνυμο<input aria-label="Επώνυμο κάρτας" value={profile.lastName} maxLength="180" onChange={e => change('lastName', e.target.value)} /></label></div>
            <div className="field-group"><label className="field">Ιδιότητα<input value={profile.title} maxLength="180" onChange={e => change('title', e.target.value)} /></label><label className="field">Εταιρεία<input value={profile.company} maxLength="180" onChange={e => change('company', e.target.value)} /></label></div>
            <div className="field-group"><label className="field">Τηλέφωνο<input type="tel" value={profile.phone} maxLength="40" placeholder="+30 …" onChange={e => change('phone', e.target.value)} /></label><label className="field">Email<input type="email" value={profile.email} maxLength="180" onChange={e => change('email', e.target.value)} /></label></div>
            <div className="field-group"><label className="field">Website<input type="url" value={profile.website} maxLength="180" onChange={e => change('website', e.target.value)} /></label><label className="field">Διεύθυνση γραφείου<input value={profile.address} maxLength="180" onChange={e => change('address', e.target.value)} /></label></div>
            <label className="field member-card-description">Περιγραφή<textarea value={profile.description || ''} rows="3" maxLength="1000" placeholder="Λίγα λόγια για το μέλος και τη δουλειά του…" onChange={e => change('description', e.target.value)} /><small>{(profile.description || '').length} / 1000</small></label>
            <div className="form-section"><div className="form-section-title">Φωτογραφία κάρτας</div><ImageField value={profile.photo || ''} onChange={value => change('photo', value)} placeholder="Φωτογραφία μέλους" /></div>
            <label className="field">Σύνδεσμος μέλους<input aria-label="Σύνδεσμος μέλους" value={id} readOnly={Boolean(savedId)} maxLength="64" onChange={e => { setId(e.target.value); setDirty(true); }} /><small>{location.origin}{model.ownerCardPath(id || 'member')}</small></label>
            <p className="muted">Άφησε κενά τα στοιχεία που δεν θέλεις να μοιράζεται το μέλος. Τα προσωπικά μηνύματα γράφονται κατά την αποστολή.</p>
          </fieldset>
          <div className="settings-foot"><button className="btn primary" type="button" disabled={busy || (Boolean(savedId) && !dirty)} onClick={save}>{busy ? 'Αποθήκευση…' : savedId ? 'Αποθήκευση & δημοσίευση' : 'Δημιουργία & δημοσίευση κάρτας'}</button></div>
          {savedId && <div className="member-card-links"><a className="btn" href={model.ownerCardPath(savedId)} target="_blank" rel="noopener">Κάρτα μέλους <window.P58DashboardIcon name="external" size={16}/></a><a className="btn" href={model.cardURL(location.origin, '', 'el', savedId)} target="_blank" rel="noopener">Κάρτα παραλήπτη <window.P58DashboardIcon name="external" size={16}/></a></div>}
          </div>
        </>}
      </div>
    </div>
    <p role="status" aria-live="polite">{status}</p>
  </>;
};
