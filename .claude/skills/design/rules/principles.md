# Design Principles

## Minimalism Over Engineering

Only make changes that are directly requested or clearly necessary. Keep solutions simple and focused.

- Don't add features, refactor code, or make "improvements" beyond what was asked
- Don't add error handling or validation for scenarios that can't happen
- Don't create helpers or abstractions for one-time operations
- Reuse existing abstractions. Follow DRY.

## Avoid "AI Slop" Aesthetics

Generic, on-distribution outputs create the telltale "AI-generated" look. Make distinctive choices that feel genuinely designed for this romantic, couples-focused learning context.

**Avoid:**
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (purple gradients on white backgrounds)
- Predictable layouts and cookie-cutter component patterns
- Safe, timid design choices that lack character
- **Raw emoji as UI elements** — emoji in buttons, headers, feature lists, or decorative positions look unpolished. Use Phosphor icons via the `ICONS` system in `constants/icons.tsx`.

**Instead:**
- Commit to the established warm, romantic aesthetic
- Make bold color choices — dominant colors with sharp accents
- Vary approaches between components; not everything needs the same pattern
- Use the `ICONS` system for all iconography — consistent style and weight

## When Adding New UI

1. **Match the existing aesthetic** — Warm tones, rounded shapes, playful but not childish
2. **Use established colors** — CSS variables from `services/theme.ts`, never introduce hardcoded hex values
3. **Follow existing patterns** — Look at similar components first
4. **Use glass morphism** — Semi-transparent backgrounds with subtle borders and shadows for cards
5. **Use `font-header`** — All headings and display text should use Quicksand via the `font-header` class
6. **Keep it simple** — Resist adding visual complexity for its own sake
7. **Test the feel** — Does it feel like the same app? Does it feel designed, not generated?
