# Motion & Animation

## CSS-Only Preference

Prioritize CSS-only solutions over JavaScript animation libraries.

## Baseline

Use `transition-all duration-200` as the default transition on all interactive elements.

## High-Impact Moments

Focus animation effort on moments that create delight:

- **Page load** — Staggered reveals using `animation-delay`
- **State transitions** — Mode switches, card flips
- **Micro-interactions** — Button hover/active/press feedback

One well-orchestrated reveal creates more delight than scattered animations throughout the interface.

## Onboarding Reveal

Step content uses a `reveal-up` animation with stagger classes:

```css
@keyframes reveal-up {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-reveal { animation: reveal-up 0.5s ease-out both; }
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
/* ... through .stagger-6 at 0.3s */
```

## Floating Backgrounds

Canvas-based animated backgrounds for depth:
- `FloatingHeartsBackground` — hearts at 10–25% opacity, count scales with step
- `WordParticleBackground` — word particles, desktop only
- Both render behind glass cards at `z-0`

## Button Press Feedback

All buttons should have:
- `active:scale-[0.98]` — subtle press effect
- `hover:brightness-105` — gentle highlight on desktop
- `disabled:opacity-40` — clear disabled state

## Rules

- Don't animate everything — be intentional
- Keep durations short (150-300ms for interactions, up to 500ms for reveals)
- Use easing that feels natural (`ease-out` for enters, `ease-in` for exits)
- Test on mobile — animations should feel smooth, not janky
