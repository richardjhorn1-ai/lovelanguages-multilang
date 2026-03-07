#!/usr/bin/env python3.11
"""
Sitemap audit — check all URLs for status codes, redirects, and orphans.

Usage:
  python3.11 scripts/audit-sitemaps.py
  python3.11 scripts/audit-sitemaps.py --sample 100  # Check 100 random URLs
"""

import json, re, os, sys, subprocess, argparse, random, xml.etree.ElementTree as ET
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import Counter

SITE = "https://www.lovelanguages.io"
OUTPUT = Path(__file__).parent.parent / "docs" / "SITEMAP_AUDIT.md"


LOCAL_SITEMAP_DIR = Path(__file__).parent.parent / '.vercel' / 'output' / 'static'


def fetch_sitemap_index():
    """Fetch and parse sitemap-index.xml (tries live URL, falls back to local build)."""
    xml_text = None

    # Try live URL first
    try:
        r = subprocess.run(
            ['curl', '-s', f'{SITE}/sitemap-index.xml'],
            capture_output=True, text=True, timeout=30
        )
        if r.stdout.strip().startswith('<?xml') or '<sitemapindex' in r.stdout[:500]:
            xml_text = r.stdout
        else:
            print("  Live sitemap returned non-XML (SPA catch-all), falling back to local build...")
    except Exception:
        pass

    # Fall back to local build output
    if not xml_text:
        local_path = LOCAL_SITEMAP_DIR / 'sitemap-index.xml'
        if local_path.exists():
            xml_text = local_path.read_text()
            print(f"  Using local: {local_path}")
        else:
            print(f"  ERROR: No sitemap found at {SITE}/sitemap-index.xml or {local_path}")
            return []

    root = ET.fromstring(xml_text)
    ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    sitemaps = []
    for sitemap in root.findall('.//sm:sitemap', ns):
        loc = sitemap.find('sm:loc', ns)
        if loc is not None:
            sitemaps.append(loc.text)
    return sitemaps


def fetch_sitemap_urls(sitemap_url: str) -> list:
    """Fetch and parse a single sitemap, return all URLs (tries live, falls back to local)."""
    xml_text = None

    # Try live URL first
    try:
        r = subprocess.run(
            ['curl', '-s', sitemap_url],
            capture_output=True, text=True, timeout=60
        )
        if r.stdout.strip() and (r.stdout.strip().startswith('<?xml') or '<urlset' in r.stdout[:500]):
            xml_text = r.stdout
    except Exception:
        pass

    # Fall back to local build
    if not xml_text:
        filename = sitemap_url.split('/')[-1]
        local_path = LOCAL_SITEMAP_DIR / filename
        if local_path.exists():
            xml_text = local_path.read_text()
        else:
            print(f"  WARNING: Cannot fetch {sitemap_url} and no local file {local_path}")
            return []

    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        print(f"  WARNING: Failed to parse {sitemap_url}")
        return []

    ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    urls = []
    for url in root.findall('.//sm:url', ns):
        loc = url.find('sm:loc', ns)
        if loc is not None:
            urls.append(loc.text)
    return urls


def check_url(url: str) -> dict:
    """Check HTTP status of a URL (follow redirects, report final status)."""
    r = subprocess.run(
        ['curl', '-s', '-o', '/dev/null', '-w',
         '%{http_code}|%{redirect_url}|%{url_effective}',
         '-L', '--max-redirs', '3', '--max-time', '10', url],
        capture_output=True, text=True, timeout=15
    )
    parts = r.stdout.strip().split('|')
    status = parts[0] if parts else 'err'
    redirect_url = parts[1] if len(parts) > 1 else ''
    final_url = parts[2] if len(parts) > 2 else url

    # Also check without following redirects
    r2 = subprocess.run(
        ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}',
         '--max-time', '10', url],
        capture_output=True, text=True, timeout=15
    )
    initial_status = r2.stdout.strip()

    return {
        'url': url,
        'initial_status': initial_status,
        'final_status': status,
        'redirect_url': redirect_url if initial_status in ('301', '302', '307', '308') else '',
        'final_url': final_url,
        'is_redirect': initial_status in ('301', '302', '307', '308'),
        'is_error': status in ('404', '500', '502', '503', 'err', '000'),
    }


