# Love Languages Skills To Create

Skills are reusable workflows that make complex tasks repeatable and reliable.

---

## 🎮 Product Development

### `add-game`
Adding a new game mode to the app.
- Create component in `components/`
- Add to game selector
- Wire up scoring/XP
- Add sounds
- Test on preview
- **Depends on:** XP system overhaul

### `add-language`
Adding a 19th (or beyond) language.
- Add to `constants/language-config.ts`
- Add flag emoji, name, native name
- Add conjugation rules (if verb support)
- Add to Learn Hub
- Generate blog content
- Test all features with new language

### `add-feature`
General feature development workflow.
- Branch naming
- Implementation checklist
- Testing levels (syntax → behavior → preview → edge)
- Peer review
- Merge process

---

## ✍️ Content Creation

### `create-article`
Generate blog article across all language pairs.
- Check registry for duplicates
- Generate with Claude API
- Generate hero image with Glif
- Update registry
- Commit and deploy
- **Note:** Multi-language batch generation enhancement pending

### `seo-audit`
Audit and improve SEO performance.
- Pull GSC data
- Identify underperforming pages
- Check indexing issues
- Suggest improvements
- Track changes

### `content-refresh`
Update existing articles.
- Find outdated content
- Update with current info
- Refresh images if needed
- Re-validate structured data

---

## 🔧 Operations

### `daily-standup`
Morning SEO/analytics standup.
- Pull GSC (impressions, clicks, queries)
- Pull GA4 (sessions, landing pages)
- Check new signups in Supabase
- Identify trends
- Brief Sofia with tasks

### `user-feedback`
Process and act on user feedback.
- Collect feedback (email, chat, reviews)
- Categorize (bug, feature request, UX issue)
- Add to roadmap or fix immediately
- Follow up with user

### `outreach`
User/partner outreach workflow.
- Identify targets (organic signups, potential partners)
- Draft personalized email
- Send via gmail-send
- Track responses

---

## 🧪 Testing & Quality

### `testing-workflow`
4-level testing process.
- Level 1: Syntax (`tsc --noEmit`, `npm run build`)
- Level 2: Behavioral tests (actual feature verification)
- Level 3: Vercel preview (browser testing)
- Level 4: Edge cases (fuzzing, failure modes)

### `security-review`
Code security audit.
- Scan for hardcoded secrets
- Check for injection vulnerabilities
- Verify input validation
- Run automated scanners (gitleaks, semgrep)
- Pre-commit hook validation

### `e2e-test`
Write and run E2E tests.
- Identify test scenarios
- Write Playwright tests
- Run against preview
- Document test accounts used

---

## 👥 Agent Management

### `agent-workflow`
Spawn and manage sub-agents.
- Task assignment
- Branch setup
- Summary report format
- Peer review rotation
- Cleanup verification

### `code-review`
Peer review process.
- Self-review checklist
- Cross-agent review assignment
- Security checks
- Approval workflow

---

## 🚀 Infrastructure

### `vercel-deploy`
Deployment workflow.
- Branch → Preview URL
- Testing on preview
- Approval gate
- Merge to main
- Verify production

### `db-migration`
Database schema changes.
- Write migration SQL
- Test in preview environment
- Run in production Supabase
- Verify data integrity
- Update types if needed

### `setup-security`
Security automation setup.
- Pre-commit hooks
- GitHub Actions
- Automated scanners
- CLAUDE.md security checklist

---

## 📊 Analytics & Monitoring

### `analytics-setup`
Set up tracking for new features.
- Add GA4 events
- Update privacy policy if needed
- Verify tracking works
- Document what's tracked

### `performance-audit`
Performance review.
- Lighthouse scores
- Core Web Vitals
- Bundle size analysis
- Optimization recommendations

---

## Priority Matrix

| Skill | Urgency | Impact | Effort |
|-------|---------|--------|--------|
| `security-review` | 🔴 High | 🔴 High | Medium |
| `testing-workflow` | 🔴 High | 🔴 High | Low (exists) |
| `agent-workflow` | 🔴 High | 🔴 High | Low (exists) |
| `create-article` | 🟡 Medium | 🔴 High | Medium |
| `add-language` | 🟡 Medium | 🔴 High | Large |
| `add-game` | 🟡 Medium | 🟡 Medium | Medium |
| `daily-standup` | 🟡 Medium | 🟡 Medium | Low (exists) |
| `vercel-deploy` | 🟢 Low | 🟡 Medium | Low |
| `db-migration` | 🟢 Low | 🟡 Medium | Medium |

---

## Roadmap Placement

### Before Next Coding Session
- `security-review` — part of Code Review & Security Automation
- `testing-workflow` — formalize existing TESTING_GUIDE.md
- `agent-workflow` — formalize existing WORKFLOW.md

### With Major System Improvements
- `add-game` — after XP system overhaul
- `add-language` — after Verb System work

### Ongoing Operations
- `daily-standup` — already running via cron
- `create-article` — enhance with batch generation
- `seo-audit` — periodic check

---

*This document tracks skills to be created. Each skill becomes a SKILL.md in the appropriate location.*
