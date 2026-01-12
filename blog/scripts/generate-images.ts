#!/usr/bin/env npx ts-node
/**
 * Image Generator for Love Languages Blog Articles
 * Generates hero images using Glif API and updates article frontmatter
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GLIF_API_KEY = process.env.GLIF_API_KEY;
// Using a popular text-to-image glif (FLUX Schnell)
const GLIF_ID = 'cmincelxf0000l104qgpz7iaa'; // Z Image Turbo

interface ArticleInfo {
  slug: string;
  title: string;
  language: string;
  filePath: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  ru: 'Russian',
  el: 'Greek',
  tr: 'Turkish',
  sv: 'Swedish',
  no: 'Norwegian',
  da: 'Danish',
  cs: 'Czech',
  uk: 'Ukrainian',
  ro: 'Romanian',
  hu: 'Hungarian',
  pl: 'Polish',
  en: 'English',
};

async function getArticlesWithoutImages(): Promise<ArticleInfo[]> {
  const articlesDir = path.join(__dirname, '..', 'src', 'content', 'articles');
  const articles: ArticleInfo[] = [];

  // New structure: articles/[nativeLang]/[targetLang]/article.mdx
  const nativeLanguages = fs.readdirSync(articlesDir).filter(f =>
    fs.statSync(path.join(articlesDir, f)).isDirectory()
  );

  for (const nativeLang of nativeLanguages) {
    const nativeLangDir = path.join(articlesDir, nativeLang);
    const targetLanguages = fs.readdirSync(nativeLangDir).filter(f =>
      fs.statSync(path.join(nativeLangDir, f)).isDirectory()
    );

    for (const targetLang of targetLanguages) {
      const targetLangDir = path.join(nativeLangDir, targetLang);
      const files = fs.readdirSync(targetLangDir).filter(f => f.endsWith('.mdx'));

      for (const file of files) {
        const filePath = path.join(targetLangDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Check if already has image
        if (!content.match(/^image:/m)) {
          const titleMatch = content.match(/^title:\s*["'](.+?)["']/m);
          const title = titleMatch ? titleMatch[1] : file.replace('.mdx', '');

          articles.push({
            slug: file.replace('.mdx', ''),
            title,
            language: targetLang, // Use target language for image prompts
            filePath,
          });
        }
      }
    }
  }

  return articles;
}

function generateImagePrompt(article: ArticleInfo): string {
  const langName = LANGUAGE_NAMES[article.language] || article.language;

  // Create a romantic, language-learning themed prompt
  const basePrompt = `A beautiful photorealistic image of a romantic couple learning ${langName} together. `;

  let contextPrompt = '';
  const title = article.title.toLowerCase();

  if (title.includes('i love you') || title.includes('romantic')) {
    contextPrompt = 'Intimate moment, soft lighting, holding hands over a book, warm atmosphere. ';
  } else if (title.includes('pet names') || title.includes('endearment')) {
    contextPrompt = 'Playful and affectionate, laughing together, cozy living room setting. ';
  } else if (title.includes('pronunciation') || title.includes('sounds')) {
    contextPrompt = 'One partner teaching the other, focused and intimate, natural light. ';
  } else if (title.includes('family') || title.includes('parents')) {
    contextPrompt = 'Warm family gathering scene, welcoming atmosphere, cultural elements. ';
  } else if (title.includes('date night') || title.includes('restaurant')) {
    contextPrompt = 'Romantic dinner setting, candlelight, elegant atmosphere. ';
  } else if (title.includes('greetings') || title.includes('goodbye')) {
    contextPrompt = 'Morning light, coffee together, tender moment. ';
  } else if (title.includes('compliments')) {
    contextPrompt = 'Partner whispering sweetly, romantic garden or balcony setting. ';
  } else if (title.includes('verb') || title.includes('grammar')) {
    contextPrompt = 'Study session together, notebooks and coffee, focused but happy. ';
  } else if (title.includes('hard to learn') || title.includes('difficulty')) {
    contextPrompt = 'Encouraging moment, supportive partner, books around them, determination. ';
  } else {
    contextPrompt = 'Language learning session, books and notes, warm cozy atmosphere. ';
  }

  return basePrompt + contextPrompt + 'High quality, 4k, professional photography, shallow depth of field, warm color tones.';
}

async function generateImage(prompt: string, retries = 3): Promise<string | null> {
  if (!GLIF_API_KEY) {
    console.error('GLIF_API_KEY not set');
    return null;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://simple-api.glif.app', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GLIF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: GLIF_ID,
          input: prompt,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`   Attempt ${attempt}/${retries} - API error: ${error}`);
        if (attempt < retries) {
          const delay = attempt * 5000; // Exponential backoff
          console.log(`   Waiting ${delay/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        return null;
      }

      const result = await response.json();
      return result.output || null;
    } catch (error) {
      console.error(`   Attempt ${attempt}/${retries} - Error:`, error);
      if (attempt < retries) {
        const delay = attempt * 5000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return null;
    }
  }
  return null;
}

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) return false;

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (error) {
    console.error('Error downloading image:', error);
    return false;
  }
}

function updateArticleFrontmatter(filePath: string, imagePath: string): void {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Add image field after date field
  content = content.replace(
    /(date:\s*['"].+?['"])/,
    `$1\nimage: '${imagePath}'`
  );

  fs.writeFileSync(filePath, content);
}

async function main() {
  console.log('🖼️  Finding articles without images...\n');

  const articles = await getArticlesWithoutImages();
  console.log(`Found ${articles.length} articles without images\n`);

  if (articles.length === 0) {
    console.log('All articles have images!');
    return;
  }

  const imagesDir = path.join(__dirname, '..', 'public', 'blog');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;

  for (const article of articles) {
    console.log(`\n📝 Processing: ${article.title}`);
    console.log(`   Language: ${LANGUAGE_NAMES[article.language]}`);

    const prompt = generateImagePrompt(article);
    console.log(`   Prompt: ${prompt.substring(0, 80)}...`);

    const imageUrl = await generateImage(prompt);

    if (imageUrl) {
      const imagePath = path.join(imagesDir, `${article.slug}.jpg`);
      const webPath = `/blog/${article.slug}.jpg`;

      if (await downloadImage(imageUrl, imagePath)) {
        updateArticleFrontmatter(article.filePath, webPath);
        console.log(`   ✅ Image saved and frontmatter updated`);
        successCount++;
      } else {
        console.log(`   ❌ Failed to download image`);
        errorCount++;
      }
    } else {
      console.log(`   ❌ Failed to generate image`);
      errorCount++;
    }

    // Rate limiting - 5 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log(`\n\n🎉 Done!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
}

main();
