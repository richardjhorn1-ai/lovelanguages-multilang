# Sentry Release Setup

This app uses `@sentry/capacitor` at runtime and `@sentry/vite-plugin` at build time.

## Required runtime env

- `VITE_SENTRY_DSN`

## Required build-time env for source map upload

- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

## Optional release env

- `SENTRY_RELEASE`
- `VITE_SENTRY_RELEASE`

If neither release variable is set, the build falls back to `VERCEL_GIT_COMMIT_SHA` when available.

## Behavior

- Runtime error capture is enabled only when `VITE_SENTRY_DSN` is present.
- Vite source maps are generated when Sentry runtime or upload env is configured.
- Source maps are uploaded only when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are all set.
- Uploaded `.map` files are deleted from `dist/` after a successful upload so they are not shipped publicly.
