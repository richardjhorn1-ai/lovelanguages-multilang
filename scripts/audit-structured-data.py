#!/usr/bin/env python3.11
"""
Structured data audit — validate JSON-LD on article pages.

Usage:
  python3.11 scripts/audit-structured-data.py
  python3.11 scripts/audit-structured-data.py --count 20
"""

import json, re, os, sys, subprocess, argparse, random
from pathlib import Path

SITE = "https://www.lovelanguages.io"
OUTPUT = Path(__file__).parent.parent / "docs" / "STRUCTURED_DATA_AUDIT.md"

# Required fields per schema type
REQUIRED_FIELDS = {
    'BlogPosting': ['headline', '@type', 'author', 'datePublished', 'description'],
    'BreadcrumbList': ['@type', 'itemListElement'],
    'FAQPage': ['@type', 'mainEntity'],
    'HowTo': ['@type', 'name', 'step'],
    'SpeakableSpecification': ['@type'],
}


def get_sample_urls(count: int = 10) -> list:
    """Get a diverse sample of article URLs from Supabase."""
    key = ''
    with open(os.path.expanduser('~/clawd/secrets/.env.tokens')) as f:
        for line in f:
            if line.startswith('SUPABASE_SERVICE_KEY='):
                key = line.strip().split('=', 1)[1].strip('"').strip("'")

    url = 'https://iiusoobuoxurysrhqptx.supabase.co/rest/v1'

    # Get articles from different categories and languages
    r = subprocess.run([
        'curl', '-s',
        f'{url}/blog_articles?select=slug,native_lang,target_lang,category'
        f'&target_lang=neq.all&limit=500',
        '-H', f'apikey: {key}',
        '-H', f'Authorization: Bearer {key}'
    ], capture_output=True, text=True, timeout=30)

    articles = json.loads(r.stdout)

    # Ensure diversity: pick from different categories and native langs
    by_cat = {}
    for a in articles:
        cat = a.get('category', 'other')
        by_cat.setdefault(cat, []).append(a)

    selected = []
    cats = list(by_cat.keys())
    while len(selected) < count and cats:
        for cat in cats:
            if by_cat[cat] and len(selected) < count:
                a = random.choice(by_cat[cat])
                by_cat[cat].remove(a)
                selected.append(a)

    urls = []
    for a in selected:
        urls.append({
            'url': f"{SITE}/learn/{a['native_lang']}/{a['target_lang']}/{a['slug']}/",
            'slug': a['slug'],
            'native': a['native_lang'],
            'target': a['target_lang'],
            'category': a.get('category', ''),
        })

    return urls


def extract_jsonld(html: str) -> list:
    """Extract all JSON-LD blocks from HTML."""
    blocks = []
    pattern = r'<script\s+type=["\']application/ld\+json["\']>(.*?)</script>'
    matches = re.findall(pattern, html, re.DOTALL)
    for match in matches:
        try:
            data = json.loads(match)
            if isinstance(data, list):
                blocks.extend(data)
            else:
                blocks.append(data)
        except json.JSONDecodeError as e:
            blocks.append({'_parse_error': str(e), '_raw': match[:200]})
    return blocks


def validate_schema(schema: dict) -> list:
    """Validate a JSON-LD schema block."""
    issues = []
    schema_type = schema.get('@type', 'unknown')

    if '_parse_error' in schema:
        return [f"JSON parse error: {schema['_parse_error']}"]

    # Check required fields
    required = REQUIRED_FIELDS.get(schema_type, [])
    for field in required:
        if field not in schema or not schema[field]:
            issues.append(f"Missing required field: `{field}`")

    # Type-specific checks
    if schema_type == 'BlogPosting':
        # Check author format
        author = schema.get('author', {})
        if isinstance(author, dict) and not author.get('name'):
            issues.append("Author missing `name`")

        # Check dates
        for date_field in ['datePublished', 'dateModified']:
            val = schema.get(date_field, '')
            if val and not re.match(r'^\d{4}-\d{2}-\d{2}', str(val)):
                issues.append(f"`{date_field}` not in ISO format: {val}")

        # Check headline length
        headline = schema.get('headline', '')
        if len(headline) > 110:
            issues.append(f"Headline too long ({len(headline)} chars, max 110)")

        # Check image
        if 'image' not in schema:
            issues.append("Missing `image` field")

    elif schema_type == 'BreadcrumbList':
        items = schema.get('itemListElement', [])
        if not items:
            issues.append("Empty breadcrumb list")
        for i, item in enumerate(items):
            if 'name' not in item:
                issues.append(f"Breadcrumb item {i} missing `name`")
            if 'item' not in item and i < len(items) - 1:
                issues.append(f"Breadcrumb item {i} missing `item` URL")

    elif schema_type == 'FAQPage':
        entities = schema.get('mainEntity', [])
        if not entities:
            issues.append("FAQPage has no questions")
        for i, q in enumerate(entities):
            if q.get('@type') != 'Question':
                issues.append(f"FAQ item {i} not typed as Question")
            if 'name' not in q:
                issues.append(f"FAQ item {i} missing question text (`name`)")
            answer = q.get('acceptedAnswer', {})
            if 'text' not in answer:
                issues.append(f"FAQ item {i} missing answer text")

    return issues


