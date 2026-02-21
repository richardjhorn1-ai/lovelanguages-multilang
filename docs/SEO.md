# SEO Strategy & Progress Tracker

**Last Updated:** February 21, 2026

---

## Mission

Make Love Languages discoverable by couples searching for **language learning resources across 18 languages**: romantic phrases, cultural content, and couple-focused learning.

**Supported Languages:** English, Spanish, French, Italian, Portuguese, Romanian, German, Dutch, Swedish, Norwegian, Danish, Polish, Czech, Russian, Ukrainian, Greek, Hungarian, Turkish

---

## 📊 Current Performance (Feb 21, 2026)

### Google Search Console (30-day)
| Metric | Value |
|--------|-------|
| **Pages indexed** | 702 |
| **Pages submitted** | 11,933 |
| **Impressions** | 12,088 |
| **Clicks** | 247 |
| **CTR** | 2.04% |

### Top Pages by Impressions
| Impressions | Clicks | CTR | Page |
|-------------|--------|-----|------|
| 305 | 1 | 0.3% | /learn/en/tr/turkish-pet-names... |
| 236 | 0 | 0% | /learn/en/it/how-to-say-i-love-you-in-italian |
| 191 | 0 | 0% | /learn/de/el/how-to-say-i-love-you-in-greek |
| 184 | 2 | 1.1% | /learn/en/el/greek-pet-names... |
| 168 | 1 | 0.6% | /learn/ru/en/english-pet-names... |
| 165 | 0 | 0% | /learn/en/ro/romanian-pronunciation-guide... |

### Top Pages by Clicks
| Clicks | Impressions | CTR | Page |
|--------|-------------|-----|------|
| 9 | 98 | 9.2% | / (homepage) |
| 4 | 11 | 36.4% | /learn/pl/ru/russian-pet-names... |
| 3 | 94 | 3.2% | /learn/ru/uk/ukrainian-pet-names... |
| 3 | 125 | 2.4% | /learn/en/no/norwegian-pet-names... |
| 3 | 99 | 3.0% | /learn/en/uk/ukrainian-pet-names... |

---

## 🔍 SEO Audit Results (Feb 21, 2026)

Comprehensive audit using 6 sub-agents checking 60+ articles.

### ✅ What's Working Well
| Area | Status |
|------|--------|
| i18n/UI localization | ✅ 11/12 articles have properly translated UI |
| Schema/structured data | ✅ BlogPosting, BreadcrumbList, FAQPage present |
| Sitemap URLs | ✅ All resolve correctly |
| Content quality | ✅ No AI slop, good structure, proper translations |
| Testimonials | ✅ Component not rendered (no Polish bug on live pages) |

### ❌ Issues Found
| Issue | Severity | Scope | Fix Effort |
|-------|----------|-------|------------|
| **$ instead of €** for EU languages | 🔴 High | All EU-language articles | 30 min |
| **Weak internal linking** | 🔴 High | Only 3/10 articles have related links | 2-4 hrs |
| **No cross-pair links** | 🟡 Medium | 0/10 articles link same topic in other pairs | 2-3 hrs |
| **No reverse direction links** | 🟡 Medium | 0/10 articles link to reverse (EN→PL → PL→EN) | 2 hrs |
| **Generic meta descriptions** | 🟡 Medium | 3 articles (DE→IT especially) | 1 hr |
| **404 URLs** | 🟡 Medium | 4 specific pages | 1 hr |

### 404s Found
- `/learn/en/el/greek-pet-names-terms-of-endearment/`
- `/learn/en/no/norwegian-pet-names-terms-of-endearment/`
- `/learn/es/pl/polish-romantic-phrases-every-occasion/`
- `/learn/es/it/italian-food-vocabulary/`

---

## 🎯 SEO Action Plan

### Immediate (This Week)
1. [ ] **Fix € currency** — Update CTA.astro translations for EU languages
2. [ ] **Fix 404 URLs** — Check Supabase for correct slugs or create redirects
3. [ ] **Add internal linking** — Related articles section in ArticleLayout.astro

### Short-term (Next 2 Weeks)  
4. [ ] **Cross-pair links** — Link same topic across different language pairs
5. [ ] **Reverse links** — Link EN→PL articles to PL→EN equivalents
6. [ ] **Fix generic metas** — Update DE→IT article meta descriptions
7. [ ] **Create landing page** — "couples language learning app" targeting commercial keyword

### Medium-term
8. [ ] **CTR optimization** — Improve titles/metas for top impression pages
9. [ ] **Topic clusters** — Ensure all "pet names" articles interlink
10. [ ] **Reddit presence** — Authentic posts about learning partner's language

