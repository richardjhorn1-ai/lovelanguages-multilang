/**
 * Blog API - Fetch articles from Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found in environment');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export interface BlogArticle {
  id: string;
  slug: string;
  native_lang: string;
  target_lang: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: string | null;
  read_time: number | null;
  image: string | null;
  tags: string[];
  content: string;
  content_html: string | null;
  date: string | null;
  created_at: string;
  updated_at: string;
  published: boolean;
}

export type BlogArticleSummary = Pick<BlogArticle,
  'id' | 'slug' | 'native_lang' | 'target_lang' | 'title' | 'description' |
  'category' | 'difficulty' | 'read_time' | 'image' | 'tags' | 'date'
>;

export type BlogArticleSearchResult = Pick<BlogArticle,
  'id' | 'slug' | 'native_lang' | 'target_lang' | 'title' | 'description' |
  'category' | 'image' | 'date'
>;

/**
 * Get a single article by slug and language pair
 */
export async function getArticle(
  nativeLang: string,
  targetLang: string,
  slug: string
): Promise<BlogArticle | null> {
  const { data, error } = await supabase
    .from('blog_articles')
    .select('*')
    .eq('native_lang', nativeLang)
    .eq('target_lang', targetLang)
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching article:', error);
    return null;
  }

  return data;
}

/**
 * Get all articles for a language pair
 */
