# Media library — setup

The Media section of the dashboard stores images in **Vercel Blob** instead of
inside the browser. Until a Blob store is linked, the section shows a notice and
image uploads fall back to the old behaviour (embedded in `localStorage`).

---

## 1. Create the store

Vercel dashboard → your project → **Storage → Create → Blob**.

Choose **Public**. These are photos that get published on the site anyway, and a
public store serves them straight from the CDN. Note that public vs private is
fixed when the store is created and **cannot be changed later**.

Connect the store to this project. Vercel injects `BLOB_READ_WRITE_TOKEN`
automatically — there is no key to copy.

## 2. Redeploy

Environment variables only apply to new deployments, so redeploy after linking.

---

## How it is organised

Everything lives in one store:

| Path | What |
| --- | --- |
| `media/index.json` | the library: filename, size, caption, which project |
| `media/files/…` | the images themselves |

**Backlog is not a separate place.** It is every image whose `projectId` is
`null`. Assigning an image to a project sets that field; sending it back to the
backlog clears it. Because the assignment lives in the index rather than in the
pathname, **the image URL never changes** — so moving an image around can't break
a page already using it.

An image pointing at a project that has since been deleted shows up in the
backlog rather than disappearing.

## Uploads

Images are downscaled in the browser before upload — longest edge 2400px, JPEG
quality 0.85, PNG kept as PNG so transparency survives. SVGs are passed through
untouched.

That is not only about page weight: a Vercel function request body caps at
4.5MB, and base64 inflates by a third. A phone photo would not otherwise fit.

## Where images can come from

| | |
| --- | --- |
| Media section | Upload, assign to a project, caption, delete |
| Project / news / team editors | **Upload** puts the file in the library and links it |
| | **Library** picks an image already there |

So the ordinary editing flow fills the library as a side effect. Nothing has to
be uploaded twice.

## Moving the old images across

Content saved before this existed has images embedded as base64 inside
`localStorage`. The Media section detects them and offers to move them into
storage — it uploads each one, then rewrites the content to point at the new
URL. Images that belong to a project are tagged with that project automatically;
everything else lands in the backlog.

It exports a JSON backup first, because it rewrites your content. If it fails
part way it keeps whatever succeeded rather than rolling everything back.

Worth doing once: `localStorage` caps at roughly 5MB for *all* your content
together, and embedded images are the main thing that fills it.

## Deleting

Deleting removes the file from storage permanently. If a project still
references it, that page will show a broken image — the dashboard warns about
this but cannot check for you, since the content lives in the browser and the
API cannot see it.

## Local development

The Python preview server (`.claude/launch.json`) serves static files only —
there is no `/api`, so the Media section shows "needs the Vercel backend" and the
**Library** button reports the same. That is expected. To exercise it locally,
use `vercel dev` with a Blob store linked.

## Cost

A few thousand images and a handful of daily logins sit inside the free tier.
Unlike a database, a Blob store has no inactivity pausing — nothing needs to be
kept warm.
