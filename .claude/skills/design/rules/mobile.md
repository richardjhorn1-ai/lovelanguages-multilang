# Mobile Design

## Breakpoint

Uses Tailwind's `md:` breakpoint (768px). Pattern: `mobile-value md:desktop-value`

```tsx
className="px-3 md:px-4 py-2 md:py-3"  // Responsive padding
className="text-scale-label md:text-scale-body"  // Responsive text
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
| Text body | `text-scale-label` | `text-scale-body` |
| Text label | `text-scale-micro` | `text-scale-caption` |
| Gaps | `gap-1.5`, `gap-2` | `gap-3`, `gap-4` |
| Border radius | `rounded-lg`, `rounded-xl` | `rounded-xl`, `rounded-2xl` |

> **Note:** Prefer `text-scale-*` classes over raw `text-xs`/`text-sm`. The text-scale system automatically handles mobile/desktop sizing via CSS variables. See `typography.md` for the full text scale system.

## Safe Area Insets

CSS variables for iOS notch/Dynamic Island support, defined in `src/index.css`:

```css
--safe-area-top: env(safe-area-inset-top, 0px);
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-left: env(safe-area-inset-left, 0px);
--safe-area-right: env(safe-area-inset-right, 0px);
```

Utility classes:
- `.safe-area-top` — `padding-top: var(--safe-area-top)`
- `.safe-area-bottom` — `padding-bottom: var(--safe-area-bottom)`

Usage in components:
```tsx
// Direct usage for precise control
style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}

// Utility class for simple cases
className="safe-area-top"

// Calc with additional padding
style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
```

## Navigation (Mobile)

- 3 centered nav buttons (Chat, Love Log, Play) — evenly spaced
- Logo on left (icon only, no text)
- Profile avatar on right (no chevron, compact)
- Progress/Help/Notifications hidden — accessible via profile dropdown

## Profile Dropdown (Mobile)

Narrower (`w-48` vs `w-56`), smaller text (`text-scale-micro`), reduced padding (`px-3 py-2`), smaller icons (`w-3.5 h-3.5`), tighter gaps (`gap-2`).

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
