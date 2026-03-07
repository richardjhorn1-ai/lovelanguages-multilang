# Love Languages — Operations Hub

> Central reference for all internal tools, services, and access points.
> Updated by Cupid 💘 (AI COO). Last update: 2026-03-03.

---

## 🏠 The Product

| | |
|---|---|
| **App** | https://www.lovelanguages.io |
| **Repo** | `~/lovelanguages-multilang` (branch: `main`) |
| **Stack** | React + Vite + Astro (blog) + Supabase + Gemini AI |
| **Hosting** | Vercel (app + blog), Supabase (database + auth) |
| **iOS** | Capacitor, Xcode 26 beta, Apple Developer account |

---

## 👥 The Team

| Name | Role | Contact | AI Agent |
|------|------|---------|----------|
| **Richard** | CEO | Telegram @CrustyakaRichard | `main` (Cupid 💘) |
| **Misia** | CCO | Telegram 7224437785 | Direct with main |
| **Le Phan** | Intern | Telegram 8244961645 | `intern` (Cupid Jr 💘) |
| **Erik** | Marketing | Telegram 751246004 | `erik` (Cupid for Erik) |
| **Cupid** | AI COO | Via Telegram bot | Runs on Mac mini 24/7 |

---

## 📊 Analytics & Monitoring

### Dashboard
- **URL:** http://localhost:3333 (Mac mini local network)
- **What:** Real-time overview of all analytics — GA4, GSC, PostHog, Bing, Supabase
- **Auto-refreshes** every 5 minutes
- **Data collected** at 4am + 7am daily, morning report at 10am

### Data Sources

| Source | What It Tells Us | Access |
|--------|-----------------|--------|
| **GA4** | Traffic, sessions, users, bounce rates, funnels, engagement | API via OAuth (`secrets/token.json`) |
| **Google Search Console** | Search queries, impressions, clicks, keyword positions | API via OAuth |
| **PostHog** | Per-user journeys, geo (city-level), rage clicks, custom events | HogQL API (`POSTHOG_API_KEY`) |
| **Bing Webmaster** | Bing search traffic, indexed pages, crawl stats | API key in `secrets/check_bing.py` |
| **Supabase** | User profiles, signups, game sessions, onboarding data | Service key (READ ONLY!) |

### Scripts
```bash
# Collect all analytics data
python3.11 ~/clawd/scripts/analytics_collector.py

# Generate formatted report
python3.11 ~/clawd/scripts/analytics_report.py

# Quick GA4 check
python3.11 ~/clawd/secrets/check_ga4.py --property 521363300 --brief

# GSC keywords
python3.11 ~/clawd/secrets/check_gsc.py

# Bing stats
python3.11 ~/clawd/secrets/check_bing.py --all
```

### Automated Jobs (Cron)
| Time | Job | What |
|------|-----|------|
| 4am, 7am | `analytics-collect-overnight` | Pull fresh data from all sources |
| 9am | `daily-gsc-indexing` | Submit up to 200 URLs to Google Indexing API |
| 10am | `daily-seo-standup` | Morning analytics report to Richard |
| Every 2h (8am-10pm) | `heartbeat-check` | Check for urgent items |

---

## 🔧 Internal Tools

### Notion
- **Workspace:** Love Languages team
- **Used by:** Misia, Le, Erik
- **Cupid access:** Full read/write via internal integration
- **Key databases:** To Do Lists, DMs (influencer outreach), Marketing Strategy, Content

### Google Drive
- **Status:** OAuth token exists, Drive scope pending
- **Planned:** Generate reports/docs → store in Drive → link in Notion

### Email (Gmail)
```bash
gmail-send --from "richard@lovelanguages.io" --to "..." --subject "..." --body "..."
```

### Supabase
- **Project:** `iiusoobuoxurysrhqptx` (LoveLanguages-Multilanguage)
- **⚠️ READ ONLY** — never write without Richard's explicit approval
- **Tables:** profiles, game_sessions, analytics_events, blog_articles, chats, messages, word_scores, etc.

---

## 🚀 Deployment

### Vercel
- **Project:** lovelanguages-multilang
- **Auto-deploy:** Push to `main` → builds → deploys
- **Preview:** Every PR gets a preview URL
- **Env vars:** Managed in Vercel dashboard

### iOS (TestFlight)
- **Xcode:** Version 26 beta (iOS 26.2 simulators)
- **Simulators:** iPhone 17 Pro, 17 Pro Max, iPhone Air, iPhone 16e
- **Build:** `npm run build && npx cap sync ios && npx cap open ios`
- **Signing:** Apple Developer account (com.lovelanguages.app)

---

## 🔑 Secrets & Access

All secrets live in `~/clawd/secrets/` on the Mac mini. Never commit these.

| Secret | Location | Purpose |
|--------|----------|---------|
| Google OAuth | `secrets/token.json` | GA4, GSC, Gmail, Calendar, Indexing API |
| Supabase service key | `secrets/.env.tokens` | Database read access |
| PostHog API key | `secrets/.env.tokens` | Analytics queries |
| Notion API key | `~/.config/notion/api_key` | Workspace access |
| Vercel token | `secrets/.env.tokens` | Deployment management |

---

## 📈 SEO & Content

### Current State
- **~12,000 articles** in Supabase across 306 language pairs
- **Google:** ~468 indexed pages, 11,490 submitted
- **Bing:** ~2,275 indexed, growing ~100/day via IndexNow
- **Indexing API:** Submitting 200 URLs/day to Google (daily cron)

### Content Strategy
- 18 native languages × 17 target languages = 306 pairs
- 7 couples-focused article types per pair (59% of all content)
- Template: en→pl is most complete (79 articles)
- Goal: replicate across all 306 pairs

---

## 💬 Communication Channels

| Channel | Who | Purpose |
|---------|-----|---------|
| **Telegram DM** | Richard ↔ Cupid | Primary comms, quick decisions |
| **Telegram DM** | Le ↔ Cupid Jr | Intern task management |
| **Telegram DM** | Erik ↔ Cupid | Marketing consultation |
| **Telegram DM** | Misia ↔ Cupid | Content, TikTok, marketing |
| **Notion** | Team | Tasks, content planning, outreach tracking |
| **GitHub** | Richard + Cupid | Code, PRs, issues |

---

## 🗓️ Daily Rhythm

| Time | What |
|------|------|
| 4am | Analytics data collection (silent) |
| 7am | Analytics data collection (silent) |
| 9am | Google Indexing API push (200 URLs) |
| 10am | Morning analytics report to Richard |
| 8am-10pm | Heartbeat checks every 2 hours |
| Ad hoc | Richard messages → Cupid acts |

---

*This document is maintained by Cupid 💘. For changes, ask Richard or update directly.*