---

## 🏆 Competitive Analysis (Feb 21, 2026)

### "couples language learning app" SERP
Love Languages does NOT appear in top 50 results.

**Who ranks:**
1. 🥇 Coupling (couplingcafe.com) — Direct competitor
2. Reddit threads about Coupling
3. Coupling (App Store)
4. Coupling (Google Play)
5. Tandem
6. Love Nudge (5 Love Languages — different product)
7. CNET article
8. Otto: Language for Couples

### Coupling vs Love Languages
| Metric | Coupling | Love Languages |
|--------|----------|----------------|
| Pages indexed | 2 | 702 |
| Content strategy | None (just app) | 12k+ blog articles |
| App Store presence | ✅ Strong | ❌ Not yet |
| Commercial keywords | ✅ Ranks #1 | ❌ Not ranking |
| Informational keywords | ❌ Not trying | 🟡 Getting impressions |

**Key insight:** Coupling wins commercial terms via App Store pages + Reddit buzz. Love Languages can dominate informational long-tail once authority builds.

---

## 📈 Goals & KPIs

### Q1 2026 Targets
| Metric | Current | Target |
|--------|---------|--------|
| Indexed pages | 702 | 2,000+ |
| Monthly impressions | 12,088 | 50,000 |
| Monthly clicks | 247 | 1,000 |
| CTR | 2.04% | 4%+ |
| Blog → Signup conversion | Unknown | 5% |

### Keyword Targets
| Keyword | Current Position | Target |
|---------|------------------|--------|
| "turkish pet names" | ~10-20 | Top 5 |
| "how to say i love you in italian" | ~20-30 | Top 10 |
| "couples language learning app" | Not ranking | Top 20 |

---

## 🛠️ Technical SEO Status

### ✅ Completed
- [x] Astro SSR blog (server-side rendering)
- [x] Clean URLs: `/learn/[native]/[target]/[slug]/`
- [x] Meta tags per page (title, description)
- [x] Open Graph + Twitter Cards
- [x] JSON-LD (BlogPosting, BreadcrumbList, FAQPage, HowTo)
- [x] Sitemap at `/sitemap-index.xml`
- [x] robots.txt configured
- [x] Canonical URLs with www
- [x] Edge cache headers (s-maxage=1d)
- [x] Reduced DB queries (12+ → 2 per page)
- [x] GA4 unified across blog + app

### 🔲 Pending
- [ ] Internal linking automation
- [ ] Cross-pair/reverse link generation
- [ ] RSS feed
- [ ] Article search functionality

---

## 📚 Content Stats

### Articles by Native Language
| Language | Count | | Language | Count |
|----------|-------|---|----------|-------|
| 🇬🇧 en | ~500 | | 🇷🇴 ro | ~290 |
| 🇫🇷 fr | ~480 | | 🇳🇱 nl | ~285 |
| 🇪🇸 es | ~430 | | 🇹🇷 tr | ~280 |
| 🇮🇹 it | ~360 | | 🇺🇦 uk | ~280 |
| 🇩🇪 de | ~360 | | 🇵🇱 pl | ~270 |
| 🇵🇹 pt | ~350 | | 🇷🇺 ru | ~260 |
| 🇸🇪 sv | ~170 | | 🇳🇴 no | ~170 |
| 🇭🇺 hu | ~170 | | 🇬🇷 el | ~170 |
| 🇩🇰 da | ~170 | | 🇨🇿 cs | ~170 |

**Total:** ~5,000+ unique articles (13,000+ including all pairs)

---

## 🔧 Files to Update for SEO Fixes

| Fix | File(s) |
|-----|---------|
| € currency | `blog/src/components/CTA.astro` |
| Internal linking | `blog/src/layouts/ArticleLayout.astro` |
| Meta descriptions | Supabase `blog_articles` table |
| 404 fixes | Check slugs in Supabase |

---

## 📅 Progress Log

### February 21, 2026
- Full SEO audit (60+ articles via sub-agents)
- Identified € currency bug, weak internal linking
- Competitive analysis: Coupling dominates "couples language app"
- GSC shows 702 indexed, 12k impressions, 247 clicks

### January 22, 2026
- Added 3 native languages (RU, PL, TR)
- Total pages: 2,741
- Total images: 960
- UI fully localized for 9 native languages

### January 9, 2026
- Built content generation CLI
- Published wedding phrases, compliments articles
- Configured Glif MCP for image generation

---

*This file syncs with TODO.md — keep them aligned.*
