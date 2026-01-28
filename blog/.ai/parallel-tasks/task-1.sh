#!/bin/bash
echo "[TASK-1] sv/cs: Date Night Vocabulary"
./kimi-article-factory.sh single "Date Night Vocabulary" "cs" "sv" "phrases-list" > logs/task-1.log 2>&1
if [ -f "../src/content/articles/sv/cs/"*.mdx ]; then
  echo "[TASK-1] ✅ Done"
else
  echo "[TASK-1] ❌ Failed"
fi
