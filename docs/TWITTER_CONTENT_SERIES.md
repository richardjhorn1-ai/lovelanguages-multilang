# Love Languages Twitter Content Series

**Created:** February 14, 2026
**Account:** @lovelanguagesio (0 followers)
**Strategy:** 7 threads over 2 weeks, each targeting a different audience

## Content Calendar

| # | Thread | Best Audience | Suggested Date |
|---|--------|---------------|----------------|
| 1 | Launch / Valentine's Day | Everyone | Feb 14 |
| 2 | SEO, GEO & AEO | Marketers, SEO folks | Feb 19 |
| 3 | Love Log (vocabulary extraction) | Product builders | Feb 24 |
| 4 | Mobile & Desktop Design | Frontend devs | Feb 26 |
| 5 | Transcription & Translation | AI/ML devs | Feb 21 |
| 6 | 5,000+ Article Blog System | Indie hackers | Feb 17 |
| 7 | Vercel & Hosting Limits | Web devs, infra | Feb 28 |

**Tips:**
- Quote-tweet Thread 1 from each future thread ("two weeks ago I launched Love Languages -- here's how we built the blog system behind it")
- Tag relevant accounts where natural -- @AstroJS, @vercel, @GladiaAI when referencing their tech
- Thread #6 (blog system) has the most viral potential for indie hacker Twitter -- consider posting it early
- Thread #5 (dedup story) has the best narrative arc -- "70 lines replaced by 15" is a great punchline
- No hashtags intentionally -- they look desperate on a first post. Let the story do the work.

---

## THREAD 1: THE LAUNCH (Valentine's Day)

**1/9**

This Valentine's Day, I'm launching the app I built to talk to my girlfriend's family.

Love Languages -- a language learning app for couples. 18 languages. 306 possible pairs. Built in 2 months. 667 commits. Still waiting on Apple.

Here's the story.

**2/9**

It started because I couldn't keep up at dinner.

My girlfriend is Polish. Her family speaks Polish. I'd sit there smiling and nodding, understanding nothing.

So I hacked together a terrible chatbot in Google AI Studio. Just me, English to Polish, asking "how do I say pass the salt."

**3/9**

But it worked. I was actually learning. The AI could explain grammar in context, correct my mistakes, teach me phrases I'd actually use -- like how to tell her parents I loved their cooking.

That's when I thought: what if this wasn't just for me?

**4/9**

So I forked the whole thing and rebuilt it from scratch.

The old app was hardcoded Polish everywhere. Variable names literally called `polish` and `english`. One language pair. One user.

The new version? 18 languages. Any can be native, any can be target. A Spanish speaker learning Turkish. A French speaker learning Greek. 306 possible pairs.

**5/9**

The multi-language transformation touched everything.

13 database tables got a new language_code column. 18 API endpoints rewritten. 800+ UI strings internationalized across 50+ components. The type system overhauled -- `polish` became `word`, `english` became `translation`.

All in about 3 days.

**6/9**

What we built:

- AI chat (ask, learn, coach modes)
- Real-time voice conversations with Gemini Live
- A "Listen Mode" that transcribes conversations around you
- 7 game modes (flashcards, quick fire, verb dojo)
- A couples system -- one teaches, one learns
- Offline mode with background sync
- 5,000+ SEO blog articles

**7/9**

The bugs were legendary.

React stale closures breaking every game timer. MDX syntax errors multiplied by 18 languages. A 10-hour debug session branch accidentally merged to production. 4,036 broken internal links across 1,813 blog articles.

70+ issues documented and resolved.

**8/9**

The best feature is the tutor role.

Your partner -- the native speaker -- becomes your teacher. They get XP for helping you. They can see which words you're stuck on. They send you challenges and love notes.

You're not just learning a language. You're learning *their* language. Together.

**9/9**

Today it's Valentine's Day 2026. The app is submitted to the App Store and we're still in review. (Come on, Apple. Read the room.)

This is tweet one from a brand new account with zero followers. If you're in a multilingual relationship and this resonates -- we built this for you.

lovelanguages.io

---

## THREAD 2: SEO, GEO & AEO -- HOW WE DID IT

**1/8**

