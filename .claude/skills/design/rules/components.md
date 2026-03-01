# Component Patterns

## Glass Morphism

The app uses frosted glass cards with `backdrop-filter: blur(12px)`. The FloatingHeartsBackground canvas in onboarding renders at **z-20** (above glass cards, below interactive UI) with `pointer-events-none`, so `backdrop-filter` works safely on glass layers at z-10.

**Z-index stacking (onboarding):**
- `z-0`: Gradient blobs (decorative)
- `z-10`: Glass content cards (with blur)
- `z-20`: Hearts canvas (subtle, pointer-events-none)
- `z-30+`: Interactive UI (buttons, modals)

**CSS classes** (defined in `src/index.css`):

| Class | Use For | Key Properties |
|-------|---------|----------------|
| `.glass-card` | Standard cards, panels | Gradient bg (55%→30%), blur 12px, inset shadow, hover lift |
| `.glass-card-solid` | Modals, dropdowns, menus | Gradient bg (95%→90%), blur 20px, stronger shadow |
| `.modal-backdrop` | Scrim behind overlays | `rgba(0,0,0,0.3)`, blur 8px |

**Inline style constants** in `components/onboarding/OnboardingStep.tsx`:

| Constant | Use For | Key Properties |
|----------|---------|----------------|
| `ONBOARDING_GLASS` | Content cards, feature lists | Matches `.glass-card` — gradient bg + blur 12px + inset shadow, 20px radius |
| `ONBOARDING_OPTION(isSelected, accentColor)` | Selection buttons | Accent tint when selected, 16px radius |
| `ONBOARDING_INPUT(isFilled, accentColor)` | Form inputs | Accent border when filled, 16px radius |

**Landing page** uses `.glass-card` CSS class directly (with `rounded-[20px]`). Auth cards use slightly more opaque `rgba(255,255,255,0.72)` with accent border glow.

**Main app cards** — use `.glass-card` class for automatic dark mode support. For inline styles:

```tsx
// Light mode glass
background: 'linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.30))',
backdropFilter: 'blur(12px)',
boxShadow: '0 8px 32px -8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
borderRadius: '20px',

// Dark mode — prefer .glass-card class (auto dark mode).
// For inline styles, use color-mix:
background: 'color-mix(in srgb, var(--bg-card) 65%, transparent)',
```

**Rule: No borders on glass elements.** Glass edges are defined by `backdrop-filter` + inset `box-shadow`, not `border`.

## Z-Index Scale

Global z-index tokens defined as CSS variables and Tailwind utilities:

| Token | Value | Tailwind | Use |
|-------|-------|----------|-----|
| `--z-background` | 0 | `z-background` | Decorative gradient blobs |
| `--z-content` | 10 | `z-content` | Glass cards, main content |
| `--z-float` | 20 | `z-float` | Floating elements (hearts canvas) |
| `--z-sticky` | 30 | `z-sticky` | Sticky headers, toolbars |
| `--z-overlay` | 40 | `z-overlay` | Overlay backdrops |
| `--z-modal` | 50 | `z-modal` | Modals, dropdowns, menus |

**Rule:** Never use z-index values above 50. All dropdowns, modals, and overlays use `z-[50]`.

## Cards/Panels

- Rounded corners: `rounded-xl` (standard cards), `rounded-2xl` (large panels/modals), `rounded-full` (pills/avatars only)
- Shadows: `shadow-subtle`, `shadow-card` (glass), `shadow-elevated`, `shadow-dropdown`
- Soft background tints based on context
- Consistent padding: `p-4` (standard), `p-6` (prominent cards)

## Buttons

- **Primary**: Solid background with accent color, white text, `rounded-2xl`, `py-4`, glow shadow
- **Secondary**: Transparent with border, accent colored text
- **All buttons**: `transition-all duration-200`, global `button:active { scale: 0.97 }` press feedback
- **Disabled**: `opacity-40 cursor-not-allowed`
- **Landing buttons**: May use `py-3`/`py-3.5` for compact spacing

## Form Inputs

Global focus style applied via `src/index.css`:

```css
input:focus, textarea:focus, select:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 15%, transparent);
  outline: none;
}
```

**Do not** add `focus:ring-*` Tailwind classes on input/textarea/select elements — the global rule handles it. Buttons are excluded from the global rule and may still use `focus:ring-*`.

## Progress Indicators

- Fill color: `tierColor` or accent color
- Track: gray or `bg-white/30`
- Glow shadow on fill: `0 0 8px ${color}40`

## Badges/Pills

- Background at 15% opacity: `${tierColor}15`
- Text: full `tierColor`

## Icon System

Icons are Phosphor icons wrapped in `constants/icons.tsx`. **Always use `ICONS.*` — never raw emoji in UI.**

```tsx
import { ICONS } from './constants';
<ICONS.Heart className="w-5 h-5" />
```

**Never use raw emoji** (like `🎉`, `💕`, `🎯`) as icons, decorators, or visual elements. Emoji are only acceptable in user-generated content or AI chat responses.

**Size scale:**

| Context | Size | Example |
|---------|------|---------|
| Inline with text | `w-4 h-4` | Status indicators |
| Buttons, nav items | `w-5 h-5` | Action buttons |
| Feature list items | `w-8 h-8` | Feature descriptions |
| Hero/display icons | `w-16 h-16` to `w-20 h-20` | Page hero sections |

## Step/Page Layout Standard

Standard centered layout for full-page forms and onboarding-style screens:

- Container: `text-center items-center` within flex column
- Heading: `font-header font-bold text-2xl md:text-3xl text-[var(--text-primary)] mb-8`
- Sub-label: `text-[var(--text-secondary)] text-scale-label mb-3`
- Feature list: `flex items-center gap-3` rows with `w-8 h-8` icons
- Hero icon: `w-16 h-16` to `w-20 h-20` centered above heading

## Selection Patterns

- **Grid selection** (2-col): `grid grid-cols-2 gap-3`, use `ONBOARDING_OPTION`, padding `p-3` to `p-4`
- **Full-width selection**: Single column, use `ONBOARDING_OPTION`, padding `p-5` to `p-6`
- Always use `ONBOARDING_OPTION` for selection cards — never inline styles

## Tailwind Patterns

- Use CSS variables: `bg-[var(--bg-card)]`, `text-[var(--text-primary)]`, `text-[var(--accent-color)]`
- Dynamic styles via `style={}` prop when color comes from JS runtime values
- Flexbox: `flex flex-col`, `flex items-center justify-center`
- Consistent spacing: `gap-3` (lists), `gap-4` (grids), `p-4` (cards), `p-6` (panels)
