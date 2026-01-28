#!/bin/bash
echo "[TASK-15] cs/it: Date Night Vocabulary"
./kimi-article-factory.sh single "Date Night Vocabulary" "it" "cs" "phrases-list" > logs/task-15.log 2>&1
if [ -f "../src/content/articles/cs/it/"*.mdx ]; then
  echo "[TASK-15] ✅ Done"
else
  echo "[TASK-15] ❌ Failed"
fi
