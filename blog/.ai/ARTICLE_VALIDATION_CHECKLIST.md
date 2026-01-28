# Article Validation Checklist

Before committing ANY generated articles, verify ALL of the following:

## Frontmatter Validation

- [ ] `title` is quoted if contains apostrophes: `title: "Comment dire je t'aime"`
- [ ] `description` is under 160 characters
- [ ] `category` is ONE of: `phrases`, `vocabulary`, `grammar`, `culture`, `situations`, `pronunciation`
- [ ] `difficulty` is ONE of: `beginner`, `intermediate`, `advanced`
- [ ] `readTime` is a NUMBER (e.g., `5`) NOT a string (e.g., `"5 min"`)
- [ ] `date` format: `'YYYY-MM-DD'` with quotes
- [ ] `language` is valid 2-letter code (target language)
- [ ] `nativeLanguage` is valid 2-letter code (reader's language)
- [ ] `tags` is an array: `['tag1', 'tag2']`

## Component Props Validation

### VocabCard
```mdx
<VocabCard
  word="[target language word]"      ← REQUIRED
  translation="[native translation]"  ← optional
  pronunciation="[phonetic]"          ← optional
  example="[example sentence]"        ← optional
/>
```
❌ NEVER use: `polish=`, `swedish=`, `spanish=`, `english=`, etc.

### PhraseOfDay
```mdx
<PhraseOfDay
  word="[target language phrase]"     ← REQUIRED
  translation="[native translation]"  ← optional
  pronunciation="[phonetic]"          ← REQUIRED!
  context="[when to use]"             ← optional
/>
```
❌ NEVER use: `polish=`, `swedish=`, `spanish=`, `english=`, etc.

### CultureTip
```mdx
<CultureTip flag="🇸🇪" title="Title Here">
  Content goes INSIDE the tags (slot), not as a prop!
</CultureTip>
```
⚠️ ALWAYS include `flag` prop matching the target language!

**Flag Reference:**
- en=🇬🇧, es=🇪🇸, fr=🇫🇷, de=🇩🇪, it=🇮🇹, pt=🇵🇹
- pl=🇵🇱, nl=🇳🇱, ru=🇷🇺, uk=🇺🇦, tr=🇹🇷, ro=🇷🇴
- cs=🇨🇿, el=🇬🇷, hu=🇭🇺, sv=🇸🇪, no=🇳🇴, da=🇩🇰

### ConjugationTable
```mdx
<ConjugationTable
  verb="[infinitive form]"           ← REQUIRED
  meaning="[translation]"            ← REQUIRED
  conjugations={[                    ← REQUIRED (array!)
    { person: "I", word: "...", translation: "..." },
    { person: "You", word: "...", translation: "..." },
    ...
  ]}
/>
```

### CTA
```mdx
<CTA />
```
Just use self-closing with no props (defaults are fine).

## Content Validation

- [ ] NO `<3` in content (breaks MDX) - use ❤️ instead
- [ ] All component attributes are quoted: `title="..."` not `title=...`
- [ ] Internal links use 3-segment format: `/learn/en/sv/article-slug/`
- [ ] At least 2-3 internal links to related articles
- [ ] Minimum 500 words
- [ ] PhraseOfDay component appears near the top
- [ ] CTA component appears at the bottom

## Build Test

Before pushing a batch of articles:
```bash
cd ~/lovelanguages-multilang/blog
npm run build 2>&1 | grep -i error
```

If ANY errors, fix before pushing.

---

## Quick Validation Script

Run this to check common issues:
```bash
# Check frontmatter
grep -L "^nativeLanguage:" src/content/articles/**/*.mdx
grep -L "^language:" src/content/articles/**/*.mdx
grep "readTime:.*min" src/content/articles/**/*.mdx

# Check components
grep "polish=" src/content/articles/**/*.mdx
grep "swedish=" src/content/articles/**/*.mdx
grep "english=" src/content/articles/**/*.mdx
grep "<3" src/content/articles/**/*.mdx
```

Any matches = problems to fix.
