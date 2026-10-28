import { memberId, defaults, cacheKey, profileEndpoint, hasProfile, initialProfile, profileAvailable, updateMemberLinks } from './context.js';
import { renderContactDetails } from './details.js';
import { DEFAULT_PROFILE, normalizeProfile, fullName, makeVCard, cardMessage } from './profile.js';
import { getLanguage, t } from './language.js';
import { localizedMessage } from './locales.js';

const $ = id => document.getElementById(id);
let profile = initialProfile();

function renderMessage() {
  const message = localizedMessage(cardMessage(location.hash), getLanguage());
  $('recipient-message').textContent = message;
  $('recipient-message').hidden = !message;
  $('default-message').hidden = Boolean(message);
}
renderMessage();
window.addEventListener('hashchange', renderMessage);

function renderProfile() {
  profileAvailable(hasProfile);
  updateMemberLinks();
  const portrait = document.querySelector('.portrait');
  portrait.src = profile.photo || '/card/avatar.svg';
  portrait.alt = fullName(profile);
  $('first-name').textContent = profile.firstName;
  $('last-name').textContent = profile.lastName ? profile.lastName + '.' : '';
  $('role').textContent = [t(profile.title), profile.company].filter(Boolean).join(' · ');
  document.title = `${fullName(profile)} · ${profile.company}`;
  document.querySelector('.portrait').alt = fullName(profile);
  renderContactDetails(profile, t);
  $('save-contact').disabled = false;
}

$('save-contact').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([makeVCard(profile)], { type: 'text/vcard;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = (memberId || 'contact') + '.vcf';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  $('contact-status').textContent = 'Άνοιξε το αρχείο επαφής και επίλεξε αποθήκευση στο κινητό σου.';
});

async function loadProfile() {
  try {
    const response = await fetch(profileEndpoint, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (response.status === 404 || response.status === 400) { profileAvailable(false); throw new Error('missing'); }
    if (!response.ok) throw new Error('Profile unavailable');
    const data = await response.json();
    if (!data.profile || typeof data.profile !== 'object') throw new Error('Invalid profile');
    profile = normalizeProfile(data.profile, defaults);
    profileAvailable(true);
    try { localStorage.setItem(cacheKey, JSON.stringify(profile)); } catch { /* Private mode. */ }
    $('contact-status').textContent = ''; renderProfile();
  } catch { $('contact-status').textContent = hasProfile ? 'Εμφανίζονται τα τελευταία διαθέσιμα στοιχεία.' : 'Η κάρτα δεν είναι διαθέσιμη.'; }
}
window.addEventListener('cardlanguagechange', () => { renderProfile(); renderMessage(); });
renderProfile();
loadProfile();
window.addEventListener('online', loadProfile);
window.addEventListener('pageshow', event => { if (event.persisted) loadProfile(); });
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('/card/sw.js', { scope: '/card/' }).catch(() => {});
}
