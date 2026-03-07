# Route Ownership Contract

## Intent

Each public route must have one declared owner to prevent SPA/public SEO collisions.

## Owner Types

- `spa`
- `astro`
- `static`
- `redirect`

## Mandatory Rule

No public route may be simultaneously owned by SPA fallback and an Astro/static page.

## Locked Decisions

- `/support/` is a public Astro-owned route
- `/learn/*`, `/compare/*`, `/tools/*`, `/dictionary/*` are public SEO-owned surfaces
- redirect-only roots are non-indexable and excluded from canonical sitemaps

## Validation Surfaces

Route ownership must be consistent across:

- deploy rewrites (`vercel.json`)
- SPA offline fallback denylist (`vite` PWA config)
- sitemap inventory tooling

## Acceptance Scenarios

1. `/support/` resolves to Astro page in preview and production.
2. Route manifest and rewrite/fallback rules do not conflict.
3. SEO inventory and sitemap policies align with route owner and indexability intent.
