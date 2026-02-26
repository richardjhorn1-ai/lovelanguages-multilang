# Landing Page & Onboarding UX Review
**Branch:** `feature/ios-apple-auth-iap`  
**Date:** 2025-07-24  
**Files reviewed:** `components/Landing.tsx`, `components/Hero.tsx`, `components/onboarding/Onboarding.tsx`, `components/onboarding/OnboardingStep.tsx`, all step files

---

## 1. Landing Page — Layout & Responsiveness

### Desktop (≥ `lg` / 1024px)
The split layout is implemented cleanly:
```
<div class="hidden lg:grid lg:grid-cols-[2fr_1fr] min-h-screen max-w-[1400px] mx-auto">
  <div>  <!-- Left: MarketingContent, scrolls naturally -->
  <div class="sticky top-0 h-screen"> <!-- Right: AuthCard, stays put -->
```
- **2fr / 1fr** split (~67% / 33%) — left side gets the bento marketing grid, right side gets the auth card (capped at `max-w-[420px]`).
- As of the latest commit it was rebalanced to 2/3–1/3 (`lg:grid-cols-[2fr_1fr]`), which is solid.
- The sticky auth card uses `sticky top-0 h-screen` — correct, won't cause double-scroll issues since only the left column scrolls.
- Auth card max-width `max-w-sm` (384px) inside a `max-w-[420px]` container — fine.

### Mobile (< `lg`)
- Auth card is **above the fold** with logo + branding shown (via `showBranding={true}`).
- Scroll hint arrow + "Swipe to discover more" text is pinned to bottom of the auth screen via `flex flex-col` + `min-h-screen` layout — nice touch.
- Marketing content is below the fold in a `px-6 pb-8 max-w-sm mx-auto` block.
- **Responsive handling is solid** — clean `lg:hidden` / `hidden lg:grid` split, no overlap between breakpoints.

### Background Effects
- `InteractiveHearts` and `WordParticleEffect` are rendered unconditionally in JSX, but their `isMobile`/conditional display is controlled by a **`window.innerWidth` snapshot at render time** — see Bug section below.
- Background color layer uses `fixed inset-0` with role-based bg color + CSS transition — works correctly.

---

## 2. Marketing Content

The `MarketingContent` component is shared between mobile and desktop, with an `isDesktop: boolean` prop controlling sizing. It renders the same data in both layouts.

### Headline
- Dynamic per role (student/tutor) via i18n keys: `hero.landing.student.headline` / `hero.landing.tutor.headline`
- Highlighted keywords (`highlight1`, `highlight2`) rendered with glow effect in accent color
- Role toggles animate a full remount of the bento grid (`key={role}`)

### Features
- **6 features split into two groups of 3** — rendered as glass cards with accent-colored accent bars
- Keys: `hero.bottomSections.rall.offer.{role}.feature{1-6}.feature` + `.pain` (same i18n as Hero.tsx)
- Desktop: staggered `reveal-up` animations (0.13s–0.21s delays); mobile: no animation

### Testimonials
- **2 testimonials** hardcoded in a single card
- Keys: `hero.testimonials.1.quote`, `hero.testimonials.2.quote` (name, context)
- Quote text, name, learning context — standard display, no carousel

### Founders Card
- Richard & Misia photo from `/founders.jpg`
- Two paragraphs from the RALL story (`paragraph3` + `paragraph4`)
- Accent-colored left border quote styling

### Flags Strip
- All supported language flags displayed (col-span-2 on desktop)
- Footer text is first sentence of `hero.bottomSections.rall.story.paragraph6`

### Role Toggle
- Pill-style `student/tutor` toggle at top of marketing content
- On mobile: centered above the headline
- On desktop: right-aligned next to logo mark in the top row

### What's MISSING vs Hero.tsx
The new Landing.tsx is intentionally lighter than Hero.tsx. It does NOT include:
- GameShowcase, HeroFAQ, HeroRALL, HeroBlog, HeroFooter sections
- Full scrolling sections (5 per role)
- Language selector step
- Progress dots / swipe navigation
- Bottom sheet drag interaction
- Typewriter / section-context-aware CTA copy