We built 5,000+ blog articles and optimized them for Google, ChatGPT, and Alexa simultaneously.

SEO + GEO (Generative Engine Optimization) + AEO (Answer Engine Optimization) for a language learning app.

Here's how we did all three.

**2/8**

SEO foundation: every article has JSON-LD structured data.

Not just BlogPosting schema -- we auto-detect HowTo schema from titles ("How to say I love you in Polish"), auto-generate FAQPage schema from categories, and add BreadcrumbList with 5-level hierarchy.

Google rich snippets for free.

**3/8**

The big bet: GEO (Generative Engine Optimization).

We track when users arrive from ChatGPT, Claude, Perplexity, Gemini, and Copilot. Separate GA4 events, separate user properties, separate cohort analysis.

We have an llms.txt and llms-full.txt in our robots.txt so AI crawlers can index us directly.

**4/8**

AEO: we mark every VocabCard and PhraseOfDay component with speakable schema.

When Google Assistant or Alexa wants to answer "how do you say I love you in Polish" -- our content is structured for text-to-speech readback. CSS selectors mapped directly to JSON-LD speakable specification.

**5/8**

The content itself: AI-generated articles with Claude, stored in Supabase, rendered with Astro SSR.

Each article includes interactive VocabCards, PhraseOfDay components, CultureTips, and ConjugationTables. Not blog posts -- learning tools that happen to be indexed.

**6/8**

Multi-language SEO is a different beast.

18 native languages x 17 target languages = hreflang tags pointing to every language variant of every article. og:locale mapping for each. Canonical URLs enforced with trailing slashes.

One wrong hreflang and Google ignores your entire site.

**7/8**

Comparison pages were our conversion play.

"Love Languages vs Duolingo" and "Love Languages vs Babbel" -- localized into all 18 languages. Side-by-side feature tables. The differentiator: we're built for couples, they're built for individuals.

**8/8**

Current results: 2,741 pages indexed. AI referral tracking active. Speakable schema on every article.

The playbook: don't just optimize for Google. Optimize for the AI that's going to answer the question before your user ever reaches Google.

---

## THREAD 3: MAKING THE LOVE LOG WORK

**1/7**

The hardest feature in our language app isn't chat or games.

It's extracting vocabulary from conversations and making it actually useful across 18 languages.

We call it the Love Log. Here's what it took.

**2/7**

The problem: when you chat with AI about Polish grammar, it mentions dozens of words. How do you automatically extract them, store the correct grammatical forms, and make them practiceble?

Polish has 7 cases and gendered past tense. German has 4 cases and 3 genders. English barely conjugates. One system handles all of them.

**3/7**

Every language gets a grammar config:

hasConjugation, hasGender, genderTypes, conjugationPersons, availableTenses, tenseStructures.

Polish past tense is gendered (he went vs she went are different words). We generate dynamic Gemini schemas per language -- normalized keys like first_singular, second_singular across all 18.

**4/7**

The extraction pipeline: scan chat messages, send to Gemini with a language-aware prompt, get back structured JSON with word, translation, word_type, gender, plural, conjugations, adjective forms.

If Gemini skips conjugations for some verbs? We detect it and make a follow-up call to backfill. Automatic recovery.

**5/7**

Mastery system: 5 correct answers in a row = word mastered.

Get one wrong? Streak resets to zero. No partial credit.

When you master a word: haptic feedback, celebration animation, sound effect, 1 XP. The whole stack celebrates with you.

**6/7**

The bugs were sneaky. Our database had columns called correct_attempts and total_attempts, but our code was writing to success_count and fail_count.

No errors. No crashes. Just... silently losing all your practice progress. We only caught it by checking Supabase directly.

**7/7**

And it's all offline too.

IndexedDB caches your vocabulary. Practice scores queue in a sync buffer. Come back online and it pushes everything to Supabase.

Your Love Log works on the subway, on a plane, at dinner with the in-laws.

---

## THREAD 4: MOBILE & DESKTOP DESIGN

**1/7**

Building a React web app that works on desktop, mobile web, AND iOS native (via Capacitor).

Three form factors. One codebase. Hundreds of CSS edge cases.

Here's what we learned.

**2/7**

PersistentTabs: we don't unmount tabs. Ever.

