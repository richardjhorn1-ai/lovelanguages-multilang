# Master Generation Plan

## Agent Roles

### Claude (Cupid) — Coordinator & Code
**Strengths:** Complex reasoning, code changes, quality control, tool access
**Use for:**
- Phase 1 (scaffolding) — requires understanding existing codebase
- Creating/updating templates and validation scripts
- Quality review and auditing
- Fixing systematic errors
- Coordinating multi-agent workflows
- Anything requiring file system, git, browser tools

### Kimi K2.5 — Bulk Content Generation
**Strengths:** Fast, cheap, parallelizable (25 agents), good at following templates
**Use for:**
- Phase 2 & 3 bulk article generation
- Repetitive content tasks
- Following established patterns at scale
- Phase 4 image prompt generation

### Decision Matrix

| Task | Claude | Kimi | Why |
|------|--------|------|-----|
| Update Astro pages | ✅ | ❌ | Needs codebase understanding |
| Add UI translations | ✅ | ✅ | Claude coordinates, Kimi can translate |
| Create validation scripts | ✅ | ❌ | Complex logic |
| Generate 1 test article | ✅ | ✅ | Either works |
| Generate 100+ articles | ❌ | ✅ | Kimi is faster/cheaper at scale |
| Review failed articles | ✅ | ❌ | Needs reasoning about why |
| Fix template issues | ✅ | ❌ | Needs understanding of system |
| Generate image prompts | ❌ | ✅ | Repetitive task |
| Debug build errors | ✅ | ❌ | Needs tool access |

---

## Current State
- **Hub data:** 17 languages (all except en) ✅
- **Compare pages:** Only 12 languages (missing: sv, no, da, cs, el, hu) ❌
- **EN→PL articles:** 78 (gold standard)
- **Goal:** 18 natives × 17 targets × 78 topics = ~23,868 articles

---

# Phase 1: Scaffolding
**Agent: Claude (Cupid)**
**Goal:** All 18 languages selectable and working in UI

## Phase 1.1: Update Compare Pages
**Claude does this** — requires understanding Astro routing

Add 6 missing languages:
```
Files to update:
- src/pages/compare/[nativeLang]/index.astro
- src/pages/compare/[nativeLang]/love-languages-vs-duolingo.astro
- src/pages/compare/[nativeLang]/love-languages-vs-babbel.astro

Change: ['en','es','fr','de','it','pt','nl','pl','ru','uk','tr','ro']
To:     ['en','es','fr','de','it','pt','nl','pl','ru','uk','tr','ro','sv','no','da','cs','el','hu']
```

**Validation:** All 18 `/compare/XX/` URLs load

## Phase 1.2: Add UI Translations
**Claude coordinates, can use Kimi for translations**

For each new language, add UI_TEXT object:
- sv: Swedish translations
- no: Norwegian translations  
- da: Danish translations
- cs: Czech translations
- el: Greek translations
- hu: Hungarian translations

**Approach:**
1. Claude extracts English UI_TEXT as template
2. Kimi translates to each language (6 parallel tasks)
3. Claude integrates translations into code

## Phase 1.3: Verify Hub Pages
**Claude does this** — requires browser/testing tools

- Test all 18 language hub pages load
- Verify language selector works
- Check no broken links

## Phase 1.4: Create Article Directories
**Claude does this** — simple file operations

```bash
mkdir -p src/content/articles/{sv,no,da,cs,el,hu}/{en,es,fr,...}
```

### Phase 1 Quality Gate (Claude verifies)
- [ ] All 18 compare pages load
- [ ] All 18 hub pages load  
- [ ] Language selector shows all 18
- [ ] Build passes with zero errors
- [ ] No 404s in navigation

---

# Phase 2: Base Content Parity
**Agent: Kimi K2.5 (18 parallel agents)**
**Coordinator: Claude**
**Goal:** Every language pair has 10 P0 topics

## Phase 2.0: Preparation (Claude)
1. Create CSV files for each native language
2. Ensure templates are finalized
3. Test with 1 article per native (sanity check)
4. Set up logging/quarantine directories

## Phase 2.1: Generate P0 Content (Kimi ×18)
Each Kimi agent handles ONE native language:

| Agent | Native | Work |
|-------|--------|------|
| K1 | sv | 10 topics × 17 targets = 170 articles |
| K2 | no | 170 articles |
| K3 | da | 170 articles |
| K4 | cs | 170 articles |
| K5 | el | 170 articles |
| K6 | hu | 170 articles |
| K7 | en | Fill gaps only |
| K8 | es | Fill gaps only |
| ... | ... | ... |
| K18 | ro | Fill gaps only |

**All 18 run in parallel**

