# Security Remediation Tasks

## Task: Prevent Gemini API key exposure in the client bundle (Resolved)
**Issue**
- Previously, `vite.config.ts` injected `process.env.API_KEY` into the client bundle and Gemini SDK instances were created in `services/gemini.ts` and `services/live-session.ts`, exposing secrets to end users.

**Mitigations Implemented**
1. All Gemini calls now occur server-side (`api/chat.ts` and new `api/analyze-history.ts`), and the client consumes only those endpoints.
2. The Vite config no longer injects environment variables into the browser bundle.
3. Live session functionality is disabled client-side until a secure server proxy is available, preventing direct SDK use in the browser.

**Residual Recommendations**
- Add authentication/authorization and rate limiting to the API routes to protect against abuse.
- Instrument server-side logging/alerting (without logging secrets) to monitor for anomalous traffic.
