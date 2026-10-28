import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { DEFAULT_PROFILE, normalizeProfile, makeVCard, cardURL, cardMessage, shareText, shareLinks } from '../../card/profile.js';
import { translations, languages, translate, localizedMessage } from '../../card/locales.js';
import { renderContactDetails } from '../../card/details.js';

test('profile descriptions preserve paragraphs, stay bounded and render as plain text', () => {
  const description = '  Αρχιτέκτονας\r\n<script>alert(1)</script>\u0000  ';
  const profile = normalizeProfile({ description });
  assert.equal(profile.description, 'Αρχιτέκτονας\n<script>alert(1)</script>');
  assert.equal(normalizeProfile({ description: 'α'.repeat(1200) }).description.length, 1000);
  assert.equal(normalizeProfile({}).description, '');
  // A long public biography must not make the offline contact QR too large.
  assert.equal(makeVCard(profile), makeVCard(DEFAULT_PROFILE));
  const elements = new Map();
  const originalDocument = globalThis.document;
  globalThis.document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { toggleAttribute() {} });
    return elements.get(id);
  } };
  try {
    renderContactDetails(profile, value => value);
    assert.equal(elements.get('profile-description').textContent, profile.description);
    assert.equal(elements.get('profile-description').hidden, false);
    renderContactDetails(normalizeProfile({ description: '' }), value => value);
    assert.equal(elements.get('profile-description').hidden, true);
    assert.equal(elements.get('profile-description').textContent, '');
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});

