# Bugs and Fixes

This file records bugs discovered during the Project58 rebuild, the likely causes, the fixes applied, and testing notes for future developers.

## Mobile Vertical Scrolling Bug

**Where it happens**

- Public website on mobile breakpoints (`max-width: 720px`).
- Most visible on `index.html#home`.
- Also relevant to the mobile preview shell in `mobile.html`, because it renders the live site inside an iframe.

**What is currently broken**

- The mobile website is supposed to scroll vertically like a normal website.
- The home page previously inherited the desktop horizontal scrolling model on mobile.
- The page could feel trapped inside a fixed-height horizontal rail instead of allowing natural vertical overflow.
- In iframe-style previews, scrolling can also be affected by the outer preview/device container rather than the real page.

**Probable cause**

- Desktop home uses a horizontal track:
  - `body[data-route="home"] main { height: 100vh; overflow: hidden; }`
  - `.hzone { overflow-x: auto; overflow-y: hidden; touch-action: pan-x; }`
  - JavaScript wheel handling calls `preventDefault()` to translate vertical wheel movement into horizontal scroll.
- Those rules are correct for desktop, but must not govern mobile.
- The mobile preview frame in `mobile.html` is iframe-based, so it can obscure whether the real page or the preview wrapper is responsible for scroll behavior.
- Any of the following can reintroduce the issue:
  - `overflow: hidden` on `html`, `body`, `main`, or `.hzone` at mobile widths.
  - `height: 100vh` without allowing content below it.
  - `position: fixed` wrappers around the page content.
  - `touch-action: pan-x` on mobile content.
  - `preventDefault()` applied to touch or wheel events on mobile.

**Correct expected behavior**

- On mobile, the home page should be a normal vertical document:
  - Fullscreen immersive hero first.
  - Project intro and cards stacked below it.
  - Footer appears in normal document flow.
  - Native touch scrolling works on iPhone, Android, Safari, and Chrome.
- Only the header/navigation should account for the Dynamic Island and safe area.
- Hero/image content should remain fullscreen and immersive.
- Desktop horizontal scrolling must remain available only for desktop/tablet layouts where intended.

**Exact fix implemented**

- Added a dedicated mobile home renderer in `pages.jsx`:
  - `useHomeMobile()` detects the mobile breakpoint.
  - `MobileHomePage` renders normal vertical sections instead of the desktop `.hzone`.
  - Mobile no longer mounts the desktop horizontal rail, desktop wheel handler, drag-to-scroll handler, horizontal footer pane, or horizontal controls.
- Added mobile-specific overrides in `styles.css`:
  - `body[data-route="home"]` and `main` return to `height: auto`, vertical overflow, and normal document flow.
  - `.hzone` changes from a horizontal scroller to a block layout on mobile.
  - `.hzone` uses `touch-action: pan-y` on mobile.
  - Home project cards become full-width vertical cards.
  - The horizontal footer pane, arrow controls, and progress bar are hidden on mobile.
  - The normal global footer is restored on mobile.
- Kept desktop behavior separate:
  - Desktop `.hzone` still uses horizontal scrolling.
  - Desktop wheel-to-horizontal behavior remains isolated to the `.hzone` element.
  - Pointer drag behavior ignores touch input.
- Updated mobile header styling:
  - Header remains fixed over the fullscreen hero.
  - Header uses safe-area top padding.
  - The nav remains available on mobile instead of hiding the menu.

**Files/components changed**

- `pages.jsx`
  - Added `useHomeMobile()`.
  - Added `MobileHomePage`.
  - Mobile home now uses separate vertical markup from desktop.
- `styles.css`
  - Added `.mhome`, `.mhome-hero`, `.mhome-intro`, `.mhome-list`, and `.mhome-card`.
  - Mobile home route overrides.
  - Mobile `.hzone` layout overrides.
  - Safe-area/mobile nav refinements.
- `index.html`
  - Cache-busted to `v=10`.
- `mobile.html`
  - Preview iframe now loads `index.html?v=10#home`.

**Testing notes**