def analyze_url(url: str) -> dict:
    """Analyze a URL for common issues."""
    issues = []

    if '://lovelanguages.io' in url and '://www.' not in url:
        issues.append('non-www')
    if not url.endswith('/') and '/learn/' in url:
        issues.append('no-trailing-slash')

    return issues


def main():
    parser = argparse.ArgumentParser(description='Sitemap audit')
    parser.add_argument('--sample', type=int, default=0, help='Check N random URLs (0=all)')
    parser.add_argument('--workers', type=int, default=10, help='Concurrent workers')
    args = parser.parse_args()

    print("Fetching sitemap index...")
    sitemaps = fetch_sitemap_index()
    print(f"Found {len(sitemaps)} sitemaps")

    all_urls = []
    for sm_url in sitemaps:
        print(f"  Fetching {sm_url}...")
        urls = fetch_sitemap_urls(sm_url)
        print(f"    → {len(urls)} URLs")
        all_urls.extend(urls)

    print(f"\nTotal URLs in sitemaps: {len(all_urls)}")

    # URL-level analysis (no HTTP needed)
    url_issues = {}
    for url in all_urls:
        issues = analyze_url(url)
        if issues:
            url_issues[url] = issues

    if url_issues:
        print(f"URLs with structural issues: {len(url_issues)}")

    # Sample if requested
    check_urls = all_urls
    if args.sample > 0 and args.sample < len(all_urls):
        check_urls = random.sample(all_urls, args.sample)
        print(f"Sampling {args.sample} URLs for HTTP check")

    # HTTP status checks
    print(f"\nChecking {len(check_urls)} URLs...")
    results = []
    status_counts = Counter()

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(check_url, url): url for url in check_urls}
        done = 0
        for future in as_completed(futures):
            result = future.result()
            results.append(result)
            status_counts[result['initial_status']] += 1
            done += 1
            if done % 100 == 0:
                print(f"  Progress: {done}/{len(check_urls)}")

    # Categorize results
    errors = [r for r in results if r['is_error']]
    redirects = [r for r in results if r['is_redirect']]
    ok = [r for r in results if not r['is_error'] and not r['is_redirect']]

    # Generate report
    report = f"""# Sitemap Audit — {len(all_urls)} URLs

## Summary
- **Total URLs in sitemaps:** {len(all_urls)}
- **URLs checked:** {len(check_urls)}
- **200 OK:** {len(ok)}
- **Redirects (301/302):** {len(redirects)}
- **Errors (404/500):** {len(errors)}
- **URLs with structural issues:** {len(url_issues)}

## Status Code Distribution
"""
    for status, count in sorted(status_counts.items()):
        report += f"- `{status}`: {count}\n"

    if errors:
        report += f"\n## Error URLs ({len(errors)})\n"
        for r in sorted(errors, key=lambda x: x['url']):
            report += f"- `{r['initial_status']}` {r['url']}\n"

    if redirects:
        report += f"\n## Redirect URLs ({len(redirects)})\n"
        for r in sorted(redirects, key=lambda x: x['url'])[:50]:
            report += f"- `{r['initial_status']}` {r['url']}"
            if r['redirect_url']:
                report += f" → {r['redirect_url']}"
            report += "\n"
        if len(redirects) > 50:
            report += f"\n... and {len(redirects) - 50} more\n"

    if url_issues:
        report += f"\n## Structural Issues ({len(url_issues)})\n"
        issue_types = Counter()
        for url, issues in url_issues.items():
            for i in issues:
                issue_types[i] += 1
        for issue, count in issue_types.most_common():
            report += f"- **{issue}:** {count} URLs\n"

    report += "\n## Sitemaps\n"
    for sm in sitemaps:
        report += f"- {sm}\n"

    # Save
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, 'w') as f:
        f.write(report)

    print(f"\nReport saved to {OUTPUT}")
    print(f"\nQuick summary: {len(ok)} ok, {len(redirects)} redirects, {len(errors)} errors")


if __name__ == '__main__':
    main()
