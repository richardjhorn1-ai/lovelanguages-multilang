# Mobile Design

## Breakpoint

Uses Tailwind's `md:` breakpoint (768px). Pattern: `mobile-value md:desktop-value`

```tsx
className="px-3 md:px-4 py-2 md:py-3"  // Responsive padding
className="text-xs md:text-sm"           // Responsive text
className="hidden md:flex"               // Hide on mobile
className="md:hidden"                    // Show only on mobile
```

## Core Principles

1. **Compact but not cramped** — Reduce padding/margins ~30-40% from desktop
2. **Touch-friendly** — Minimum 32px tap targets
3. **Hidden chrome** — Remove scrollbars, chevrons, decorative waste
4. **Inline over stacked** — Combine elements horizontally where possible
5. **Progressive disclosure** — Slide-in panels instead of always-visible sidebars

## Size Scale

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

## Navigation (Mobile)

- 3 centered nav buttons (Chat, Love Log, Play) — evenly spaced
- Logo on left (icon only, no text)
- Profile avatar on right (no chevron, compact)
- Progress/Help/Notifications hidden — accessible via profile dropdown

## Profile Dropdown (Mobile)

Narrower (`w-48` vs `w-56`), smaller text (`text-xs`), reduced padding (`px-3 py-2`), smaller icons (`w-3.5 h-3.5`), tighter gaps (`gap-2`).

## Panels & Overlays

Slide-in panels for secondary content:
- Semi-transparent backdrop (`bg-black/30`) that closes on tap
- Panel width: `w-72 max-w-[85vw]`
- Header with title + close button
- Scrollable content area
- Left slide for conversation index, right slide for notifications

## Scrollbar

Completely hidden on mobile (< 768px):
```css
@media (max-width: 767px) {
  * { -ms-overflow-style: none; scrollbar-width: none; }
  *::-webkit-scrollbar { display: none; }
}
```

## Grid Layouts

- **Love Log**: `grid-cols-2` (vs 3-5 desktop)
- **Play games**: `grid-cols-2`, centered content, hidden descriptions
- **Card heights**: Reduced (e.g., `h-[200px]` vs `h-[280px]`)

## Mobile UX Patterns

1. Remove decorative chevrons — waste space on touch
2. Truncate long text — use `truncate` class
3. Badges over text — show counts, not "X requests"
4. Tap to expand — hide secondary info behind taps
5. Full-width touch targets — buttons span full width in lists
