# Component Patterns

## Glass Morphism

The app uses semi-transparent glass cards. **No `backdrop-filter`** — canvas background elements (hearts, word particles) sit on separate GPU compositing layers that `backdrop-filter` can't capture. Semi-transparent backgrounds let animated elements show through naturally.

**Shared constants** in `components/onboarding/OnboardingStep.tsx`:

| Constant | Use For | Key Properties |
|----------|---------|----------------|
| `ONBOARDING_GLASS` | Content cards, feature lists | `rgba(255,255,255,0.55)`, 1px white border, subtle shadow, 20px radius |
| `ONBOARDING_OPTION(isSelected, accentColor)` | Selection buttons | Accent tint when selected, 16px radius |
| `ONBOARDING_INPUT(isFilled, accentColor)` | Form inputs | Accent border when filled, 16px radius |

**Landing equivalent** in `Landing.tsx`:

| Constant | Use For | Key Properties |
|----------|---------|----------------|
| `GLASS_CARD` | Landing page cards | Same as ONBOARDING_GLASS + `willChange: 'transform, opacity'` |
| Auth cards | Login/signup | Slightly more opaque: `rgba(255,255,255,0.7)` |

**Main app cards** — use CSS variables for dark mode compatibility:

```tsx
// Light mode glass
backgroundColor: 'rgba(255, 255, 255, 0.55)',
border: '1px solid rgba(255, 255, 255, 0.6)',
boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.08)',
borderRadius: '20px',

// Dark mode glass — use var(--bg-card) with alpha
backgroundColor: 'color-mix(in srgb, var(--bg-card) 70%, transparent)',
```

## Cards/Panels

- Rounded corners: `rounded-xl` (standard cards), `rounded-2xl` (large panels/modals), `rounded-full` (pills/avatars only)
- Shadows: `shadow-sm` (subtle), `0 8px 32px -8px rgba(0,0,0,0.08)` (glass), `shadow-lg` (elevated)
- Soft background tints based on context
- Consistent padding: `p-4` (standard), `p-6` (prominent cards)

## Buttons

- **Primary**: Solid background with accent color, white text, `rounded-2xl`, `py-4`, glow shadow
- **Secondary**: Transparent with border, accent colored text
- **All buttons**: `transition-all duration-200`, `active:scale-[0.98]` for press feedback
- **Disabled**: `opacity-40 cursor-not-allowed`

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
- Heading: `font-header font-bold text-2xl md:text-3xl text-gray-800 mb-8`
- Sub-label: `text-gray-500 text-sm mb-3`
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
