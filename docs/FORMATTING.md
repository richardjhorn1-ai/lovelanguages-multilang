# Love Languages - Formatting System

How text formatting works from AI response to user display.

---

## Overview

The app uses a custom markdown-like syntax for displaying Polish vocabulary:

| Element | Markdown | Display |
|---------|----------|---------|
| Polish words | `**kocham**` | **kocham** (pink, bold) |
| Pronunciation | `[KOH-ham]` | *(KOH-ham)* (gray, italic) |
| Line breaks | `\n` | `<br />` |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. AI RESPONSE (Gemini API)                                    │
│     Output: "**Cześć** [cheshch] means hello"                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. API SANITIZATION (api/chat.ts)                              │
│     sanitizeOutput() removes any CSS artifacts from old data    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. DATABASE STORAGE (Supabase)                                 │
│     Stored as: "**Cześć** [cheshch] means hello"                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. FRONTEND PARSING (components/ChatArea.tsx)                  │
│     parseMarkdown() converts to styled HTML                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. RENDERED OUTPUT                                             │
│     <strong style="color: #FF4761">Cześć</strong>               │
│     <span class="text-gray-400 italic">(cheshch)</span>         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `components/ChatArea.tsx` | `parseMarkdown()` - converts markdown to HTML |
| `api/chat.ts` | `sanitizeOutput()` - removes CSS artifacts, system prompts |
| `api/chat-stream.ts` | `sanitizeOutput()` - streaming version |
| `api/live-token.ts` | Voice mode system prompts |

---

## The parseMarkdown() Function

**Location:** `components/ChatArea.tsx` (lines 9-52)

```javascript
const parseMarkdown = (text: string) => {
  if (!text) return '';

  // STEP 1: Sanitize legacy CSS artifacts
  let clean = text
    .split('(#FF4761) font-semibold">').join('')
    .split('(#FF4761)font-semibold">').join('')
    .split('#FF4761) font-semibold">').join('')
    .split('font-semibold">').join('')
    .split('font-semibold>').join('');

  // STEP 2: Regex sanitization for variations
  clean = clean
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

  // STEP 3: Apply markdown formatting
  // CRITICAL: Order matters! Brackets MUST be processed FIRST
  return clean
    .replace(/\[(.*?)\]/g, '<span class="text-gray-400 italic text-sm">($1)</span>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #FF4761; font-weight: 600;">$1</strong>')
    .replace(/\n/g, '<br />');
};
```

---

## CRITICAL: Regex Order

**The bracket replacement MUST run BEFORE the asterisk replacement.**

### Why?

If you process asterisks first with a Tailwind class:
```javascript
// BAD: Creates HTML with brackets in class name
.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#FF4761] font-semibold">$1</strong>')
```

Then the bracket regex will match `[#FF4761]` inside the class attribute and break the HTML!

### Correct Approach

Either:
1. **Process brackets first** (current solution)
2. **Use inline styles** instead of Tailwind arbitrary values (current solution)

```javascript
// GOOD: No brackets in the output HTML
.replace(/\[(.*?)\]/g, '<span...>($1)</span>')  // First
.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #FF4761;">$1</strong>')  // Second
```

---

## AI System Prompts

The AI is instructed to output clean markdown in its system prompts:

**Location:** `api/chat.ts` (COMMON_INSTRUCTIONS)

```
FORMATTING - YOU MUST FOLLOW THIS EXACTLY:
- Polish words go inside **double asterisks**: **kocham**, **Dzień dobry**
- Pronunciation goes in [square brackets]: [KOH-ham], [jen DOH-bri]
- Complete example: **Dzień dobry** [jen DOH-bri] means "good morning"
- Output ONLY plain text with markdown - nothing else
```

**Key principles:**
- Use POSITIVE instructions only ("do this")
- Avoid NEGATIVE examples ("don't do this") - the AI may learn the wrong pattern
- Keep formatting rules simple and consistent

---

## Custom Block Syntax

For LEARN mode, the app uses custom block delimiters:

### Tables
```
::: table
Polish | English | Pronunciation
---|---|---
Cześć | Hello | cheshch
Dzień dobry | Good morning | jen DOH-bri
:::
```

### Drills
```
::: drill
Tonight's challenge: Say "Kocham cię" while looking into their eyes.
:::
```

### Culture Notes
```
::: culture
In Poland, it's customary to greet with "Dzień dobry" (good day) until evening.
:::
```

These are parsed by `GrammarTable`, `DrillCard`, and `CultureCard` components in `ChatArea.tsx`.

---

## Adding New Formatting

### To add a new markdown element:

1. **Update AI prompts** - Tell the AI the new syntax
   - `api/chat.ts` - COMMON_INSTRUCTIONS
   - `api/chat-stream.ts` - buildSystemInstruction()
   - `api/live-token.ts` - MODE_PROMPTS

2. **Update parseMarkdown()** - Add regex replacement
   - Consider regex order (brackets before HTML generation)
   - Use inline styles if class names would contain brackets

3. **Test thoroughly**
   - New messages render correctly
   - Old messages still render correctly
   - No CSS artifacts leak through

### Example: Adding underline support

```javascript
// In parseMarkdown(), add BEFORE asterisk processing:
.replace(/__(.*?)__/g, '<u>$1</u>')
```

```
// In AI prompts, add:
- Use __double underscores__ for emphasis: __important__
```

---

## Debugging Formatting Issues

### Symptom: CSS artifacts visible in chat

**Check:**
1. Console log the raw AI response in `api/chat.ts`
2. Console log the input to `parseMarkdown()`
3. Console log the output of `parseMarkdown()`

Usually the issue is in the parseMarkdown() function, not the AI.

### Symptom: Formatting not applied

**Check:**
1. Is the AI outputting the correct markdown syntax?
2. Is the regex pattern correct? (test on regex101.com)
3. Is the regex order correct? (brackets before HTML)

### Symptom: Old messages look broken

**Check:**
1. Are old messages stored with CSS artifacts in the database?
2. Does `sanitizeOutput()` handle the artifact pattern?
3. Add literal string replacements for exact patterns

---

## Color Reference

| Element | Color | Usage |
|---------|-------|-------|
| Polish words | `#FF4761` | Rose/pink - brand color |
| Pronunciation | `text-gray-400` | Subtle gray |
| Culture cards | `#FFF0F3` gradient | Soft pink background |
| Drill cards | `teal-50` | Teal/green accent |

---

## Related Documentation

- `TROUBLESHOOTING.md` - Issue 17 documents the CSS artifacts bug and fix
- `docs/AI_INTEGRATION_GUIDE.md` - How AI models are configured
- `ROADMAP.md` - Future formatting enhancements
