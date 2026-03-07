# Testing Checklist

Last reviewed: 2026-03-07

This checklist reflects the current quality gates and high-risk user flows.

## 1. Required Local Gates

Run these from repo root and require pass before merge:

- `npm run lint`
- `npm run typecheck:app`
- `npm run typecheck:api`
- `npm run typecheck:blog`
- `npm run test:unit`
- `npm run build:app`
- `npm run build:blog`
- `npm run seo:validate-routes`

## 2. Security and Dependency Checks

- Runtime dependency gate (PR blocking): `npm audit --omit=dev --audit-level=high`
- Release sweep (release branches): run full audit report workflow and review uploaded artifact
- Secret scanning: verify Gitleaks passes in CI

## 3. High-Risk Product Flows

- Partner linking/unlinking
- Shared subscription visibility and billing-owner controls
- Tutor/student collaboration actions (gifts, challenges, requests)
- Chat + Love Log extraction + Progress aggregation
- Apple account deletion path and revocation attempt behavior

## 4. SEO and Public Route Validation

- Confirm route-ownership contract passes (`seo:validate-routes`)
- Validate canonical host is `https://www.lovelanguages.io`
- Validate canonical trailing-slash convention
- Confirm story subdomain remains isolated and non-indexable

## 5. Deployment Checks

- Verify preview passes the same gates as PR CI
- Re-run SEO audit against preview before promoting to production
- Confirm production parity after release for route/sitemap/canonical behavior
