#!/usr/bin/env python3.11
"""
Upload internal link changes to Supabase.

Merges v2 inline links + pass2 related articles, then updates content_html in Supabase.
Pass2 takes priority for overlapping articles (it includes v2 changes + related section).

Usage:
  python3.11 scripts/upload-internal-links.py --dry-run    # Preview counts
  python3.11 scripts/upload-internal-links.py              # Actually upload
"""

import json, os, sys, subprocess, argparse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

SUPABASE_URL = "https://iiusoobuoxurysrhqptx.supabase.co/rest/v1"
V2_DIR = Path(__file__).parent.parent / "data" / "articles-v2"
P2_DIR = Path(__file__).parent.parent / "data" / "articles-v2-pass2"
BATCH_SIZE = 50  # Update this many at a time
MAX_WORKERS = 5


def get_supabase_key():
    env_file = os.path.expanduser("~/clawd/secrets/.env.tokens")
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line.startswith("SUPABASE_SERVICE_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise ValueError("SUPABASE_SERVICE_KEY not found")


def load_all_articles():
    """Load and merge v2 + pass2 articles. Pass2 takes priority."""
    articles = {}  # id -> {id, slug, content_html, source}

    # Load v2 first
    for f in sorted(os.listdir(V2_DIR)):
        if not f.endswith('.json'):
            continue
        with open(V2_DIR / f) as fh:
            for a in json.load(fh):
                articles[a['id']] = {
                    'id': a['id'],
                    'slug': a['slug'],
                    'content_html': a['content_html'],
                    'source': 'v2',
                }

    v2_count = len(articles)

    # Load pass2 — overwrites v2 for overlapping articles
    overwritten = 0
    new_from_p2 = 0
    for f in sorted(os.listdir(P2_DIR)):
        if not f.endswith('.json'):
            continue
        with open(P2_DIR / f) as fh:
            for a in json.load(fh):
                if a['id'] in articles:
                    overwritten += 1
                else:
                    new_from_p2 += 1
                articles[a['id']] = {
                    'id': a['id'],
                    'slug': a['slug'],
                    'content_html': a['content_html'],
                    'source': 'pass2',
                }

    print(f"Loaded {v2_count} articles from v2")
    print(f"Loaded pass2: {overwritten} overwrites + {new_from_p2} new = {overwritten + new_from_p2}")
    print(f"Total unique articles to upload: {len(articles)}")

    return list(articles.values())


def update_article(article: dict, key: str) -> dict:
    """Update a single article's content_html in Supabase."""
    article_id = article['id']

    # Use PATCH to update just content_html
    payload = json.dumps({'content_html': article['content_html']})

    r = subprocess.run([
        'curl', '-s', '-w', '%{http_code}',
        '-X', 'PATCH',
        f'{SUPABASE_URL}/blog_articles?id=eq.{article_id}',
        '-H', f'apikey: {key}',
        '-H', f'Authorization: Bearer {key}',
        '-H', 'Content-Type: application/json',
        '-H', 'Prefer: return=minimal',
        '-d', payload,
    ], capture_output=True, text=True, timeout=30)

    status = r.stdout.strip()[-3:] if r.stdout else 'err'

    return {
        'id': article_id,
        'slug': article['slug'],
        'status': status,
        'ok': status in ('200', '204'),
    }


def main():
    parser = argparse.ArgumentParser(description='Upload internal links to Supabase')
    parser.add_argument('--dry-run', action='store_true', help='Preview without uploading')
    args = parser.parse_args()

    articles = load_all_articles()

    if args.dry_run:
        print(f"\nDRY RUN — would upload {len(articles)} articles")
        return

    key = get_supabase_key()

    print(f"\nUploading {len(articles)} articles to Supabase...")

    success = 0
    failed = 0
    errors = []

    # Process in batches with threading
    for i in range(0, len(articles), BATCH_SIZE):
        batch = articles[i:i + BATCH_SIZE]

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {executor.submit(update_article, a, key): a for a in batch}
            for future in as_completed(futures):
                result = future.result()
                if result['ok']:
                    success += 1
                else:
                    failed += 1
                    errors.append(result)

        done = min(i + BATCH_SIZE, len(articles))
        print(f"  Progress: {done}/{len(articles)} ({success} ok, {failed} failed)")

    print(f"\n{'='*60}")
    print(f"DONE: {success} updated, {failed} failed")

    if errors:
        print(f"\nFailed articles:")
        for e in errors[:20]:
            print(f"  {e['slug']} — HTTP {e['status']}")


if __name__ == '__main__':
    main()
