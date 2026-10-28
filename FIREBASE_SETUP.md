# Firebase — free Spark plan

Project: `p58website` (`521785162082`). Firestore `(default)` is in `europe-west1`, with deletion protection enabled. No billing account or Blaze upgrade was enabled.

## Where data lives

- Firestore `siteContent/published` and its `chunks`: published projects, news, team, categories, translations, typography, form configuration and site settings.
- Firestore `siteContent/draft` and its `chunks`: unpublished dashboard changes. Saving does not publish.
- Firestore `media` and `mediaNames`: file metadata and filename reservations.
- Firestore `inquiries`: private contact submissions and read status.
- Firestore `mediaFiles` and their `chunks`: new uploaded images/files, served through `/api/media-file` with CDN caching. Firebase Storage is not used because it requires billing. The old Vercel Blob store currently responds `Your store is blocked`; its files cannot be migrated until accessible. Existing bundled assets remain available.
- Browser view preferences, previews and a recovery cache remain local. Existing dashboard accounts remain in the server's `P58_USERS` configuration.

Content uses byte chunks under Firestore's document size limit. Transactions atomically read/write complete snapshots. Concurrent editors still use last-save-wins. Free Firestore quotas apply (including 1 GiB stored data, daily read/write quotas and transfer limits); no unlimited storage or usage is implied. Media files are limited to 3 MiB each. CDN caching reduces repeated database reads; deleting a file does not immediately purge copies already cached.

## Server authentication

Production uses Vercel OIDC and Google Workload Identity Federation; no service-account private key is needed.

- `FIREBASE_PROJECT_ID=p58website`
- `FIREBASE_WIF_AUDIENCE=//iam.googleapis.com/projects/521785162082/locations/global/workloadIdentityPools/vercel/providers/vercel`
- Identity pool/provider: `vercel/vercel`
- Issuer: `https://oidc.vercel.com/project58`
- Allowed subject: `owner:project58:project:p58website:environment:production`
- IAM grants this principal `roles/datastore.user` on this project only.

Rules in `firebase/firestore.rules` deny direct browser access. Server handlers enforce dashboard sessions. Public visitors can read published content and submit inquiries; they cannot list inquiries or read drafts. Preserve `SESSION_SECRET` and `P58_USERS` in Vercel.

For local administrative migration, use your authorized Google credentials with the Firestore SDK. The helper also supports `GOOGLE_APPLICATION_CREDENTIALS` or a service-account credential where permitted, but production uses OIDC. Preview deployments have no production Firestore access.

## Migration and verification

`scripts/migrate-firebase.mjs` takes a content JSON backup (`{content,updatedAt}`) and a media index (`{items}`). It refuses to overwrite existing published Firestore content and leaves Blob files unchanged. Back up local unpublished edits before switching; those cannot be recovered centrally from other browsers. Existing local inquiries also need a separate import if they are only present on an old browser.

Run `npm run check` and `npm test`. Deploy rules with `npx firebase-tools deploy --only firestore:rules --project p58website`. Deploy the server on Vercel after the Firebase environment variables are configured. Verify public content, private access checks, saving, media and inquiries. Configure platform rate limiting if needed for public submissions.

References: https://vercel.com/docs/oidc/gcp and https://firebase.google.com/docs/firestore/quotas
