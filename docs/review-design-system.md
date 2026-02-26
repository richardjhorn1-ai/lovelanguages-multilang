# Design System Review — `feature/ios-apple-auth-iap`

**Branch:** `feature/ios-apple-auth-iap`  
**Reviewed:** 2025-06-26  
**Scope:** Glassmorphism design system + 10 spot-check components (130 changed .tsx/.ts/.css files total)

---

## 1. Design System Overview

### What Was Added (in `src/index.css`)

The branch introduces **4 new CSS utility classes**:

| Class | Purpose | Status |
|-------|---------|--------|
| `.glass-card` | Standard semi-transparent glass panel (blur 12px) | ✅ Well-defined |
| `.glass-card-solid` | Opaque glass for modals/dropdowns (blur 20px) | ✅ Well-defined |
| `.modal-backdrop` | Blur scrim behind overlays | ✅ Well-defined |
| `.app-bg-decor` | Root background using `--accent-light` | ✅ Well-defined |

Dark mode variants exist for **all 4 classes**. The range input slider is also newly styled consistently via `var(--accent-color)`.

The `prefers-reduced-motion` global override at the bottom of `index.css` is **correct and comprehensive** — all animations/transitions are collapsed to near-zero, and `scroll-behavior: auto` is included.

### Font Mismatch — Design Doc vs. Implementation

⚠️ **Minor discrepancy**: `typography.md` documents fonts as **Quicksand** (headers) + **Outfit** (body). The actual `--font-header` CSS variable is set to `'Nunito'` and `--font-body` to `'Manrope'`. Both Nunito and Quicksand are loaded in `index.html`, as is Outfit. In practice the app uses Nunito/Manrope. The design docs need updating, or the CSS variables need aligning with the docs. This is a documentation drift issue, not a functional one.

---

## 2. Component Coverage

### Updated and Using `.glass-card` Correctly

| Component | Glass Usage | Notes |
|-----------|------------|-------|
| **Navbar.tsx** | `glass-card` (navbar bar), `glass-card-solid` (dropdowns, notifications panel) | ✅ Correct tier usage — toolbar = card, menus = solid |
| **BreakupModal.tsx** | `glass-card-solid` (modal container), `modal-backdrop` (scrim) | ✅ Correct pattern |
| **BugReportModal.tsx** | `glass-card-solid` (modal), `modal-backdrop` (scrim) | ✅ Correct pattern |
| **ProfileView.tsx** | `glass-card` used on all section containers | ✅ Consistent |
| **AccountSettings.tsx** | `glass-card` outer container | ✅ Pattern is correct |
| **FlashcardGame.tsx** | `glass-card` on game selection grid cards | ✅ Correct |
| **GameHistory.tsx** | `glass-card` on session rows | ✅ Correct |
| **FAQ.tsx** | `glass-card` on all accordion items + CTA block | ✅ Correct |
| **ChatArea.tsx** | `glass-card` on grammar tables, listen mode panel, mode pill | ✅ Correct |

### `PricingPlans` — Not Found (Component Name Mismatch)
The specified `PricingPlans.tsx` doesn't exist. There are `Pricing.tsx` and `PricingPage.tsx`. Both were updated and use `glass-card` correctly. `PricingPage.tsx` uses `var(--bg-primary)` for page background via inline style — not `app-bg-decor` — which is a minor inconsistency but not broken.

---

## 3. Dark Mode Quality

**Overall: Good but not perfect.**

### ✅ What Works Well
- All 4 CSS utility classes have proper `.dark` variants
- Most component-level tints use `dark:` modifiers consistently (e.g., `bg-red-50 dark:bg-red-900/20`, `text-green-600 dark:text-green-400`)
- `color-mix()` approach for dark glass background is clean and adaptive

### ⚠️ Issues Found

**AccountSettings.tsx — hardcoded light-only error/success messages:**
```tsx
// Lines 161-162 — no dark: variant
<div className="p-3 bg-red-50 border border-red-200 rounded-xl">
  <p className="text-red-700 text-sm font-semibold">{error}</p>
</div>
<div className="p-3 bg-green-50 border border-green-200 rounded-xl">
  <p className="text-green-700 text-sm font-semibold">{message}</p>
</div>
```
Compare to `BugReportModal.tsx` which handles this correctly with `dark:bg-red-900/20 dark:border-red-800`.

