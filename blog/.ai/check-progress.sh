#!/bin/bash
# Quick progress checker for the swarm

cd "$(dirname "$0")/.."

echo "=== SWARM PROGRESS ($(date '+%H:%M:%S')) ==="
echo ""

echo "New Languages (target: 170 each):"
for lang in sv no da cs el hu; do
    count=$(find "src/content/articles/$lang" -name "*.mdx" 2>/dev/null | wc -l | tr -d ' ')
    pct=$((count * 100 / 170))
    bar=$(printf '%*s' $((pct/5)) '' | tr ' ' '█')
    printf "  %-3s: %3d/170 (%2d%%) %s\n" "$lang" "$count" "$pct" "$bar"
done

echo ""
echo "Existing Languages (gap fill):"
for lang in en es fr de it pt nl pl ru uk tr ro; do
    count=$(find "src/content/articles/$lang" -name "*.mdx" 2>/dev/null | wc -l | tr -d ' ')
    printf "  %-3s: %3d articles\n" "$lang" "$count"
done

echo ""
total=$(find src/content/articles -name "*.mdx" 2>/dev/null | wc -l | tr -d ' ')
recent=$(find src/content/articles -name "*.mdx" -mmin -1 2>/dev/null | wc -l | tr -d ' ')
procs=$(ps aux | grep "kimi-article-factory" | grep -v grep | wc -l | tr -d ' ')
echo "Total articles: $total"
echo "Last minute: $recent new"
echo "Active processes: $procs"
