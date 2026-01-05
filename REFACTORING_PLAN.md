# Refactoring Action Plan

**Created:** January 5, 2026
**Goal:** Clean up codebase, reduce complexity, improve maintainability
**Principle:** Test at every step. Never move forward with broken code.

---

## Testing Strategy

Since there's no test suite, we use a multi-layer verification approach:

### Verification Commands (Run After EVERY Change)

```bash
# 1. TypeScript Check - catches type errors, missing imports, wrong signatures
npx tsc --noEmit

# 2. Build Check - catches runtime issues, bundling problems
npm run build

# 3. Dev Server - manual verification
npm run dev
```

### Manual Testing Checklist

After each phase, manually verify these critical paths:

| Feature | How to Test |
|---------|-------------|
| Login | Can log in successfully |
| Chat | Send a message in ASK mode, see response |
| Voice | Toggle voice mode (if available) |
| Love Log | View vocabulary list, see word details |
| Play | Start a flashcard game, answer one question |
| Progress | View progress page, see XP/level |

### Git Safety Protocol

```bash
# BEFORE starting any phase:
git status                    # Check current state
git stash                     # Stash any uncommitted work (if needed)
git checkout -b refactor/phase-X  # Create branch for this phase

# AFTER each successful verification:
git add -A
git commit -m "Refactor: [description of change]"

# IF something breaks:
git checkout .                # Discard all changes
# OR
git stash                     # Save broken state for debugging
git checkout main             # Return to working state
```

---

## Phase 1: Quick Wins

**Time:** 30 minutes
**Risk:** None
**Approach:** One change at a time, verify after each

### Step 1.1: Update .gitignore

```bash
# Create branch
git checkout -b refactor/phase-1-quick-wins
```

**Change:**
Add to `.gitignore`:
```
test-logins.local.txt
```

**Verify:**
```bash
npx tsc --noEmit && npm run build
git add .gitignore && git commit -m "Refactor: Add test-logins.local.txt to gitignore"
```

---

### Step 1.2: Check for Dead Code - TenseConjugation

**Investigate:**
```bash
grep -rn "TenseConjugation" --include="*.ts" --include="*.tsx"
```

**Decision Tree:**
- If only found in `types.ts` line 64 → Safe to remove
- If found elsewhere → Keep it, document usage

**If removing:**
```bash
# After editing types.ts to remove the line
npx tsc --noEmit && npm run build
git add types.ts && git commit -m "Refactor: Remove unused TenseConjugation type alias"
```

---

### Step 1.3: Check for Dead Code - Old Mode Names

**Investigate:**
```bash
grep -rn "mode.*['\"]chat['\"]" --include="*.ts" --include="*.tsx"
grep -rn "mode.*['\"]tutor['\"]" --include="*.ts" --include="*.tsx"
```

**Decision Tree:**
- If not found → Remove `modeMap` from `api/chat.ts:507`
- If found → Keep for backwards compatibility, add TODO comment

**If removing:**
```bash
# After editing api/chat.ts
npx tsc --noEmit && npm run build

# Manual test: Send a chat message, verify response works
npm run dev
# Test in browser, then Ctrl+C

git add api/chat.ts && git commit -m "Refactor: Remove unused mode name mappings"
```

---

### Step 1.4: Extract shuffleArray Utility

**Create file:** `utils/array.ts`

```typescript
/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param array - The array to shuffle
 * @returns A new shuffled array (does not mutate original)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

**Verify utility file compiles:**
```bash
npx tsc --noEmit
git add utils/array.ts && git commit -m "Refactor: Add shuffleArray utility"
```

---

### Step 1.5: Update FlashcardGame.tsx to Use Utility

**Find current implementation:**
```bash
grep -n "shuffleArray" components/FlashcardGame.tsx
```

**Change:**
1. Add import: `import { shuffleArray } from '../utils/array';`
2. Remove local `shuffleArray` function definition

**Verify:**
```bash
npx tsc --noEmit && npm run build

