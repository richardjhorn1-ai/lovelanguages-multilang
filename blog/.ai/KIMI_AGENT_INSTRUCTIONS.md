# Kimi Agent Instructions — P0 Article Generation

## Your Mission

You are generating language learning articles for Love Languages (lovelanguages.io).

**Your assigned native language:** `{NATIVE_LANG}` (e.g., "sv" for Swedish)
**Your task file:** `tasks/tasks-{NATIVE_LANG}.csv`

You will generate **170 articles** — one for each row in your CSV.

---

## Input Files

### 1. Your Task CSV (`tasks/tasks-{NATIVE_LANG}.csv`)

```csv
task_id,native_lang,target_lang,topic_id,template,slug,title,output_path
1,sv,en,1,how-to-say,how-to-say-i-love-you-in-english,"How to Say I Love You in English",src/content/articles/sv/en/how-to-say-i-love-you-in-english.mdx
```

Columns:
- `task_id`: Unique task number (1-170)
- `native_lang`: Reader's language (your assignment)
- `target_lang`: Language they're learning
- `topic_id`: Which P0 topic (1-10)
- `template`: Which template to follow
- `slug`: URL slug for the article
- `title`: Article title
- `output_path`: Where to save the file

### 2. Templates (`STRUCTURE_TEMPLATES/{template}.md`)

Each template type has specific requirements. **Follow your template exactly.**

- `how-to-say.md` — For "How to say X" articles
- `phrases-list.md` — For phrase collections (50+ items)
- `practical-guide.md` — For practical scenarios
- `grammar-guide.md` — For grammar/pronunciation
- `comparison.md` — For "Is X hard to learn?" articles

### 3. Validation Checklist (`ARTICLE_VALIDATION_CHECKLIST.md`)

Every article MUST pass these checks before saving.

---

## Output

### Success → Save to `output_path`

Example: `src/content/articles/sv/en/how-to-say-i-love-you-in-english.mdx`

### Failure → Save to `quarantine/{native}/{target}/{slug}.mdx`

Include error reason in a comment at the top:
```mdx
{/* QUARANTINE REASON: Missing CultureTip component */}
---
title: ...
```

---

## Article Generation Process

For each row in your CSV:

### Step 1: Check if file exists
```
IF file exists at output_path → SKIP (log as "skipped")
```

### Step 2: Load the template
```
Read STRUCTURE_TEMPLATES/{template}.md
```

### Step 3: Generate the article

**CRITICAL RULES:**

1. **Write in the NATIVE language** (e.g., if native=sv, all UI text and explanations in Swedish)

2. **Teach the TARGET language** (e.g., if target=en, teach English words/phrases)

3. **Use correct component props:**
   ```mdx
   ✅ CORRECT:
   <VocabCard word="te quiero" translation="I love you" />
   
   ❌ WRONG:
   <VocabCard spanish="te quiero" english="I love you" />
   ```

4. **Include required components:**
   - `<PhraseOfDay>` — At least one, with pronunciation
   - `<CultureTip>` — At least one, with flag prop
   - `<VocabCard>` — Multiple throughout
   - `<Quiz>` — If template requires
   - `<CTA>` — At the end

5. **Internal links:** Include 2+ links to other articles
   ```mdx
   [Spanish pet names](/learn/{native}/es/spanish-pet-names-for-your-partner)
   ```

6. **Minimum length:** 500+ words of actual content

### Step 4: Validate

Before saving, verify:
- [ ] Frontmatter is complete
- [ ] All components use word=/translation= (not language-specific props)
- [ ] Has PhraseOfDay with pronunciation
- [ ] Has CultureTip with flag
- [ ] Has 2+ internal links
- [ ] Has CTA at end
- [ ] 500+ words

### Step 5: Save or Quarantine

- **Pass** → Save to `output_path`
- **Fail** → Save to `quarantine/` with reason

### Step 6: Log result

Append to your log:
```
[2026-01-28 21:30:00] Task 1: ✅ SUCCESS - how-to-say-i-love-you-in-english.mdx
[2026-01-28 21:30:15] Task 2: ✅ SUCCESS - english-pet-names-for-your-partner.mdx
[2026-01-28 21:30:30] Task 3: ❌ QUARANTINE - essential-english-phrases (missing CultureTip)
[2026-01-28 21:30:45] Task 4: ⏭️ SKIPPED - file already exists
```

---

## Frontmatter Template

```yaml
---
title: "{title from CSV}"
description: "A compelling 150-160 char description in {native_lang}"
pubDate: 2025-01-28
updatedDate: 2025-01-28
nativeLang: "{native_lang}"
targetLang: "{target_lang}"
topic: "{topic based on topic_id}"
level: "beginner"
readingTime: "{X} min read"
tags: ["topic1", "topic2", "topic3"]
longTailKeyword: "relevant long-tail keyword"
---
```

---

## Component Reference

### VocabCard
```mdx
<VocabCard 
  word="target language word"
  translation="native language translation"
  pronunciation="pronunciation guide"
  example="Example sentence"
  exampleTranslation="Translation of example"
/>
```

### PhraseOfDay
```mdx
<PhraseOfDay 
  phrase="phrase in target language"
  translation="translation in native language"
  pronunciation="pronunciation"
  context="When to use this phrase"
/>
```

### CultureTip
```mdx
<CultureTip flag="{target_lang}">
  Cultural insight written in {native_lang}...
</CultureTip>
```

### Quiz
```mdx
<Quiz
  question="Question in {native_lang}"
  options={["option1", "option2", "option3", "option4"]}
  correctIndex={0}
  explanation="Explanation in {native_lang}"
/>
```

### CTA
```mdx
<CTA 
  title="CTA title in {native_lang}"
  description="CTA description in {native_lang}"
/>
```

---

## Language Codes Reference

| Code | Language | Native Name |
|------|----------|-------------|
| en | English | English |
| es | Spanish | Español |
| fr | French | Français |
| de | German | Deutsch |
| it | Italian | Italiano |
| pt | Portuguese | Português |
| nl | Dutch | Nederlands |
| pl | Polish | Polski |
| ru | Russian | Русский |
| uk | Ukrainian | Українська |
| tr | Turkish | Türkçe |
| ro | Romanian | Română |
| sv | Swedish | Svenska |
| no | Norwegian | Norsk |
| da | Danish | Dansk |
| cs | Czech | Čeština |
| el | Greek | Ελληνικά |
| hu | Hungarian | Magyar |

---

## Summary Checklist

Before finishing your session:

- [ ] All 170 tasks attempted
- [ ] Log file saved to `logs/{native}-{timestamp}.log`
- [ ] Quarantine files have error reasons
- [ ] Report final counts: X success, Y failed, Z skipped

---

## Questions?

If you encounter:
- **Template ambiguity** → Follow the most similar example
- **Missing information** → Make reasonable assumptions, note in article
- **Technical errors** → Log and continue with next task
