# Design System Audit

## Summary

The repo does not currently have one coherent shipped design system. It has:

- a documented app design system
- a partially enforced app implementation
- a separate blog/editorial system
- multiple stale docs claiming the cleanup is already complete

This is a design-system and documentation problem more than a pure aesthetics problem.

## Current Design Systems

| Surface | Actual typography | Actual token strategy | Current state |
| --- | --- | --- | --- |
| React app | mainly Nunito/Manrope, but old font families are still loaded in `index.html` | mixed CSS vars plus many hardcoded styles | partially aligned |
| Astro blog | Quicksand/Outfit in `BaseLayout.astro` | hardcoded gray/pink palette plus a small accent var layer | separate system |
| Design docs | Nunito/Manrope + CSS vars only + no raw emoji | described as authoritative | does not match code |

## High-Level Findings

### 1. Documentation says the sweep is complete, but source says otherwise

Evidence:

- `docs/review-design-system.md` says all P1/P2/P3 issues are resolved.
- `docs/DESIGN.md` forbids hardcoded colors and raw emoji.
- `App.tsx`, `Landing.tsx`, and `SubscriptionManager.tsx` still contain hardcoded styles and raw emoji UI.

Impact:

- future contributors will over-trust the docs
- code review has no clear "actual standard" to enforce

### 2. The blog is visually a different product

Evidence:

- `blog/src/layouts/BaseLayout.astro` loads Quicksand and Outfit instead of the app fonts.
- blog components and pages use extensive `text-gray-*`, `bg-white`, `bg-gray-*`, direct hex colors, and editorial card patterns.
- the app is meant to be glassmorphism-plus-token driven, while the blog is primarily gray/white editorial layout

Impact:

- cross-surface brand continuity is weak
- shared public pages cannot easily inherit app-level visual changes

### 3. Enforcement is not automated

Evidence:

- there is no lint rule or token-check step preventing raw color literals on key surfaces
- no visual regression gate exists for app/blog parity
- raw emoji are still used as UI elements in several surfaces

Impact:

- the system drifts further on every feature pass

## Flow Review

### Landing and Signup

Current state:

- visually strong, but it is also the single biggest outlier from the documented token system
- large amount of inline styling and hardcoded brand color usage
- typography and component patterns are bespoke rather than shared

Representative evidence:

- `components/Landing.tsx:73`
- `components/Landing.tsx:113`
- `components/Landing.tsx:173`

Assessment:

- high craftsmanship intent
- low reusability and low policy consistency

### Onboarding

Current state:

- follows app tone more closely than landing
- still depends on a mix of app tokens and ad hoc styles
- complexity makes visual consistency fragile

Assessment:

- functionally coherent
- vulnerable to drift because the component is very large

### Chat, Love Log, Games, Progress

Current state:

- these surfaces align better with the documented app tone
- they still contain a meaningful number of hardcoded colors and local visual exceptions
- the shared glass-card aesthetic exists, but enforcement is incomplete

Assessment:

- app core is closer to one system than the public landing/blog surfaces are

### Subscription and Profile

Current state:

- account UI still uses raw credit-card emoji and hardcoded rose buttons
- these are small violations, but they matter because they sit inside core trust flows

Representative evidence:

- `components/SubscriptionManager.tsx:133`
- `components/SubscriptionManager.tsx:212`
- `components/SubscriptionManager.tsx:235`

### Blog Hubs and Articles

Current state:

- editorial surface is readable and consistent with itself
- it is not consistent with the app
- compare pages and other utilities still use raw emoji and hardcoded editorial colors

Representative evidence:

- `blog/src/layouts/BaseLayout.astro:33`
- `blog/src/layouts/BaseLayout.astro:93`
- `blog/src/pages/compare/[nativeLang]/index.astro:518`

Assessment:

- the blog behaves like a separate mini-design-system

## Design Debt by Category

### Typography debt

- app docs say Nunito/Manrope
- blog ships Quicksand/Outfit
- `index.html` still preloads several old/extra families, which weakens font discipline

### Color debt

- app docs say CSS variables only
- app and blog both still contain many hardcoded color literals and Tailwind color classes

### Iconography debt

- app docs forbid raw emoji as UI icons
- raw emoji still appear in app and blog product UI

### Cross-surface consistency debt

- app navigation, cards, buttons, and tone do not map cleanly to blog surfaces
- support page, compare pages, and landing page each follow different visual rules

## Recommended Target

### Minimum viable design-system repair

1. choose one typography system for app and blog
2. move shared colors, spacing, radius, and shadows into one token layer
3. ban raw emoji in product UI unless explicitly whitelisted
4. add a lightweight check for raw hex colors and direct Tailwind grays on designated surfaces

### Suggested implementation order

1. make docs truthful first
2. converge the blog base layout onto shared typography/tokens
3. clean the highest-traffic app outliers:
   - `App.tsx`
   - `Landing.tsx`
   - `SubscriptionManager.tsx`
4. add visual regression snapshots for app shell and key blog pages

## Design Audit Conclusion

The codebase has real design intent, but the design system is not truly systematized. The app and blog are adjacent visual products sharing a brand, not one enforced design system.
