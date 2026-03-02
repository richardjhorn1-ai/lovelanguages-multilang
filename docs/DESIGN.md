# DESIGN.md

This file provides design guidance to Claude Code (claude.ai/code) when working with UI and styling in this repository.

> **Authoritative source:** `.claude/skills/design/rules/` — the individual rule files (`colors.md`, `typography.md`, `components.md`, `motion.md`, `mobile.md`, `principles.md`) are the detailed source of truth. This file is a high-level overview.

## Design Philosophy

### Minimalism Over Engineering

**Only make changes that are directly requested or clearly necessary.** Keep solutions simple and focused.

- Don't add features, refactor code, or make "improvements" beyond what was asked. A bug fix doesn't need surrounding code cleaned up. A simple feature doesn't need extra configurability.
- Don't add error handling, fallbacks, or validation for scenarios that can't happen. Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs).
- Don't create helpers, utilities, or abstractions for one-time operations. Don't design for hypothetical future requirements. The right amount of complexity is the minimum needed for the current task.
- Reuse existing abstractions where possible. Follow the DRY principle.

### Avoid "AI Slop" Aesthetics

Generic, on-distribution outputs create the telltale "AI-generated" look. Make distinctive choices that feel genuinely designed for this romantic, couples-focused learning context.

**Avoid:**
- Overused font families (Inter, Roboto, Arial, system fonts)
- Predictable layouts and cookie-cutter component patterns
- Safe, timid design choices that lack character

**Instead:**
- Commit to the established warm, romantic aesthetic
- Make bold color choices—dominant colors with sharp accents
- Vary approaches between components; not everything needs the same pattern

## Established Design System

### Typography

Configured in `index.html` via Google Fonts:
- **Body**: `Manrope` — Clean, modern, slightly warm (`--font-body`)
- **Headers**: `Nunito` — Rounded, friendly, distinctive (`--font-header`)

Use via Tailwind: `font-header` class for Nunito headings.

**Text scale system:** 6 semantic levels (`text-scale-micro` through `text-scale-heading`) with user-selectable size preferences. See `typography.md` for details.

### Color System

Colors are managed through **CSS variables** set by `services/theme.ts`. Never hardcode colors.

**6 accent presets:** rose, coral, honey, mint, ocean, wine — each with 10+ variants and a paired secondary color.

**Key variables:** `--accent-color`, `--accent-light`, `--bg-primary`, `--bg-card`, `--text-primary`, `--text-secondary`, `--border-color`

**Target language word highlight**: `#FF4761` — Used consistently for all target language vocabulary.

**Tier colors** (for level system): Each proficiency tier has a distinct color defined in `constants/levels.ts`. Use `tierColor` from level info, not hardcoded values.

**Background**: `var(--bg-primary)` — warm off-white in light mode, dark in dark mode.

### Glass Morphism

The app uses frosted glass cards (`.glass-card` CSS class) with `backdrop-filter: blur(12px)`, gradient backgrounds, and inset shadows. See `components.md` and `colors.md` for the full 6-tier glass opacity system.

### Dark Mode

4 presets: Light (off), Midnight, Charcoal, Black. Applied via `.dark` class on `<html>`. All CSS variables update automatically. Use `dark:` Tailwind prefix for dark mode overrides.

### Scrollbar

Custom styled (pink theme):
- Track: transparent
- Thumb: `#fecdd3` (soft pink)
- Thumb hover: `#fb7185` (rose)

### Motion & Interaction

Prioritize CSS-only solutions. Use `transition-all duration-200` as baseline.

Focus on high-impact moments:
- Page load animations with staggered reveals (`animation-delay`)
- State transitions (mode switches, card flips)
- Micro-interactions on buttons and interactive elements

Global button press: `button:active { scale: 0.97 }`. All animations respect `prefers-reduced-motion`.

### Component Patterns

**Cards/Panels**: `rounded-xl` (standard), `rounded-2xl` (large), glass with `.glass-card` class.

**Buttons**:
- Primary: Solid background with accent color, white text, `rounded-2xl`
- Secondary: Transparent with border, colored text
- All get `transition-all duration-200` and global press feedback

**Progress indicators**: Use `tierColor` for fill, gray track.

**Badges/Pills**: Background at 15% opacity (`${tierColor}15`) with full color text.

## Implementation Notes

### Tailwind Patterns

- CSS variables: `bg-[var(--bg-card)]`, `text-[var(--text-primary)]`
- Dynamic styles via `style={}` prop when color comes from JS
- Text scale: `text-scale-body`, `text-scale-label`, etc.
- Shadow tokens: `shadow-subtle`, `shadow-card`, `shadow-elevated`

### Icon System

Icons defined in `constants/icons.tsx` as React components. Import via:
```tsx
import { ICONS } from './constants';
<ICONS.Heart className="w-5 h-5" />
```

**Never use raw emoji** as UI elements. Emoji are only acceptable in user-generated content.

### Responsive Design

Mobile-first. Uses `md:` breakpoint (768px). Safe area insets via CSS variables. See `mobile.md` for full mobile design system.

---

## When Adding New UI

1. **Match the existing aesthetic** — Warm tones, rounded shapes, playful but not childish
2. **Use established colors** — CSS variables only, never hardcode
3. **Follow existing patterns** — Check `.claude/skills/design/rules/` first
4. **Use text-scale system** — `text-scale-*` classes, not raw `text-xs`/`text-sm`
5. **Keep it simple** — Resist adding visual complexity for its own sake
6. **Test the feel** — Does it feel like the same app? Does it feel designed, not generated?
