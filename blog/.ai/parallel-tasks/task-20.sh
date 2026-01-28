#!/bin/bash
echo "[TASK-20] cs/uk: 50 Pet Names and Terms of Endearment"
./kimi-article-factory.sh single "50 Pet Names and Terms of Endearment" "uk" "cs" "phrases-list" > logs/task-20.log 2>&1
if [ -f "../src/content/articles/cs/uk/"*.mdx ]; then
  echo "[TASK-20] ✅ Done"
else
  echo "[TASK-20] ❌ Failed"
fi