# Manual test: Start a flashcard game, verify cards are shuffled
npm run dev
# Test Play section in browser
```

**Commit:**
```bash
git add components/FlashcardGame.tsx && git commit -m "Refactor: Use shared shuffleArray in FlashcardGame"
```

---

### Step 1.6: Update TutorGames.tsx to Use Utility

**Find current implementation:**
```bash
grep -n "shuffleArray" components/TutorGames.tsx
```

**Change:**
1. Add import: `import { shuffleArray } from '../utils/array';`
2. Remove local `shuffleArray` function definition

**Verify:**
```bash
npx tsc --noEmit && npm run build

# Manual test: As tutor, start a local quiz game
npm run dev
# Test TutorGames in browser
```

**Commit:**
```bash
git add components/TutorGames.tsx && git commit -m "Refactor: Use shared shuffleArray in TutorGames"
```

---

### Step 1.7: Merge Phase 1

```bash
# Final verification
npx tsc --noEmit && npm run build

# Run full manual test checklist (login, chat, lovelog, play, progress)
npm run dev

# If all good:
git checkout main
git merge refactor/phase-1-quick-wins
git branch -d refactor/phase-1-quick-wins
```

---

## Phase 2: Type Consolidation

**Time:** 30 minutes
**Risk:** Low
**Approach:** One type at a time, verify imports work

### Step 2.1: Setup

```bash
git checkout -b refactor/phase-2-types
```

---

### Step 2.2: Audit PartnerContext Definitions

**Find all definitions:**
```bash
grep -rn "interface PartnerContext" --include="*.ts" --include="*.tsx"
```

**Expected locations:**
- `types.ts:255` - Full definition with typed vocabulary array
- `api/chat.ts:76` - Simpler definition with `vocabulary: string[]`

**Decision:** These are intentionally different. The API version is simpler because it's internal to that file. **Keep both** but add a comment explaining the difference.

**Change in `api/chat.ts`:**
```typescript
// Local interface for coach mode context (simplified from types.ts PartnerContext)
// Uses string[] for vocabulary instead of full objects for prompt generation
interface PartnerContext {
  // ... existing code
}
```

**Verify:**
```bash
npx tsc --noEmit
git add api/chat.ts && git commit -m "Refactor: Document PartnerContext interface purpose"
```

---

### Step 2.3: Move ExtractedWord to types.ts

**Current location:** `services/gemini.ts:4-20`

**Step A - Add to types.ts:**

Add at the end of `types.ts`:
```typescript
// ===========================================
// Gemini Service Types
// ===========================================

export interface ExtractedWord {
  word: string;
  translation: string;
  type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'other';
  importance: number;
  context: string;
  rootWord?: string;
  examples?: string[];
  proTip?: string;
  conjugations?: {
    present?: { ja?: string; ty?: string; onOna?: string; my?: string; wy?: string; oni?: string };
    past?: { ja?: string; ty?: string; onOna?: string; my?: string; wy?: string; oni?: string };
    future?: { ja?: string; ty?: string; onOna?: string; my?: string; wy?: string; oni?: string };
  };
  adjectiveForms?: { masculine?: string; feminine?: string; neuter?: string; plural?: string };
  gender?: string;
  plural?: string;
}

export interface Attachment {
  data: string;
  mimeType: string;
}
```

**Verify types.ts compiles:**
```bash
npx tsc --noEmit
git add types.ts && git commit -m "Refactor: Add ExtractedWord and Attachment to types.ts"
```

---

**Step B - Update services/gemini.ts:**

Replace local interfaces with import:
```typescript
import { ExtractedWord, Attachment } from '../types';
// Remove lines 4-26 (the local interface definitions)
```

**Verify:**
```bash
npx tsc --noEmit && npm run build

