# Public website SEO

The current canonical origin is `https://p58website.vercel.app`. Set Vercel's `SITE_URL` to the final HTTPS origin when the custom domain is connected, then redeploy and submit the new sitemap. Do not set it to an unconnected domain.

Public pages use `/en` and `/el` language paths. Existing public paths redirect to English. Each response includes the actual React page, a unique localized title/description, canonical URL, reciprocal language alternatives, social sharing metadata and Organization/WebSite/WebPage structured data. Missing or unpublished projects return 404; editor previews are noindex.

`api/page.js` reads only the published Firestore snapshot, never drafts. A storage outage returns 503, not bundled demo content. Preview deployments need their own authorized content source; production Firestore identity access remains restricted to production. No authentication permissions were expanded.

`/sitemap.xml` includes both languages, visible projects and public brand collections. `/robots.txt` allows public pages and media while excluding management paths. Google Search Console verification/submission and Google Business Profile review require access to the relevant accounts. See GitHub issue #9.

Run `npm run build` to create the local production browser runtime, browser bundle and server source. Vercel runs this build automatically. Generated files are ignored by Git. `npm test` builds first and checks rendering, published-data boundaries, metadata, languages, error responses and existing site functionality. `npm run check` checks source syntax.

Bilingual service-page copy is in `editorial-copy.js`; published project descriptions and contact details remain managed by the dashboard. The home title's three-line fit applies to “Designing a world of possibilities” (with optional punctuation), preserving other editable headings. Existing navigation buttons were not converted to anchor links at the user's request.