def audit_url(url_info: dict) -> dict:
    """Audit a single URL's structured data."""
    url = url_info['url']
    r = subprocess.run(
        ['curl', '-s', '--max-time', '15', url],
        capture_output=True, text=True, timeout=20
    )

    if not r.stdout:
        return {**url_info, 'error': 'Failed to fetch', 'schemas': [], 'issues': ['Page fetch failed']}

    schemas = extract_jsonld(r.stdout)
    all_issues = []
    schema_results = []

    for schema in schemas:
        schema_type = schema.get('@type', 'unknown')
        issues = validate_schema(schema)
        schema_results.append({
            'type': schema_type,
            'issues': issues,
            'fields': list(schema.keys()),
        })
        all_issues.extend([f"[{schema_type}] {i}" for i in issues])

    # Check for expected schema types
    types_found = {s.get('@type') for s in schemas}
    if 'BlogPosting' not in types_found:
        all_issues.append("Missing BlogPosting schema")
    if 'BreadcrumbList' not in types_found:
        all_issues.append("Missing BreadcrumbList schema")

    return {
        **url_info,
        'schemas': schema_results,
        'types': list(types_found),
        'issues': all_issues,
        'schema_count': len(schemas),
    }


def main():
    parser = argparse.ArgumentParser(description='Structured data audit')
    parser.add_argument('--count', type=int, default=15, help='Number of URLs to check')
    args = parser.parse_args()

    print(f"Getting {args.count} diverse sample URLs...")
    urls = get_sample_urls(args.count)
    print(f"Auditing {len(urls)} pages...\n")

    results = []
    for i, url_info in enumerate(urls):
        print(f"  [{i+1}/{len(urls)}] {url_info['native']}→{url_info['target']} / {url_info['category']} / {url_info['slug'][:40]}")
        result = audit_url(url_info)
        results.append(result)
        if result['issues']:
            for issue in result['issues']:
                print(f"    ⚠️  {issue}")
        else:
            print(f"    ✅ All good ({result['schema_count']} schemas)")

    # Generate report
    total_issues = sum(len(r['issues']) for r in results)
    clean = sum(1 for r in results if not r['issues'])

    report = f"""# Structured Data Audit — {len(results)} Pages

## Summary
- **Pages checked:** {len(results)}
- **Clean (no issues):** {clean}
- **With issues:** {len(results) - clean}
- **Total issues found:** {total_issues}

## Issue Breakdown
"""
    # Aggregate issues
    from collections import Counter
    issue_counts = Counter()
    for r in results:
        for i in r['issues']:
            issue_counts[i] += 1

    if issue_counts:
        for issue, count in issue_counts.most_common():
            report += f"- **{count}x** {issue}\n"
    else:
        report += "No issues found! 🎉\n"

    report += "\n## Per-Page Results\n"
    for r in results:
        status = "✅" if not r['issues'] else "⚠️"
        report += f"\n### {status} `{r['native']}→{r['target']}` {r['slug'][:50]}\n"
        report += f"- Category: {r['category']}\n"
        report += f"- Schema types: {', '.join(r['types'])}\n"
        if r['issues']:
            report += f"- Issues:\n"
            for i in r['issues']:
                report += f"  - {i}\n"

    # Save
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, 'w') as f:
        f.write(report)

    print(f"\nReport saved to {OUTPUT}")
    print(f"Summary: {clean}/{len(results)} clean, {total_issues} total issues")


if __name__ == '__main__':
    main()