# Manual test: Send a chat message, verify vocabulary extraction works
npm run dev
# Test chat, check Love Log for new words
```

**Commit:**
```bash
git add services/gemini.ts && git commit -m "Refactor: Import ExtractedWord from types.ts"
```

---

### Step 2.4: Merge Phase 2

```bash
npx tsc --noEmit && npm run build
npm run dev  # Full manual test

git checkout main
git merge refactor/phase-2-types
git branch -d refactor/phase-2-types
```

---

## Phase 3: Constants Reorganization

**Time:** 45 minutes
**Risk:** Low (but many files reference constants)
**Approach:** Create new structure, update imports one file at a time

### Step 3.1: Setup

```bash
git checkout -b refactor/phase-3-constants
mkdir -p constants
```

---

### Step 3.2: Create constants/colors.ts

```typescript
export const COLORS = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#FFE66D',
  background: '#F7FFF7',
  text: '#292F36',
  softPink: '#FFF0F3',
  softBlue: '#E7F5FF',
};
```

**Verify:**
```bash
npx tsc --noEmit
git add constants/colors.ts && git commit -m "Refactor: Create constants/colors.ts"
```

---

### Step 3.3: Create constants/icons.tsx

Copy the entire ICONS object from `constants.tsx` to new file:
```typescript
import React from 'react';

export const ICONS = {
  Heart: (props: any) => (
    // ... all icons
  ),
  // ... rest of icons
};
```

**Verify:**
```bash
npx tsc --noEmit
git add constants/icons.tsx && git commit -m "Refactor: Create constants/icons.tsx"
```

---

### Step 3.4: Create constants/index.ts

```typescript
export { COLORS } from './colors';
export { ICONS } from './icons';
```

**Verify:**
```bash
npx tsc --noEmit
git add constants/index.ts && git commit -m "Refactor: Create constants/index.ts barrel export"
```

---

### Step 3.5: Find All Files Using constants.tsx

```bash
grep -rn "from.*['\"].*constants['\"]" --include="*.ts" --include="*.tsx" | grep -v node_modules
```

**Document the list** - we'll update each one.

---

### Step 3.6: Update Imports One File at a Time

For EACH file that imports from constants:

**Change:**
```typescript
// Old
import { ICONS, COLORS } from '../constants';
// or
import { ICONS } from '../constants.tsx';

// New
import { ICONS, COLORS } from '../constants';
// (This will work because constants/index.ts re-exports everything)
```

**After EACH file:**
```bash
npx tsc --noEmit
# If error, fix before continuing
git add [filename] && git commit -m "Refactor: Update [filename] to use new constants structure"
```

---

### Step 3.7: Remove Old constants.tsx

Only after ALL imports are updated:

```bash
npx tsc --noEmit && npm run build

# If both pass:
rm constants.tsx
git add -A && git commit -m "Refactor: Remove old constants.tsx"
```

---

### Step 3.8: Merge Phase 3

```bash
npx tsc --noEmit && npm run build
npm run dev  # Full manual test - icons should render everywhere

git checkout main
git merge refactor/phase-3-constants
git branch -d refactor/phase-3-constants
```

---

## Phase 4: API Layer Cleanup

**Time:** 1-2 hours
**Risk:** Medium (API changes can break functionality)
**Approach:** Extract one utility at a time, test API endpoints after each

### Step 4.1: Setup

```bash
git checkout -b refactor/phase-4-api
mkdir -p api/lib
```

---

### Step 4.2: Extract api/lib/cors.ts

**Create file:**
```typescript
export function setCorsHeaders(req: any, res: any): boolean {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
  const origin = req.headers.origin || '';

  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  return req.method === 'OPTIONS';
}
```

**Verify file compiles:**
```bash
npx tsc --noEmit
git add api/lib/cors.ts && git commit -m "Refactor: Extract CORS utility to api/lib/cors.ts"
```

---

### Step 4.3: Update api/chat.ts to Use CORS Utility

**Change:**
```typescript
import { setCorsHeaders } from './lib/cors';
// Remove lines 32-47 (local setCorsHeaders function)
```

**Verify:**
```bash
npx tsc --noEmit && npm run build

