# ML-6.11: Language Selection UX Enhancement

**Phase:** ML-6.11 (Language Selection Flow)
**Goal:** Create intuitive language selection experience on Hero page

---

## Overview

Transform the Hero page to include:
1. **URL-based language routing** (`/pl`, `/es`, etc.)
2. **Language Selector as Section 0** - First thing visitors see
3. **Auto-scroll on selection** - Smooth transition to main content
4. **Enhanced Role Confirmation** - Includes native + target language selection

---

## Part 1: URL-Based Language Routing

**KEY:** `/pl` means "I want to learn Polish" (target language), NOT "I speak Polish".

### 1.1 URL Meaning

| URL | Meaning | User Flow |
|-----|---------|-----------|
| `/` | No preset | Step 1 → Step 2 → Step 3 |
| `/pl` | Learning Polish | Step 1 (native) → Skip Step 2 → Step 3 |
| `/es` | Learning Spanish | Step 1 (native) → Skip Step 2 → Step 3 |

When user visits `/pl`:
1. Target language is preset to Polish
2. User only needs to select native language (Step 1)
3. After selecting native → goes directly to Step 3 (marketing)
4. Generative art shows Polish → [their native language]

### 1.2 Update App.tsx Routes

```typescript
// App.tsx
import { SUPPORTED_LANGUAGE_CODES } from './constants/language-config';

// Dynamic route for target language
<Route path="/:targetLang" element={<Hero />} />

// Root shows full 3-step flow
<Route path="/" element={<Hero />} />
```

### 1.3 Hero Component Props

```typescript
interface HeroProps {
  // No props needed - read from URL params
}

const Hero: React.FC = () => {
  const { targetLang } = useParams<{ targetLang?: string }>();
  const [targetLanguage, setTargetLanguage] = useState<string | null>(null);

  useEffect(() => {
    // If URL has target language, preset it and skip Step 2
    if (targetLang && SUPPORTED_LANGUAGE_CODES.includes(targetLang)) {
      setTargetLanguage(targetLang);
      localStorage.setItem('preferredTargetLanguage', targetLang);
      // User still needs to select native language (Step 1)
      // After Step 1, will skip to Step 3
    }
  }, [targetLang]);

  // Determine starting step
  const getInitialStep = () => {
    const savedNative = localStorage.getItem('preferredLanguage');
    const savedTarget = localStorage.getItem('preferredTargetLanguage');

    if (savedNative && (savedTarget || targetLang)) {
      return 'marketing'; // Return visitor or URL preset + native saved
    }
    return 'native'; // Start at step 1
  };
};
```

### 1.4 Language Detection Priority

**For target language:**
1. URL path (`/pl`) - Highest priority
2. localStorage (`preferredTargetLanguage`) - Return visitors
3. None - Must select in Step 2

**For native language (UI):**
1. localStorage (`preferredLanguage`) - Return visitors
2. Browser language - First-time visitors
3. English - Fallback

---

## Part 2: Language Selector as Section 0

### 2.1 New Section Structure

```
Section 0: Language Selector (NEW)
  └── Left: Language grid with flags
  └── Right: Login form (same as current)

Section 1-6: Current Hero sections (unchanged)
```

### 2.2 Language Selector UI (Left Side)

```tsx
const LanguageSelectorSection: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
    { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱', nativeName: 'Polski' },
    // ... all 18 languages
  ];

  const handleSelect = (code: string) => {
    setSelectedLang(code);
    i18n.changeLanguage(code);
    localStorage.setItem('preferredLanguage', code);

    // Auto-scroll to Section 1
    scrollToSection(1);
  };

  return (
    <div className="language-selector">
      <h2>{t('hero.languageSelector.title')}</h2>
      <p>{t('hero.languageSelector.subtitle')}</p>

      <div className="language-grid">
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className={selectedLang === lang.code ? 'selected' : ''}
          >
            <span className="flag">{lang.flag}</span>
            <span className="name">{lang.nativeName}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
```

### 2.3 Visual Design - Fixed Right Column, 3-Step Left Column

**KEY PRINCIPLE:** The right column (login form) stays FIXED in position at all times. The left column transitions through 3 steps.