This is intentional — the new Landing is auth-first, not marketing-first.

---

## 3. Onboarding Flow — Step-by-Step

### Before (main branch): 17 student steps / 11 tutor steps

**Student flow (main):**
1. NameStep
2. PartnerNameStep
3. VibeStep
4. PhotoStep
5. WhyStep
6. TimeStep
7. WhenStep
8. FearStep
9. PriorStep
10. ValidationModeStep
11. LearnHelloStep
12. LearnLoveStep
13. TryItStep
14. CelebrationStep
15. GoalStep
16. PlanSelectionStep
17. StartStep

**Tutor flow (main):**
1. NameStep
2. PartnerNameStep
3. RelationStep
4. LanguageConnectionStep
5. OriginStep
6. DreamPhraseStep
7. TeachingStyleStep
8. ValidationModeStep
9. TutorPreviewStep
10. PlanSelectionStep
11. TutorStartStep

---

### After (feature/ios-apple-auth-iap): 10 student steps / 9 tutor steps

**Shared steps (1–4):**
1. **RoleStep** — NEW: user now picks student/tutor inside onboarding (wasn't in main)
2. **NativeLanguageStep** — NEW: language the user speaks (was implicit from profile before)
3. **LanguageStep** — NEW: language the user wants to learn/teach
4. **CombinedNamesStep** — MERGED: replaced separate NameStep + PartnerNameStep into one screen

**Student steps (5–10):**
5. **LearnHelloStep** — kept (was step 11 in main)
6. **LearnLoveStep** — kept (was step 12 in main)
7. **CelebrationStep** — kept (was step 14 in main)
8. **PersonalizationStep** — NEW COMBINED: merges VibeStep + TimeStep + PriorStep into one screen (3 sections)
9. **PlanSelectionStep** — kept (was step 16)
10. **StartStep** — kept (was step 17)

**Tutor steps (5–9):**
5. **TeachingStyleStep** — kept (was step 7 in main)
6. **TutorPreviewStep** — kept (was step 9 in main)
7. **TutorPersonalizationStep** — NEW COMBINED: merges RelationStep + LanguageConnectionStep + OriginStep into one screen
8. **PlanSelectionStep** — kept (was step 10)
9. **TutorStartStep** — kept (was step 11)

### What Was CUT

| Step | Category | Notes |
|------|----------|-------|
| PhotoStep | Student | Removed entirely |
| WhyStep | Student | Removed entirely |
| WhenStep | Student | Removed entirely |
| FearStep | Student | Removed entirely |
| TryItStep | Student | Removed entirely |
| GoalStep | Student | Removed entirely |
| ValidationModeStep | Shared | Removed from both flows |
| RelationStep | Tutor | Merged into TutorPersonalizationStep |
| LanguageConnectionStep | Tutor | Merged into TutorPersonalizationStep |
| OriginStep | Tutor | Merged into TutorPersonalizationStep |
| DreamPhraseStep | Tutor | Removed entirely |

**Net reduction:** Student 17→10 (−7 steps, −41%), Tutor 11→9 (−2 steps, −18%)

### New Additions
- **RoleStep** — entirely new (role was previously set on landing page / profile)
- **NativeLanguageStep** — new explicit step for UI language
- **CombinedNamesStep** — consolidates 2 screens into 1
- **PersonalizationStep** — consolidates 3 student screens (vibe + time + prior) into 1
- **TutorPersonalizationStep** — consolidates 3 tutor screens (relation + connection + origin) into 1

---

## 4. Marketing / Value-Prop Content IN Onboarding

The new onboarding is fairly lean on marketing copy — it's functional. Here's what's there:

- **LearnHelloStep** — teaches the actual "hello" word in the target language with audio playback. Pure feature demo, low marketing weight.
- **LearnLoveStep** — teaches "I love you" with audio. Same: functional demo.
- **CelebrationStep** — shows XP earned, both learned words, partner's name integration. Positive emotional reward but no external marketing claims.
- **PersonalizationStep** — purely functional (vibe/time/prior). No value prop copy.
- **StartStep** — shows "what's unlocked" summary. This IS marketing — it lists features the user gets. Some copy warmth here.
- **PlanSelectionStep** — plan selection with pricing from RevenueCat (iOS) or Stripe (web). Functional, some feature comparison.

**What's NOT woven in:** The new onboarding doesn't include the rich emotional narrative Hero.tsx has (e.g., the RALL story, testimonials, FAQs inside onboarding). The old flow had more steps but also more warmth per step (WhyStep, GoalStep). The new approach trades emotional depth for speed.

---

## 5. Bugs

### 🔴 Bug 1: `window.innerWidth` read at render time (no resize handler) — Landing.tsx

**Lines 873, 877:**
```tsx
<InteractiveHearts
  ...
  isMobile={window.innerWidth < 768}  // ← snapshots at mount, never updates
/>

{window.innerWidth >= 1024 && (       // ← controls whether WordParticleEffect renders
  <WordParticleEffect ... />
)}
```

`window.innerWidth` is read synchronously at render time. If the window is resized, these values don't update — the wrong effect could be shown (or missing) after resize. On React 18 strict mode, this also throws if rendered SSR (no `window`).

**Fix:** Use a `useEffect` + `useState` with a resize listener, or Tailwind's `useMediaQuery` hook:
```tsx
const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);

useEffect(() => {
  const onResize = () => {
    setIsMobile(window.innerWidth < 768);
    setIsDesktop(window.innerWidth >= 1024);
  };
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}, []);
```

Note: The desktop layout itself is handled correctly via Tailwind `lg:hidden` / `hidden lg:grid` — only the JS-controlled background effects have this issue.

### 🟡 Bug 2: `handleForgotPassword` type mismatch — Landing.tsx

**Line 582:**
```tsx
<button type="button" onClick={handleForgotPassword} ...>
```

But `handleForgotPassword` is typed as `(e: React.FormEvent) => void` and calls `e.preventDefault()`. When triggered by an `onClick` on a `type="button"`, the event passed is `React.MouseEvent`, not `React.FormEvent`. Calling `e.preventDefault()` on a mouse event is a no-op and won't cause a crash, but the type is wrong.

**Fix:** Change the prop type to `(e: React.MouseEvent | React.FormEvent) => void` or simply remove the `e.preventDefault()` call (unnecessary on `type="button"`).

### 🟡 Bug 3: `CelebrationStep` receives `onBack` but passes `canGoBack={false}` — Onboarding.tsx

**Line in Onboarding.tsx (step 7):**
```tsx
case 7:
  return (
    <CelebrationStep
      ...
      onNext={goNext}
      accentColor={accentColor}
    />
  );
```

`CelebrationStep` itself sets `canGoBack={false}` in its `OnboardingStep` wrapper — correct and intentional (no back from celebration). But the step doesn't receive `onBack` at all from Onboarding.tsx. That's fine, but worth noting: if `canGoBack` is later changed to `true`, back navigation from the celebration will silently do nothing (no handler).

### 🟡 Bug 4: `accentBorder` is hardcoded string for tutor, not from BRAND constants — Landing.tsx

**Line 669:**
```tsx
const accentBorder = selectedRole === 'student' ? BRAND.border : '#99f6e4'; // pink-200 / teal-200
```

`BRAND.border` is `'#FECDD3'` (from `heroConstants.ts`). The tutor value `'#99f6e4'` is hardcoded inline. This works but is fragile — if the teal palette is updated in `BRAND`, this won't update. Should be `BRAND.tealBorder` (which doesn't exist yet) or at minimum a named constant.

