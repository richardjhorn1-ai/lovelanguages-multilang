# Color Palette

## Core Colors

Defined in `constants/colors.ts`:

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#FF6B6B` | Coral red — primary actions, branding |
| Secondary | `#4ECDC4` | Teal — secondary actions, accents |
| Accent | `#FFE66D` | Golden yellow — highlights, rewards |
| Background | `#F7FFF7` | Mint white — light backgrounds |
| Text | `#292F36` | Near black — body text |
| Soft Pink | `#FFF0F3` | Subtle pink tints |
| Soft Blue | `#E7F5FF` | Subtle blue tints |

## App Background

`#fdfcfd` (warm off-white) — the primary app background color.

## Target Word Highlight

`#FF4761` — used consistently for all target language vocabulary words. Do not use other colors for this.

## Tier Colors

Each proficiency tier has a distinct color defined in `constants/levels.ts`. Always use `tierColor` from level info, never hardcode tier colors.

## Scrollbar

Custom pink-themed scrollbar (desktop only, hidden on mobile):
- Track: transparent
- Thumb: `#fecdd3` (soft pink)
- Thumb hover: `#fb7185` (rose)

## Usage Patterns

- Use arbitrary Tailwind values: `bg-[#fdfcfd]`, `text-[#FF4761]`
- Use `style={}` prop when color comes from JavaScript variables
- Badges/pills: background at 15% opacity (`${tierColor}15`) with full color text