**Step 1: Native Language Selection**
```
┌─────────────────────────────────────────────────────────────┐
│   ┌─────────────────────────┐   ┌─────────────────────────┐ │
│   │   LEFT COLUMN (Step 1)  │   │   RIGHT COLUMN (FIXED)  │ │
│   │                         │   │                         │ │
│   │  "What language do      │   │    [Login Form]         │ │
│   │   you speak?"           │   │                         │ │
│   │                         │   │    Email: [________]    │ │
│   │  ┌─────┐ ┌─────┐ ┌─────┐│   │    Pass:  [________]    │ │
│   │  │ 🇬🇧  ││ 🇪🇸  ││ 🇫🇷  ││   │                         │ │
│   │  │ EN  ││ ES  ││ FR  ││   │    [  Sign Up  ]        │ │
│   │  └─────┘ └─────┘ └─────┘│   │                         │ │
│   │  ┌─────┐ ┌─────┐ ┌─────┐│   │    ─────────────────    │ │
│   │  │ 🇩🇪  ││ 🇵🇱  ││ 🇮🇹  ││   │    Already have an      │ │
│   │  └─────┘ └─────┘ └─────┘│   │    account?             │ │
│   │       ...               │   │    [  Sign In  ]        │ │
│   │                         │   │                         │ │
│   └─────────────────────────┘   └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Step 2: Target Language Selection** (after native selected)
```
┌─────────────────────────────────────────────────────────────┐
│   ┌─────────────────────────┐   ┌─────────────────────────┐ │
│   │   LEFT COLUMN (Step 2)  │   │   RIGHT COLUMN (FIXED)  │ │
│   │                         │   │                         │ │
│   │  ← Back                 │   │    [Login Form]         │ │
│   │                         │   │                         │ │
│   │  "What do you want      │   │    Email: [________]    │ │
│   │   to learn?"            │   │    Pass:  [________]    │ │
│   │                         │   │                         │ │
│   │  ┌─────┐ ┌─────┐ ┌─────┐│   │    [  Sign Up  ]        │ │
│   │  │ 🇵🇱  ││ 🇪🇸  ││ 🇫🇷  ││   │                         │ │
│   │  └─────┘ └─────┘ └─────┘│   │    ─────────────────    │ │
│   │  ┌─────┐ ┌─────┐ ┌─────┐│   │    Already have an      │ │
│   │  │ 🇩🇪  ││ 🇮🇹  ││ 🇵🇹  ││   │    account?             │ │
│   │  └─────┘ └─────┘ └─────┘│   │    [  Sign In  ]        │ │
│   │  (excludes native lang) │   │                         │ │
│   │                         │   │                         │ │
│   └─────────────────────────┘   └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Step 3: Marketing Content** (after target selected)
```
┌─────────────────────────────────────────────────────────────┐
│   ┌─────────────────────────┐   ┌─────────────────────────┐ │
│   │   LEFT COLUMN (Step 3)  │   │   RIGHT COLUMN (FIXED)  │ │
│   │                         │   │                         │ │
│   │  ╭─────────────────────╮│   │    [Login Form]         │ │
│   │  │ GENERATIVE ART      ││   │                         │ │
│   │  │                     ││   │    Email: [________]    │ │
│   │  │  "Cześć" → "Hola"   ││   │    Pass:  [________]    │ │
│   │  │  "Kocham" → "Amo"   ││   │                         │ │
│   │  │                     ││   │    [  Sign Up  ]        │ │
│   │  │ (target → native)   ││   │                         │ │
│   │  ╰─────────────────────╯│   │    ─────────────────    │ │
│   │                         │   │    Already have an      │ │
│   │  "Learn Polish          │   │    account?             │ │
│   │   with your partner"    │   │    [  Sign In  ]        │ │
│   │                         │   │                         │ │
│   │  [Features...]          │   │                         │ │
│   │                         │   │                         │ │
│   │  ─────────────────────  │   │                         │ │
│   │  🇪🇸 Spanish → 🇵🇱 Polish│   │                         │ │
│   │  [Change]               │   │                         │ │
│   └─────────────────────────┘   └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.3.1 Generative Art Word Animation

The word animation shows target language words transforming into native language translations:

**Animation concept:**
```
┌────────────────────────────────────────┐
│                                        │
│     "Cześć"    ───fade───►   "Hola"    │
│      (PL)                     (ES)     │
│                                        │
│   "Kocham cię" ───fade───► "Te quiero" │
│      (PL)                     (ES)     │
│                                        │
│   "Dziękuję"  ───fade───►  "Gracias"   │
│      (PL)                     (ES)     │
│                                        │
└────────────────────────────────────────┘
```

**Implementation:**
- Pull romantic/common phrases from `constants/language-config.ts` or generate dynamically
- Each phrase: target language word floats in → pauses → transforms to native translation
- Multiple words animate with staggered timing
- Words specific to the user's selected language pair

**Data source options:**
1. Static phrase pairs per language in `language-config.ts`
2. Call `/api/generate-romantic-phrases` with language pair (already exists)
3. Curated list of ~20 romantic phrases per language

### 2.4 CSS Implementation for Fixed Right Column

```css
.hero-container {
  display: flex;
  min-height: 100vh;
}

