# Typography

## Fonts

Configured in `index.html` via Google Fonts and set as CSS variables in `src/index.css`:

| Font | CSS Variable | Role | Usage |
|------|-------------|------|-------|
| **Manrope** | `--font-body` | Body text | Clean, modern, slightly warm. Default for all text. |
| **Nunito** | `--font-header` | Headers | Rounded, friendly, distinctive. Use `font-header` Tailwind class. |

> **Note:** `tailwind.config.js` also defines `fontFamily.header` and `fontFamily.body` pointing to these fonts. The CSS variables (`--font-header`, `--font-body`) are the runtime source of truth, set in `:root` of `index.css`.

## Text Scale System

The app uses a **theme-aware text scale** instead of raw Tailwind text sizes. 6 semantic levels with 3 user-selectable size presets (Small, Medium, Large). Desktop automatically adds ~2px to each level.

### Levels

| Token | Tailwind Class | Medium/Mobile | Medium/Desktop | Use For |
|-------|---------------|---------------|----------------|---------|
| `--text-micro` | `text-scale-micro` | 11px | 13px | Tiny labels, timestamps, metadata |
| `--text-caption` | `text-scale-caption` | 12px | 14px | Captions, helper text, badges |
| `--text-label` | `text-scale-label` | 14px | 16px | Form labels, secondary content, descriptions |
| `--text-button` | `text-scale-button` | 15px | 17px | Button text, nav items |
| `--text-body` | `text-scale-body` | 16px | 18px | Chat messages, primary content |
| `--text-heading` | `text-scale-heading` | 20px | 22px | Section headings, card titles |

### Size Presets (from `services/theme.ts`)

| Preset | Adjustment | Body Mobile | Body Desktop |
|--------|-----------|-------------|--------------|
| **Small** | −2px | 14px | 16px |
| **Medium** | baseline | 16px | 18px |
| **Large** | +2px | 18px | 20px |

Desktop scaling is applied via media query in `applyTheme()`.

### Usage

```tsx
// ✅ Correct — uses theme-aware scale
<p className="text-scale-body">Main content</p>
<span className="text-scale-caption">Helper text</span>

// ❌ Wrong — raw Tailwind sizes bypass user preference
<p className="text-sm">Main content</p>
<span className="text-xs">Helper text</span>
```

**Exception:** Landing page hero headings (`text-3xl`+) use raw Tailwind sizes — they're pre-auth display text that shouldn't scale with user preference.

### Mapping from Raw Tailwind

| Raw Tailwind | Token |
|-------------|-------|
| `text-[9px]`, `text-[10px]`, `text-[11px]` | `text-scale-micro` |
| `text-xs` (12px) | `text-scale-caption` |
| `text-sm` (14px) | `text-scale-label` |
| `text-base` (16px) | `text-scale-body` |
| `text-lg`, `text-xl` (18-20px) | `text-scale-heading` |

## Rules

- Never introduce new font families (Inter, Roboto, Arial, etc.)
- Use `font-header` class for any heading or display text that should use Nunito
- Body text uses Manrope automatically (set on `body` element via `--font-body`)
- Prefer `text-scale-*` classes over raw `text-xs`, `text-sm`, etc. in app components
- Line heights are set per scale level: tight (1.3), normal (1.5), relaxed (1.6)