# Critical test: Send a chat message
vercel dev  # or npm run dev if using different setup
# Test chat in browser - must receive response
```

**Commit:**
```bash
git add api/chat.ts api/lib/cors.ts && git commit -m "Refactor: Use shared CORS utility in chat.ts"
```

---

### Step 4.4: Extract api/lib/sanitize.ts

**Create file:**
```typescript
/**
 * Sanitize output to remove any CSS/HTML artifacts the AI might generate
 */
export function sanitizeOutput(text: string): string {
  if (!text) return '';
  return text
    .replace(/\(?#[A-Fa-f0-9]{3,6}\)?\s*font-semibold[^a-z>]*>/gi, '')
    .replace(/\(#[A-Fa-f0-9]{3,6}\)/g, '')
    .replace(/font-semibold["'>:\s]*/gi, '')
    .replace(/text-\[#[A-Fa-f0-9]{3,6}\]/g, '')
    .replace(/<\/?(?:span|strong|div|em|b|i)[^>]*>/gi, '')
    .replace(/style=["'][^"']*["']/gi, '')
    .replace(/class=["'][^"']*["']/gi, '')
    .replace(/#[A-Fa-f0-9]{6}(?![A-Fa-f0-9])/g, '')
    .replace(/["']\s*>/g, '')
    .replace(/<\s*["']/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
```

**Verify & commit:**
```bash
npx tsc --noEmit
git add api/lib/sanitize.ts && git commit -m "Refactor: Extract sanitize utility"
```

---

### Step 4.5: Update api/chat.ts to Use Sanitize Utility

**Change:**
```typescript
import { sanitizeOutput } from './lib/sanitize';
// Remove lines 5-29 (local sanitizeOutput function)
```

**Verify:**
```bash
npx tsc --noEmit && npm run build

# Test: Chat response should be clean (no HTML artifacts)
vercel dev
# Test chat in browser
```

**Commit:**
```bash
git add api/chat.ts && git commit -m "Refactor: Use shared sanitize utility in chat.ts"
```

---

### Step 4.6: Continue Pattern for auth.ts

Same process:
1. Create `api/lib/auth.ts` with `verifyAuth()` and `getUserRole()`
2. Verify file compiles
3. Update `api/chat.ts` to import
4. Verify build + manual test
5. Commit

---

### Step 4.7: Merge Phase 4

```bash
npx tsc --noEmit && npm run build

# Full API test:
vercel dev
# Test: Login, Chat, Voice toggle, Level test

git checkout main
git merge refactor/phase-4-api
git branch -d refactor/phase-4-api
```

---

## Phase 5: Component Extraction

**Time:** 2-3 hours
**Risk:** Medium
**Approach:** Extract ONE component at a time from ONE parent. Never extract multiple simultaneously.

### General Pattern for Each Extraction

```bash
# 1. Identify what to extract
# 2. Create new component file
# 3. Verify new file compiles: npx tsc --noEmit
# 4. Commit new file
# 5. Update parent to import and use new component
# 6. Verify: npx tsc --noEmit && npm run build
# 7. Manual test the specific feature
# 8. Commit parent changes
```

### Step 5.1: Start with Smallest Extraction

**Recommended first extraction:** `GameResults.tsx` from `FlashcardGame.tsx`

This is a self-contained results screen with no complex state dependencies.

---

### Step 5.2: Create components/games/GameResults.tsx

```typescript
import React from 'react';

interface GameResultsProps {
  correct: number;
  incorrect: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

const GameResults: React.FC<GameResultsProps> = ({
  correct,
  incorrect,
  onPlayAgain,
  onExit
}) => {
  const total = correct + incorrect;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="...">
      {/* Copy JSX from FlashcardGame results section */}
    </div>
  );
};

export default GameResults;
```

**Verify:**
```bash
npx tsc --noEmit
git add components/games/GameResults.tsx && git commit -m "Refactor: Create GameResults component"
```

---

### Step 5.3: Update FlashcardGame.tsx

```typescript
import GameResults from './games/GameResults';

// Replace inline results JSX with:
<GameResults
  correct={score.correct}
  incorrect={score.incorrect}
  onPlayAgain={handlePlayAgain}
  onExit={handleExit}
/>
```

**Verify:**
```bash
npx tsc --noEmit && npm run build

# Manual test: Complete a flashcard game, verify results screen works
npm run dev
```

**Commit:**
```bash
git add components/FlashcardGame.tsx && git commit -m "Refactor: Use GameResults component in FlashcardGame"
```

---

### Step 5.4: Continue Extracting

Follow same pattern for each component. Suggested order:

1. `GameResults.tsx` (simplest, shared)
2. `GameHeader.tsx` (progress bar, score - shared)
3. `WordCard.tsx` from LoveLog (self-contained)
4. `ConjugationTable.tsx` from LoveLog (self-contained)
5. `TestResultsModal.tsx` from Progress (modal, isolated)
6. Larger extractions after these succeed

---

## Rollback Procedures

### If TypeScript Check Fails

```bash
# See what you changed
git diff

# Undo all changes
git checkout .

# Or stash for debugging later
git stash save "broken: [description]"
```

### If Build Fails but TypeScript Passes

```bash
# Check build error carefully - often import path issues
npm run build 2>&1 | head -50

# Common fixes:
# - Missing file extension in import
# - Wrong relative path
# - Circular dependency
```

### If Manual Test Fails

```bash
# Check browser console for errors
# Check network tab for failed API calls

# If unclear, rollback to last commit:
git checkout .

# If you committed broken code:
git revert HEAD
```

### Nuclear Option

```bash
# If things are really broken, return to main:
git checkout main
git branch -D refactor/phase-X  # Delete broken branch
# Start fresh
```

---

## Progress Tracking

Check off as you complete:

### Phase 1: Quick Wins
- [ ] 1.1 Update .gitignore
- [ ] 1.2 Check TenseConjugation usage
- [ ] 1.3 Check old mode names usage
- [ ] 1.4 Create utils/array.ts
- [ ] 1.5 Update FlashcardGame.tsx
- [ ] 1.6 Update TutorGames.tsx
- [ ] 1.7 Merge to main

### Phase 2: Type Consolidation
- [ ] 2.1 Setup branch
- [ ] 2.2 Audit PartnerContext
- [ ] 2.3 Move ExtractedWord to types.ts
- [ ] 2.4 Merge to main

### Phase 3: Constants Reorganization
- [ ] 3.1-3.4 Create new structure
- [ ] 3.5 Find all usages
- [ ] 3.6 Update each file (list them)
- [ ] 3.7 Remove old constants.tsx
- [ ] 3.8 Merge to main

### Phase 4: API Cleanup
- [ ] 4.1-4.2 Extract cors.ts
- [ ] 4.3 Update chat.ts for cors
- [ ] 4.4-4.5 Extract and use sanitize.ts
- [ ] 4.6 Extract auth.ts
- [ ] 4.7 Merge to main

### Phase 5: Component Extraction
- [ ] 5.1-5.3 Extract GameResults
- [ ] 5.4+ Continue extractions
- [ ] Merge to main

---

## Success Criteria

Before considering refactoring complete:

1. **All TypeScript checks pass:** `npx tsc --noEmit` returns 0
2. **Build succeeds:** `npm run build` completes without errors
3. **No console errors:** Browser console is clean during normal use
4. **All features work:** Full manual test checklist passes
5. **Code is committed:** All changes are on main branch
6. **No orphan files:** No unused files left behind

---

*Remember: Slow is smooth, smooth is fast. One change at a time, verify, commit, repeat.*
