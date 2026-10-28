import { DEFAULT_PROFILE, EMPTY_PROFILE, currentCardId, cardCacheKey, normalizeProfile, ownerCardPath } from './profile.js';
export const memberId = currentCardId(location.href);
export const defaults = memberId === 'georgios' ? DEFAULT_PROFILE : EMPTY_PROFILE;
export const cacheKey = cardCacheKey(memberId || 'invalid');
export const profileEndpoint = '/api/card?id=' + encodeURIComponent(memberId || 'invalid!');
export let hasProfile = memberId === 'georgios';
export function initialProfile() {
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (memberId && cached && (cached.firstName || cached.lastName)) { hasProfile = true; return normalizeProfile(cached, defaults); }
  } catch { /* Private mode or old cache. */ }
  return normalizeProfile(defaults, defaults);
}
export function profileAvailable(available) {
  hasProfile = available;
  document.documentElement.classList.remove('loading-member');
  for (const element of document.querySelectorAll('.identity,.contact-details,.connect-bar')) element.hidden = !available;
}
export function updateMemberLinks() {
  const settings = document.querySelector('a[href^="/card/settings"]');
  if (settings && memberId !== 'georgios') {
    const url = new URL(settings.href); url.searchParams.set('member', memberId); settings.href = url.pathname + url.search;
  }
  if (memberId && memberId !== 'georgios') {
    const manifest = document.querySelector('link[rel="manifest"]');
    if (manifest) manifest.href = profileEndpoint + '&manifest=1';
  }
}
