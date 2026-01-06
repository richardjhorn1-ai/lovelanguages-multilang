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

---

## Mobile Design System

The mobile interface prioritizes **density and efficiency** while maintaining the warm, approachable aesthetic. Every pixel matters on small screens.

### Core Mobile Principles

1. **Compact but not cramped** - Reduce padding/margins by ~30-40% from desktop, not eliminate them
2. **Touch-friendly targets** - Minimum 32px tap targets, but visual elements can be smaller
3. **Hidden chrome** - Remove scrollbars, chevrons, and decorative elements that waste space
4. **Inline over stacked** - Combine elements horizontally where possible (e.g., title + icons on same row)
5. **Progressive disclosure** - Use slide-in panels instead of always-visible sidebars

### Mobile Breakpoint

Uses Tailwind's `md:` breakpoint (768px). Pattern: `mobile-value md:desktop-value`

```tsx
// Example: Responsive padding
className="px-3 md:px-4 py-2 md:py-3"

// Example: Responsive text
className="text-xs md:text-sm"

// Example: Hide on mobile
className="hidden md:flex"

// Example: Show only on mobile
className="md:hidden"
```

### Mobile Size Scale

| Element | Mobile | Desktop |
|---------|--------|---------|
| Container padding | `p-2`, `p-3` | `p-4`, `p-6` |
| Card padding | `p-2.5`, `p-3` | `p-4`, `p-5` |
| Button padding | `px-2 py-1.5` | `px-3 py-2` |
| Icon size | `w-3.5 h-3.5`, `w-4 h-4` | `w-4 h-4`, `w-5 h-5` |
| Avatar size | `w-8 h-8` | `w-9 h-9`, `w-10 h-10` |
| Text body | `text-xs` | `text-sm` |
| Text label | `text-[9px]`, `text-[10px]` | `text-[10px]`, `text-xs` |
| Gaps | `gap-1.5`, `gap-2` | `gap-3`, `gap-4` |
| Border radius | `rounded-lg`, `rounded-xl` | `rounded-xl`, `rounded-2xl` |

### Mobile Navigation

**Navbar pattern:**
- 3 centered nav buttons (Chat, Love Log, Play) - evenly spaced
- Logo on left (icon only, no text)
- Profile avatar on right (no chevron, compact)
- Progress button hidden (accessible via profile dropdown)
- Help/Notifications hidden (accessible via profile dropdown)

**Profile dropdown (mobile):**
- Narrower width: `w-48` vs `w-56`
- Smaller text: `text-xs` vs `text-sm`
- Reduced padding: `px-3 py-2` vs `px-4 py-2.5`
- Smaller icons: `w-3.5 h-3.5` vs `w-4 h-4`
- Tighter gaps: `gap-2` vs `gap-3`

### Mobile Panels & Overlays

Use slide-in panels for secondary content instead of sidebars:

```tsx
// Slide-in from left (conversation index)
className={`fixed inset-0 z-[200] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
// Panel: transform translate-x-0 / -translate-x-full

// Slide-in from right (notifications)
// Panel: transform translate-x-0 / translate-x-full
```

**Panel anatomy:**
- Semi-transparent backdrop (`bg-black/30`) that closes on tap
- Panel width: `w-72 max-w-[85vw]`
- Header with title + close button
- Scrollable content area

### Mobile Scrollbar

Scrollbars are **completely hidden** on mobile (< 768px) via CSS:

```css
@media (max-width: 767px) {
  * {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  *::-webkit-scrollbar {
    display: none;
  }
}
```

Scrolling still works - only the visual scrollbar is hidden.

### Mobile Grid Layouts

**Love Log cards:** `grid-cols-2` (2 columns on mobile vs 3-5 on desktop)
**Play game cards:** `grid-cols-2` with centered content, hidden descriptions
**Card heights:** Reduced (e.g., `h-[200px]` vs `h-[280px]`)

### Mobile-Specific Components

**Chat:**
- Hamburger menu (☰) opens conversation sidebar
- Reduced message padding: `px-3 py-2` vs `px-5 py-3.5`
- Smaller input buttons: `w-10 h-10` vs `w-14 h-14`
- Compact empty state suggestions

**Love Log:**
- Single-row header with inline search/sync icons
- Expandable search field (toggle visibility)
- 2-column card grid with smaller cards

**Play:**
- 2-column game selection grid
- Centered icons with hidden descriptions on mobile
- Compact game cards

### Mobile UX Patterns

1. **Remove decorative chevrons** - They waste space and aren't needed for touch
2. **Truncate long text** - Use `truncate` class liberally
3. **Badges over text** - Show counts as small badges, not "X requests"
4. **Tap to expand** - Hide secondary info behind taps (search fields, sidebars)
5. **Full-width touch targets** - Buttons should span full width in lists

---

## When Adding New UI

1. **Match the existing aesthetic** - Warm tones, rounded shapes, playful but not childish
2. **Use established colors** - Don't introduce new brand colors without reason
3. **Follow existing patterns** - Look at similar components first
4. **Keep it simple** - Resist adding visual complexity for its own sake
5. **Test the feel** - Does it feel like the same app? Does it feel designed, not generated?
