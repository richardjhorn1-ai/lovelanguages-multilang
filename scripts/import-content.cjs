#!/usr/bin/env node

/**
 * Content Import Script for Love Languages Blog
 *
 * Usage: npm run import-content
 *
 * This script:
 * 1. Reads JSON article files from content/incoming/articles/
 * 2. Converts them to MDX files in content/
 * 3. Moves images from content/incoming/images/ to public/blog/
 * 4. Updates content/articles.ts with new article metadata
 * 5. Updates public/sitemap.xml with new URLs
 * 6. Cleans up the incoming folder
 */

const fs = require('fs');
const path = require('path');

// Paths
const INCOMING_ARTICLES = path.join(__dirname, '../content/incoming/articles');
const INCOMING_IMAGES = path.join(__dirname, '../content/incoming/images');
const CONTENT_DIR = path.join(__dirname, '../content');
const PUBLIC_BLOG = path.join(__dirname, '../public/blog');
const ARTICLES_TS = path.join(__dirname, '../content/articles.ts');
const SITEMAP = path.join(__dirname, '../public/sitemap.xml');

// Valid enums
const VALID_CATEGORIES = ['phrases', 'vocabulary', 'grammar', 'culture', 'situations'];
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

// Colors for console output
const colors = {
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  blue: (t) => `\x1b[34m${t}\x1b[0m`,
  dim: (t) => `\x1b[2m${t}\x1b[0m`,
};

console.log('\n' + colors.blue('💕 Love Languages Content Importer') + '\n');

// Ensure directories exist
[INCOMING_ARTICLES, INCOMING_IMAGES, PUBLIC_BLOG].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Get all JSON files
const jsonFiles = fs.readdirSync(INCOMING_ARTICLES)
  .filter(f => f.endsWith('.json'));

if (jsonFiles.length === 0) {
  console.log(colors.yellow('No JSON files found in content/incoming/articles/'));
  console.log(colors.dim('Drop your generated JSON files there and run this again.\n'));
  process.exit(0);
}

console.log(`Found ${colors.green(jsonFiles.length)} article(s) to import:\n`);

// Track results
const results = { success: [], failed: [] };
const newArticles = [];

// Process each JSON file
for (const file of jsonFiles) {
  const slug = file.replace('.json', '');
  const filePath = path.join(INCOMING_ARTICLES, file);

  try {
    console.log(`  ${colors.blue('→')} Processing ${file}...`);

    // Read and parse JSON
    const raw = fs.readFileSync(filePath, 'utf8');
    const article = JSON.parse(raw);

    // Validate required fields
    const errors = validateArticle(article, slug);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    // Check for image
    if (article.meta.image) {
      const imgSrc = path.join(INCOMING_IMAGES, article.meta.image);
      const imgDest = path.join(PUBLIC_BLOG, article.meta.image);

      if (fs.existsSync(imgSrc)) {
        fs.copyFileSync(imgSrc, imgDest);
        console.log(`    ${colors.dim('Copied image:')} ${article.meta.image}`);
      } else {
        console.log(`    ${colors.yellow('⚠ Image not found:')} ${article.meta.image}`);
      }
    }

    // Generate MDX
    const mdx = generateMDX(article);
    const mdxPath = path.join(CONTENT_DIR, `${slug}.mdx`);
    fs.writeFileSync(mdxPath, mdx);
    console.log(`    ${colors.dim('Created MDX:')} ${slug}.mdx`);

    // Track for articles.ts update
    newArticles.push({
      slug,
      ...article.meta,
      date: new Date().toISOString().split('T')[0],
    });

    // Clean up JSON file
    fs.unlinkSync(filePath);

    results.success.push(slug);
    console.log(`    ${colors.green('✓')} Success\n`);

  } catch (err) {
    results.failed.push({ slug, error: err.message });
    console.log(`    ${colors.red('✗')} Failed: ${err.message}\n`);
  }
}

// Update articles.ts
if (newArticles.length > 0) {
  updateArticlesRegistry(newArticles);
  console.log(colors.green('Updated content/articles.ts'));
}