### 🟡 Bug 5: `isDesktop` prop to `MarketingContent` is always a hardcoded literal — Landing.tsx

```tsx
// Mobile layout:
<MarketingContent isDesktop={false} role={selectedRole} onToggleRole={setSelectedRole} />

// Desktop layout:
<MarketingContent isDesktop={true} role={selectedRole} onToggleRole={setSelectedRole} />
```

This is fine (each layout branch renders one version) but the `isDesktop` prop doesn't react to viewport changes — it's determined by which layout branch is active (Tailwind `lg:hidden` / `hidden lg:grid`). Since CSS handles visibility, the wrong `isDesktop` value would be passed to the hidden branch. Not a real bug but could be confusing. The `React.memo` wrapper on `MarketingContent` means the hidden branch's instance won't re-render unless role/props change — acceptable.

---

## 6. Dead Code — Files Not Imported in New Onboarding

The following step files exist on disk but are **NOT imported** in the new `Onboarding.tsx`. They're dead code on this branch:

### Student steps (dead):
| File | Previously (main) |
|------|-------------------|
| `steps/student/FearStep.tsx` | Step 8 |
| `steps/student/GoalStep.tsx` | Step 15 |
| `steps/student/PhotoStep.tsx` | Step 4 |
| `steps/student/PriorStep.tsx` | Step 9 |
| `steps/student/TimeStep.tsx` | Step 6 |
| `steps/student/TryItStep.tsx` | Step 13 |
| `steps/student/VibeStep.tsx` | Step 3 |
| `steps/student/WhenStep.tsx` | Step 7 |
| `steps/student/WhyStep.tsx` | Step 5 |

