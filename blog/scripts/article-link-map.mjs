#!/usr/bin/env node

import { buildArticlePath, parseLearnArticlePath, replaceArticleUrlsInText } from '../src/lib/native-slugs.mjs';

const PAGE_SIZE = 1000;

function makeArticleKey(nativeLang, targetLang, slug) {
  return `${nativeLang}|${targetLang}|${slug}`;
}

function makeTopicKey(nativeLang, targetLang, topicId) {
  return `${nativeLang}|${targetLang}|${topicId}`;
}

async function fetchPublishedArticles(supabase) {
  const articles = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('id, native_lang, target_lang, slug, topic_id, is_canonical')
      .eq('published', true)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    articles.push(...data);

    if (data.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return articles;
}

async function fetchSlugAliases(supabase) {
  const aliases = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('blog_article_slug_aliases')
      .select('article_id, native_lang, target_lang, alias_slug, source')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      if (
        error.code === '42P01' ||
        String(error.message || '').includes('blog_article_slug_aliases')
      ) {
        return aliases;
      }
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    aliases.push(...data);

    if (data.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return aliases;
}

export async function fetchPublishedArticleLinkMap(supabase) {
  const allArticles = await fetchPublishedArticles(supabase);
  const allAliases = await fetchSlugAliases(supabase);

  const canonicalById = new Map();
  const canonicalByKey = new Map();
  const canonicalByTopic = new Map();
  const aliasByKey = new Map();
  const issues = {
    duplicateCanonicalKeys: [],
    duplicateCanonicalTopics: [],
    aliasCanonicalConflicts: [],
    conflictingAliases: [],
    orphanNonCanonical: [],
    orphanAliasRows: [],
  };

  for (const article of allArticles.filter(candidate => candidate.is_canonical !== false)) {
    const canonicalPath = buildArticlePath(article.native_lang, article.target_lang, article.slug);
    const articleKey = makeArticleKey(article.native_lang, article.target_lang, article.slug);

    if (canonicalByKey.has(articleKey) && canonicalByKey.get(articleKey) !== canonicalPath) {
      issues.duplicateCanonicalKeys.push(articleKey);
      continue;
    }

    canonicalById.set(article.id, article);
    canonicalByKey.set(articleKey, canonicalPath);

    if (article.topic_id) {
      const topicKey = makeTopicKey(article.native_lang, article.target_lang, article.topic_id);
      if (canonicalByTopic.has(topicKey)) {
        issues.duplicateCanonicalTopics.push(topicKey);
        continue;
      }
      canonicalByTopic.set(topicKey, article);
    }
  }

  for (const article of allArticles.filter(candidate => candidate.is_canonical === false)) {
    if (!article.topic_id) {
      issues.orphanNonCanonical.push(makeArticleKey(article.native_lang, article.target_lang, article.slug));
      continue;
    }

    const topicKey = makeTopicKey(article.native_lang, article.target_lang, article.topic_id);
    const canonicalArticle = canonicalByTopic.get(topicKey);

    if (!canonicalArticle) {
      issues.orphanNonCanonical.push(makeArticleKey(article.native_lang, article.target_lang, article.slug));
      continue;
    }

    aliasByKey.set(
      makeArticleKey(article.native_lang, article.target_lang, article.slug),
      buildArticlePath(canonicalArticle.native_lang, canonicalArticle.target_lang, canonicalArticle.slug)
    );
  }

  for (const alias of allAliases) {
    const canonicalArticle = canonicalById.get(alias.article_id);
    if (!canonicalArticle) {
      issues.orphanAliasRows.push(makeArticleKey(alias.native_lang, alias.target_lang, alias.alias_slug));
      continue;
    }

    const aliasKey = makeArticleKey(alias.native_lang, alias.target_lang, alias.alias_slug);
    const canonicalKey = makeArticleKey(
      canonicalArticle.native_lang,
      canonicalArticle.target_lang,
      canonicalArticle.slug
    );
    const canonicalPath = buildArticlePath(
      canonicalArticle.native_lang,
      canonicalArticle.target_lang,
      canonicalArticle.slug
    );

    if (aliasKey === canonicalKey) {
      continue;
    }

    if (canonicalByKey.has(aliasKey) && canonicalByKey.get(aliasKey) !== canonicalPath) {
      issues.aliasCanonicalConflicts.push(aliasKey);
      continue;
    }

    if (aliasByKey.has(aliasKey) && aliasByKey.get(aliasKey) !== canonicalPath) {
      issues.conflictingAliases.push(aliasKey);
      continue;
    }

    aliasByKey.set(aliasKey, canonicalPath);
  }

  return {
    articles: allArticles,
    aliases: allAliases,
    canonicalById,
    canonicalByKey,
    aliasByKey,
    issues,
  };
}

export function resolveCanonicalArticlePath(pathOrUrl, linkMap) {
  const parsed = typeof pathOrUrl === 'string' ? parseLearnArticlePath(pathOrUrl) : pathOrUrl;
  if (!parsed) {
    return null;
  }

  const articleKey = makeArticleKey(parsed.nativeLang, parsed.targetLang, parsed.slug);
  return linkMap.canonicalByKey.get(articleKey) || linkMap.aliasByKey.get(articleKey) || null;
}

export function rewriteCanonicalArticleLinks(input, linkMap) {
  return replaceArticleUrlsInText(
    input,
    parsed => resolveCanonicalArticlePath(parsed, linkMap)
  );
}
