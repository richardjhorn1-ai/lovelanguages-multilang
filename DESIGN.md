# DESIGN.md

This file provides design guidance to Claude Code (claude.ai/code) when working with UI and styling in this repository.

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
- Clichéd color schemes (purple gradients on white backgrounds)
- Predictable layouts and cookie-cutter component patterns
- Safe, timid design choices that lack character

**Instead:**
- Commit to the established warm, romantic aesthetic
- Make bold color choices—dominant colors with sharp accents
- Vary approaches between components; not everything needs the same pattern

## Established Design System

### Typography

Already configured in `index.html`:
- **Body**: `Outfit` - Clean, modern, slightly warm
- **Headers**: `Quicksand` - Rounded, friendly, distinctive

Use via Tailwind: `font-header` class for Quicksand.

### Color Palette

**Core colors** (defined in `constants/colors.ts`):
```
Primary:    #FF6B6B (coral red)
Secondary:  #4ECDC4 (teal)
Accent:     #FFE66D (golden yellow)
Background: #F7FFF7 (mint white)
Text:       #292F36 (near black)
Soft Pink:  #FFF0F3
Soft Blue:  #E7F5FF
```

**Polish word highlight**: `#FF4761` - Used consistently for all Polish vocabulary

**Tier colors** (for level system): Each proficiency tier has a distinct color defined in `constants/levels.ts`. Use `tierColor` from level info, not hardcoded values.

**Background**: `#fdfcfd` (warm off-white) - The primary app background

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

One well-orchestrated reveal creates more delight than scattered animations.

### Component Patterns

**Cards/Panels**: Rounded corners (`rounded-xl` or `rounded-2xl`), subtle shadows, soft background tints based on context.

**Buttons**:
- Primary: Solid background with `tierColor` or pink accent
- Secondary: Transparent with border, colored text
- Include subtle hover/active states

**Progress indicators**: Use `tierColor` for fill, gray track.

**Badges/Pills**: Background at 15% opacity (`${tierColor}15`) with full color text.

## Implementation Notes

### Tailwind Patterns Used

- Arbitrary values: `bg-[#fdfcfd]`, `text-[#FF4761]`
- Dynamic styles via `style={}` prop when color comes from JS
- Flexbox layouts: `flex flex-col`, `flex items-center justify-center`
- Spacing: Consistent use of Tailwind spacing scale

### Icon System

Icons defined in `constants/icons.tsx` as React components. Import via:
```tsx
import { ICONS } from './constants';
<ICONS.Heart className="w-5 h-5" />
```

### Responsive Considerations

Mobile-first design. Main app is optimized for phone-sized viewport within a larger container. Test at 375px width minimum.

## When Adding New UI

1. **Match the existing aesthetic** - Warm tones, rounded shapes, playful but not childish
2. **Use established colors** - Don't introduce new brand colors without reason
3. **Follow existing patterns** - Look at similar components first
4. **Keep it simple** - Resist adding visual complexity for its own sake
5. **Test the feel** - Does it feel like the same app? Does it feel designed, not generated?
