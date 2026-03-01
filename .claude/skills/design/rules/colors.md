# Color Palette

## Theme System

Colors are managed through CSS variables set by `services/theme.ts`. **Never hardcode colors** — use CSS variables or Tailwind theme tokens.

### CSS Variable Tokens

| Variable | Purpose | Example Usage |
|----------|---------|--------------|
| `--accent-color` | Primary accent (user-chosen) | Buttons, links, active states |
| `--accent-light` | Light accent tint | Card backgrounds, hover states |
| `--accent-border` | Accent for borders | Selected item borders |
| `--accent-hover` | Darker accent for hover | Button hover states |
| `--accent-text` | Dark accent for text | Accent-colored text on light bg |
| `--accent-shadow` | Accent shadow color | Glow effects, button shadows |
| `--secondary-color` | Paired secondary accent | Badges, alternate highlights |
| `--secondary-light` | Light secondary tint | Secondary card backgrounds |
| `--bg-primary` | Page background | Main container |
| `--bg-card` | Card/panel background | Cards, modals, dropdowns |
| `--bg-app` | App background (tinted) | Root app background |
| `--text-primary` | Primary text | Headings, body text |
| `--text-secondary` | Secondary text | Labels, captions, muted text |
| `--border-color` | Default borders | Dividers, card borders |

### Shadow Tokens

CSS variables in `src/index.css`, mapped to Tailwind via `tailwind.config.js`:

| Variable | Value (Light) | Value (Dark) | Tailwind | Use |
|----------|--------------|--------------|----------|-----|
| `--shadow-subtle` | `0 2px 8px -2px rgba(0,0,0,0.04)` | `...0.12` | `shadow-subtle` | Subtle depth hints |
| `--shadow-card` | `0 8px 32px -8px rgba(0,0,0,0.08)` | `...0.15` | `shadow-card` | Standard card shadows |
| `--shadow-elevated` | `0 12px 40px -8px rgba(0,0,0,0.12)` | `...0.25` | `shadow-elevated` | Elevated panels |
| `--shadow-dropdown` | `0 8px 32px -8px rgba(0,0,0,0.2)` | `...0.35` | `shadow-dropdown` | Dropdowns, menus |

### Accent Color Presets

6 user-selectable accents defined in `services/theme.ts`. Each has a paired secondary color.

| Preset | Name | Primary | Secondary | Light BG |
|--------|------|---------|-----------|----------|
| `rose` | Rose & Gold | `#FF4761` | `#FFD93B` (gold) | `#FFF0F3` |
| `coral` | Coral & Pink | `#FF5831` | `#FF7BDD` (pink) | `#FFF4F1` |
| `honey` | Gold & Orange | `#FFD93B` | `#FF8B0D` (orange) | `#FFFBEB` |
| `mint` | Mint & Ice | `#31DB92` | `#96DEEA` (ice) | `#ECFDF5` |
| `ocean` | Blue & Lilac | `#1569FF` | `#9292FF` (lilac) | `#EFF6FF` |
| `wine` | Wine & Rose | `#BE123C` | `#FF7BDD` (pink) | `#FFF1F2` |

> **Migration:** Old preset names still work: `blush` → `coral`, `lavender` → `ocean`, `teal` → `mint`.

**Always use `var(--accent-color)`** for interactive/branded elements. Never hardcode `#FF4761` or any specific accent hex in component code.

### Accent Opacity Suffix Convention

When using dynamic accent colors with hex opacity suffixes (e.g., `${accentColor}15`), use only these **5 standard suffixes**:

| Suffix | ~Opacity | Use For |
|--------|----------|---------|
| `08` | ~3% | Very subtle tints, gradient blobs, decorative backgrounds |
| `15` | ~8% | Icon backgrounds, selected bg, badges, hover tints |
| `25` | ~15% | Shadows, soft borders, hover borders |
| `40` | ~25% | Focus borders, strong hover states, active borders |
| `60` | ~38% | Strong borders, prominent selections, glow shadows |

```tsx
// Correct — standard suffixes
backgroundColor: `${accentColor}15`  // icon background
border: `1px solid ${accentColor}25`  // soft border
boxShadow: `0 4px 12px ${accentColor}25`  // glow

// Wrong — use nearest standard value
backgroundColor: `${accentColor}12`  // use 15
border: `1px solid ${accentColor}30`  // use 25
```

## Dark Mode

4 dark mode presets in `services/theme.ts`, applied via `.dark` CSS class:

| Preset | Background | Card | Text | Border |
|--------|-----------|------|------|--------|
| `off` (Light) | `#fdfcfd` | `#ffffff` | `#292F36` | `#e5e7eb` |
| `midnight` | `#1a1a2e` | `#2d2d44` | `#f5f5f5` | `#3d3d5c` |
| `charcoal` | `#1f1f1f` | `#2a2a2a` | `#f5f5f5` | `#3a3a3a` |
| `black` | `#000000` | `#1a1a1a` | `#ffffff` | `#2a2a2a` |