// Update sitemap
if (newArticles.length > 0) {
  updateSitemap(newArticles);
  console.log(colors.green('Updated public/sitemap.xml'));
}

// Clean up used images
const usedImages = newArticles.map(a => a.image).filter(Boolean);
usedImages.forEach(img => {
  const imgPath = path.join(INCOMING_IMAGES, img);
  if (fs.existsSync(imgPath)) {
    fs.unlinkSync(imgPath);
  }
});

// Summary
console.log('\n' + colors.blue('─'.repeat(40)));
console.log(`\n${colors.green('✓')} Imported: ${results.success.length}`);
if (results.failed.length > 0) {
  console.log(`${colors.red('✗')} Failed: ${results.failed.length}`);
  results.failed.forEach(f => {
    console.log(`  - ${f.slug}: ${f.error}`);
  });
}
console.log('');

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function validateArticle(article, slug) {
  const errors = [];

  if (!article.meta) errors.push('Missing "meta" object');
  if (!article.content) errors.push('Missing "content" array');

  if (article.meta) {
    if (!article.meta.title) errors.push('Missing meta.title');
    if (!article.meta.description) errors.push('Missing meta.description');
    if (!article.meta.category) errors.push('Missing meta.category');
    if (!article.meta.difficulty) errors.push('Missing meta.difficulty');
    if (!article.meta.readTime) errors.push('Missing meta.readTime');

    if (article.meta.category && !VALID_CATEGORIES.includes(article.meta.category)) {
      errors.push(`Invalid category: ${article.meta.category}. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }
    if (article.meta.difficulty && !VALID_DIFFICULTIES.includes(article.meta.difficulty)) {
      errors.push(`Invalid difficulty: ${article.meta.difficulty}. Must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
    }
  }

  // Check if slug already exists
  const existingMdx = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (fs.existsSync(existingMdx)) {
    errors.push(`Article already exists: ${slug}.mdx (delete it first to replace)`);
  }

  return errors;
}

function generateMDX(article) {
  const lines = [];

  for (const block of article.content) {
    switch (block.type) {
      case 'paragraph':
        lines.push(block.text);
        lines.push('');
        break;

      case 'heading':
        const prefix = '#'.repeat(block.level || 2);
        lines.push(`${prefix} ${block.text}`);
        lines.push('');
        break;

      case 'phrase':
        lines.push(`<PhraseOfDay`);
        lines.push(`  polish="${escapeJsx(block.polish)}"`);
        lines.push(`  english="${escapeJsx(block.english)}"`);
        lines.push(`  pronunciation="${escapeJsx(block.pronunciation)}"`);
        if (block.context) lines.push(`  context="${escapeJsx(block.context)}"`);
        lines.push('/>');
        lines.push('');
        break;

      case 'vocab':
        lines.push(`<VocabCard`);
        lines.push(`  polish="${escapeJsx(block.polish)}"`);
        lines.push(`  english="${escapeJsx(block.english)}"`);
        if (block.pronunciation) lines.push(`  pronunciation="${escapeJsx(block.pronunciation)}"`);
        if (block.example) lines.push(`  example="${escapeJsx(block.example)}"`);
        lines.push('/>');
        lines.push('');
        break;

      case 'conjugation':
        lines.push(`<ConjugationTable`);
        lines.push(`  verb="${escapeJsx(block.verb)}"`);
        lines.push(`  meaning="${escapeJsx(block.meaning)}"`);
        lines.push(`  conjugations={${JSON.stringify(block.forms)}}`);
        lines.push('/>');
        lines.push('');
        break;

      case 'vocabTable':
        lines.push('| ' + block.columns.join(' | ') + ' |');
        lines.push('|' + block.columns.map(() => '---').join('|') + '|');
        for (const row of block.rows) {
          lines.push('| ' + row.join(' | ') + ' |');
        }
        lines.push('');
        break;

      case 'culture':
        lines.push(`<CultureTip title="${escapeJsx(block.title || 'Cultural Tip')}">`);
        lines.push(block.text);
        lines.push('</CultureTip>');
        lines.push('');
        break;

      case 'quote':
        lines.push(`> ${block.text}`);
        lines.push('');
        break;

      case 'list':
        const marker = block.style === 'numbered' ? '1.' : '-';
        for (const item of block.items) {
          lines.push(`${marker} ${item}`);
        }
        lines.push('');
        break;

      case 'divider':
        lines.push('---');
        lines.push('');
        break;

      case 'cta':
        lines.push('<CTA');
        if (block.heading) lines.push(`  text="${escapeJsx(block.heading)}"`);
        if (block.buttonText) lines.push(`  buttonText="${escapeJsx(block.buttonText)}"`);
        lines.push('/>');
        lines.push('');
        break;

      case 'image':
        lines.push(`![${block.alt || ''}](/blog/${block.src})`);
        if (block.caption) lines.push(`*${block.caption}*`);
        lines.push('');
        break;

      default:
        console.log(`    ${colors.yellow('⚠ Unknown block type:')} ${block.type}`);
    }
  }

  return lines.join('\n');
}

function escapeJsx(str) {
  if (!str) return '';
  return str
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, ' ');
}

