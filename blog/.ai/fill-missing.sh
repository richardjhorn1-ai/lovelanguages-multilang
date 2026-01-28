#!/bin/bash
set -e

KIMI_KEY="${KIMI_API_KEY:-}"
if [ -z "$KIMI_KEY" ]; then
  echo "❌ KIMI_API_KEY not set"
  exit 1
fi

LOG_DIR="logs"
mkdir -p "$LOG_DIR"

# Read tasks and process
tail -n +2 tasks/missing-fill.csv | while IFS=, read -r native target topic; do
  output_path="../src/content/articles/${native}/${target}/${topic}.mdx"

  if [ -f "$output_path" ]; then
    echo "⏭️ Skipping $native/$target/$topic (exists)"
    continue
  fi

  echo "🔄 Generating $native/$target/$topic..."

  # Run kimi-article-factory
  ./kimi-article-factory.sh "$topic" "$target" "$native" 2>&1 | tee -a "$LOG_DIR/fill-missing.log"

  sleep 1
done

echo "✅ Fill complete!"