**AccountSettings.tsx — input focus border uses hardcoded rose:**
```tsx
focus:border-rose-400  // Lines 251, 332
```
Should be `focus:border-[var(--accent-color)]` so it adapts to the user's accent color choice. Currently locked to rose regardless of selected accent theme.

**AccountSettings.tsx — inner panels use `bg-white/40 dark:bg-white/12`** — this is actually the documented "surface" tier, so it's *correct* per `colors.md`. Not an issue.

**BreakupModal.tsx confirm step input:**
```tsx
focus:bg-white dark:focus:bg-[var(--bg-primary)]
```
The `focus:bg-white` is a hardcoded color leak (no dark variant for the white state — but the dark variant exists, so this is borderline). Fine in practice.

---

## 4. Hardcoded Colors That Should Use Variables

### Critical Violations

**FlashcardGame.tsx — hardcoded `rgba(255, 71, 97, ...)` in inline `<style>` block (lines 1441–1442):**
```tsx
<style>{`
  @keyframes pulse-border {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 71, 97, 0.4); }
    50% { box-shadow: 0 0 0 3px rgba(255, 71, 97, 0.2); }
  }
`}</style>
```
This hardcodes the rose accent and won't adapt when users switch to lavender, honey, teal, etc. Should use `var(--accent-color)` — but inline `@keyframes` can't use CSS variables directly in `box-shadow`. A fix is to use a CSS variable in a wrapping class or swap to a Tailwind `animate-` approach with runtime style injection.

**FlashcardGame.tsx — `accentColor="#f59e0b"` hardcoded for QuickFire (line 1207):**
```tsx
<QuickFire
  accentColor="#f59e0b"  // Hardcoded amber — doesn't follow user's accent
```
This is a prop passed to a sub-component. It should be `accentColor={tierColor}` (consistent with other game modes on lines 1133, 1150, 1168) or at minimum use `accentHex`.

**BugReportModal.tsx — hardcoded severity colors (lines 26–29):**
```tsx
{ value: 'low', color: '#64748b' },
{ value: 'medium', color: '#f59e0b' },
{ value: 'high', color: '#f97316' },
{ value: 'critical', color: '#ef4444' },
```
These are semantic status colors (not accent colors), so hardcoding is arguably intentional. The docs say "Never hardcode accent hex values" but these are semantic UI colors. **Low concern** — acceptable for severity indicators, but a `constants/status-colors.ts` would be cleaner.

**AccountSettings.tsx — `focus:border-rose-400` (lines 251, 332):** Already noted above. Should be `focus:border-[var(--accent-color)]`.

### Acceptable Patterns (Not Violations)
- `bg-teal-*`, `bg-amber-*`, `bg-purple-*` for game card icon backgrounds in `FlashcardGame.tsx` — these are intentional semantic color coding per game type, not accent colors.
- `bg-red-*`, `bg-green-*` for feedback states — semantic meaning, not accent-related.

---

## 5. Motion & Animation

### Global `prefers-reduced-motion` Support: ✅ Complete
`src/index.css` has a solid blanket override:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
This correctly catches all CSS animations and transitions globally.

### Inline Keyframes Without Reduced Motion Guard

**FlashcardGame.tsx `pulse-border` animation** (in the inline `<style>` block):
```tsx
<style>{`
  @keyframes pulse-border { ... }
  .animate-pulse-border { animation: pulse-border 2s ease-in-out infinite; }
`}</style>
```
The global `prefers-reduced-motion` override in `index.css` applies to `*` and will catch `.animate-pulse-border`. However, since this is in a `<style>` tag inside a component (not `index.css`), the cascade order matters. In practice it should work, but it's fragile — component-level `<style>` can override the global. **Recommendation:** Add `@media (prefers-reduced-motion: reduce) { .animate-pulse-border { animation: none; } }` inside the component style block.

### `animate-bounce` in `GameHistory.tsx` (loading indicators, lines 175–177, 262–264)
Three-dot bounce loading indicators. The global override handles this, but these dots are decorative spinners during data fetch — not high-impact. Low concern.

### `animate-pulse` in `BreakupModal.tsx` (processing HeartCrack icon, line 164)
Deliberate emotional feedback during async operation. Covered by global override.

