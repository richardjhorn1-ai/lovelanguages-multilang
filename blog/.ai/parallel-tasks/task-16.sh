#!/bin/bash
echo "[TASK-16] cs/it: 50 Pet Names and Terms of Endearment"
./kimi-article-factory.sh single "50 Pet Names and Terms of Endearment" "it" "cs" "phrases-list" > logs/task-16.log 2>&1
if [ -f "../src/content/articles/cs/it/"*.mdx ]; then
  echo "[TASK-16] ✅ Done"
else
  echo "[TASK-16] ❌ Failed"
fi
