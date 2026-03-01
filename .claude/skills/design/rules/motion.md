# Motion & Animation

## CSS-Only Preference

Prioritize CSS-only solutions over JavaScript animation libraries.

## Baseline

Use `transition-all duration-200` as the default transition on all interactive elements.

## Duration Tokens

CSS variables defined in `src/index.css`, mapped to Tailwind via `tailwind.config.js`:

| Token | Value | Tailwind | Use |
|-------|-------|----------|-----|
| `--duration-fast` | 150ms | `duration-fast` | Micro-interactions, hover states |
| `--duration-normal` | 200ms | `duration-normal` | Standard transitions (default) |
| `--duration-emphasis` | 400ms | `duration-emphasis` | Pop-in, celebrations, emphasis |
| `--duration-entrance` | 500ms | `duration-entrance` | Page reveals, staggered entrances |

## High-Impact Moments

Focus animation effort on moments that create delight:

- **Page load** — Staggered reveals using `animation-delay`
- **State transitions** — Mode switches, card flips
- **Micro-interactions** — Button hover/active/press feedback

One well-orchestrated reveal creates more delight than scattered animations throughout the interface.

## Button Press Feedback

All buttons get a global press effect via `src/index.css`:

```css
button:active:not(:disabled) {
  scale: 0.97;
}
```

Additionally, glass cards have a hover lift on desktop:

```css
@media (hover: hover) {
  .glass-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 40px -8px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }
}
```

**Disabled state:** `opacity-40 cursor-not-allowed`

## Animation Keyframes

All keyframes defined in `src/index.css`:

### Entrances

| Keyframe | Duration | Easing | Class | Use |
|----------|----------|--------|-------|-----|
| `reveal-up` | 0.5s | ease-out | `.animate-reveal` | Onboarding/landing content slides up with fade |
| `pop-in` | 0.4s | cubic-bezier(0.34, 1.56, 0.64, 1) | `.animate-pop-in` | Celebratory entrance (overshoots then settles) |
| `fade-in-scale` | 0.3s | ease-out | `.animate-fade-in-scale` | Softer entrance for modals and overlays |
| `slide-up` | 0.3s | ease-out | `.animate-slide-up` | Chat messages, notifications |

### Feedback

| Keyframe | Duration | Class | Use |
|----------|----------|-------|-----|
| `shake` | 0.5s | `.animate-shake` | Error/incorrect input feedback |
| `correct-glow` | 0.6s | `.animate-correct-glow` | Green box-shadow pulse for correct answers |
| `incorrect-flash` | 0.6s | `.animate-incorrect-flash` | Red box-shadow pulse for wrong answers |
| `count-pulse` | 0.4s | `.animate-count-pulse` | Score number increment animation |
| `sparkle` | 0.8s | `.animate-sparkle` | Mastery/streak celebration particles |

### Directional Slides (tailwindcss-animate compatible)

| Keyframe | Direction | Class |
|----------|-----------|-------|
| `enter-from-right` | Slides in from right (100%) | `.slide-in-from-right` |
| `enter-from-left` | Slides in from left (-100%) | `.slide-in-from-left` |
| `enter-from-top` | Slides down from above (-8px) | `.slide-in-from-top` |
| `enter-from-bottom` | Slides up from below (8px) | `.slide-in-from-bottom` |
| `zoom-enter` | Scales up from 95% | `.zoom-in` |
| `fade-enter` | Fades in | `.fade-in` |

Composed via `.animate-in` base class + direction modifier.

## Stagger Classes

Cascade animation delays through list items:

```css
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
/* ... */
.stagger-8 { animation-delay: 0.4s; }
```

8 stagger levels available (0.05s increments).

## Floating Backgrounds

Canvas-based animated backgrounds for depth:

- `FloatingHeartsBackground` — hearts at 8–18% opacity, renders at **z-20** (above glass cards, below interactive UI)
- `WordParticleBackground` — word particles, desktop only
- Both have `pointer-events-none` so they don't block interaction

## 3D Flip Utilities

For flashcard games:

```css
.perspective-1000 { perspective: 1000px; }
.transform-style-3d { transform-style: preserve-3d; }
.backface-hidden { backface-visibility: hidden; }
.rotate-y-180 { transform: rotateY(180deg); }
```

## Reduced Motion

All animations respect the OS `prefers-reduced-motion` setting via a global override in `src/index.css`:

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

## Rules

- Don't animate everything — be intentional
- Keep durations short (150-300ms for interactions, up to 500ms for reveals)
- Use easing that feels natural (`ease-out` for enters, `ease-in` for exits)
- Test on mobile — animations should feel smooth, not janky
- Use duration tokens instead of hardcoded values where possible
