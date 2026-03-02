# Homepage Concepts Exploration

## Overview

Four alternative homepage + onboarding designs exploring different visual directions for Love Languages. Each concept has a full Hero page, simplified demo onboarding, and design documentation. A ConceptTheme system flows each concept's design language through the full 17-step (student) / 11-step (tutor) real onboarding.

### Quick Comparison

| Concept | Vibe | Key Trait | Dark? | Layout |
|---------|------|-----------|-------|--------|
| **Original** | Familiar | Hearts + particles background | No | Centered |
| **Upgraded** | Premium | Glassmorphism + soft glows | No | Centered |
| **Editorial** | Magazine | 50/50 split + chapter system | No | Split |
| **Cinematic** | Immersive | Dark mode + ambient glows | Yes | Centered |
| **Playful** | Gamified | Thick borders + offset shadows | No | Centered |

## Architecture

### ConceptThemeContext

`context/ConceptThemeContext.tsx` defines:
- `ConceptVariant` type — `'original' | 'upgraded' | 'editorial' | 'cinematic' | 'playful'`
- `ConceptThemeConfig` interface — 40+ properties covering colors, typography, shapes, animation, layout, progress style, backgrounds, and CSS overrides
- 5 theme definitions (one per concept)
- `ConceptThemeProvider` — React context provider
- `useConceptTheme()` — hook to read theme in any component
- `getConceptTheme()` — direct access without hook (for non-component code)

### Theme Flow

```
URL param (?concept=editorial)
    ↓
App.tsx (reads param or localStorage)
    ↓
designConcept state (persisted in localStorage via ConceptSwitcher)
    ↓
<Onboarding conceptVariant={designConcept} />
    ↓
<ConceptThemeProvider variant={conceptVariant}>
    ↓
OnboardingStep reads useConceptTheme() →
    - Renders concept-specific progress indicator
    - Applies concept colors, fonts, borders to chrome
    - Uses concept animation class for step transitions
    - Injects concept globalCSS for component overrides
    - Editorial: renders 50/50 split layout with art panel
    ↓
NextButton reads useConceptTheme() →
    - Applies concept border radius, shadow, hover effects
    ↓
All 28 step components render inside OnboardingStep →
    - Automatically inherit concept styling through wrapper
    - Zero changes to individual step files
```

### Zero-Change Strategy

The key insight: all 28 onboarding step components wrap their content in `<OnboardingStep>`. By making OnboardingStep concept-aware, every step inherits theming automatically. For concepts that need to override internal component styles (Cinematic dark mode, Playful thick borders), the `globalCSS` property injects scoped CSS overrides using `.concept-{name}` class selectors.

## Concept Files

### Per-Concept Directories

```
components/concepts/
├── ConceptSwitcher.tsx          # Floating concept toggle (bottom-right)
├── upgraded/
│   ├── HeroUpgraded.tsx         # Full hero page
│   ├── OnboardingUpgraded.tsx   # 3-step demo onboarding
│   └── DESIGN_DECISIONS.md      # Design documentation
├── editorial/
│   ├── HeroEditorial.tsx
│   ├── OnboardingEditorial.tsx
│   └── DESIGN_DECISIONS.md
├── cinematic/
│   ├── HeroCinematic.tsx
│   ├── OnboardingCinematic.tsx
│   └── DESIGN_DECISIONS.md
└── playful/
    ├── HeroPlayful.tsx
    ├── OnboardingPlayful.tsx
    └── DESIGN_DECISIONS.md
```

### Shared Infrastructure

```
context/ConceptThemeContext.tsx         # Theme definitions + provider
components/onboarding/OnboardingStep.tsx  # Concept-aware step wrapper
components/onboarding/Onboarding.tsx      # Accepts conceptVariant prop
components/HeroRouter.tsx                 # Routes to concept Hero pages
App.tsx                                   # URL param + state management
```

## How to Test

### URL Parameters
- `localhost:5174/?concept=original` — Default (no changes)
- `localhost:5174/?concept=upgraded` — Glassmorphism + soft
- `localhost:5174/?concept=editorial` — Magazine + split
- `localhost:5174/?concept=cinematic` — Dark + atmospheric
- `localhost:5174/?concept=playful` — Brutalist + bouncy

### ConceptSwitcher
When not logged in, a floating pill bar appears in the bottom-right corner. Click any concept name to switch instantly. Selection persists in localStorage.

### Onboarding Testing
1. Pick a concept via URL param or switcher
2. Go through the Hero demo flow (language → role → auth)
3. Click "Sign Up (Demo)" to enter the simplified demo onboarding
4. For the full real onboarding: sign up with a real account — the concept styling flows through all 17/11 steps

## How to Add a New Concept

1. **Create directory:** `components/concepts/{name}/`
2. **Create Hero + Onboarding files:** `Hero{Name}.tsx`, `Onboarding{Name}.tsx`
3. **Add theme definition** to `context/ConceptThemeContext.tsx`:
   - Add to `ConceptVariant` union type
   - Create `{name}Theme: ConceptThemeConfig` object
   - Add to `CONCEPT_THEMES` map
4. **Add to ConceptSwitcher** (`components/concepts/ConceptSwitcher.tsx`):
   - Add to `DesignConcept` type
   - Add button with concept-specific styling
5. **Add to App.tsx:**
   - Import `Hero{Name}`
   - Add case in the concept routing ternary
   - Add to `validConcepts` array in URL param check
6. **Create DESIGN_DECISIONS.md** documenting all design choices

## How to "Promote" a Concept to Production

1. Set the chosen concept as default in `App.tsx` (replace `'original'` fallback)
2. Remove `ConceptSwitcher` from App.tsx JSX
3. Delete unused concept directories
4. Move theme values from ConceptThemeContext into main CSS variables (`index.css`)
5. Simplify OnboardingStep back to single-layout if Editorial's split isn't chosen
6. Remove ConceptThemeContext entirely — values are now in CSS

## How to Discard a Concept

1. Delete concept directory (`components/concepts/{name}/`)
2. Remove theme entry from `ConceptThemeContext.tsx`
3. Remove from ConceptSwitcher type + button
4. Remove from App.tsx routing + validConcepts array
