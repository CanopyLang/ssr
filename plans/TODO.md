# canopy/ssr — TODO

## Status: Mostly Complete (v1.0.0)

Server-side rendering. VirtualDom-to-HTML, meta tags, head management, static site generation, islands architecture, streaming.

---

## Bugs to Fix

- [ ] **`Island.withDirective` is a no-op** (line 97-98) — Returns the island unchanged, discarding the directive parameter. Fix to actually apply the hydration directive.

---

## Features to Add

- [ ] Hydration — client-side hydration that attaches event handlers to server-rendered HTML
- [ ] Selective hydration — only hydrate interactive components
- [ ] SSR caching — cache rendered pages/components
- [ ] `Ssr.Error` — SSR-specific error pages (404, 500)
- [ ] Dynamic meta tag injection per route
- [ ] Structured data (JSON-LD) generation helpers
- [ ] RSS/Atom feed generation
- [ ] CSS extraction — collect critical CSS during SSR
- [ ] HTTP streaming with chunked transfer encoding

---

## Test Improvements

- [ ] Good coverage (5 files, 1343 lines) — add regression test for withDirective
- [ ] Add tests for Stream module (currently untested directly)
- [ ] Add tests for full page rendering pipeline
