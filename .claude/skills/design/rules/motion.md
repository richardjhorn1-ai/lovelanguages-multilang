# Motion & Animation

## CSS-Only Preference

Prioritize CSS-only solutions over JavaScript animation libraries.

## Baseline

Use `transition-all duration-200` as the default transition.

## High-Impact Moments

Focus animation effort on moments that create delight:

- **Page load** — Staggered reveals using `animation-delay`
- **State transitions** — Mode switches, card flips
- **Micro-interactions** — Button hover/active/press feedback

One well-orchestrated reveal creates more delight than scattered animations throughout the interface.

## Rules

- Don't animate everything — be intentional
- Keep durations short (150-300ms for interactions, up to 500ms for reveals)
- Use easing that feels natural (`ease-out` for enters, `ease-in` for exits)
- Test on mobile — animations should feel smooth, not janky
