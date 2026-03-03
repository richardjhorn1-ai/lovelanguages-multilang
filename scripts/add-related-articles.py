#!/usr/bin/env python3.11
"""
Second pass: Add "Related Articles" section to articles that have <3 internal links.

Works on v2 output data — applies to articles that v2 either missed entirely
or gave fewer than 3 links. Groups articles by category and slug-topic similarity
within the same language pair.

Usage:
  python3.11 scripts/add-related-articles.py --pair uk-cs --dry-run
  python3.11 scripts/add-related-articles.py --all --dry-run
  python3.11 scripts/add-related-articles.py --all
"""

import json, re, os, sys, subprocess, argparse
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
from collections import defaultdict

# Config
SUPABASE_URL = "https://iiusoobuoxurysrhqptx.supabase.co/rest/v1"
MIN_RELATED = 3       # Minimum related articles to add
MAX_RELATED = 5       # Maximum related articles to show
LINK_THRESHOLD = 3    # Only add related section if article has < this many links
V2_DIR = Path(__file__).parent.parent / "data" / "articles-v2"
OUT_DIR = Path(__file__).parent.parent / "data" / "articles-v2-pass2"
DIFF_DIR = Path(__file__).parent.parent / "data" / "link-diffs-v2-pass2"

# "Related Articles" heading in each native language
RELATED_HEADING = {
    'en': 'Related Articles',
    'es': 'Artículos Relacionados',
    'fr': 'Articles Connexes',
    'de': 'Verwandte Artikel',
    'it': 'Articoli Correlati',
    'pt': 'Artigos Relacionados',
    'nl': 'Gerelateerde Artikelen',
    'pl': 'Powiązane Artykuły',
    'ru': 'Похожие Статьи',
    'uk': 'Схожі Статті',
    'tr': 'İlgili Makaleler',
    'ro': 'Articole Similare',
    'sv': 'Relaterade Artiklar',
    'no': 'Relaterte Artikler',
    'da': 'Relaterede Artikler',
    'cs': 'Související Články',
    'el': 'Σχετικά Άρθρα',
    'hu': 'Kapcsolódó Cikkek',
}

# Topic keywords extracted from slugs — used to find topically similar articles
SLUG_TOPICS = {
    'romantic': ['romantic', 'romance', 'love-phrases'],
    'flirt': ['flirt'],
    'pet-names': ['pet-names', 'pet-name', 'terms-of-endearment', 'endearment'],
    'greetings': ['greetings', 'greeting', 'farewell', 'good-morning', 'goodnight', 'good-night'],
    'birthday': ['birthday'],
    'anniversary': ['anniversary'],
    'wedding': ['wedding', 'marriage'],
    'family': ['family', 'in-laws', 'partner-s-family', 'parents'],
    'emotions': ['emotion', 'expressing-emotion', 'feelings'],
    'compliments': ['compliment', 'admiration'],
    'pronunciation': ['pronunciation', 'pronounce'],
    'grammar': ['grammar', 'verb', 'conjugat', 'tense', 'subjunctive', 'word-order', 'past-tense'],
    'common-words': ['common-words', 'most-common', '100-most', 'vocabulary', 'essential-phrases'],
    'texting': ['texting', 'text-message', 'sms', 'slang'],
    'restaurant': ['restaurant', 'dining', 'food'],
    'travel': ['travel', 'honeymoon', 'vacation'],
    'argue': ['argue', 'argument', 'fight', 'conflict', 'disagree'],
    'forgive': ['forgive', 'apologize', 'apology', 'sorry', 'makeup'],
    'miss-you': ['miss-you', 'missing', 'long-distance'],
    'love-letter': ['love-letter', 'letter', 'writing'],
    'date': ['date-night', 'first-date', 'dating'],
    'baby': ['baby', 'pregnancy', 'expecting'],
    'christmas': ['christmas', 'holiday', 'noel'],
    'support': ['support', 'comfort', 'encourage'],
    'jealous': ['jealous', 'jealousy'],
    'moving-in': ['moving-in', 'living-together', 'household'],
    'proposal': ['proposal', 'engagement', 'propose'],
    'phone': ['phone-call', 'video-call', 'calling'],
    'small-talk': ['small-talk', 'conversation'],
    'hard-to-learn': ['hard-to-learn', 'difficult', 'is-it-hard'],
}


