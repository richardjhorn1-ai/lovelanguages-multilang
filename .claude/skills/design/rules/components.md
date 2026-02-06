# Component Patterns

## Cards/Panels

- Rounded corners: `rounded-xl` or `rounded-2xl`
- Subtle shadows
- Soft background tints based on context

## Buttons

- **Primary**: Solid background with `tierColor` or pink accent
- **Secondary**: Transparent with border, colored text
- Include subtle hover/active states

## Progress Indicators

- Fill color: `tierColor`
- Track: gray

## Badges/Pills

- Background at 15% opacity: `${tierColor}15`
- Text: full `tierColor`

## Icon System

Icons are defined in `constants/icons.tsx` as React components:

```tsx
import { ICONS } from './constants';
<ICONS.Heart className="w-5 h-5" />
```

## Tailwind Patterns

- Arbitrary values: `bg-[#fdfcfd]`, `text-[#FF4761]`
- Dynamic styles via `style={}` prop when color comes from JS
- Flexbox: `flex flex-col`, `flex items-center justify-center`
- Consistent spacing scale
