import { memberId, defaults, cacheKey, profileEndpoint, hasProfile, initialProfile, profileAvailable, updateMemberLinks } from './context.js';
import { renderContactDetails } from './details.js';
import { DEFAULT_PROFILE, normalizeProfile, fullName, makeVCard, cardURL, normalizeMessage, shareText, shareLinks } from './profile.js';
import { getLanguage, t } from './language.js';

const $ = id => document.getElementById(id);
let url = cardURL(location.origin, '', '', memberId || 'georgios');
let nfcURL = cardURL(location.origin, '', getLanguage(), memberId || 'georgios');
let profile = initialProfile(), qrImage = '', nfcAbort = null, message = '';
const messageDrafts = { el: '', en: '', fr: '' };
let previousLanguage = getLanguage();
const status = text => { $('sheet-status').textContent = text; };
const notice = text => { $('notice').textContent = text; };

function contactFile() { return new File([makeVCard(profile)], (memberId || 'contact') + '.vcf', { type: 'text/vcard' }); }
function canShareFile() {
  try { return Boolean(navigator.share && navigator.canShare?.({ files: [contactFile()] })); } catch { return false; }
}
function updateShareLinks() {
  url = cardURL(location.origin, message, getLanguage(), memberId || 'georgios');
  nfcURL = cardURL(location.origin, '', getLanguage(), memberId || 'georgios');
  $('nfc-url').value = nfcURL;
  const text = shareText(profile, message);
  const links = shareLinks(text, url, t('Η κάρτα μου · Project58'));
  for (const [key, href] of Object.entries(links)) $('share-' + key).href = href;
  $('copy-text').value = `${text}\n${url}`;
  $('intro-message').textContent = message || t('Το προσωπικό σου μήνυμα εδώ.');
  $('share-message-preview').textContent = message || t('Χωρίς προσωπικό μήνυμα.');
}
function openMessageEditor() {
  $('message').value = message;
  $('message-count').textContent = `${message.length} / 1000`;
  $('edit-message').hidden = true;
  $('edit-message').setAttribute('aria-expanded', 'true');
  $('message-edit-hint').hidden = true;
  $('message-editor').hidden = false;
  $('message').focus();
  $('message').setSelectionRange(message.length, message.length);
}
function closeMessageEditor(apply) {
  if (apply) message = normalizeMessage($('message').value);
  $('message-editor').hidden = true;
  $('edit-message').hidden = false;
  $('edit-message').setAttribute('aria-expanded', 'false');
  $('message-edit-hint').hidden = false;
  updateShareLinks();
  $('edit-message').focus();
}
$('edit-message').addEventListener('click', openMessageEditor);
$('apply-message').addEventListener('click', () => closeMessageEditor(true));
$('cancel-message').addEventListener('click', () => closeMessageEditor(false));
$('edit-message-from-share').addEventListener('click', () => { $('connect-dialog').close(); openMessageEditor(); });
$('message').addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); closeMessageEditor(false); }
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); closeMessageEditor(true); }
});
function renderQR() {
  try {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
    const contact = $('qr-kind').value === 'contact';
    const qr = qrcode(0, 'M');
    qr.addData(contact ? makeVCard(profile) : nfcURL, 'Byte');
    qr.make();
    // Four-module quiet zone, integer module sizes, no artistic occlusion.
    qrImage = qr.createDataURL(8, 32);
    const img = new Image(); img.src = qrImage;
    img.alt = contact ? 'QR με τα στοιχεία της επαφής' : 'QR για την προσωπική σελίδα';
    $('qr-code').replaceChildren(img);
    $('qr-code').setAttribute('aria-label', img.alt);
    $('qr-description').textContent = contact
      ? 'Ο άλλος σκανάρει και επιβεβαιώνει την αποθήκευση. Λειτουργεί και χωρίς internet.'
      : 'Ο άλλος ανοίγει τη σελίδα σου με τα στοιχεία επικοινωνίας. Χρειάζεται internet.';
    $('download-qr').disabled = false;
  } catch {
    qrImage = ''; $('download-qr').disabled = true;
    $('qr-code').textContent = 'Δεν ήταν δυνατή η δημιουργία QR. Χρησιμοποίησε την αποστολή συνδέσμου ή το αρχείο επαφής.';
  }
}
function renderProfile() {
  profileAvailable(hasProfile);
  updateMemberLinks();
  const portrait = document.querySelector('.portrait');
  portrait.src = profile.photo || '/card/avatar.svg';
  portrait.alt = fullName(profile);
  $('first-name').textContent = profile.firstName;
  $('last-name').textContent = profile.lastName ? profile.lastName + '.' : '';
  $('role').textContent = [t(profile.title), profile.company].filter(Boolean).join(' · ');
  document.title = `${fullName(profile)} · Project58 Card`;
  renderContactDetails(profile, t);
  $('attachment-option').hidden = !canShareFile();
  $('native-share').hidden = !navigator.share;
  updateShareLinks(); renderQR();
}
function cancelNFC() { nfcAbort?.abort(); nfcAbort = null; }
function tab(name, focus = false) {
  if (name !== 'nfc') cancelNFC();
  for (const button of document.querySelectorAll('[data-tab]')) {
    const selected = button.dataset.tab === name;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    $(button.dataset.tab + '-panel').hidden = !selected;
    if (selected && focus) button.focus();
  }
  status('');
}
document.querySelectorAll('[data-tab]').forEach(button => {
  button.addEventListener('click', () => tab(button.dataset.tab));
  button.addEventListener('keydown', event => {
    const tabs = ['qr', 'share', 'nfc'], i = tabs.indexOf(button.dataset.tab);
    let next;
    if (event.key === 'ArrowRight') next = (i + 1) % 3;
    if (event.key === 'ArrowLeft') next = (i + 2) % 3;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = 2;
    if (next !== undefined) { event.preventDefault(); tab(tabs[next], true); }
  });
});
$('connect').addEventListener('click', () => {
  if (!$('message-editor').hidden) closeMessageEditor(true);
  tab('qr'); $('connect-dialog').showModal();
});
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('connect-dialog').addEventListener('close', () => { cancelNFC(); $('manual-copy').hidden = true; });
window.addEventListener('pagehide', cancelNFC);
$('qr-kind').addEventListener('change', renderQR);
$('download-qr').addEventListener('click', () => {
  if (!qrImage) return;
  const a = document.createElement('a'); a.href = qrImage;
  a.download = $('qr-kind').value === 'contact' ? 'project58-contact-qr.gif' : 'project58-page-qr.gif';
  document.body.append(a); a.click(); a.remove();
});
$('message').addEventListener('input', () => { $('message-count').textContent = `${$('message').value.length} / 1000`; });
$('clear-message').addEventListener('click', () => { $('message').value = ''; $('message-count').textContent = '0 / 1000'; $('message').focus(); });
$('native-share').addEventListener('click', async () => {
  const payload = { title: `${fullName(profile)} · ${profile.company}`, text: shareText(profile, message), url };
  if ($('attach-contact').checked && canShareFile()) payload.files = [contactFile()];
  try {
    // No async work before share(): preserve the button's user activation.
    await navigator.share(payload);
    status('Η κάρτα δόθηκε στο μενού κοινοποίησης του κινητού.');
  } catch (error) {
    if (error.name === 'AbortError') return;
    status('Η κοινοποίηση δεν είναι διαθέσιμη εδώ. Δοκίμασε μια εφαρμογή παρακάτω ή την αντιγραφή.');
  }
});
async function copy(text, input) {
  try { await navigator.clipboard.writeText(text); status('Αντιγράφηκε.'); }
  catch {
    if (input === $('copy-text')) $('manual-copy').hidden = false;
    input.value = text; input.focus(); input.select();
    status('Επίλεξε «Αντιγραφή» στο επιλεγμένο κείμενο.');
  }
}
$('copy-share').addEventListener('click', () => copy($('copy-text').value, $('copy-text')));
$('nfc-url').value = nfcURL;
$('copy-nfc').addEventListener('click', () => copy(nfcURL, $('nfc-url')));
if ('NDEFReader' in window && window.isSecureContext) {
  $('nfc-write-area').hidden = false;
  $('nfc-help').textContent = 'Η συσκευή σου διαθέτει Web NFC. Ενεργοποίησε το NFC και κράτησε την κάρτα κοντά στο πίσω μέρος του κινητού μέχρι να ολοκληρωθεί η εγγραφή.';
}
$('write-nfc').addEventListener('click', async () => {
  if (!('NDEFReader' in window)) return;
  const controller = new AbortController(); nfcAbort = controller;
  $('write-nfc').disabled = true; $('cancel-nfc').hidden = false;
  $('nfc-status').textContent = 'Περιμένω μια κενή κάρτα NFC…';
  try {
    await new NDEFReader().write({ records: [{ recordType: 'url', data: nfcURL }] }, { overwrite: false, signal: controller.signal });
    $('nfc-status').textContent = 'Ο σύνδεσμος γράφτηκε στην κάρτα NFC. Δοκίμασέ την με ένα δεύτερο κινητό.';
  } catch (error) {
    $('nfc-status').textContent = error.name === 'AbortError' ? 'Η εγγραφή ακυρώθηκε.' : error.name === 'NotAllowedError'
      ? 'Δεν δόθηκε άδεια NFC. Επίτρεψε την πρόσβαση και δοκίμασε ξανά.'
      : 'Η εγγραφή δεν έγινε. Έλεγξε ότι το NFC είναι ενεργό και η κάρτα είναι κενή και εγγράψιμη.';
  } finally {
    if (nfcAbort === controller) nfcAbort = null;
    $('write-nfc').disabled = false; $('cancel-nfc').hidden = true;
  }
});
$('cancel-nfc').addEventListener('click', cancelNFC);
function connectionStatus() { $('connection-status').textContent = navigator.onLine ? 'DIGITAL CARD' : 'OFFLINE · QR ΕΤΟΙΜΟ'; }
window.addEventListener('online', () => { connectionStatus(); loadProfile(); });
window.addEventListener('offline', connectionStatus);
window.addEventListener('pageshow', event => { if (event.persisted) loadProfile(); });
async function loadProfile() {
  try {
    const response = await fetch(profileEndpoint, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (response.status === 404 || response.status === 400) { profileAvailable(false); throw new Error('missing'); }
    if (!response.ok) throw new Error('profile unavailable');
    const data = await response.json();
    if (!data.profile || typeof data.profile !== 'object') throw new Error('invalid profile');
    profile = normalizeProfile(data.profile, defaults);
    profileAvailable(true);
    try { localStorage.setItem(cacheKey, JSON.stringify(profile)); } catch { /* Private mode. */ }
    notice(''); renderProfile();
  } catch {
    // Keep the last public profile; never cache drafts or messages.
    notice(hasProfile ? 'Εμφανίζονται τα τελευταία διαθέσιμα στοιχεία.' : 'Η κάρτα δεν είναι διαθέσιμη.');
  }
}
window.addEventListener('cardlanguagechange', () => {
  messageDrafts[previousLanguage] = $('message-editor').hidden ? message : normalizeMessage($('message').value);
  previousLanguage = getLanguage();
  message = messageDrafts[previousLanguage];
  $('message').value = message;
  $('message-count').textContent = `${message.length} / 1000`;
  cancelNFC(); renderProfile(); connectionStatus();
});
renderProfile(); connectionStatus(); loadProfile();
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('/card/sw.js', { scope: '/card/' }).catch(() => notice('Η κάρτα λειτουργεί online. Η αποθήκευση για offline χρήση δεν ήταν διαθέσιμη.'));
}
