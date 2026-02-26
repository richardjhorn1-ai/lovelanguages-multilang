# Color Palette

## Theme System

Colors are managed through CSS variables set by `services/theme.ts`. **Never hardcode colors** — use CSS variables or Tailwind theme tokens.

### CSS Variable Tokens

| Variable | Purpose | Example Usage |
|----------|---------|--------------|
| `--accent-color` | Primary accent (user-chosen) | Buttons, links, active states |
| `--accent-light` | Light accent tint | Card backgrounds, hover states |
| `--accent-border` | Accent for borders | Selected item borders |
| `--bg-primary` | Page background | Main container |
| `--bg-card` | Card/panel background | Cards, modals, dropdowns |
| `--text-primary` | Primary text | Headings, body text |
| `--text-secondary` | Secondary text | Labels, captions, muted text |
| `--border-color` | Default borders | Dividers, card borders |

### Accent Color Presets

6 user-selectable accents defined in `services/theme.ts`: rose, blush, lavender, wine, teal, honey. Each has 10 variants (primary, hover, light, dark, text, border, shadow, etc.).

**Always use `var(--accent-color)`** for interactive/branded elements. Never hardcode `#FF4761` or any specific accent hex in component code.

## Glass Opacity Tier System

**Principle: opacity = depth.** Higher in the visual stack → more opaque. Every `white/XX` value maps to a named tier.

### System A: Glass on App Background

For elements floating on the pink `--accent-light` / `app-bg-decor` background.

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
- Use `style={}` prop when color comes from JavaScript variables (tier colors, dynamic accents)