### `animate-spin` in `BugReportModal.tsx` (submit spinner, line 278)
Standard submit loading spinner. Covered by global override.

### Motion Consistency ✅
- `transition-all duration-200` is used consistently across interactive elements in all reviewed components
- `active:scale-[0.98]` press feedback is present on all primary buttons reviewed
- `hover:brightness-105` is absent from most button implementations — components use `hover:opacity-90` instead (consistent with each other, but slightly different from the motion guide's preference)

---

## 6. Accessibility

### Focus States

**Poor coverage overall.** The design system docs mention focus states but the components don't consistently implement them:

- `ChatArea.tsx` (line 2285): ✅ `focus:ring-2 focus:ring-[var(--accent-color)]`
- `LoveLog.tsx`: ✅ `focus:ring-2 focus:ring-[var(--accent-border)]`
- `BugReportModal.tsx` inputs: `focus:outline-none focus:border-[var(--accent-color)]` — visible via border change, no ring
- `AccountSettings.tsx` inputs: `focus:border-rose-400` — hardcoded rose, no ring
- `BreakupModal.tsx` input: `focus:border-red-300` — no ring
- `Navbar.tsx` buttons: No `focus:` states — keyboard navigation unclear
- `FAQ.tsx` accordion buttons: No `focus:` states
- `FlashcardGame.tsx` game cards (buttons): No `focus:` states

There's inconsistency. Interactive elements in modals and nav have no keyboard focus indicators. This is an **accessibility gap** for keyboard users and screen readers.

### Contrast Concerns

- **`bg-white/40` on `app-bg-decor` (accent-light background):** The surface tier glass cards have very low opacity. Text on these surfaces should still contrast sufficiently since text uses `var(--text-primary)`, but at 40% opacity over a pink background the card itself may not pass WCAG AA for some teal/honey accent combinations. No automated contrast test was run.
- **`text-teal-500` in ChatArea.tsx** (listen mode label): Teal on a light background — likely fine but not verified.

### Emoji as Decorative UI Elements

Found in reviewed components:
- `BreakupModal.tsx`: 🥀 (wilted rose), 🕊️ (dove) — used as purely decorative step icons
- `Navbar.tsx`: 🔔 (bell) — used as empty-state illustration in notifications panel

Per `components.md` principle: *"Raw emoji are only acceptable in user-generated content or AI chat responses."* These 3 uses are borderline violations — they're in app UI, not user content. The 🥀 and 🕊️ are particularly "AI slop" territory. The 🔔 in the empty-state is weak compared to `<ICONS.Bell />`.

**Recommendation:** Replace all 3 with ICONS equivalents:
- 🥀 → `<ICONS.HeartCrack />` (already used nearby)
- 🕊️ → `<ICONS.Bird />` or `<ICONS.Feather />`  
- 🔔 → `<ICONS.Bell />`

### Border on Glass Elements

The design system doc states: *"No borders on glass elements. Glass edges are defined by backdrop-filter + inset box-shadow, not border."*

Several glass elements add explicit border classes anyway:
- `ProfileView.tsx` partner avatar: `border-2` on `glass-card` div
- Various hover states add `hover:border-*` to `glass-card` buttons in `FlashcardGame.tsx`

This is a pattern inconsistency. The hover border on game cards (`hover:border-[var(--accent-border)]`, etc.) is visually harmless but technically violates the rule. The border-on-avatar case is probably intentional.

---

## 7. Visual Inconsistencies

### Rounded Corner Mix

Design doc defines `rounded-2xl` for modals. In practice:
- `BreakupModal.tsx`: `rounded-[2rem]` (custom value)
- `BugReportModal.tsx`: `rounded-2xl` (consistent with spec)
- `AccountSettings.tsx` container: `rounded-[2.5rem]` (custom value)
- `ProfileView.tsx` cards: `rounded-[2.5rem]` (custom value)
- `FAQ.tsx` accordion items: `rounded-2xl` (consistent)
- `GameHistory.tsx` session cards: `rounded-2xl` (consistent)

The large profile page containers use `rounded-[2.5rem]` as a deliberate "premium" feel, but it's inconsistent with the spec. `rounded-[2rem]` in modals vs `rounded-2xl` (which is `1rem`) elsewhere is a noticeable gap.

### `font-header` Usage Gaps

`typography.md` says "Use `font-header` class for any heading or display text." Some headings in reviewed components do NOT use `font-header`:

- `FAQ.tsx` question text (button `span`): No `font-header` 
- `GameHistory.tsx` session type name: No `font-header`
- `AccountSettings.tsx` header h3: Uses `font-header` ✅

Inconsistent — headings in accordion items and list contexts often skip `font-header`.

### Tailwind `text-sm` Anti-Pattern

`colors.md` says to use the `text-scale-*` system, never raw Tailwind text sizing. Violations found:
- `BreakupModal.tsx` (line 65, 76, 109, 115, etc.): Uses `text-sm` extensively
- `FAQ.tsx`: Uses `text-base`, `text-sm`, `text-3xl`, `text-4xl` — bypasses scale system entirely
- `BugReportModal.tsx` (line 163): Uses `text-lg`, `text-base`

These are widespread. The scale system is followed well in Navbar, ChatArea, and FlashcardGame but inconsistently in the informational/modal components.

---

## 8. Summary Table

| Area | Status | Severity |
|------|--------|----------|
| CSS glass utility classes | ✅ Complete, well-structured | — |
| Dark mode for `.glass-*` / `.modal-backdrop` | ✅ All 4 classes covered | — |
| Dark mode in components | ⚠️ AccountSettings missing dark variants for error messages | Low |
| Hardcoded colors (accent) | ❌ FlashcardGame pulse-border + QuickFire amber; AccountSettings rose | Medium |
| Hardcoded colors (semantic) | ⚠️ BugReport severity (intentional, low risk) | Low |
| `prefers-reduced-motion` (global) | ✅ Comprehensive override in index.css | — |
| Inline keyframes reduced-motion | ⚠️ FlashcardGame pulse-border not guarded locally | Low |
| Focus states | ❌ Absent from Navbar, FAQ, FlashcardGame card buttons | High |
| Emoji as UI icons | ⚠️ 3 violations (BreakupModal 2×, Navbar 1×) | Medium |
| `font-header` usage | ⚠️ Missing on FAQ questions, GameHistory labels | Low |
| `text-scale-*` system compliance | ⚠️ FAQ, BreakupModal use raw Tailwind text sizes | Low |
| Border on glass elements | ⚠️ Hover borders on game cards violate "no border" rule | Low |
| Rounded corner consistency | ⚠️ Mix of `rounded-2xl`, `[2rem]`, `[2.5rem]` | Low |
| Typography doc vs CSS | ⚠️ Doc says Quicksand/Outfit; CSS uses Nunito/Manrope | Low (doc issue) |

---

## 9. Priority Fixes

### P1 — Fix Before Merge
1. **`FlashcardGame.tsx` line 1441–1442**: Replace hardcoded `rgba(255, 71, 97, ...)` in `pulse-border` keyframes with a CSS custom property or accent-color-aware approach.
2. **`FlashcardGame.tsx` line 1207**: Change `accentColor="#f59e0b"` to `accentColor={tierColor}` for QuickFire.
3. **Focus states**: Add `focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]` to all interactive buttons in Navbar, FAQ, and FlashcardGame game-select grid.

### P2 — Polish / Consistency
4. **`AccountSettings.tsx`**: Change `focus:border-rose-400` → `focus:border-[var(--accent-color)]` on both inputs.
5. **`AccountSettings.tsx`**: Add `dark:bg-red-900/20 dark:border-red-800 dark:text-red-400` dark variants to error message block.
6. **`BreakupModal.tsx` + `Navbar.tsx`**: Replace 3 raw emoji (🥀, 🕊️, 🔔) with ICONS equivalents.
7. **`FAQ.tsx`**: Replace raw `text-sm / text-base / text-3xl` with `text-scale-*` classes.

### P3 — Documentation
8. Update `typography.md` to reflect actual fonts in use: `Nunito` (header) + `Manrope` (body), with note about font-preset system allowing swaps.
9. Clarify in `components.md` whether hover-borders on glass cards are acceptable for interactive feedback (current rule says no borders on glass, but cards clearly benefit from visual hover affordance).

---

*Reviewed by subagent — full file read of src/index.css, all 6 design system docs, and 10/10 target components.*