Chat, Dictionary, Games, and Progress stay mounted with CSS display:none. Tab switches are instant. State survives. Event listeners in hidden tabs still fire.

Tradeoff: everything initializes on first load. Worth it for the UX.

**3/7**

iOS nearly broke us.

100vh is a lie (address bar). We use 100dvh.
Input focus auto-zooms below 16px font. We force 16px.
Safe areas for notch and Dynamic Island need env(safe-area-inset-top).
Momentum scrolling needs -webkit-overflow-scrolling: touch.
Touch-action: pan-y on scrollables, none globally.

**4/7**

Theme system: 6 accent colors, 3 dark mode styles, 3 font presets, 3 font sizes.

Rose, Blush, Lavender, Wine, Teal, Honey.
Midnight, Charcoal, True Black.
Classic (Nunito), Modern (Montserrat), Playful (Quicksand).

All stored as CSS variables, synced to Supabase profile.

**5/7**

Responsive text scale: we don't just use Tailwind breakpoints.

We define 7 text sizes (micro through heading) in our theme service, with separate mobile and desktop values. A media query listener swaps scales on resize. Every component reads from CSS variables.

**6/7**

Haptics and sound design add more than you'd think.

8 haptic patterns: correct, incorrect, perfect, tier-up, xp-gain, notification, selection, button.
10 sound effects preloaded on first interaction.

Native only (Capacitor). Silently fails on web. Toggleable in settings.

**7/7**

The Capacitor bridge is minimal.

We load from https://lovelanguages.io inside a WKWebView. Navigation limited to app-bound domains. Link previews disabled. Content mode forced to mobile.

It's a web app that feels native because we sweated the 50 things that make web apps feel bad.

---

## THREAD 5: TRANSCRIPTION & TRANSLATION FOR MULTILINGUAL APPS

**1/7**

Our app has three voice features:

1. Voice chat with Gemini Live API
2. Listen Mode (passive transcription with Gladia)
3. Text-to-speech (Google Cloud TTS)

Making them all work across 18 languages nearly killed us.

**2/7**

Gemini Live API: bidirectional voice conversation in v1alpha.

4 modes with different system prompts:
- Ask: speaks native, introduces target words
- Learn: structured lesson, one word at a time
- Coach: tutor assistance, 100% native language
- Conversation: full immersion role-play

Audio at 16kHz in, 24kHz out. PCM over WebSocket.

**3/7**

Listen Mode: you set your phone down near a conversation and it transcribes + translates in real time.

Gladia's Solaria-1 model with code_switching enabled. Both languages detected simultaneously. Real-time translation piped back to the UI.

One problem: deduplication.

**4/7**

Gladia sends the same utterance multiple times. Partial, then final, then refined.

With code-switching on, it gets worse: "Bardzo lubie ostrosc" (Polish) also appears as "But so Lu Bay ostrich" (garbled English phonetic guess).

We wrote 70 lines of fuzzy matching heuristics. Time windows, word overlap, length ratios. All failed.

**5/7**

The fix was embarrassingly simple.

Gladia sends a stable utterance ID (data.id) across all partial/final/refined messages. Same ID = same utterance. Replace old with new. Done.

70 lines of heuristics replaced with 15 lines of ID matching. Then Gemini cleans up any remaining garble as a safety net.

**6/7**

TTS is language-specific and cached.

Each of our 18 languages maps to a Google Cloud TTS voice. Speaking rate 0.9 (slightly slower for learning). Audio cached per-user with 1-hour signed URLs.

Fallback: browser's native Web Speech API for unauthenticated users.

**7/7**

The real challenge is language mismatch.

Your UI is in English. You're learning Polish. The AI speaks Polish to teach you but explains in English. Gladia transcribes both. Translations appear inline.

Three languages in one conversation. The system prompt is the only thing keeping it coherent.

---

## THREAD 6: BUILDING A 5,000+ ARTICLE BLOG SYSTEM

**1/8**

We have 5,147 blog articles. AI-generated. Across 18 languages.

If you think generating them was the hard part, you'd be wrong.

The hard part was fixing them. Here's the story.

**2/8**

Tech stack: Astro SSR + Supabase + Claude API.

