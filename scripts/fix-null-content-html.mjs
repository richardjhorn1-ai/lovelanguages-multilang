#!/usr/bin/env node
/**
 * Fix articles with null content_html
 * Usage: node fix-null-content-html.mjs <native_lang>
 *
 * This script finds all articles for a native language that have
 * content_html=null and converts their raw MDX content to proper HTML.
 */

const SUPABASE_URL = 'https://iiusoobuoxurysrhqptx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpdXNvb2J1b3h1cnlzcmhxcHR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA1NTI3MSwiZXhwIjoyMDgzNjMxMjcxfQ.sVStyBe6WUBry9_WuTjhL7fzoBO_34L9xfORlVwQDBE';

const nativeLang = process.argv[2];

if (!nativeLang) {
  console.error('Usage: node fix-null-content-html.mjs <native_lang>');
  console.error('Example: node fix-null-content-html.mjs en');
  process.exit(1);
}

async function getArticlesToFix() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/blog_articles?content_html=is.null&native_lang=eq.${nativeLang}&select=id,slug,native_lang,target_lang,title,content`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );
  return res.json();
}

async function updateArticle(id, content_html, difficulty, read_time) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/blog_articles?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        content_html,
        difficulty: difficulty || 'beginner',
        read_time: read_time || 8
      })
    }
  );
  return res.ok;
}

/**
 * Convert MDX content to HTML
 * Handles <Phrase>, <Trans>, <Note> components
 */
function convertMdxToHtml(content) {
  if (!content) return '';

  let html = content;

  // Convert <Phrase term="..." pronunciation="...">...<Trans>...</Trans><Note>...</Note></Phrase>
  // to a clean HTML format
  html = html.replace(
    /<Phrase\s+term="([^"]+)"\s+pronunciation="([^"]+)">\s*<Trans>([^<]+)<\/Trans>\s*(?:<Note>([^<]+)<\/Note>)?\s*<\/Phrase>/g,
    (match, term, pronunciation, trans, note) => {
      let result = `<p><strong>${term}</strong> (${pronunciation})</p>\n<p>${trans}</p>`;
      if (note) {
        result += `\n<p><em>${note}</em></p>`;
      }
      return result;
    }
  );

  // Convert markdown headers to HTML
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Convert markdown paragraphs (double newline) to <p> tags
  html = html.split(/\n\n+/).map(para => {
    para = para.trim();
    if (!para) return '';
    if (para.startsWith('<h') || para.startsWith('<p') || para.startsWith('<ul') || para.startsWith('<table')) {
      return para;
    }
    return `<p>${para}</p>`;
  }).join('\n');

  // Convert **bold** to <strong>
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Convert *italic* to <em>
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  return html;
}

async function main() {
  console.log(`Fetching articles with null content_html for native_lang=${nativeLang}...`);

  const articles = await getArticlesToFix();
  console.log(`Found ${articles.length} articles to fix`);

  if (articles.length === 0) {
    console.log('Nothing to fix!');
    return;
  }

  // Output articles as JSON for the agent to process
  console.log('\n=== ARTICLES TO FIX ===');
  console.log(JSON.stringify(articles, null, 2));
}

main().catch(console.error);