export async function getArticlesByLangPair(
  nativeLang: string,
  targetLang: string,
  options?: {
    category?: string;
    limit?: number;
    offset?: number;
  }
): Promise<BlogArticleSummary[]> {
  let query = supabase
    .from('blog_articles')
    .select('id, slug, native_lang, target_lang, title, description, category, difficulty, read_time, image, tags, date')
    .eq('native_lang', nativeLang)
    .eq('target_lang', targetLang)
    .eq('published', true)
    .order('date', { ascending: false });

  if (options?.category) {
    query = query.eq('category', options.category);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching articles:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all articles for a native language (across all target languages)
 */
export async function getArticlesByNativeLang(
  nativeLang: string,
  options?: {
    limit?: number;
  }
): Promise<BlogArticleSummary[]> {
  let query = supabase
    .from('blog_articles')
    .select('id, slug, native_lang, target_lang, title, description, category, difficulty, read_time, image, tags, date')
    .eq('native_lang', nativeLang)
    .eq('published', true)
    .order('date', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching articles:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all unique language pairs with article counts
 */
export async function getLanguagePairs(): Promise<{ native_lang: string; target_lang: string; count: number }[]> {
  const { data, error } = await supabase
    .from('blog_articles')
    .select('native_lang, target_lang')
    .eq('published', true);

  if (error) {
    console.error('Error fetching language pairs:', error);
    return [];
  }

  // Count by language pair
  const counts: Record<string, { native_lang: string; target_lang: string; count: number }> = {};

  for (const row of data || []) {
    const key = `${row.native_lang}-${row.target_lang}`;
    if (!counts[key]) {
      counts[key] = { native_lang: row.native_lang, target_lang: row.target_lang, count: 0 };
    }
    counts[key].count++;
  }

  return Object.values(counts).sort((a, b) => b.count - a.count);
}

/**
 * Get all unique native languages
 */
export async function getNativeLanguages(): Promise<string[]> {
  const { data, error } = await supabase
    .from('blog_articles')
    .select('native_lang')
    .eq('published', true);

  if (error) {
    console.error('Error fetching native languages:', error);
    return [];
  }

  const unique = [...new Set((data || []).map(r => r.native_lang))];
  return unique.sort();
}

/**
 * Get target languages for a specific native language
 */
export async function getTargetLanguages(nativeLang: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('blog_articles')
    .select('target_lang')
    .eq('native_lang', nativeLang)
    .eq('published', true);

  if (error) {
    console.error('Error fetching target languages:', error);
    return [];
  }

  const unique = [...new Set((data || []).map(r => r.target_lang))];
  return unique.sort();
}

/**
 * Get articles by category
 */
export async function getArticlesByCategory(
  category: string,
  options?: {
    nativeLang?: string;
    targetLang?: string;
    limit?: number;
  }
): Promise<BlogArticleSummary[]> {
  let query = supabase
    .from('blog_articles')
    .select('id, slug, native_lang, target_lang, title, description, category, difficulty, read_time, image, tags, date')
    .eq('category', category)
    .eq('published', true)
    .order('date', { ascending: false });

  if (options?.nativeLang) {
    query = query.eq('native_lang', options.nativeLang);
  }

  if (options?.targetLang) {
    query = query.eq('target_lang', options.targetLang);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching articles by category:', error);
    return [];
  }

  return data || [];
}

/**
 * Search articles
 */
export async function searchArticles(
  query: string,
  options?: {
    nativeLang?: string;
    limit?: number;
  }
): Promise<BlogArticleSearchResult[]> {
  let dbQuery = supabase
    .from('blog_articles')
    .select('id, slug, native_lang, target_lang, title, description, category, image, date')
    .eq('published', true)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('date', { ascending: false });

  if (options?.nativeLang) {
    dbQuery = dbQuery.eq('native_lang', options.nativeLang);
  }

  if (options?.limit) {
    dbQuery = dbQuery.limit(options.limit);
  }

  const { data, error } = await dbQuery;

  if (error) {
    console.error('Error searching articles:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all slugs for a language pair (for sitemap/static paths)
 */
export async function getAllSlugs(
  nativeLang?: string,
  targetLang?: string
): Promise<{ native_lang: string; target_lang: string; slug: string }[]> {
  const allData: { native_lang: string; target_lang: string; slug: string }[] = [];
  const PAGE_SIZE = 1000;
  let offset = 0;

  while (true) {
    let query = supabase
      .from('blog_articles')
      .select('native_lang, target_lang, slug')
      .eq('published', true)
      .range(offset, offset + PAGE_SIZE - 1);

    if (nativeLang) {
      query = query.eq('native_lang', nativeLang);
    }

    if (targetLang) {
      query = query.eq('target_lang', targetLang);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching slugs:', error);
      return allData;
    }

    if (!data || data.length === 0) break;

    allData.push(...data);

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allData;
}

/**
 * Topic definitions for hub pages
 */
export const TOPIC_DEFINITIONS: Record<string, { patterns: string[]; icon: string }> = {
  'pet-names': { patterns: ['pet-names', 'terms-of-endearment'], icon: '💕' },
  'i-love-you': { patterns: ['how-to-say-i-love-you'], icon: '❤️' },
  'pronunciation': { patterns: ['pronunciation-guide'], icon: '🗣️' },
  'grammar-basics': { patterns: ['grammar-basics'], icon: '📝' },
  'essential-phrases': { patterns: ['essential-phrases'], icon: '💬' },
  'romantic-phrases': { patterns: ['romantic-phrases'], icon: '💘' },
};

/**
 * Get articles matching a topic pattern for a native language
 */
export async function getArticlesByTopic(
  nativeLang: string,
  topicSlug: string
): Promise<{ targetLang: string; articles: BlogArticleSummary[] }[]> {
  const topic = TOPIC_DEFINITIONS[topicSlug];
  if (!topic) return [];

  // Build OR filter for slug patterns
  const orFilters = topic.patterns.map(p => `slug.ilike.%${p}%`).join(',');

  const { data, error } = await supabase
    .from('blog_articles')
    .select('id, slug, native_lang, target_lang, title, description, category, difficulty, read_time, image, tags, date')
    .eq('native_lang', nativeLang)
    .eq('published', true)
    .or(orFilters)
    .order('target_lang', { ascending: true });

  if (error) {
    console.error('Error fetching articles by topic:', error);
    return [];
  }

  // Group by target language
  const grouped: Record<string, BlogArticleSummary[]> = {};
  for (const article of data || []) {
    if (!grouped[article.target_lang]) {
      grouped[article.target_lang] = [];
    }
    grouped[article.target_lang].push(article);
  }

  return Object.entries(grouped).map(([targetLang, articles]) => ({
    targetLang,
    articles,
  }));
}

/**
 * Get topic counts for a native language (for topic hub overview)
 */
export async function getTopicCounts(
  nativeLang: string
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  for (const [topicSlug, topic] of Object.entries(TOPIC_DEFINITIONS)) {
    const orFilters = topic.patterns.map(p => `slug.ilike.%${p}%`).join(',');

    const { count, error } = await supabase
      .from('blog_articles')
      .select('id', { count: 'exact', head: true })
      .eq('native_lang', nativeLang)
      .eq('published', true)
      .or(orFilters);

    if (!error && count) {
      counts[topicSlug] = count;
    }
  }

  return counts;
}

/**
 * Get article count
 */
export async function getArticleCount(
  nativeLang?: string,
  targetLang?: string
): Promise<number> {
  let query = supabase
    .from('blog_articles')
    .select('id', { count: 'exact', head: true })
    .eq('published', true);

  if (nativeLang) {
    query = query.eq('native_lang', nativeLang);
  }

  if (targetLang) {
    query = query.eq('target_lang', targetLang);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Error getting article count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get all article counts by target language for a native language (single query)
 */
export async function getArticleCountsByTargetLang(
  nativeLang: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('blog_articles')
    .select('target_lang')
    .eq('native_lang', nativeLang)
    .eq('published', true);

  if (error) {
    console.error('Error getting article counts:', error);
    return {};
  }

  // Count by target language
  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.target_lang] = (counts[row.target_lang] || 0) + 1;
  }

  return counts;
}
