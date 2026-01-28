#!/bin/bash
LOG="logs/fill-v2.log"
echo "[FILL] Starting fill v2" | tee "$LOG"

tail -n +2 tasks/missing-fill-proper.csv | while IFS=, read -r native target topic template; do
  # Check if exists (approximate slug)
  slug=$(echo "$topic" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed "s/'/-/g")

  # Try to find existing
  existing=$(ls ../src/content/articles/${native}/${target}/*.mdx 2>/dev/null | wc -l)
  if [ "$existing" -ge 10 ]; then
    echo "[FILL] ⏭️ $native/$target already has 10 articles" | tee -a "$LOG"
    continue
  fi

  echo "[FILL] 🔄 $native/$target: $topic ($template)" | tee -a "$LOG"

  # Run kimi with proper args
  ./kimi-article-factory.sh single "$topic" "$target" "$native" "$template" >> "$LOG" 2>&1

  sleep 1
done

echo "[FILL] ✅ Complete!" | tee -a "$LOG"