- Tested locally at `http://127.0.0.1:5179/index.html#home`.
- Verified desktop route renders after the changes.
- Verified mobile breakpoint visually in the in-app browser at `390 x 844`.
- Verified mobile DOM now contains `Recent Projects` and project card links directly after the hero without desktop intro metadata.
- Verified stale intro content such as `See more projects` is no longer present in the mobile DOM.
- Future testing should include:
  - Real iPhone Safari.
  - Real Android Chrome.
  - `index.html#home`, `#interiors`, `#interiors:pg`, and `#project/pg-panormou`.
  - Confirm native touch scroll without page lock or sideways-only behavior.

## Project Card Navigation Did Not Reliably Preserve Route Context

**Where it happens**

- Home project cards.
- Category project cards on `#interiors`, `#interiors:pg`, and `#interiors:dn`.
- Project detail pages opened from those lists.

**What is currently broken**

- Opening a project should feel app-like and return the user to the previous scroll position.
- Hash routing existed, but scroll restoration was not explicit.
- Project links used IDs directly and did not consistently support future editable slugs.

**Probable cause**

- Routing was handled through `hashchange` with immediate `window.scrollTo(0, 0)`.
- The app did not keep a per-route scroll memory.
- Horizontal home scroll position lives in `.hzone.scrollLeft`, not `window.scrollY`.

**Correct expected behavior**

- Opening a project from home returns to the same horizontal home position when using browser back.
- Opening a project from a category page returns to that category page and scroll position.
- Project routes should support CMS-managed slugs while preserving ID fallback.

**Exact fix implemented**

- Added route helpers in `app.jsx`:
  - `routeFromHash()`
  - `hashFromRoute()`
  - `routeKey()`
- Added scroll memory in `app.jsx`:
  - Stores `window.scrollY`.
  - Stores `.hzone.scrollLeft` for the horizontal home rail.
  - Restores the relevant scroll state on browser back/forward.
- Updated project navigation in `pages.jsx` and `chrome.jsx` to use `slug || id`.
- Project detail lookup now matches either `id` or `slug`.

**Files/components changed**

- `app.jsx`
- `pages.jsx`
- `chrome.jsx`

**Testing notes**

- Tested `#interiors` to `#project/pg-panormou`.
- Browser back returned to `#interiors`.
- Project detail rendered correctly from direct URL `#project/pg-panormou`.

## Missing Shared CMS Fields on Public Project Data

**Where it happens**

- Dashboard/CMS project editor.
- Public pages consuming `PROJECTS`.
- Home featured rail and project detail routes.

**What is currently broken**

- Dashboard content and frontend content were not fully aligned around editable fields such as slug, category, ordering, and featured status.
- Home featured selection was hardcoded to specific project IDs.

**Probable cause**

- `data.jsx` had bundled arrays and a localStorage override, but the project schema did not normalize CMS fields.
- `HomePage` manually selected featured projects by ID.

**Correct expected behavior**

- Desktop and mobile should use the same project objects.
- Projects should support:
  - Categories.
  - Images.
  - Descriptions.
  - Slugs.
  - Ordering.
  - Featured status.
  - Page content.
- Editors should be able to add, remove, reorder, and edit projects without touching frontend code.

**Exact fix implemented**

- Added content normalization in `data.jsx`:
  - `slug`
  - `category`
  - `order`
  - `featured`
  - `brandKey`
- Added `applyP58ContentFromStore()` so the public site can refresh from `localStorage`.
- Updated home featured selection to use `project.featured`.
- Added dashboard fields and controls:
  - Slug.
  - Category.
  - Featured checkbox.
  - Up/down reorder buttons.

**Files/components changed**

- `data.jsx`
- `dashboard.jsx`
- `dashboard.css`
- `pages.jsx`

**Testing notes**

- Dashboard loaded with new fields visible.
- Public routes still rendered with bundled defaults.
- Future testing should include editing a project in `dashboard.html`, saving, then confirming `index.html` reflects the updated content in the same browser.

## Project Image Zoom Transition Was Missing

**Where it happens**

