#!/bin/bash
echo "[TASK-28] el/no: Date Night Vocabulary"
./kimi-article-factory.sh single "Date Night Vocabulary" "no" "el" "phrases-list" > logs/task-28.log 2>&1
if [ -f "../src/content/articles/el/no/"*.mdx ]; then
  echo "[TASK-28] ✅ Done"
else
  echo "[TASK-28] ❌ Failed"
fi