.hero-left {
  flex: 1;
  overflow-y: auto;
  /* Left side scrolls independently */
}

.hero-right {
  flex: 0 0 400px; /* Fixed width */
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Right side stays fixed while left scrolls */
}
```

### 2.5 Mobile Layout - Top Section Swipes, Bottom Fixed

**Mobile keeps the current top/bottom split. Top section swipes through steps:**

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  TOP SECTION        │     │  TOP SECTION        │     │  TOP SECTION        │
│  (Swipeable)        │     │  (Swipeable)        │     │  (Swipeable)        │
│                     │     │                     │     │                     │
│  "What language     │     │  "What do you want  │     │  Marketing content  │
│   do you speak?"    │ ──► │   to learn?"        │ ──► │  in their language  │
│                     │     │                     │     │                     │
│  🇬🇧 🇪🇸 🇫🇷 🇩🇪      │     │  🇵🇱 🇪🇸 🇫🇷 🇩🇪      │     │  "Learn Polish      │
│  🇵🇱 🇮🇹 🇵🇹 🇳🇱      │     │  🇮🇹 🇵🇹 🇳🇱 🇷🇺      │     │   with your partner"│
│       ...           │     │       ...           │     │                     │
│                     │     │                     │     │  [Features...]      │
├─────────────────────┤     ├─────────────────────┤     ├─────────────────────┤
│  BOTTOM SECTION     │     │  BOTTOM SECTION     │     │  BOTTOM SECTION     │
│  (Fixed - Login)    │     │  (Fixed - Login)    │     │  (Fixed - Login)    │
│                     │     │                     │     │                     │
│  [Email]            │     │  [Email]            │     │  [Email]            │
│  [Password]         │     │  [Password]         │     │  [Password]         │
│  [Sign Up]          │     │  [Sign Up]          │     │  [Sign Up]          │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
      Step 1                      Step 2                      Step 3
         ─────── swipe right ───────►  ─────── swipe right ───────►
```

**Behavior:**
1. First-time visitor sees Step 1 (Native language selector)
2. Tap a language → Auto-swipes right to Step 2 (Target language)
3. Tap target language → Auto-swipes right to Step 3 (Marketing)
4. Can swipe back left to change selections
5. Return visitors skip directly to Step 3

### 2.6 Mobile CSS Implementation

```css
/* Mobile: Top section is swipeable carousel, bottom fixed */
@media (max-width: 768px) {
  .hero-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .hero-top {
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    display: flex;
  }

  .hero-top-step {
    flex: 0 0 100%;
    width: 100%;
    scroll-snap-align: start;
    padding: 1rem;
  }

  .hero-bottom {
    flex: 0 0 auto;
    padding: 1rem;
    border-top: 1px solid var(--border-color);
    /* Login form stays fixed at bottom */
  }
}
```

### 2.7 Mobile Auto-Swipe Logic

```typescript
const topSectionRef = useRef<HTMLDivElement>(null);
const [currentStep, setCurrentStep] = useState(0); // 0: native, 1: target, 2: marketing

const scrollToStep = (step: number) => {
  if (topSectionRef.current) {
    const stepWidth = topSectionRef.current.offsetWidth;
    topSectionRef.current.scrollTo({
      left: stepWidth * step,
      behavior: 'smooth'
    });
    setCurrentStep(step);
  }
};

const handleNativeLanguageSelect = (code: string) => {
  setNativeLanguage(code);
  i18n.changeLanguage(code);
  localStorage.setItem('preferredLanguage', code);
  scrollToStep(1); // Go to target language selection
};

const handleTargetLanguageSelect = (code: string) => {
  setTargetLanguage(code);
  localStorage.setItem('preferredTargetLanguage', code);
  scrollToStep(2); // Go to marketing content
};
```

---

## Part 3: Content Transition Behavior (Desktop)

