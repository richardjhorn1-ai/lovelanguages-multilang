#!/usr/bin/env python3.11
"""
Hreflang audit — check for reciprocal hreflang tags across language pairs.

Usage:
  python3.11 scripts/audit-hreflang.py
  python3.11 scripts/audit-hreflang.py --count 20
"""

import json, re, os, sys, subprocess, argparse, random
from pathlib import Path
from collections import defaultdict

SITE = "https://www.lovelanguages.io"
OUTPUT = Path(__file__).parent.parent / "docs" / "HREFLANG_AUDIT.md"


def get_sample_articles(count: int = 15) -> list:
    """Get diverse sample articles from Supabase with topic_id for cross-language matching."""
    key = ''
    with open(os.path.expanduser('~/clawd/secrets/.env.tokens')) as f:
        for line in f:
            if line.startswith('SUPABASE_SERVICE_KEY='):
                key = line.strip().split('=', 1)[1].strip('"').strip("'")

    url = 'https://iiusoobuoxurysrhqptx.supabase.co/rest/v1'

    # Get articles that have topic_id (needed for hreflang cross-linking)
    r = subprocess.run([
        'curl', '-s',
        f'{url}/blog_articles?select=slug,slug_native,native_lang,target_lang,topic_id'
        f'&target_lang=neq.all&topic_id=not.is.null&limit=500',
        '-H', f'apikey: {key}',
        '-H', f'Authorization: Bearer {key}'
    ], capture_output=True, text=True, timeout=30)

    articles = json.loads(r.stdout)

    # Pick diverse set
    by_native = defaultdict(list)
    for a in articles:
        by_native[a['native_lang']].append(a)

    selected = []
    langs = list(by_native.keys())
    random.shuffle(langs)
    while len(selected) < count and langs:
        for lang in langs:
            if by_native[lang] and len(selected) < count:
                a = random.choice(by_native[lang])
                by_native[lang].remove(a)
                selected.append(a)

    return selected


def extract_hreflang_tags(html: str) -> list:
    """Extract hreflang link tags from HTML."""
    tags = []
    pattern = r'<link\s+[^>]*rel=["\']alternate["\'][^>]*>'
    matches = re.findall(pattern, html, re.IGNORECASE)

    for match in matches:
        href = re.search(r'href=["\']([^"\']+)["\']', match)
        hreflang = re.search(r'hreflang=["\']([^"\']+)["\']', match)
        if href and hreflang:
            tags.append({
                'href': href.group(1),
                'hreflang': hreflang.group(1),
            })

    return tags


def check_reciprocal(source_url: str, target_url: str) -> dict:
    """Check if target page has a hreflang tag pointing back to source."""
    r = subprocess.run(
        ['curl', '-s', '--max-time', '10', target_url],
        capture_output=True, text=True, timeout=15
    )

    if not r.stdout:
        return {'status': 'fetch_failed', 'has_reciprocal': False}

    tags = extract_hreflang_tags(r.stdout)

    # Normalize URLs for comparison
    source_normalized = source_url.rstrip('/')

    for tag in tags:
        tag_href = tag['href'].rstrip('/')
        if tag_href == source_normalized:
            return {'status': 'ok', 'has_reciprocal': True, 'tags_count': len(tags)}

    return {
        'status': 'missing_reciprocal',
        'has_reciprocal': False,
        'tags_count': len(tags),
        'tags_found': [t['hreflang'] for t in tags],
    }