Articles generated via Claude, stored in a PostgreSQL blog_articles table with native_lang, target_lang, and slug as a composite unique key.

Rendered at request time. No massive static build. Articles queryable by language pair, category, difficulty.

**3/8**

The migration from static MDX to Supabase was necessary because static builds don't scale to 5,000 pages.

But moving 1,952 articles meant every generic slug like "greetings-and-farewells" had to become "spanish-greetings-and-farewells" to avoid cross-language collisions.

A migration script renamed them all.

**4/8**

Then we found the links.

4,036 internal links pointing to articles that don't exist. AI-generated content linking to slugs it made up.

"/learn/en/es/essential-phrases-for-couples/" -- doesn't exist.
The real slug is "/learn/en/es/spanish-essential-phrases-for-couples/".

A fuzzy matching script recovered 3,886. The other 150 fell back to language hubs.

**5/8**

MDX syntax errors at scale are a nightmare.

One bad pattern x 18 languages = 18 broken builds.

`<3` breaks JSX. `<br>` needs to be `<br />`. Quote mismatches in YAML frontmatter. Wrong component names.

We built 17 fix scripts. Some mechanical (regex), some AI-powered (Gemini validates pronunciation, detects wrong-language words).

**6/8**

The AI fix pipeline runs in stages:

Phase 1a: Deterministic fixes (malformed props, HTML entities, empty components)
Phase 1b: AI fixes (bad pronunciations, English examples in non-English articles, truncated content)

25 parallel requests. Retry with exponential backoff. Validation counts components before and after.

**7/8**

Custom MDX components make articles interactive, not just text:

VocabCard: word + translation + pronunciation + example
PhraseOfDay: featured phrase with context
CultureTip: cultural notes for couples
ConjugationTable: verb forms

Each with backwards compatibility -- old `polish`/`english` props still work alongside new `word`/`translation`.

**8/8**

Lesson learned: AI content generation is maybe 20% of the work.

The other 80% is validation, fixing, migrating, redirect mapping, slug normalization, link recovery, and building the scripts to do it all at scale without losing data.

Don't ship 5,000 articles. Ship 5,000 *correct* articles.

---

## THREAD 7: STATIC PAGES, MEMORY LIMITS & VERCEL

**1/7**

Vercel nearly ran out of memory building our blog.

5,000+ articles. 170+ redirect rules. A build script that chains React, Astro, and sitemap generation.

Here's what breaks when your side project outgrows the defaults.

**2/7**

First thing in our vercel.json:

`"NODE_OPTIONS": "--max-old-space-size=8192"`

8GB heap. Because compiling 5,000 MDX articles, validating frontmatter, and generating sitemaps in one build was killing the default 1.7GB.

**3/7**

SSR vs Static nearly cost us a weekend.

Astro's hybrid mode has different rules. Redirect-only pages MUST have `export const prerender = true`. Dynamic routes fetching from DB should NOT prerender.

Pages that worked locally would 404 on Vercel. We documented it as Pattern 2 in our troubleshooting guide.

**4/7**

Serverless functions can't import from sibling directories.

Vercel bundles each API function independently. Our api/chat.ts can import from utils/ but NOT from api/helper.ts.

We accepted the duplication. Shared logic goes in utils/. Each function gets its own bundled copy. Attempted refactoring, decided it wasn't worth the custom build step.

**5/7**

Our build command is one line that does everything:

vite build (React app)
cd blog && npm install && npm run build (Astro blog)
Copy sitemaps to .vercel/output/static/
Merge React dist into Vercel output

Two frameworks. One deployment. One prayer.

**6/7**

The redirect file is 2,100+ lines of vercel.json.

Every old Polish-only URL maps to the new multi-language structure. Spanish articles that were generated with Spanish slugs redirect to English slugs.

/learn/es/de/100-palabras-mas-comunes-en-aleman/
redirects to
/learn/es/de/100-common-german-words/

301 permanent. Don't lose the PageRank.

**7/7**

Biggest lesson: each push triggers a Vercel build.

When we merged a 10-hour debug session branch with 50+ changes directly to main, it took 3 broken deployments to stabilize.

Now: ONE branch per feature. Batch commits. Push when ready. Test on preview before main. Every time.
