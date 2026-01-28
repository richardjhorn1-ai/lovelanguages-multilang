#!/bin/bash
echo "[TASK-14] cs/de: 50 Pet Names and Terms of Endearment"
./kimi-article-factory.sh single "50 Pet Names and Terms of Endearment" "de" "cs" "phrases-list" > logs/task-14.log 2>&1
if [ -f "../src/content/articles/cs/de/"*.mdx ]; then
  echo "[TASK-14] ✅ Done"
else
  echo "[TASK-14] ❌ Failed"
fi
