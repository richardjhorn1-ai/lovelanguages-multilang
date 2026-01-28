#!/bin/bash
LOG="logs/fill-sv.log"
echo "[FILL-sv] Starting" > "$LOG"

tail -n +1 tasks/fill-sv.csv | while IFS=, read -r nat target topic template; do
  existing=$(ls ../src/content/articles/${nat}/${target}/*.mdx 2>/dev/null | wc -l | tr -d ' ')
  if [ "$existing" -ge 10 ]; then
    echo "[FILL-sv] ⏭️ $nat/$target full" >> "$LOG"
    continue
  fi

  echo "[FILL-sv] 🔄 $nat/$target: $topic" >> "$LOG"
  ./kimi-article-factory.sh single "$topic" "$target" "$nat" "$template" >> "$LOG" 2>&1
  sleep 0.5
done

echo "[FILL-sv] ✅ Complete!" >> "$LOG"
