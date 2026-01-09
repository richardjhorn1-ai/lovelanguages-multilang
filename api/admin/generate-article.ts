/**
 * Admin-only endpoint for generating SEO-optimized Polish learning blog articles.
 * Uses Claude API to create content with proper MDX components.
 *
 * POST /api/admin/generate-article
 * Body: { topic: string, category?: string, difficulty?: string }
 * Returns: { slug, frontmatter, content, imagePrompt }
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  setCorsHeaders,
  verifyAdminAuth,
  createServiceClient
} from '../../utils/api-middleware.js';

// Article frontmatter schema
interface ArticleFrontmatter {
  title: string;
  description: string;
  category: 'phrases' | 'vocabulary' | 'grammar' | 'culture' | 'situations';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: number;
  tags: string[];
}

interface GeneratedArticle {
  slug: string;
  frontmatter: ArticleFrontmatter;
  content: string;
  imagePrompt: string;
}

// Example article for few-shot learning
const EXAMPLE_ARTICLE = `---
title: '25 Adorable Polish Pet Names for Your Partner'
description: 'Learn the sweetest Polish terms of endearment to call your boyfriend, girlfriend, or spouse. From classic kochanie to playful misiaczek.'
category: vocabulary
difficulty: beginner
readTime: 6
date: '2026-01-09'
tags: ['pet names', 'endearment', 'vocabulary']
---
import VocabCard from '../../components/VocabCard.astro';
import CultureTip from '../../components/CultureTip.astro';
import PhraseOfDay from '../../components/PhraseOfDay.astro';
import CTA from '../../components/CTA.astro';

Polish is a language rich with affectionate expressions. Whether you're just starting to date a Polish speaker or have been together for years, using the right pet name can make your partner's heart melt.

## The Most Popular: Kochanie

<PhraseOfDay
  polish="Kochanie"
  english="Darling / Sweetheart"
  pronunciation="ko-HA-nyeh"
  context="The most universally used and always appropriate term of endearment."
/>

**Kochanie** is derived from the verb **kochać** (to love), making it literally mean "the one I love." You'll hear this everywhere in Poland - between young couples, married partners, and even parents to children.

<CultureTip title="Pronunciation Tip">
The stress in Polish almost always falls on the second-to-last syllable. So it's ko-HA-nyeh, not KO-ha-nyeh.
</CultureTip>

## Sweet & Playful Names

| Polish | Literal Meaning | Vibe |
|---|---|---|
| Misiaczek | Little teddy bear | Cute, playful |
| Kotku | Kitty | Sweet, casual |
| Słoneczko | Little sunshine | Warm, bright |
| Skarbie | Treasure | Very affectionate |
| Złotko | Little gold | Precious, dear |

<VocabCard
  polish="Misiaczek"
  english="Little teddy bear"
  pronunciation="mee-SHA-chek"
  example="Cześć misiaczku, jak się masz?"
/>

## For Your Boyfriend

- **Kochany** - beloved/dear (masculine)
- **Przystojniaku** - handsome one
- **Mój książę** - my prince
- **Tygrysie** - tiger (playful/fierce)

## For Your Girlfriend

- **Kochana** - beloved/dear (feminine)
- **Księżniczko** - princess
- **Piękna** - beautiful one
- **Aniołku** - little angel

> Pro tip: Add the diminutive suffix -ek, -ka, or -ko to almost any noun to make it sound more affectionate. Poles love diminutives!

---

<CTA
  text="Practice These With Your Partner"
  buttonText="Try It Free"
/>`;

// System prompt for Claude
const SYSTEM_PROMPT = `You are an expert Polish language educator writing SEO-optimized blog articles for "Love Languages" - an app that helps couples learn Polish together.

Your articles should be:
1. ACCURATE - Polish spelling, diacritics, and grammar must be perfect
2. EDUCATIONAL - Clear explanations with pronunciation guides in English phonetics
3. ENGAGING - Written for couples, romantic tone, practical examples
4. SEO-OPTIMIZED - Natural keyword usage, good heading structure
5. STRUCTURED - Use MDX components properly

## Available MDX Components

Always import these at the top after frontmatter:
\`\`\`
import VocabCard from '../../components/VocabCard.astro';
import ConjugationTable from '../../components/ConjugationTable.astro';
import CultureTip from '../../components/CultureTip.astro';
import PhraseOfDay from '../../components/PhraseOfDay.astro';
import CTA from '../../components/CTA.astro';
\`\`\`

### VocabCard - For individual words/phrases
\`\`\`jsx
<VocabCard
  polish="Kocham cię"
  english="I love you"
  pronunciation="KO-ham cheh"  // Optional
  example="Kocham cię najbardziej."  // Optional - full Polish sentence
/>
\`\`\`

### PhraseOfDay - Featured phrase (use 1 per article, near top)
\`\`\`jsx
<PhraseOfDay
  polish="Kochanie"
  english="Darling"
  pronunciation="ko-HA-nyeh"  // Required
  context="The most common term of endearment."  // Optional
/>
\`\`\`

### ConjugationTable - For verb conjugations
\`\`\`jsx
<ConjugationTable
  verb="Kochać"
  meaning="to love"
  conjugations={[
    { person: "I", polish: "kocham", english: "I love" },
    { person: "You (informal)", polish: "kochasz", english: "you love" },
    { person: "He/She", polish: "kocha", english: "he/she loves" },
    { person: "We", polish: "kochamy", english: "we love" },
    { person: "You (plural)", polish: "kochacie", english: "you all love" },
    { person: "They", polish: "kochają", english: "they love" }
  ]}
/>
\`\`\`

### CultureTip - Cultural insights (use 1-2 per article)
\`\`\`jsx
<CultureTip title="Did You Know?">
In Poland, saying "kocham cię" is reserved for serious relationships...
</CultureTip>
\`\`\`

### CTA - Call to action (always at the end)
\`\`\`jsx
<CTA
  text="Ready to practice these phrases?"
  buttonText="Try It Free"
/>
\`\`\`

## Markdown Elements You Can Use
- **Bold** for Polish words in flowing text
- Tables with | for vocabulary lists
- Blockquotes > for pro tips
- Bullet lists - for quick vocabulary lists
- ## Headings for sections
- --- horizontal rule before CTA

## Pronunciation Guide Format
Use CAPS-style phonetic English: "KO-ham cheh", "mee-SHA-chek"
Stress the capitalized syllable.

## Output Format
Return a JSON object with:
{
  "frontmatter": {
    "title": "SEO-friendly title with target keyword",
    "description": "150-160 char meta description with keywords",
    "category": "phrases|vocabulary|grammar|culture|situations",
    "difficulty": "beginner|intermediate|advanced",
    "readTime": 5,  // estimated minutes
    "tags": ["keyword1", "keyword2", "keyword3"]
  },
  "content": "Full MDX content starting with imports...",
  "imagePrompt": "Detailed prompt for generating a hero image"
}`;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default async function handler(req: any, res: any) {
  // CORS handling
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  // Method validation
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Admin authentication
    const admin = await verifyAdminAuth(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    if (!admin.isAdmin) {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    // Validate request body
    const { topic, category, difficulty } = req.body || {};
    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      return res.status(400).json({ error: 'Topic is required (minimum 3 characters)' });
    }

    // Check for Anthropic API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({ apiKey });

    // Build the user prompt
    let userPrompt = `Write a comprehensive Polish learning article about: "${topic.trim()}"

Target audience: English-speaking couples learning Polish together.
Aim for 1200-1800 words of valuable content.`;

    if (category) {
      userPrompt += `\n\nCategory hint: ${category}`;
    }
    if (difficulty) {
      userPrompt += `\nDifficulty level: ${difficulty}`;
    }

    userPrompt += `

Here's an example of a well-structured article for reference:

${EXAMPLE_ARTICLE}

Now generate a NEW article about "${topic.trim()}" following the same format and quality standards.
Return your response as a valid JSON object with frontmatter, content, and imagePrompt fields.`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ],
      system: SYSTEM_PROMPT
    });

    // Extract text content
    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return res.status(502).json({ error: 'Invalid response from Claude API' });
    }

    // Parse JSON response
    let articleData: { frontmatter: ArticleFrontmatter; content: string; imagePrompt: string };
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = textContent.text;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      articleData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('[generate-article] Failed to parse Claude response:', parseError);
      return res.status(502).json({
        error: 'Failed to parse article structure',
        raw: textContent.text.slice(0, 500)
      });
    }

    // Generate slug from title
    const slug = slugify(articleData.frontmatter.title);

    // Track generation in database
    const supabase = createServiceClient();
    if (supabase) {
      try {
        await supabase.from('article_generations').insert({
          slug,
          topic: topic.trim(),
          category: articleData.frontmatter.category,
          difficulty: articleData.frontmatter.difficulty,
          generated_by: admin.userId,
          word_count: articleData.content.split(/\s+/).length,
          has_image: false
        });
      } catch (dbError: any) {
        // Non-blocking - log but don't fail
        console.error('[generate-article] Failed to track generation:', dbError.message);
      }
    }

    // Return generated article
    const response: GeneratedArticle = {
      slug,
      frontmatter: articleData.frontmatter,
      content: articleData.content,
      imagePrompt: articleData.imagePrompt
    };

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('[generate-article] Error:', error);

    // Handle Anthropic API errors
    if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limited. Please try again later.' });
    }

    return res.status(500).json({
      error: 'Failed to generate article. Please try again.',
      details: error.message
    });
  }
}