- Opening a project from home cards.
- Opening a project from category tiles.

**What is currently broken**

- Project navigation required a smooth image zoom transition from card thumbnail to project hero.
- The site navigated directly without a transition layer.

**Probable cause**

- No shared transition state existed in the app shell.
- Card click handlers did not pass the clicked image element into the router.

**Correct expected behavior**

- Clicking a project card should animate the thumbnail toward a fullscreen hero frame.
- Navigation should feel continuous and premium.

**Exact fix implemented**

- Added `zoom` transition state in `app.jsx`.
- Card click handlers now pass the clicked image element and image source to `go()`.
- Added `.zoom-flight` CSS overlay in `styles.css`.

**Files/components changed**

- `app.jsx`
- `pages.jsx`
- `styles.css`

**Testing notes**

- Category tile click opens the correct project route.
- Visual transition should be reviewed in real browser/device QA for timing polish.

## Recent Projects Cards Showed Grey Empty Areas

**Where it happens**

- Home page `Recent Projects` horizontal rail on desktop.
- Home page stacked project cards on mobile.

**What is currently broken**

- Project images did not reliably fill the full card media area.
- A grey/empty area could appear inside the project card below or around the image.
- The card felt like an image placed above an empty block instead of one complete image-based tile.
- The `Recent Projects` intro pane contained too much supporting text and metadata.

**Probable cause**

- The card image in `pages.jsx` had inline dimensions:
  - `style={{ height: "480px", width: "587px" }}`
- Those inline dimensions overrode the intended CSS sizing.
- The wrapper `.vhome-hpic` had a grey background, so any mismatch between wrapper size and image size became visible.
- The card caption lived outside the image wrapper, making the card read as separated image plus text instead of one composed tile.

**Correct expected behavior**

- Each project card should be a single premium image tile.
- The image should fill the complete visual card area with `object-fit: cover`.
- No grey placeholder/background should be visible.
- Card title/location can appear as an overlay within the image.
- The intro pane should show only the main `RECENT PROJECTS` title.

**Exact fix implemented**

- Removed the inline image width/height from the project card image in `pages.jsx`.
- Moved the card caption outside `.vhome-hpic` so the title and location sit below the image in black text.
- Updated `.hz-card` and `.vhome-hpic` in `styles.css`:
  - Card image area is reduced so title/location have their own space below.
  - Image is forced to `width: 100%`, `height: 100%`, and `object-fit: cover`.
  - Grey background is replaced with an ink fallback that should not be visible during normal image loading.
  - Added only a subtle top gradient for the small image tags.
- Removed extra intro content:
  - Eyebrow/descriptive line.
  - “See more projects” link.
  - Project count.
  - Location text.
- Reduced the `RECENT PROJECTS` title size.
- Added `50px` right margin to the intro pane before the first project card.

**Files/components changed**

- `pages.jsx`
- `styles.css`
- `index.html`
  - Cache-busted stylesheet and JSX script URLs so the browser preview loads the corrected card markup/CSS.

**Testing notes**

- Verified from the DOM that the stale intro text was removed:
  - No `See more projects`.
  - No project count.
- Verified the local preview reloads with cache-busted assets at:
  - `http://127.0.0.1:5179/index.html?v=11#home`
- Visual QA should continue on desktop and mobile after browser cache is cleared or versioned assets are loaded.

## Vercel Deployment Blocked by Invalid Token

**Where it happens**

- Deployment step from local machine.

**What is currently broken**

- `npx vercel --prod --yes` could not complete.

**Probable cause**

- Vercel CLI reported: `The specified token is not valid. Use vercel login to generate a new token.`

**Correct expected behavior**

- Deployment should run after a valid Vercel session/token is available.

**Exact fix implemented**

- Added `vercel.json` so the static site is configured for Vercel.
- Did not publish because authentication failed and the user asked to review before publish.

**Files/components changed**

- `vercel.json`

**Testing notes**

- Local static server served:
  - `index.html`
  - `dashboard.html`
- Deployment still requires a valid Vercel login/token before publishing.