### Kimi Agent Instructions
```
You are generating articles for [NATIVE_LANG] speakers.

INPUT: CSV with columns: topic, target_lang, template
OUTPUT: MDX files saved to correct paths

For each row:
1. Check if file exists → skip if yes
2. Load template from STRUCTURE_TEMPLATES/
3. Generate article following template EXACTLY
4. Run through validation checklist
5. Save to src/content/articles/[native]/[target]/[slug].mdx
6. Log result (success/fail/skipped)

VALIDATION CHECKLIST (reject if any fail):
- [ ] Frontmatter has all required fields
- [ ] Uses word=/translation= props (NOT language-specific)
- [ ] Has 2+ internal links
- [ ] Has PhraseOfDay with pronunciation
- [ ] Has CultureTip with correct flag
- [ ] Has CTA at end
- [ ] 500+ words

If validation fails: save to quarantine/ with error reason
```

## Phase 2.2: Review & Fix (Claude)
After Kimi agents complete:
1. Review quarantine for patterns
2. Fix any systematic template issues
3. Regenerate failed articles
4. Run full validation sweep

### Phase 2 Quality Gate (Claude verifies)
- [ ] All 306 language pairs have 10 P0 articles
- [ ] All articles pass validate-article.sh
- [ ] Build passes
- [ ] Spot-check 5% for content quality

---

# Phase 3: Rich Content Parity  
**Agent: Kimi K2.5 (25 parallel agents)**
**Coordinator: Claude**
**Goal:** Every language pair has 78 articles

## Phase 3.0: Preparation (Claude)
1. Export EN→PL topic list as master
2. Calculate gaps per language pair
3. Generate CSVs for each native
4. Split into batches of ~500 articles per agent

## Phase 3.1: Generate Remaining Content (Kimi ×25)

### Wave 1: New natives (less existing content)
| Agent | Native | Est. Articles |
|-------|--------|---------------|
| K1-K6 | sv,no,da,cs,el,hu | ~7,000 |

### Wave 2: Established natives
| Agent | Native | Est. Articles |
|-------|--------|---------------|
| K7-K18 | en,es,fr,de,it,pt,pl,nl,ru,uk,tr,ro | ~13,000 |

**Run waves sequentially** — catch issues in Wave 1 before scaling

## Phase 3.2: Review & Fix (Claude)
Same as Phase 2.2

### Phase 3 Quality Gate (Claude verifies)
- [ ] All pairs have 78 articles
- [ ] All pass validation
- [ ] Build passes
- [ ] Random quality audit (2%)

---

# Phase 4: Image Generation
**Agent: Kimi for prompts, Glif for images**
**Coordinator: Claude**
**Goal:** Every article has a unique image

## Phase 4.0: Preparation (Claude)
1. Inventory articles needing images
2. Create image prompt template
3. Set up Glif MCP connection

## Phase 4.1: Generate Image Prompts (Kimi)
For each article:
- Extract: title, topic, target language, native language
- Generate: Glif-compatible prompt
- Output: CSV of slug → prompt

## Phase 4.2: Generate Images (Glif via Claude)
**Claude coordinates Glif calls** — needs MCP tool access

Batch by priority:
1. P0 articles (~3,000)
2. P1 articles (~9,000)
3. P2 articles (~11,000)

## Phase 4.3: Update Frontmatter (Claude)
Add image paths to all articles

### Phase 4 Quality Gate (Claude verifies)
- [ ] All articles have images
- [ ] Images render correctly
- [ ] Build passes

---

# Error Handling

## Claude's Role in Errors
1. **Monitor** agent logs during generation
2. **Analyze** quarantine patterns
3. **Fix** templates/scripts if systematic
4. **Regenerate** failed batches
5. **Escalate** to Richard if unclear

## Kimi's Role in Errors
1. **Self-validate** before saving
2. **Quarantine** failures with reason
3. **Report** completion stats
4. **Retry once** on API errors

## Stop Conditions
- Error rate > 5% → Pause, Claude investigates
- Same error 3+ times → Stop, fix root cause
- Build fails → Stop all generation

---

# Summary: Who Does What

| Phase | Claude (Cupid) | Kimi K2.5 |
|-------|----------------|-----------|
| **1.1** Update compare pages | ✅ Does it | ❌ |
| **1.2** UI translations | Coordinates | Translates (×6) |
| **1.3** Verify pages | ✅ Does it | ❌ |
| **1.4** Create directories | ✅ Does it | ❌ |
| **2.0** Prep CSVs/templates | ✅ Does it | ❌ |
| **2.1** Generate P0 articles | Monitors | ✅ Does it (×18) |
| **2.2** Review & fix | ✅ Does it | ❌ |
| **3.0** Prep gap analysis | ✅ Does it | ❌ |
| **3.1** Generate articles | Monitors | ✅ Does it (×25) |
| **3.2** Review & fix | ✅ Does it | ❌ |
| **4.0** Prep image pipeline | ✅ Does it | ❌ |
| **4.1** Generate prompts | ❌ | ✅ Does it |
| **4.2** Generate images | ✅ Calls Glif | ❌ |
| **4.3** Update frontmatter | ✅ Does it | ❌ |

---

# Next Action
**Claude (me):** Start Phase 1.1 — Update compare pages to support all 18 languages