### Tutor steps (dead):
| File | Previously (main) |
|------|-------------------|
| `steps/tutor/DreamPhraseStep.tsx` | Step 6 |
| `steps/tutor/LanguageConnectionStep.tsx` | Step 4 |
| `steps/tutor/OriginStep.tsx` | Step 5 |
| `steps/tutor/RelationStep.tsx` | Step 3 |

### Shared steps (dead):
| File | Previously (main) |
|------|-------------------|
| `steps/shared/NameStep.tsx` | Step 1 (both) |
| `steps/shared/PartnerNameStep.tsx` | Step 2 (both) |
| `steps/shared/ValidationModeStep.tsx` | Step 10 (student), Step 8 (tutor) |

**Total: 16 dead step files** — these should either be deleted or moved to an `_archived/` folder before merging to main.

### Also note: Hero.tsx is still in the repo
`components/Hero.tsx` (1349 lines) remains as the old full-page marketing+auth component. Once Landing.tsx fully replaces it, Hero.tsx should be removed or the route updated. Worth confirming which routes use which component.

---

## 7. Summary

### Positives
- **Landing layout is clean and well-structured.** The `lg:grid-cols-[2fr_1fr]` split with sticky auth works correctly.
- **Mobile auth-first is a good UX decision.** Auth is above the fold; marketing narrative is a scroll reward.
- **Onboarding is dramatically shorter** (−41% for students) — reduces drop-off risk significantly.
- **Personalization steps are well-consolidated** — 3 in 1 (vibe/time/prior for students; relation/connection/origin for tutors) without feeling cramped.
- **Native Apple Sign In** is correctly gated to `Capacitor.getPlatform() === 'ios'` with proper name capture on first sign-in.
- **RevenueCat IAP** in PlanSelectionStep correctly falls through to Stripe for non-iOS.
- **Progress saved cross-device** (Supabase + localStorage) is robust with fallback.

### Concerns
1. **`window.innerWidth` without resize handler** — both background effects in Landing.tsx won't update on viewport change.
2. **16 dead step files** — should be cleaned up before merge to keep the codebase readable.
3. **Emotional/marketing depth lost** — the old onboarding had WhyStep, GoalStep, and DreamPhraseStep that captured motivation and intent. The new onboarding is faster but colder. Worth considering if a micro-moment of "why are you learning this?" helps retention.
4. **`handleForgotPassword` type mismatch** — minor but real.
5. **Hardcoded `'#99f6e4'` for teal border** — should go into BRAND constants.
