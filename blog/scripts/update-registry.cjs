const fs = require('fs');
const path = require('path');

// Get all article paths
const articlesDir = 'src/content/articles';
const articles = [];

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    // Skip template and private directories (underscore prefix)
    if (file.startsWith('_') || file.startsWith('.')) continue;

    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.mdx')) {
      articles.push(filePath);
    }
  }
}

walkDir(articlesDir);

// Parse frontmatter
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const lines = match[1].split('\n');
  const data = {};
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    // Remove quotes
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return data;
}

// Build registry
const registry = {
  lastUpdated: new Date().toISOString(),
  totalArticles: articles.length,
  languagePairs: {},
  topics: {}
};

for (const articlePath of articles) {
  const content = fs.readFileSync(articlePath, 'utf8');
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) continue;

  // Extract language pair from path (e.g., src/content/articles/en/pl/...)
  const pathParts = articlePath.replace(articlesDir + '/', '').split('/');
  if (pathParts.length >= 2) {
    const nativeLang = pathParts[0];
    const targetLang = pathParts[1];
    const pairKey = `${nativeLang}->${targetLang}`;

    if (!registry.languagePairs[pairKey]) {
      registry.languagePairs[pairKey] = { count: 0, articles: [] };
    }
    registry.languagePairs[pairKey].count++;
    registry.languagePairs[pairKey].articles.push({
      slug: pathParts.slice(2).join('/').replace('.mdx', ''),
      title: frontmatter.title || 'Untitled',
      category: frontmatter.category || 'unknown'
    });

    // Extract topic from slug for duplicate detection
    const slug = pathParts.slice(2).join('/').replace('.mdx', '');
    // Normalize topic key by removing language-specific words and extra details
    const normalizedTopic = slug
      .replace(/-(german|polish|french|spanish|italian|portuguese|dutch|russian|greek|turkish|czech|danish|hungarian|norwegian|romanian|swedish|ukrainian)/gi, '')
      .replace(/-(en|de|pl|fr|es|it|pt|nl|ru|el|tr|cs|da|hu|no|ro|sv|uk)/gi, '')
      .replace(/-for-couples/gi, '')
      .replace(/-guide/gi, '')
      .toLowerCase();

    if (!registry.topics[normalizedTopic]) {
      registry.topics[normalizedTopic] = [];
    }
    if (!registry.topics[normalizedTopic].includes(pairKey)) {
      registry.topics[normalizedTopic].push(pairKey);
    }
  }
}

// Sort language pairs by count
const sortedPairs = Object.entries(registry.languagePairs)
  .sort((a, b) => b[1].count - a[1].count);

console.log('Language pairs by article count:');
for (const [pair, data] of sortedPairs) {
  console.log(`  ${pair}: ${data.count} articles`);
}

console.log(`\nTotal unique topics: ${Object.keys(registry.topics).length}`);
console.log(`Total articles: ${registry.totalArticles}`);

// Write registry
fs.writeFileSync('src/data/article-registry.json', JSON.stringify(registry, null, 2));
console.log('\nRegistry updated: src/data/article-registry.json');
