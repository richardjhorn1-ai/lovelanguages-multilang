#!/bin/bash
native=$1
LOG="logs/fill-${native}.log"

echo "[FILL] Starting $native" | tee "$LOG"

while IFS=, read -r nat target topic; do
  output="../src/content/articles/${nat}/${target}/${topic}.mdx"

  if [ -f "$output" ]; then
    echo "[FILL] ⏭️ $nat/$target/$topic exists" | tee -a "$LOG"
    continue
  fi

  echo "[FILL] 🔄 $nat/$target/$topic" | tee -a "$LOG"
  ./kimi-article-factory.sh "$topic" "$target" "$nat" >> "$LOG" 2>&1

  if [ -f "$output" ]; then
    echo "[FILL] ✅ $nat/$target/$topic done" | tee -a "$LOG"
  else
    echo "[FILL] ❌ $nat/$target/$topic FAILED" | tee -a "$LOG"
  fi

  sleep 0.5
done < tasks/missing-${native}.csv

echo "[FILL] ✅ $native complete!" | tee -a "$LOG"
