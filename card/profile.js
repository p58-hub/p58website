export const DEFAULT_PROFILE = Object.freeze({
  firstName: 'Georgios', lastName: 'Grigoriadis', company: 'Project58',
  title: 'Founder', email: 'g.grigoriadis@project58.gr', phone: '',
  website: 'https://p58website.vercel.app/', address: 'Ακαδημίας 76, Αθήνα',
  photo: '/assets/people/georgios-grigoriadis.jpg', description: '',
});

export function normalizePhone(value = '') {
  let phone = String(value).replace(/[^+\d]/g, '').slice(0, 40);
  if (phone.startsWith('00')) phone = '+' + phone.slice(2);
  if (/^(?:2\d{9}|69\d{8})$/.test(phone)) phone = '+30' + phone;
  if (/^30(?:2\d{9}|69\d{8})$/.test(phone)) phone = '+' + phone;
  return phone;
}

export function normalizeProfile(input = {}, defaults = DEFAULT_PROFILE) {
  const profile = { ...defaults };
  for (const key of Object.keys(profile)) {
    if (typeof input?.[key] === 'string') profile[key] = key === 'description' ? normalizeMessage(input[key]) : input[key].replace(/[\r\n\x00-\x1f]/g, ' ').trim().slice(0, key === 'photo' ? 2048 : 180);
  }
  if (!profile.firstName && !profile.lastName) profile.firstName = defaults.firstName;
  profile.photo = safePhoto(profile.photo);
  profile.phone = normalizePhone(profile.phone);
  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) profile.email = '';
  try {
    const url = new URL(profile.website);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid website');
    profile.website = url.href;
  } catch { profile.website = ''; }
  return profile;
}

export const fullName = p => [p.firstName, p.lastName].filter(Boolean).join(' ');
const escapeVCard = value => String(value).replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');

// RFC 2426: CRLF, escaped values, and folding at 75 UTF-8 octets.
function fold(line) {
  const encoder = new TextEncoder();
  let result = '', length = 0;
  for (const character of line) {
    const bytes = encoder.encode(character).length;
    if (length + bytes > 75) { result += '\r\n '; length = 1; }
    result += character;
    length += bytes;
  }
  return result;
}

export function makeVCard(input) {
  const p = normalizeProfile(input), e = escapeVCard;
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${e(p.lastName)};${e(p.firstName)};;;`, `FN:${e(fullName(p))}`];
  if (p.company) lines.push(`ORG:${e(p.company)}`);
  if (p.title) lines.push(`TITLE:${e(p.title)}`);
  if (p.phone) lines.push(`TEL;TYPE=CELL:${e(p.phone.replace(/[ ()-]/g, ''))}`);
  if (p.email) lines.push(`EMAIL;TYPE=INTERNET:${e(p.email)}`);
  if (p.website) lines.push(`URL:${e(p.website)}`);
  if (p.address) lines.push(`ADR;TYPE=WORK:;;${e(p.address)};;;;`);
  lines.push('END:VCARD');
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function normalizeMessage(message = '') {
  return String(message).replace(/\r\n?/g, '\n').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '').trim().slice(0, 1000);
}
export function cardURL(origin, message = '', language = '', member = 'georgios') {
  const url = new URL('/card/contact', origin);
  if (!validCardId(member)) throw new Error('Invalid card ID');
  if (member !== 'georgios') url.searchParams.set('member', member);
  if (['el', 'en', 'fr'].includes(language)) url.searchParams.set('lang', language);
  const text = normalizeMessage(message);
  // A fragment travels with the shared card, but is not sent to the server.
  if (text) url.hash = new URLSearchParams({ message: text }).toString();
  return url.href;
}
export function cardMessage(hash = '') {
  if (hash.length > 12000) return '';
  return normalizeMessage(new URLSearchParams(hash.replace(/^#/, '')).get('message') || '');
}
export function shareText(profile, message) {
  return [normalizeMessage(message || ''), `${fullName(profile)} · ${profile.company}`].filter(Boolean).join('\n\n');
}
export function shareLinks(text, url, subject = 'Η κάρτα μου · Project58') {
  const body = `${text}\n${url}`;
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(body)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    email: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    sms: `sms:?body=${encodeURIComponent(body)}`,
  };
}

export const EMPTY_PROFILE = Object.freeze({ ...DEFAULT_PROFILE, firstName: '', lastName: '', title: '', email: '', phone: '', photo: '' });
export const validCardId = id => typeof id === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(id);
export function safePhoto(value = '') {
  if (!value) return '';
  const raw = String(value).trim();
  if (/^(?:\/?assets\/|\/api\/media-file\?)/.test(raw) && !/[\\\x00-\x20]/.test(raw)) return raw.startsWith('/') ? raw : '/' + raw;
  try { const url = new URL(raw); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
export function currentCardId(href) {
  const url = new URL(href), path = url.pathname.match(/^\/card\/member\/([^/]+)$/);
  const id = path ? path[1] : url.searchParams.get('member') ?? 'georgios';
  return validCardId(id) ? id : null;
}
export const ownerCardPath = id => id === 'georgios' ? '/card/georgios' : '/card/member/' + id;
export const cardCacheKey = id => id === 'georgios' ? 'p58-public-card-v1' : 'p58-public-card-v1:' + id;
export function memberProfile(member) {
  const parts = String(member.name || '').trim().split(/\s+/);
  return normalizeProfile({ ...EMPTY_PROFILE, firstName: parts.shift() || '', lastName: parts.join(' '), title: member.role || '', photo: member.portrait || '', email: member.email || '', phone: member.phone || '' }, EMPTY_PROFILE);
}
export function suggestedCardId(member) {
  if (String(member.name).trim().toLowerCase() === 'georgios grigoriadis') return 'georgios';
  const slug = String(member.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64).replace(/-$/, '');
  return slug || 'member-' + String(member._id || '').replace(/[^a-z0-9-]/gi, '').toLowerCase().slice(0, 50);
}
