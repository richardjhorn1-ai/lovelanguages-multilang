# Error Tracking Notes

We are not currently shipping a paid third-party crash SDK in the app.

## Current behavior

- Client and API errors still emit structured product analytics via the shared `error-tracking` wrapper.
- The wrapper stays in place so the app can add a dedicated crash provider later without rewriting every call site.
- There is no Sentry runtime setup, source map upload, or native crash SDK configuration in the current build.
