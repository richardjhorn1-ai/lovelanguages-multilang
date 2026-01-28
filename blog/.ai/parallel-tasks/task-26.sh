#!/bin/bash
echo "[TASK-26] el/uk: 50 Pet Names and Terms of Endearment"
./kimi-article-factory.sh single "50 Pet Names and Terms of Endearment" "uk" "el" "phrases-list" > logs/task-26.log 2>&1
if [ -f "../src/content/articles/el/uk/"*.mdx ]; then
  echo "[TASK-26] ✅ Done"
else
  echo "[TASK-26] ❌ Failed"
fi