def get_supabase_key():
    env_file = os.path.expanduser("~/clawd/secrets/.env.tokens")
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line.startswith("SUPABASE_SERVICE_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise ValueError("SUPABASE_SERVICE_KEY not found")


def fetch_articles(native: str, target: str, key: str) -> List[dict]:
    articles = []
    offset = 0
    batch = 1000
    while True:
        r = subprocess.run([
            'curl', '-s',
            f'{SUPABASE_URL}/blog_articles?select=id,slug,title,category,content_html,native_lang,target_lang'
            f'&native_lang=eq.{native}&target_lang=eq.{target}&order=slug&limit={batch}&offset={offset}',
            '-H', f'apikey: {key}',
            '-H', f'Authorization: Bearer {key}'
        ], capture_output=True, text=True, timeout=30)
        data = json.loads(r.stdout)
        if not data or isinstance(data, dict):
            break
        articles.extend(data)
        if len(data) < batch:
            break
        offset += batch
    return articles


def get_slug_topic(slug: str) -> Optional[str]:
    """Extract topic from slug using keyword matching."""
    slug_lower = slug.lower()
    for topic, keywords in SLUG_TOPICS.items():
        for kw in keywords:
            if kw in slug_lower:
                return topic
    return None


def count_internal_links(html: str) -> int:
    """Count existing internal links in content."""
    return len(re.findall(r'href="(/learn/[^"]+)"', html))


def get_v2_content(native: str, target: str, article_id: str) -> Optional[str]:
    """Get v2-modified content if it exists."""
    v2_file = V2_DIR / f"{native}-{target}.json"
    if not v2_file.exists():
        return None
    with open(v2_file) as f:
        v2_articles = json.load(f)
    for a in v2_articles:
        if a['id'] == article_id:
            return a['content_html']
    return None


def find_related(article: dict, all_articles: List[dict], native: str, target: str) -> List[dict]:
    """Find related articles based on category and slug topic similarity."""
    slug = article['slug']
    category = article.get('category', '')
    topic = get_slug_topic(slug)
    article_id = article['id']

    # Get existing link targets to avoid duplicates
    content = article.get('content_html', '')
    existing_hrefs = set(re.findall(r'href="(/learn/[^"]+)"', content))

    candidates = []

    for other in all_articles:
        if other['id'] == article_id:
            continue

        other_href = f'/learn/{native}/{target}/{other["slug"]}/'
        if other_href in existing_hrefs:
            continue

        score = 0
        other_topic = get_slug_topic(other['slug'])
        other_cat = other.get('category', '')

        # Same topic = strongest signal
        if topic and other_topic and topic == other_topic:
            score += 3

        # Same category = good signal
        if category and other_cat and category == other_cat:
            score += 2

        # Adjacent topics (both about relationships/emotions)
        relationship_topics = {'romantic', 'flirt', 'date', 'love-letter', 'miss-you', 'pet-names', 'proposal'}
        conflict_topics = {'argue', 'forgive', 'jealous'}
        family_topics = {'family', 'wedding', 'baby', 'moving-in'}
        language_topics = {'pronunciation', 'grammar', 'common-words', 'hard-to-learn'}

        if topic and other_topic:
            for group in [relationship_topics, conflict_topics, family_topics, language_topics]:
                if topic in group and other_topic in group:
                    score += 1
                    break

        if score > 0:
            candidates.append({
                'slug': other['slug'],
                'title': other.get('title', ''),
                'href': other_href,
                'score': score,
            })

    # Sort by score descending, take top N
    candidates.sort(key=lambda x: -x['score'])
    return candidates[:MAX_RELATED]


def append_related_section(content: str, related: List[dict], native: str) -> str:
    """Append a Related Articles section to the end of content_html."""
    heading = RELATED_HEADING.get(native, 'Related Articles')

    # Build the HTML section
    section = f'\n<h2>{heading}</h2>\n<ul>\n'
    for r in related:
        # Clean title for display
        display = r['title']
        for suffix in [' | Love Languages', ' — Love Languages']:
            display = display.replace(suffix, '')
        section += f'  <li><a href="{r["href"]}">{display.strip()}</a></li>\n'
    section += '</ul>'

    # Append before closing tags if they exist, otherwise just append
    # Remove trailing whitespace/newlines first
    content = content.rstrip()
    content += '\n' + section

    return content


def process_pair(native: str, target: str, key: str, dry_run: bool = False) -> dict:
    print(f"\n{'='*60}")
    print(f"Processing {native}→{target} (pass 2 — related articles)")
    print(f"{'='*60}")

    articles = fetch_articles(native, target, key)
    print(f"  Fetched {len(articles)} articles")

    if len(articles) < MIN_RELATED + 1:
        print(f"  Skipping — too few articles for meaningful related links")
        return {'pair': f'{native}-{target}', 'total': len(articles), 'modified': 0, 'links_added': 0}

    # Apply v2 content where available
    for article in articles:
        v2_content = get_v2_content(native, target, article['id'])
        if v2_content:
            article['content_html'] = v2_content

    # Find articles needing related section
    modified_articles = []
    stats = {'total': len(articles), 'modified': 0, 'links_added': 0, 'skipped_enough': 0, 'skipped_no_related': 0}

    for article in articles:
        content = article.get('content_html', '')
        link_count = count_internal_links(content)

        if link_count >= LINK_THRESHOLD:
            stats['skipped_enough'] += 1
            continue

        # Find related articles
        related = find_related(article, articles, native, target)

        if len(related) < MIN_RELATED:
            stats['skipped_no_related'] += 1
            continue

        new_content = append_related_section(content, related, native)

        article['content_html_original'] = content
        article['content_html'] = new_content
        article['links_added'] = len(related)
        modified_articles.append(article)
        stats['modified'] += 1
        stats['links_added'] += len(related)

        if dry_run:
            print(f"  [{len(related)} related] {article['slug']}")
            for r in related[:3]:
                clean_title = r['title'].replace(' | Love Languages', '')[:50]
                print(f"           → {clean_title} (score={r['score']})")

    print(f"\n  Results: {stats['modified']}/{stats['total']} modified, "
          f"{stats['links_added']} links added, "
          f"{stats['skipped_enough']} already had enough, "
          f"{stats['skipped_no_related']} no related found")

    if not dry_run and modified_articles:
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        DIFF_DIR.mkdir(parents=True, exist_ok=True)

        output_file = OUT_DIR / f"{native}-{target}.json"
        save_data = []
        for a in modified_articles:
            save_data.append({
                'id': a['id'],
                'slug': a['slug'],
                'title': a['title'],
                'links_added': a['links_added'],
                'content_html': a['content_html'],
            })
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, ensure_ascii=False, indent=2)

        diff_file = DIFF_DIR / f"{native}-{target}-diff.txt"
        with open(diff_file, 'w', encoding='utf-8') as f:
            for a in modified_articles:
                f.write(f"\n{'='*60}\n")
                f.write(f"Article: {a['slug']}\n")
                f.write(f"Related links added: {a['links_added']}\n")
                old_links = set(re.findall(r'href="(/learn/[^"]+)"', a.get('content_html_original', '')))
                new_links = set(re.findall(r'href="(/learn/[^"]+)"', a['content_html']))
                added = new_links - old_links
                for link in sorted(added):
                    f.write(f"  + {link}\n")

        print(f"  Saved to {output_file}")

    return stats


