import { memberId, cacheKey, profileEndpoint } from './context.js';
import { DEFAULT_PROFILE, ownerCardPath } from './profile.js';
import './language.js';
const form = document.getElementById('settings-form');
const fields = document.getElementById('profile-fields');
const button = document.getElementById('save-settings');
const status = document.getElementById('settings-status');
let dirty = false;
const back = document.querySelector('.topbar a');
back.href = ownerCardPath(memberId || 'georgios') + location.search;
function fill(profile) { for (const key of Object.keys(DEFAULT_PROFILE)) form.elements[key].value = profile[key] || ''; }
function requireLogin() {
  status.textContent = 'Η σύνδεση έχει λήξει. Συνδέσου ξανά για να αποθηκεύσεις.';
  document.getElementById('sign-in').hidden = false;
}
form.addEventListener('input', () => { dirty = true; });
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
form.addEventListener('submit', async event => {
  event.preventDefault();
  const profile = Object.fromEntries(Object.keys(DEFAULT_PROFILE).map(key => [key, form.elements[key].value.trim()]));
  if (!profile.firstName && !profile.lastName) { status.textContent = 'Συμπλήρωσε όνομα ή επώνυμο.'; return; }
  button.disabled = true; fields.disabled = true; status.textContent = 'Αποθήκευση…';
  try {
    const response = await fetch(profileEndpoint, { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile }), signal: AbortSignal.timeout(15000) });
    if (response.status === 401) { requireLogin(); return; }
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Η αποθήκευση δεν έγινε. Δοκίμασε ξανά.');
    fill(data.profile); dirty = false;
    try { localStorage.setItem(cacheKey, JSON.stringify(data.profile)); } catch { /* Private mode. */ }
    status.textContent = 'Τα στοιχεία αποθηκεύτηκαν και δημοσιεύτηκαν στην κάρτα σου.';
  } catch (error) {
    status.textContent = error.name === 'TimeoutError' ? 'Η σύνδεση καθυστέρησε. Άνοιξε ξανά τις ρυθμίσεις για να ελέγξεις αν αποθηκεύτηκαν.' : error.message || 'Δεν ήταν δυνατή η αποθήκευση.';
  } finally { button.disabled = false; fields.disabled = false; }
});
async function load() {
  try {
    const session = await fetch('/api/session', { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(8000) });
    if (!session.ok) { requireLogin(); return; }
    const response = await fetch(profileEndpoint, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Δεν ήταν δυνατή η φόρτωση των στοιχείων. Ανανέωσε τη σελίδα.');
    const data = await response.json();
    fill(data.profile);
    if (!data.configured) { status.textContent = 'Η αποθήκευση δεν είναι διαθέσιμη: χρειάζεται να ολοκληρωθεί η σύνδεση Firebase του site.'; return; }
    fields.disabled = false; button.disabled = false;
    status.textContent = 'Οι αλλαγές δημοσιεύονται όταν πατήσεις αποθήκευση.';
  } catch (error) { status.textContent = error.message || 'Δεν ήταν δυνατή η φόρτωση. Ανανέωσε τη σελίδα.'; }
}
load();
