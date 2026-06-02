# Modifications Log

| Date | Modification | Location |
|------|-------------|----------|
| 2026-05-20 | Initial commit — project scaffolded | All |
| 2026-05-31 | Full React SPA launched — routing, pages, nav, footer | All |
| 2026-05-31 | Mobile vertical scrolling fixed — separate mobile home renderer, no horizontal rail on mobile | `#home` (mobile) |
| 2026-05-31 | Project card navigation — scroll memory added, browser back restores position | `#home`, `#interiors`, `#project/*` |
| 2026-05-31 | CMS fields normalised — slug, category, featured, order added to project schema | `dashboard.html`, `#home`, `#interiors` |
| 2026-05-31 | Project image zoom transition added — thumbnail animates to fullscreen hero on open | `#interiors`, `#project/*` |
| 2026-05-31 | Recent projects cards fixed — images fill card, grey areas removed, intro pane simplified | `#home` hero gallery |
| 2026-05-31 | `vercel.json` added for static deployment config | Deployment |
| 2026-05-31 | Previous ← and Next → arrows removed from home horizontal gallery | `#home` hero |
| 2026-05-31 | Mouse scroll animation added — mouse icon + SCROLL label centered at bottom of hero | `#home` hero |
| 2026-05-31 | Scroll indicator repositioned — centered horizontally, mouse above text | `#home` hero |
| 2026-06-02 | Interiors page layout rebuilt — BIG.dk-style vertical list, info column left + image right, removed title & eyebrow | `#interiors` |
| 2026-06-02 | Protein Garden brand icon replaced — circular PG monogram swapped for real logo image (`assets/proteingarden/`) | `#interiors` |
| 2026-06-02 | Interiors nav pinned — nav always visible (no scroll-hide), filter bar sticky below nav at `top: 74px` | `#interiors`, `chrome.jsx` |
| 2026-06-02 | Footer removed from interiors page — `<Footer>` excluded when `route.name === "interiors"` | `app.jsx` |
| 2026-06-02 | Filter bar UI — buttons equal padding, centered layout, "12 PROJECTS" count inline, border-bottom separates from list | `#interiors` |
| 2026-06-02 | Agency footer added — dark block footer with Project58 logo, "Contact ↗" toggle (slides open contact details), "Back to top ↑" button | `#agency` |
| 2026-06-02 | Interiors cards enlarged ~20% — container expanded from `640px` to `770px`, info column `168px` | `#interiors` |
| 2026-06-02 | Filter bar centering scoped to interiors only — `body.interiors-page .brand-head` override; architecture page unaffected | `styles.css` |
| 2026-06-02 | Image column = 2/5 screen width, centered at 50vw — grid columns `calc(30vw - gutter - 24px) 40vw`; image center aligns with viewport midline | `#interiors` |
| 2026-06-02 | Architecture/Residential page rebuilt — same proj-list layout as interiors; sticky nav + filter bar in nav; footer excluded; empty-state message until arch projects added | `#architecture`, `chrome.jsx`, `app.jsx`, `styles.css` |
