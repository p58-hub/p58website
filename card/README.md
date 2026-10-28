# Project58 personal card

- `/card/georgios`: public, installable personal card.
- `/card/settings`: protected by the existing dashboard login. Saves publish immediately.
- `/api/card`: public GET; authenticated JSON PUT. Stores a separate `businessCards/georgios` Firestore document, without modifying the site's published content or drafts.

Uses the site's existing Firebase server configuration and session secret. No additional keys or services. If Firebase is not configured, the public card shows the bundled defaults and settings cannot save. Blank phone/email/website fields are omitted from the card and contact file.

The contact QR encodes a UTF-8 vCard 3.0 directly. Page QR and NFC use the current deployment's `/card/georgios` URL. Previously saved phone contacts do not update automatically. Messages live only in the current page and are passed to the user's selected share app; they are never sent to the API or placed in the card URL. Apps may treat attachments and text differently.

Web NFC writes a URL to a **blank** tag only on supported browsers (not Safari/iOS); it does not emulate a tag or transmit phone-to-phone. Closing the dialog cancels pending writes. Other phones can use a tag programmed with an NFC writer app or by the card supplier.

The service worker is scoped to `/card/`, caches only its explicit public shell allowlist, and never caches settings, API requests or authentication. Offline mode uses the last public profile. Increment the service-worker cache version for shell releases. A normal page reopen activates a waiting updated worker after existing clients close.

Before production: run `npm run check` and `npm test`; deploy through the existing Vercel workflow; set contact details at `/card/settings`. Test Add to Home Screen, native sharing, importing `.vcf` on iOS/Android, and writing/reading a real NFC tag. Browser simulation verifies application behavior, not native app delivery or radio hardware.

QR generator: qrcode-generator 1.4.4 by Kazuhiko Arase, MIT; vendored at `vendor/qrcode.js` with its original attribution.
