#!/bin/bash
echo "[TASK-4] no/fr: 50 Pet Names and Terms of Endearment"
./kimi-article-factory.sh single "50 Pet Names and Terms of Endearment" "fr" "no" "phrases-list" > logs/task-4.log 2>&1
if [ -f "../src/content/articles/no/fr/"*.mdx ]; then
  echo "[TASK-4] ✅ Done"
else
  echo "[TASK-4] ❌ Failed"
fi