**Note:** Since the right column is fixed, we don't scroll the page. Instead, the left column CONTENT transitions through 3 steps.

### 3.1 Left Column State Machine

```typescript
type Step = 'native' | 'target' | 'marketing';

const [currentStep, setCurrentStep] = useState<Step>('native');
const [nativeLanguage, setNativeLanguage] = useState<string | null>(null);
const [targetLanguage, setTargetLanguage] = useState<string | null>(null);

const handleNativeSelect = (code: string) => {
  setNativeLanguage(code);
  i18n.changeLanguage(code);
  localStorage.setItem('preferredLanguage', code);
  setCurrentStep('target');
};

const handleTargetSelect = (code: string) => {
  setTargetLanguage(code);
  localStorage.setItem('preferredTargetLanguage', code);
  setCurrentStep('marketing');
};

const handleBack = () => {
  if (currentStep === 'target') setCurrentStep('native');
  if (currentStep === 'marketing') setCurrentStep('target');
};

const handleChangeLanguages = () => {
  setCurrentStep('native');
};
```

### 3.2 Left Column Rendering

```tsx
const LeftColumn: React.FC = () => {
  return (
    <div className="hero-left">
      {currentStep === 'native' && (
        <NativeLanguageSelector onSelect={handleNativeSelect} />
      )}

      {currentStep === 'target' && (
        <TargetLanguageSelector
          excludeLanguage={nativeLanguage}
          onSelect={handleTargetSelect}
          onBack={handleBack}
        />
      )}

      {currentStep === 'marketing' && (
        <>
          <MarketingContent
            nativeLanguage={nativeLanguage}
            targetLanguage={targetLanguage}
          />
          <LanguageIndicator
            native={nativeLanguage}
            target={targetLanguage}
            onChangeClick={handleChangeLanguages}
          />
        </>
      )}
    </div>
  );
};
```

### 3.3 Return Visitor Behavior

```typescript
useEffect(() => {
  const savedNative = localStorage.getItem('preferredLanguage');
  const savedTarget = localStorage.getItem('preferredTargetLanguage');

  if (savedNative && savedTarget) {
    // Return visitor with both languages saved
    setNativeLanguage(savedNative);
    setTargetLanguage(savedTarget);
    i18n.changeLanguage(savedNative);
    setCurrentStep('marketing');
  } else if (savedNative) {
    // Has native but no target - go to step 2
    setNativeLanguage(savedNative);
    i18n.changeLanguage(savedNative);
    setCurrentStep('target');
  }
  // Otherwise start at step 1 (native selection)
}, []);
```

### 3.4 Smooth Transition Animation

```css
.hero-left-content {
  transition: opacity 0.3s ease-out, transform 0.3s ease-out;
}

.hero-left-content.entering {
  opacity: 0;
  transform: translateX(20px);
}

.hero-left-content.exiting {
  opacity: 0;
  transform: translateX(-20px);
}
```

```typescript
const transitionToStep = async (nextStep: Step) => {
  // Fade out current
  contentRef.current?.classList.add('exiting');
  await new Promise(resolve => setTimeout(resolve, 300));

  // Update state
  setCurrentStep(nextStep);

  // Fade in new
  contentRef.current?.classList.remove('exiting');
  contentRef.current?.classList.add('entering');
  await new Promise(resolve => setTimeout(resolve, 50));
  contentRef.current?.classList.remove('entering');
};
```

---

## Part 4: Enhanced Role Confirmation

### 4.1 Current Flow vs New Flow

**Current:**
```
Select Role → [Learn] or [Teach] → Continue to onboarding
```

**New:**
```
Select Role → Confirm with language selection:

┌─────────────────────────────────────────────┐
│                                             │
│   "Perfect! Let's confirm your setup"       │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │ I want to:  [Learn ▼]               │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │ My language: [English 🇬🇧 ▼]        │   │ ← Native
│   └─────────────────────────────────────┘   │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │ I'm learning: [Polish 🇵🇱 ▼]        │   │ ← Target
│   └─────────────────────────────────────┘   │
│                                             │
│            [ Continue → ]                   │
│                                             │
└─────────────────────────────────────────────┘
```

### 4.2 Compact Confirmation UI

This replaces the simple Learn/Teach toggle with a more complete setup:

