#!/bin/bash
echo "[TASK-18] cs/pl: 50 Pet Names and Terms of Endearment"
./kimi-article-factory.sh single "50 Pet Names and Terms of Endearment" "pl" "cs" "phrases-list" > logs/task-18.log 2>&1
if [ -f "../src/content/articles/cs/pl/"*.mdx ]; then
  echo "[TASK-18] ✅ Done"
else
  echo "[TASK-18] ❌ Failed"
fi
