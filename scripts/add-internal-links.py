#!/usr/bin/env python3.11
"""
Add internal links to blog articles, matching the EN→PL quality pattern.

For each language pair:
1. Pull all articles from Supabase
2. Build a keyword/topic map from titles, slugs, and H2 headings
3. For each article, find natural places to insert contextual links
4. Save modified articles locally for review

Usage:
  python3.11 scripts/add-internal-links.py --pair en-pl --dry-run
  python3.11 scripts/add-internal-links.py --pair en-pl
  python3.11 scripts/add-internal-links.py --all
"""

import json, re, os, sys, subprocess, argparse
from pathlib import Path
from typing import Dict, List, Tuple, Optional

# Config
SUPABASE_URL = "https://iiusoobuoxurysrhqptx.supabase.co/rest/v1"
MAX_LINKS_PER_ARTICLE = 12
MIN_LINKS_PER_ARTICLE = 3
DATA_DIR = Path(__file__).parent.parent / "data" / "articles"
DIFF_DIR = Path(__file__).parent.parent / "data" / "link-diffs"

def get_supabase_key():
    """Load Supabase key from secrets."""
    env_file = os.path.expanduser("~/clawd/secrets/.env.tokens")
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line.startswith("SUPABASE_SERVICE_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise ValueError("SUPABASE_SERVICE_KEY not found")

def fetch_articles(native: str, target: str, key: str) -> List[dict]:
    """Pull all articles for a language pair from Supabase."""
    articles = []
    offset = 0
    batch = 1000
    while True:
        r = subprocess.run([
            'curl', '-s',
            f'{SUPABASE_URL}/blog_articles?select=id,slug,title,category,content_html,native_lang,target_lang'
            f'&native_lang=eq.{native}&target_lang=eq.{target}&is_canonical=eq.true&order=slug&limit={batch}&offset={offset}',
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

def extract_keywords(article: dict) -> List[str]:
    """Extract linkable keywords/phrases from an article's title, slug, and headings."""
    keywords = []

    # From title
    title = article.get('title', '')
    keywords.append(title)

    # From slug - convert dashes to spaces
    slug = article.get('slug', '')
    slug_words = slug.replace('-', ' ')
    keywords.append(slug_words)

    # From H2 headings in content
    content = article.get('content_html', '')
    h2s = re.findall(r'<h2[^>]*>(.*?)</h2>', content, re.DOTALL)
    for h2 in h2s:
        clean = re.sub(r'<[^>]+>', '', h2).strip()
        if clean:
            keywords.append(clean)

    # From category
    category = article.get('category', '')
    if category:
        keywords.append(category)

    return keywords

def build_link_targets(articles: List[dict], native: str, target: str) -> List[dict]:
    """Build a list of linkable articles with their match patterns."""
    targets = []

    for article in articles:
        slug = article['slug']
        title = article.get('title', '')
        href = f'/learn/{native}/{target}/{slug}/'

        # Build search patterns - phrases that might appear in other articles
        # that could naturally link to this one
        patterns = []

        # Category-based patterns
        cat = article.get('category', '')

        # Extract key topic from slug
        # e.g., "polish-pronunciation-guide" → ["pronunciation guide", "pronunciation"]
        slug_parts = slug.replace(f'{target}-', '').replace('-', ' ')

        # Common topic mappings
        topic_patterns = {
            'pronunciation': ['pronunciation', 'pronounce', 'how to say', 'sounds'],
            'grammar': ['grammar', 'verb conjugation', 'cases', 'tenses', 'word order'],
            'greetings': ['greetings', 'hello', 'goodbye', 'farewell', 'good morning', 'good night'],
            'pet-names': ['pet names', 'terms of endearment', 'nicknames', 'sweet names'],
            'romantic': ['romantic phrases', 'love phrases', 'romance', 'romantic expressions'],
            'i-love-you': ['I love you', 'say I love you', 'express love'],
            'compliments': ['compliments', 'flatter', 'praise'],
            'birthday': ['birthday', 'birthday wishes'],
            'anniversary': ['anniversary', 'anniversary wishes'],
            'wedding': ['wedding', 'marriage', 'wedding phrases'],
            'restaurant': ['restaurant', 'dining', 'ordering food', 'food vocabulary'],
            'travel': ['travel', 'traveling', 'trip', 'vacation'],
            'family': ['family', 'meeting the family', 'parents', "partner's family"],
            'emotions': ['emotions', 'express emotions', 'feelings'],
            'hard-to-learn': ['hard to learn', 'difficult', 'is it hard', 'challenging'],
            'essential-phrases': ['essential phrases', 'basic phrases', 'key phrases'],
            'common-words': ['common words', 'most common', 'vocabulary', 'basic words'],
            'texting': ['texting', 'text messages', 'messaging', 'slang'],
            'date-night': ['date night', 'romantic evening', 'date vocabulary'],
            'long-distance': ['long distance', 'distance relationship'],
            'small-talk': ['small talk', 'conversation starters', 'ice breakers'],
            'forgive': ['forgive', 'apologize', 'sorry', 'forgiveness'],
            'argue': ['argue', 'argument', 'disagreement', 'conflict'],
            'flirt': ['flirt', 'flirting', 'pick up lines'],
            'first-date': ['first date', 'dating'],
            'moving-in': ['moving in', 'living together', 'household'],
            'baby': ['baby', 'pregnancy', 'expecting'],
            'christmas': ['christmas', 'holiday', 'festive'],
            'easter': ['easter'],
            'valentines': ["valentine", "valentine's day"],
            'name-days': ['name day', 'imieniny', 'névnap'],
            'love-letters': ['love letter', 'writing letters'],
            'phone-calls': ['phone call', 'calling', 'telephone'],
            'video-call': ['video call', 'video chat'],
        }

        for topic_key, topic_phrases in topic_patterns.items():
            if topic_key in slug or any(p.lower() in title.lower() for p in topic_phrases):
                patterns.extend(topic_phrases)

        # Use a display text (shorter version of title)
        display_text = title
        # Remove common prefixes/suffixes
        for suffix in [' | Love Languages', ' for Couples', ' for couples']:
            display_text = display_text.replace(suffix, '')

        targets.append({
            'slug': slug,
            'title': title,
            'display_text': display_text,
            'href': href,
            'patterns': list(set(patterns)),
            'category': cat,
        })

    return targets

def find_link_opportunities(article: dict, targets: List[dict], native: str, target: str) -> List[dict]:
    """Find places in an article where we can naturally insert links."""
    content = article.get('content_html', '')
    slug = article['slug']
    opportunities = []

    # Don't link to self
    other_targets = [t for t in targets if t['slug'] != slug]

    # Track which articles we've already planned to link to
    linked_slugs = set()

    # Also check for existing links
    existing_links = set(re.findall(r'href="(/learn/[^"]+)"', content))

    for t in other_targets:
        if t['slug'] in linked_slugs:
            continue
        if t['href'] in existing_links:
            linked_slugs.add(t['slug'])
            continue

        for pattern in t['patterns']:
            if len(pattern) < 4:  # Skip very short patterns
                continue

            # Case-insensitive search in content text (not in HTML tags or existing links)
            # Find the pattern in plain text portions
            escaped = re.escape(pattern)
            # Match the pattern NOT inside an existing <a> tag or HTML attribute
            regex = re.compile(
                rf'(?<!["\'>=/])(?<!href=")({escaped})(?!["\'])',
                re.IGNORECASE
            )

            match = regex.search(content)
            if match:
                # Found a natural mention - record the opportunity
                pos = match.start()

                # Check we're not inside an HTML tag
                before = content[:pos]
                open_tags = before.count('<') - before.count('>')
                if open_tags > 0:
                    continue

                # Check we're not inside an existing <a> tag
                last_a_open = before.rfind('<a ')
                last_a_close = before.rfind('</a>')
                if last_a_open > last_a_close:
                    continue

                opportunities.append({
                    'target_slug': t['slug'],
                    'target_href': t['href'],
                    'target_title': t['display_text'],
                    'matched_text': match.group(0),
                    'position': pos,
                    'pattern': pattern,
                })
                linked_slugs.add(t['slug'])
                break  # One link per target article

        if len(linked_slugs) >= MAX_LINKS_PER_ARTICLE:
            break

    return opportunities

def apply_links(content: str, opportunities: List[dict]) -> str:
    """Apply the found link opportunities to the content HTML."""
    if not opportunities:
        return content

    # Sort by position descending so we can replace from end to start
    # (this preserves positions)
    opps = sorted(opportunities, key=lambda x: -x['position'])

    for opp in opps:
        pos = opp['position']
        matched = opp['matched_text']
        href = opp['target_href']

        # Replace the first occurrence at this position
        before = content[:pos]
        after = content[pos + len(matched):]

        # Create the link
        link = f'<a href="{href}">{matched}</a>'
        content = before + link + after

    return content

def process_pair(native: str, target: str, key: str, dry_run: bool = False) -> dict:
    """Process a single language pair."""
    print(f"\n{'='*60}")
    print(f"Processing {native}→{target}")
    print(f"{'='*60}")

    # Fetch articles
    articles = fetch_articles(native, target, key)
    print(f"  Fetched {len(articles)} articles")

    if not articles:
        return {'pair': f'{native}-{target}', 'total': 0, 'modified': 0}

    # Build link targets
    targets = build_link_targets(articles, native, target)

    # Process each article
    modified_articles = []
    stats = {'total': len(articles), 'modified': 0, 'links_added': 0, 'already_linked': 0}

    for article in articles:
        content = article.get('content_html', '')
        existing = len(re.findall(r'href="(/learn/[^"]+)"', content))

        if existing >= MAX_LINKS_PER_ARTICLE:
            stats['already_linked'] += 1
            continue

        opportunities = find_link_opportunities(article, targets, native, target)

        if opportunities:
            new_content = apply_links(content, opportunities)
            if new_content != content:
                article['content_html_original'] = content
                article['content_html'] = new_content
                article['links_added'] = len(opportunities)
                modified_articles.append(article)
                stats['modified'] += 1
                stats['links_added'] += len(opportunities)

                if dry_run:
                    print(f"  [{len(opportunities):2d} links] {article['slug']}")
                    for opp in opportunities[:3]:
                        print(f"           → {opp['target_slug']} (matched: '{opp['matched_text']}')")

    print(f"\n  Results: {stats['modified']}/{stats['total']} articles modified, "
          f"{stats['links_added']} links added, {stats['already_linked']} already had enough links")

    # Save locally
    if not dry_run and modified_articles:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        DIFF_DIR.mkdir(parents=True, exist_ok=True)

        # Save modified articles
        output_file = DATA_DIR / f"{native}-{target}.json"
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
        print(f"  Saved to {output_file}")

        # Save diff summary
        diff_file = DIFF_DIR / f"{native}-{target}-diff.txt"
        with open(diff_file, 'w', encoding='utf-8') as f:
            for a in modified_articles:
                f.write(f"\n{'='*60}\n")
                f.write(f"Article: {a['slug']}\n")
                f.write(f"Links added: {a['links_added']}\n")
                # Show the links that were added
                old_links = set(re.findall(r'href="(/learn/[^"]+)"', a.get('content_html_original', '')))
                new_links = set(re.findall(r'href="(/learn/[^"]+)"', a['content_html']))
                added = new_links - old_links
                for link in sorted(added):
                    f.write(f"  + {link}\n")
        print(f"  Diff saved to {diff_file}")

    return stats

def main():
    parser = argparse.ArgumentParser(description='Add internal links to blog articles')
    parser.add_argument('--pair', type=str, help='Language pair (e.g., en-pl)')
    parser.add_argument('--all', action='store_true', help='Process all pairs')
    parser.add_argument('--dry-run', action='store_true', help='Preview without saving')
    parser.add_argument('--native', type=str, help='Process all pairs for a native language')
    args = parser.parse_args()

    key = get_supabase_key()

    if args.pair:
        native, target = args.pair.split('-')
        process_pair(native, target, key, args.dry_run)
    elif args.native:
        # Get all target langs for this native lang
        r = subprocess.run([
            'curl', '-s',
            f'{SUPABASE_URL}/blog_articles?select=target_lang&native_lang=eq.{args.native}&target_lang=neq.all',
            '-H', f'apikey: {key}', '-H', f'Authorization: Bearer {key}'
        ], capture_output=True, text=True, timeout=30)
        data = json.loads(r.stdout)
        targets = sorted(set(a['target_lang'] for a in data))
        print(f"Processing {args.native}→ [{', '.join(targets)}]")
        for t in targets:
            process_pair(args.native, t, key, args.dry_run)
    elif args.all:
        # Get all unique pairs
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
        print(f"Processing {len(pairs)} language pairs...")

        total_stats = {'modified': 0, 'links_added': 0}
        for native, target in pairs:
            stats = process_pair(native, target, key, args.dry_run)
            total_stats['modified'] += stats.get('modified', 0)
            total_stats['links_added'] += stats.get('links_added', 0)

        print(f"\n{'='*60}")
        print(f"TOTAL: {total_stats['modified']} articles modified, {total_stats['links_added']} links added")
    else:
        parser.print_help()

if __name__ == '__main__':
    main()