**How it works:** `applyTheme()` in `services/theme.ts` reads theme settings, adds/removes `.dark` class on `<html>`, and sets all CSS variables. The `darkMode: 'class'` Tailwind config enables `dark:` prefixed utilities.

**Background style:** Two options — `tinted` (accent-tinted bg) and `clean` (neutral bg). Clean mode disables glass blur via `[data-bg-style="clean"] .glass-card`.

## Glass Opacity Tier System

**Principle: opacity = depth.** Higher in the visual stack → more opaque. Every `white/XX` value maps to a named tier.

### System A: Glass on App Background

For elements floating on the `--accent-light` / `app-bg-decor` background.

| Tier | Light | Dark | CSS Class / Tailwind | When to use |
|------|-------|------|---------------------|-------------|
| **backdrop** | `white/15` | `black/25` | `.modal-backdrop` | Scrim behind modals/drawers |
| **surface** | `white/40` | `white/12` | `bg-white/40 dark:bg-white/12` | Tab bar bgs, badges, icon circles, unselected options |
| **card** | `55%→30%` gradient | `bg-card 65%→45%` | `.glass-card` | Standard cards, panels, toolbars — the workhorse |
| **elevated** | `white/70` | `bg-card/75` | `bg-white/70` or `.glass-card` with extra blur | Auth forms, prominent panels needing separation from siblings |
| **active** | `white/75` | `white/15` | `bg-white/75 dark:bg-white/15` | Selected tabs, active pills, pressed states |
| **solid** | `95%→90%` gradient | `bg-card 95%→88%` | `.glass-card-solid` | Modals, dropdowns, menus — no bleed-through |

**Hover rule:** Resting opacity + 15, capped at 90. Examples:
- Surface (40) → `hover:bg-white/55`
- Active (75) → `hover:bg-white/90`

**No borders on glass elements.** Glass edges are defined by `backdrop-filter` + inset `box-shadow`, not `border`.

### System B: White on Accent Color

For text/elements on vibrant colored backgrounds (Progress card, game overlays, challenge banners).

| Tier | Value | When to use |
|------|-------|-------------|
| **on-accent-surface** | `white/10` | List items, section dividers, subtle containers |
| **on-accent-track** | `white/20` | Progress bar tracks, icon circles, structural containers |
| **on-accent-muted** | `white/50` | Tertiary labels, decorative text, "max level" messages |
| **on-accent-secondary** | `white/65` | Secondary labels ("Current Level", "Total XP") |
| **on-accent-primary** | `white/85` | Interactive text, buttons, descriptions — must be readable |

**Hover rule:** +10 opacity.

### CSS Classes (defined in `src/index.css`)

| Class | Tier | Use |
|-------|------|-----|
| `.glass-card` | card | Standard glass panel (gradient + blur 12px + inset shadow) |
| `.glass-card-solid` | solid | Modals, dropdowns (gradient + blur 20px + stronger shadow) |
| `.modal-backdrop` | backdrop | Semi-transparent blur behind overlays |
| `.app-bg-decor` | — | App root background (`--accent-light` in light, accent-tinted in dark) |

### Deprecated / Undefined Variables

**Do NOT use these** — they are undefined and resolve to nothing:
- `--bg-secondary` → use `bg-white/40 dark:bg-white/12` (surface tier) or `.glass-card`
- `--border-primary` → use `var(--border-color)` if a border is truly needed

## Role-Aware Backgrounds (Onboarding/Landing)

- **Student**: `linear-gradient(145deg, #FFF0F3 0%, #fce4ec 35%, #FFF0F3 65%, #fff5f7 100%)`
- **Tutor**: `linear-gradient(145deg, #f0fdfa 0%, #e0f2f1 35%, #f0fdfa 65%, #f5fffe 100%)`
- **Neutral**: `#fdfcfd`

## Semantic Feedback Colors

| Purpose | Variable | Value |
|---------|----------|-------|
| Correct | `--color-correct` | `#10B981` |
| Incorrect | `--color-incorrect` | `#EF4444` |
| Warning | `--color-warning` | `#F59E0B` |

Each has a `*-bg` variant at 10% opacity for backgrounds.

## Target Word Highlight

`#FF4761` — used for all target language vocabulary words in chat. Do not use other colors for this.

## Tier Colors

Each proficiency tier has a distinct color in `constants/levels.ts`. Always use `tierColor` from level info, never hardcode tier colors.

## Scrollbar

Custom scrollbar (desktop only, hidden on mobile):
- Track: transparent
- Thumb: `#fecdd3` (soft pink)
- Thumb hover: `#fb7185` (rose)

## Anti-Patterns

- **Never** use `constants/colors.ts` — it's dead code
- **Never** hardcode `bg-white`, `bg-gray-100`, `text-gray-800` — use `var(--bg-card)`, `var(--bg-primary)`, `var(--text-primary)`
- **Never** hardcode accent hex values — use `var(--accent-color)` or `var(--accent-light)`
- **Never** use non-standard opacity suffixes — only `08`, `15`, `25`, `40`, `60`
- Use `style={}` prop when color comes from JavaScript variables (tier colors, dynamic accents)
