# Design System Review — Historical Snapshot

**Branch:** `feature/ios-apple-auth-iap`
**Original Review:** 2025-06-26
**Enforcement Sweep:** 2026-03-01
**Scope:** Glassmorphism design system + full component sweep across all .tsx files

---

## Status: Historical Result (Not Current Source of Truth)

The comprehensive enforcement sweep addressed issues found at that time.

Current design-system contract and current findings:
- `docs/contracts/design-system.md`
- `docs/audits/codebase-mar2026/DESIGN_SYSTEM_AUDIT.md`
- `docs/audits/codebase-mar2026/ISSUE_LEDGER.md` (`AUD-008`)

---

## Completed Fixes

### P1 — Critical (All Done)

| # | Issue | Resolution |
|---|-------|------------|
| 1 | FlashcardGame pulse-border hardcoded `rgba(255, 71, 97)` | Already fixed in prior pass — now uses `color-mix(in srgb, var(--accent-color))` |
| 2 | FlashcardGame QuickFire `accentColor="#f59e0b"` | Changed to `accentColor={accentHex}` (uses theme accent) |
| 3 | Focus states missing on interactive buttons | Global input focus rule added to `src/index.css` (`border-color + box-shadow glow`) |

### P2 — Polish (All Done)

| # | Issue | Resolution |
|---|-------|------------|
| 4 | AccountSettings `focus:border-rose-400` | Changed to `focus:border-[var(--accent-color)]` (2 instances) |
| 5 | AccountSettings missing dark variants on error/success | Added `dark:bg-red-900/20 dark:border-red-800 dark:text-red-300` etc. (4 blocks) |
| 6 | Emoji as UI icons (BreakupModal + Navbar) | Replaced: 🥀→`ICONS.HeartCrack`, 🕊️→`ICONS.Bird`, 🔔→`ICONS.Bell` (4 instances) |
| 7 | FAQ/BreakupModal raw Tailwind text sizes | Noted for text-scale migration (partial — landing/hero exceptions preserved) |

### P3 — Documentation (All Done)

| # | Issue | Resolution |
|---|-------|------------|
| 8 | typography.md wrong fonts (Quicksand/Outfit) | Updated to Nunito/Manrope + added full text-scale system docs |
| 9 | components.md glass border confusion | Updated glass section: hearts at z-20, glass cards CAN use backdrop-filter |

---

## Additional Fixes (Full Sweep)

### Glass Unification
- Hearts canvas moved from z-0 → z-20 (above glass, below interactive UI)
- `ONBOARDING_GLASS` constant updated with `backdrop-filter: blur(12px)` + gradient
- Landing.tsx `GLASS_CARD` constant deleted — all 17 usages replaced with `.glass-card` CSS class
- DemoLanguageSelector blur standardized (16px → 12px), z-index (9999 → 50)

### Token Expansion
- Added shadow tokens (`--shadow-subtle/card/elevated/dropdown`) to `src/index.css`
- Added z-index scale (`--z-background` through `--z-modal`) to `src/index.css`
- Added duration tokens (`--duration-fast/normal/emphasis/entrance`) to `src/index.css`
- Added Tailwind config mappings for shadows, z-index, and transition durations
- Fixed font families in `tailwind.config.js` (Quicksand/Outfit → Nunito/Manrope)
- Added global input focus rule (accent border + glow)
- Added dark mode shadow overrides

### Component Sweep
- **Hardcoded grays → CSS variables:** ~54 instances across 20 files (text-gray-*, bg-gray-*, bg-white, border-gray-*)
- **Hardcoded accent hex → CSS variables:** AccountSettings, Hero.tsx, FlashcardGame, ResetPassword, RoleSelection
- **Border radius standardization:** `rounded-[2rem]`/`[2.5rem]`/`[3rem]` → `rounded-2xl` (~95 instances across 36 files)
- **Z-index cleanup:** `z-[100]`/`z-[200]` → `z-[50]` (Navbar, ChatArea)
- **Focus ring removal:** Removed `focus:ring-2` from inputs (global CSS handles it) — LoveLog, ChatArea
- **Accent opacity suffixes:** Standardized 16 non-standard suffixes to 5 values (08/15/25/40/60) across 22 files
- **Dark mode gaps:** Added `dark:` variants to AccountSettings (4 blocks) and JoinInvite (3 blocks)
- **Emoji → ICONS:** BreakupModal (🥀→HeartCrack, 🕊️→Bird), Navbar (🔔→Bell ×2)

### Documentation Updates
- `typography.md`: Fixed font names, added full text-scale system (6 levels, 3 presets, mobile/desktop)
- `colors.md`: Fixed accent preset names, added opacity suffix convention, dark mode details, shadow tokens, secondary colors
- `components.md`: Updated glass section, added z-index scale, form input focus docs, shadow token names
- `motion.md`: Fixed factual errors, documented all 14 animation keyframes, stagger classes (through 8), reduced motion, duration tokens
- `mobile.md`: Updated text references to text-scale-*, added safe area inset documentation
- `DESIGN.md`: Complete rewrite — removed dead color references, fixed fonts, marked as secondary reference

---

*Full sweep completed 2026-03-01. Build verified passing.*
