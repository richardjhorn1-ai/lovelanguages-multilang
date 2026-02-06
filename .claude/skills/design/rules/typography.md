# Typography

## Fonts

Configured in `index.html` via Google Fonts:

| Font | Role | Usage |
|------|------|-------|
| **Outfit** | Body text | Clean, modern, slightly warm. Default for all text. |
| **Quicksand** | Headers | Rounded, friendly, distinctive. Use `font-header` Tailwind class. |

## Rules

- Never introduce new font families (Inter, Roboto, Arial, etc.)
- Use `font-header` class for any heading or display text that should use Quicksand
- Body text uses Outfit automatically (set on `body` element)