```tsx
interface LanguageConfirmationProps {
  onConfirm: (role: UserRole, nativeLang: string, targetLang: string) => void;
}

const LanguageConfirmation: React.FC<LanguageConfirmationProps> = ({ onConfirm }) => {
  const { i18n, t } = useTranslation();
  const [role, setRole] = useState<'student' | 'tutor'>('student');
  const [nativeLang, setNativeLang] = useState(i18n.language);
  const [targetLang, setTargetLang] = useState('pl'); // Default or smart suggestion

  return (
    <div className="language-confirmation">
      <h3>{t('hero.confirmation.title')}</h3>

      {/* Role Selection */}
      <div className="role-toggle">
        <button
          className={role === 'student' ? 'active' : ''}
          onClick={() => setRole('student')}
        >
          {t('hero.toggle.learn')}
        </button>
        <button
          className={role === 'tutor' ? 'active' : ''}
          onClick={() => setRole('tutor')}
        >
          {t('hero.toggle.teach')}
        </button>
      </div>

      {/* Language Selectors (compact dropdowns) */}
      <div className="language-selectors">
        <label>
          {t('hero.confirmation.myLanguage')}
          <select value={nativeLang} onChange={e => setNativeLang(e.target.value)}>
            {languages.map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.nativeName}</option>
            ))}
          </select>
        </label>

        <label>
          {role === 'student'
            ? t('hero.confirmation.imLearning')
            : t('hero.confirmation.imTeaching')
          }
          <select value={targetLang} onChange={e => setTargetLang(e.target.value)}>
            {languages.filter(l => l.code !== nativeLang).map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.nativeName}</option>
            ))}
          </select>
        </label>
      </div>

      <button onClick={() => onConfirm(role, nativeLang, targetLang)}>
        {t('hero.confirmation.continue')}
      </button>
    </div>
  );
};
```

### 4.3 Where This Appears

Option A: **Replace current role toggle in Hero**
- Shows after Section 0 language selection
- Compact inline UI in the right column

Option B: **Modal after signup/login**
- User signs up → Modal confirms languages before onboarding

Option C: **First step of onboarding**
- Replaces current onboarding language selection

**Recommended: Option A** - Keep it in Hero for seamless flow

---

## Part 5: New Translation Keys

Add to `en.json` (and all other locales):

```json
{
  "hero": {
    "languageSelector": {
      "title": "What's your language?",
      "subtitle": "We'll show everything in your language",
      "showAll": "Show all languages",
      "selected": "Selected"
    },
    "confirmation": {
      "title": "Let's set you up",
      "myLanguage": "My language",
      "imLearning": "I'm learning",
      "imTeaching": "I'm teaching",
      "continue": "Continue"
    }
  }
}
```

---

## Part 6: Implementation Order

### Phase 1: Core Language Selector
1. Create `LanguageSelectorSection` component
2. Add as Section 0 in Hero
3. Implement auto-scroll on selection
4. Add localStorage persistence

### Phase 2: URL Routing
1. Add `/:lang` route in App.tsx
2. Update Hero to accept `initialLang` prop
3. Handle language detection priority

### Phase 3: Enhanced Confirmation
1. Create `LanguageConfirmation` component
2. Integrate into Hero right column
3. Connect to signup/login flow

### Phase 4: Polish & Mobile
1. Mobile-responsive layout
2. Animations/transitions
3. Scroll indicator

---

## Files to Create/Modify

### New Files:
1. `components/hero/LanguageSelectorSection.tsx`
2. `components/hero/LanguageConfirmation.tsx`

### Modified Files:
1. `App.tsx` - Add language routes
2. `components/Hero.tsx` - Add Section 0, props
3. `i18n/locales/*.json` - Add new translation keys (all 18 files)

---

## Verification Checklist

- [ ] `/pl` route shows Polish UI
- [ ] Language selector displays all 18 languages
- [ ] Selecting language changes UI immediately
- [ ] Auto-scroll works smoothly
- [ ] Scroll back up allows language change
- [ ] Return visitors skip to Section 1
- [ ] Role + language confirmation works
- [ ] Mobile layout works
- [ ] All new strings translated

---

## Questions to Clarify

1. **Show all 18 at once or grouped?** (Popular first, then "Show all")
2. **Mobile: Grid or dropdown?**
3. **Return visitors: Auto-skip Section 0 or show it?**
4. **Confirmation: In Hero or modal after signup?**

---

## After Completion

1. Update STATUS.md: Add ML-6.11 as ✅
2. Test all 18 language routes
3. Update ROADMAP with new feature