test('vCard preserves Greek names, escapes delimiters and folds UTF-8 without splitting characters', () => {
  const source = { ...DEFAULT_PROFILE, firstName: 'Γεώργιος', lastName: 'Γρηγοριάδης', company: 'Studio; one, two\\three', address: 'Α'.repeat(100), phone: '+30 (690) 123-4567' };
  const card = makeVCard(source), unfolded = card.replace(/\r\n /g, '');
  assert.ok(card.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n'));
  assert.ok(card.endsWith('END:VCARD\r\n'));
  assert.ok(unfolded.includes('N:Γρηγοριάδης;Γεώργιος;;;'));
  assert.ok(unfolded.includes('ORG:Studio\\; one\\, two\\\\three'));
  assert.ok(unfolded.includes('TEL;TYPE=CELL:+306901234567'));
  for (const line of card.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
});
test('untrusted profile values cannot inject vCard fields or unsafe links', () => {
  const p = normalizeProfile({ firstName: 'Name\r\nURL:javascript:bad', website: 'javascript:alert(1)', phone: '', email: 'bad\nmail', unknown: 'private' });
  assert.equal(p.website, ''); assert.equal(p.email, ''); assert.equal(p.unknown, undefined);
  assert.ok(!makeVCard(p).includes('\r\nURL:'));
  assert.ok(!makeVCard(p).includes('TEL;'));
});
test('Greek contact numbers include +30 once in the saved contact', () => {
  for (const phone of ['6984678303', '+30 698 467 8303', '00306984678303', '306984678303']) {
    const profile = normalizeProfile({ phone });
    assert.equal(profile.phone, '+306984678303');
    assert.ok(makeVCard(profile).includes('TEL;TYPE=CELL:+306984678303\r\n'));
  }
  assert.equal(normalizeProfile({ phone: '2101234567' }).phone, '+302101234567');
  assert.equal(normalizeProfile({ phone: '+44 7700 900123' }).phone, '+447700900123');
  assert.equal(normalizeProfile({ phone: '' }).phone, '');
});
test('sharing without a personal card message keeps the basic recipient URL', () => {
  const url = cardURL('https://p58website.vercel.app');
  const text = shareText(DEFAULT_PROFILE, 'Χάρηκα! & see you #soon');
  assert.equal(url, 'https://p58website.vercel.app/card/contact');
  const links = shareLinks(text, url);
  assert.equal(new URL(links.whatsapp).searchParams.get('text'), `${text}\n${url}`);
  assert.equal(new URL(links.telegram).searchParams.get('url'), url);
  assert.ok(!makeVCard(DEFAULT_PROFILE).includes('Χάρηκα'));
});
test('each shared card preserves its own Unicode message without sending it in the server URL', () => {
  const message = 'Χάρηκα! 👋\nΑς μιλήσουμε & πάλι #soon <b>κυριολεκτικά</b>';
  const first = new URL(cardURL('https://p58website.vercel.app', message));
  assert.equal(first.search, '');
  assert.equal(first.pathname, '/card/contact');
  assert.equal(cardMessage(first.hash), message);
  const second = new URL(cardURL(first.origin, 'Δεύτερο μήνυμα'));
  assert.equal(cardMessage(first.hash), message);
  assert.equal(cardMessage(second.hash), 'Δεύτερο μήνυμα');
  const links = shareLinks(shareText(DEFAULT_PROFILE, message), first.href);
  assert.equal(new URL(links.telegram).searchParams.get('url'), first.href);
  assert.ok(new URL(links.whatsapp).searchParams.get('text').endsWith(first.href));
  assert.equal(cardMessage(new URL(cardURL(first.origin, '   ')).hash), '');
  assert.equal(cardMessage('#message=' + 'x'.repeat(15000)), '');
  assert.equal(cardMessage('#message=%ZZ'), '%ZZ');
  assert.equal(cardMessage(new URL(cardURL(first.origin, 'α'.repeat(1200))).hash).length, 1000);
});
test('language-specific shared links preserve both language and the personal message', () => {
  for (const language of languages) {
    const message = 'Bonjour & καλημέρα 👋';
    const url = new URL(cardURL('https://p58website.vercel.app', message, language));
    assert.equal(url.searchParams.get('lang'), language);
    assert.equal(cardMessage(url.hash), message);
    const subject = translate('Η κάρτα μου · Project58', language);
    const links = shareLinks(shareText(DEFAULT_PROFILE, message), url.href, subject);
    assert.equal(new URL(links.email).searchParams.get('subject'), subject);
    assert.ok(new URL(links.email).searchParams.get('body').endsWith(url.href));
  }
  assert.equal(new URL(cardURL('https://example.com', '', 'unknown')).search, '');
});
test('all supported languages have complete UI copy and preserve custom personal text', () => {
  for (const variants of Object.values(translations)) {
    for (const language of languages) assert.ok(variants[language]?.trim());
  }
  assert.equal(translate('Αποθήκευση επαφής', 'fr'), 'Enregistrer le contact');
  assert.equal(translate('Αποθήκευση επαφής', 'en'), 'Save contact');
  assert.equal(translate('Αποθήκευση επαφής', 'unsupported'), 'Αποθήκευση επαφής');
  const personal = 'Bonjour Léa — projet lundi à 10 h.';
  for (const language of languages) assert.equal(localizedMessage(personal, language), personal);
  assert.equal(localizedMessage('Χάρηκα για τη γνωριμία!\nΑς κρατήσουμε επαφή.', 'fr'), 'Ravi de vous avoir rencontré !\nRestons en contact.');
});
test('bundled QR generator accepts UTF-8 vCards and uses a four-module quiet zone', () => {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(readFileSync('card/vendor/qrcode.js', 'utf8'), ctx);
  ctx.qrcode.stringToBytes = ctx.qrcode.stringToBytesFuncs['UTF-8'];
  const qr = ctx.qrcode(0, 'M'); qr.addData(makeVCard({ ...DEFAULT_PROFILE, firstName: 'Γεώργιος' }), 'Byte'); qr.make();
  const data = Buffer.from(qr.createDataURL(8, 32).split(',')[1], 'base64');
  assert.equal(data.subarray(0, 6).toString(), 'GIF87a');
  assert.equal(data.readUInt16LE(6), qr.getModuleCount() * 8 + 64);
});

test('member identity survives language, message, NFC and cache paths', async () => {
  const { currentCardId, cardCacheKey, memberProfile, suggestedCardId, ownerCardPath } = await import('../../card/profile.js');
  const profile = memberProfile({ name: 'Naveen Kumar', role: 'Architect', portrait: 'assets/people/naveen-kumar.png' });
  assert.equal(profile.email, ''); assert.equal(profile.phone, ''); assert.equal(profile.firstName, 'Naveen');
  assert.equal(profile.photo, '/assets/people/naveen-kumar.png');
  assert.equal(suggestedCardId({ name: 'Naveen Kumar' }), 'naveen-kumar');
  assert.notEqual(cardCacheKey('naveen-kumar'), cardCacheKey('georgios'));
  assert.equal(currentCardId('https://site.test' + ownerCardPath('naveen-kumar')), 'naveen-kumar');
  for (const language of languages) {
    const url = cardURL('https://site.test', 'Bonjour!', language, 'naveen-kumar');
    assert.equal(currentCardId(url), 'naveen-kumar'); assert.equal(cardMessage(new URL(url).hash), 'Bonjour!');
    assert.equal(new URL(url).searchParams.get('lang'), language);
  }
  assert.equal(currentCardId(cardURL('https://site.test', '', 'el', 'naveen-kumar')), 'naveen-kumar');
  assert.equal(currentCardId('https://site.test/card/contact?member=../bad'), null);
  assert.ok(!makeVCard(profile).includes('Grigoriadis'));
});
