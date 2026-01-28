#!/bin/bash
echo "[TASK-6] no/sv: 50 Pet Names and Terms of Endearment"
./kimi-article-factory.sh single "50 Pet Names and Terms of Endearment" "sv" "no" "phrases-list" > logs/task-6.log 2>&1
if [ -f "../src/content/articles/no/sv/"*.mdx ]; then
  echo "[TASK-6] ✅ Done"
else
  echo "[TASK-6] ❌ Failed"
fi