def audit_article(article: dict) -> dict:
    """Audit hreflang tags for a single article."""
    native = article['native_lang']
    target = article['target_lang']
    slug = article.get('slug_native') or article['slug']
    url = f"{SITE}/learn/{native}/{target}/{slug}/"

    # Fetch the page
    r = subprocess.run(
        ['curl', '-s', '--max-time', '10', url],
        capture_output=True, text=True, timeout=15
    )

    if not r.stdout:
        return {
            'url': url, 'slug': slug, 'native': native, 'target': target,
            'error': 'fetch_failed', 'tags': [], 'issues': ['Page fetch failed']
        }

    tags = extract_hreflang_tags(r.stdout)
    issues = []

    if not tags:
        issues.append("No hreflang tags found")
        return {
            'url': url, 'slug': slug, 'native': native, 'target': target,
            'tags': tags, 'issues': issues, 'reciprocal_checks': []
        }

    # Check for x-default
    has_xdefault = any(t['hreflang'] == 'x-default' for t in tags)
    if not has_xdefault:
        issues.append("Missing x-default hreflang")

    # Check for self-referencing tag
    has_self = any(url.rstrip('/') in t['href'].rstrip('/') for t in tags)
    if not has_self:
        issues.append("Missing self-referencing hreflang")

    # Check reciprocal for up to 3 alternate versions
    alternates = [t for t in tags if t['hreflang'] not in ('x-default',)
                  and url.rstrip('/') not in t['href'].rstrip('/')]

    reciprocal_checks = []
    check_count = min(3, len(alternates))
    for tag in random.sample(alternates, check_count) if len(alternates) > check_count else alternates:
        result = check_reciprocal(url, tag['href'])
        reciprocal_checks.append({
            'target_url': tag['href'],
            'target_lang': tag['hreflang'],
            **result,
        })
        if not result['has_reciprocal']:
            issues.append(f"Missing reciprocal from {tag['hreflang']} ({tag['href'][:60]}...)")

    return {
        'url': url, 'slug': slug, 'native': native, 'target': target,
        'tags': tags, 'tag_count': len(tags),
        'issues': issues, 'reciprocal_checks': reciprocal_checks,
    }


def main():
    parser = argparse.ArgumentParser(description='Hreflang audit')
    parser.add_argument('--count', type=int, default=15, help='Number of articles to check')
    args = parser.parse_args()

    print(f"Getting {args.count} diverse sample articles...")
    articles = get_sample_articles(args.count)
    print(f"Auditing {len(articles)} articles...\n")

    results = []
    for i, article in enumerate(articles):
        print(f"  [{i+1}/{len(articles)}] {article['native_lang']}→{article['target_lang']} / {article['slug'][:40]}")
        result = audit_article(article)
        results.append(result)
        if result['issues']:
            for issue in result['issues']:
                print(f"    ⚠️  {issue}")
        else:
            print(f"    ✅ {result.get('tag_count', 0)} hreflang tags, reciprocals OK")

    # Generate report
    total_issues = sum(len(r['issues']) for r in results)
    clean = sum(1 for r in results if not r['issues'])

    report = f"""# Hreflang Audit — {len(results)} Articles

## Summary
- **Articles checked:** {len(results)}
- **Clean (no issues):** {clean}
- **With issues:** {len(results) - clean}
- **Total issues found:** {total_issues}

## Issue Breakdown
"""
    from collections import Counter
    issue_counts = Counter()
    for r in results:
        for i in r['issues']:
            # Generalize specific URLs
            generic = re.sub(r'https?://\S+', '[URL]', i)
            issue_counts[generic] += 1

    if issue_counts:
        for issue, count in issue_counts.most_common():
            report += f"- **{count}x** {issue}\n"
    else:
        report += "No issues found! 🎉\n"

    report += "\n## Per-Article Results\n"
    for r in results:
        status = "✅" if not r['issues'] else "⚠️"
        report += f"\n### {status} `{r['native']}→{r['target']}` {r['slug'][:50]}\n"
        report += f"- URL: {r['url']}\n"
        report += f"- Hreflang tags: {r.get('tag_count', len(r['tags']))}\n"
        if r['issues']:
            for i in r['issues']:
                report += f"- ⚠️ {i}\n"
        if r.get('reciprocal_checks'):
            report += f"- Reciprocal checks:\n"
            for rc in r['reciprocal_checks']:
                status_emoji = "✅" if rc['has_reciprocal'] else "❌"
                report += f"  - {status_emoji} {rc['target_lang']}: {rc['target_url'][:60]}\n"

    # Save
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, 'w') as f:
        f.write(report)

    print(f"\nReport saved to {OUTPUT}")
    print(f"Summary: {clean}/{len(results)} clean, {total_issues} total issues")


if __name__ == '__main__':
    main()