def main():
    parser = argparse.ArgumentParser(description='Add Related Articles section (pass 2)')
    parser.add_argument('--pair', type=str, help='Language pair (e.g., uk-cs)')
    parser.add_argument('--all', action='store_true', help='Process all pairs')
    parser.add_argument('--dry-run', action='store_true', help='Preview without saving')
    parser.add_argument('--native', type=str, help='Process all pairs for a native language')
    args = parser.parse_args()

    key = get_supabase_key()

    if args.pair:
        native, target = args.pair.split('-')
        process_pair(native, target, key, args.dry_run)
    elif args.native:
        r = subprocess.run([
            'curl', '-s',
            f'{SUPABASE_URL}/blog_articles?select=target_lang&native_lang=eq.{args.native}&target_lang=neq.all',
            '-H', f'apikey: {key}', '-H', f'Authorization: Bearer {key}'
        ], capture_output=True, text=True, timeout=30)
        data = json.loads(r.stdout)
        targets = sorted(set(a['target_lang'] for a in data))
        total_stats = {'modified': 0, 'links_added': 0}
        for t in targets:
            stats = process_pair(args.native, t, key, args.dry_run)
            total_stats['modified'] += stats.get('modified', 0)
            total_stats['links_added'] += stats.get('links_added', 0)
        print(f"\nTOTAL for {args.native}: {total_stats['modified']} modified, {total_stats['links_added']} links")
    elif args.all:
        all_articles = []
        offset = 0
        while True:
            r = subprocess.run([
                'curl', '-s',
                f'{SUPABASE_URL}/blog_articles?select=native_lang,target_lang&limit=1000&offset={offset}'
                f'&target_lang=neq.all',
                '-H', f'apikey: {key}', '-H', f'Authorization: Bearer {key}'
            ], capture_output=True, text=True, timeout=30)
            data = json.loads(r.stdout)
            if not data:
                break
            all_articles.extend(data)
            if len(data) < 1000:
                break
            offset += 1000

        pairs = sorted(set((a['native_lang'], a['target_lang']) for a in all_articles))
        print(f"Processing {len(pairs)} language pairs (pass 2)...")

        total_stats = {'modified': 0, 'links_added': 0}
        for native, target in pairs:
            stats = process_pair(native, target, key, args.dry_run)
            total_stats['modified'] += stats.get('modified', 0)
            total_stats['links_added'] += stats.get('links_added', 0)

        print(f"\n{'='*60}")
        print(f"PASS 2 TOTAL: {total_stats['modified']} articles modified, {total_stats['links_added']} related links added")
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
