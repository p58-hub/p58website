import { translations, languages, normalizeLanguage, translate } from './locales.js';

const preferenceKey = 'p58-card-language';
let saved = '';
try { saved = localStorage.getItem(preferenceKey) || ''; } catch { /* Private mode. */ }
const requested = new URL(location.href).searchParams.get('lang');
let language = normalizeLanguage(languages.includes(requested) ? requested : saved || navigator.language?.split('-')[0]);
export const getLanguage = () => language;
export const t = text => translate(text, language);

const reverse = new Map();
for (const [source, variants] of Object.entries(translations)) {
  reverse.set(source, source);
  for (const value of Object.values(variants)) reverse.set(value, source);
}
const textSources = new WeakMap(), attributeSources = new WeakMap();
const excluded = 'script,style,noscript,textarea,.language-picker,#profile-description,#recipient-message,#intro-message,#share-message-preview,#message-count,#first-name,#last-name,#role,#phone-value,#email-value,#website-value,#address-value';

function translatePage() {
  document.documentElement.lang = language;
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  for (let node; (node = walker.nextNode());) {
    if (node.parentElement?.closest(excluded)) continue;
    const raw = node.nodeValue, previous = textSources.get(node);
    const source = previous?.last === raw ? previous.source : reverse.get(raw.trim());
    if (!source) continue;
    const value = raw.slice(0, raw.length - raw.trimStart().length) + t(source) + raw.slice(raw.trimEnd().length);
    textSources.set(node, { source, last: value });
    if (raw !== value) node.nodeValue = value;
  }
  for (const element of document.querySelectorAll('[aria-label],[placeholder]')) {
    const sources = attributeSources.get(element) || {};
    for (const attribute of ['aria-label', 'placeholder']) {
      const raw = element.getAttribute(attribute);
      if (!raw) continue;
      const previous = sources[attribute];
      const source = previous?.last === raw ? previous.source : reverse.get(raw);
      if (!source) continue;
      const value = t(source);
      sources[attribute] = { source, last: value };
      if (value !== raw) element.setAttribute(attribute, value);
    }
    attributeSources.set(element, sources);
  }
}

function updateLinks() {
  for (const link of document.querySelectorAll('a[href^="/card/"]')) {
    const url = new URL(link.getAttribute('href'), location.origin);
    url.searchParams.set('lang', language);
    link.href = url.pathname + url.search + url.hash;
  }
  const signIn = document.getElementById('sign-in');
  if (signIn) signIn.href = '/login?next=' + encodeURIComponent('/card/settings?lang=' + language + (new URL(location.href).searchParams.has('member') ? '&member=' + encodeURIComponent(new URL(location.href).searchParams.get('member')) : ''));
}

const picker = document.getElementById('card-language');
if (picker) {
  picker.value = language;
  picker.addEventListener('change', () => {
    language = normalizeLanguage(picker.value);
    try { localStorage.setItem(preferenceKey, language); } catch { /* Private mode. */ }
    const url = new URL(location.href);
    url.searchParams.set('lang', language);
    history.replaceState(null, '', url);
    translatePage(); updateLinks();
    window.dispatchEvent(new Event('cardlanguagechange'));
  });
}
translatePage(); updateLinks();
// Translate app-generated notices while leaving profile values and personal text untouched.
new MutationObserver(translatePage).observe(document.documentElement, {
  subtree: true, childList: true, characterData: true,
  attributes: true, attributeFilter: ['aria-label', 'placeholder'],
});