function escapeForSingleQuote(str) {
  if (!str) return '';
  return str
    .replace(/'/g, '')  // Remove single quotes for cleaner descriptions
    .replace(/"/g, '')  // Remove double quotes too
    .replace(/\n/g, ' ');
}

function updateArticlesRegistry(newArticles) {
  // Read existing file
  let content = fs.readFileSync(ARTICLES_TS, 'utf8');

  // Find the articles array
  const arrayStart = content.indexOf('export const articles: ArticleMeta[] = [');
  const arrayEnd = content.indexOf('];', arrayStart);

  if (arrayStart === -1 || arrayEnd === -1) {
    console.log(colors.yellow('⚠ Could not parse articles.ts - manual update needed'));
    return;
  }

  // Extract existing articles
  const existingArrayContent = content.slice(
    arrayStart + 'export const articles: ArticleMeta[] = ['.length,
    arrayEnd
  );

  // Generate new entries
  const newEntries = newArticles.map(a => `  {
    slug: '${a.slug}',
    title: '${escapeForSingleQuote(a.title)}',
    description: '${escapeForSingleQuote(a.description)}',
    category: '${a.category}',
    difficulty: '${a.difficulty}',
    readTime: ${a.readTime},${a.image ? `
    image: '/blog/${a.image}',` : ''}
    date: '${a.date}',
  }`).join(',\n');

  // Combine
  let newArrayContent = existingArrayContent.trim();
  if (newArrayContent && !newArrayContent.endsWith(',')) {
    newArrayContent += ',';
  }
  newArrayContent += '\n' + newEntries + '\n';

  // Write back
  const newContent = content.slice(0, arrayStart + 'export const articles: ArticleMeta[] = ['.length) +
    newArrayContent +
    content.slice(arrayEnd);

  fs.writeFileSync(ARTICLES_TS, newContent);
}

function updateSitemap(newArticles) {
  let sitemap = fs.readFileSync(SITEMAP, 'utf8');
  const today = new Date().toISOString().split('T')[0];

  // Find closing tag
  const closeTag = '</urlset>';
  const insertPoint = sitemap.indexOf(closeTag);

  if (insertPoint === -1) {
    console.log(colors.yellow('⚠ Could not parse sitemap.xml - manual update needed'));
    return;
  }

  // Generate new entries
  const newEntries = newArticles.map(a => `  <url>
    <loc>https://lovelanguages.io/#/learn/${a.slug}</loc>
    <lastmod>${today}</lastmod>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
  </url>`).join('\n');

  // Insert before closing tag
  const newSitemap = sitemap.slice(0, insertPoint) + newEntries + '\n' + closeTag + '\n';

  fs.writeFileSync(SITEMAP, newSitemap);
}
