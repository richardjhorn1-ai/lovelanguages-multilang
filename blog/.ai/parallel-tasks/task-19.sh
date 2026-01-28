#!/bin/bash
echo "[TASK-19] cs/ru: 50 Pet Names and Terms of Endearment"
./kimi-article-factory.sh single "50 Pet Names and Terms of Endearment" "ru" "cs" "phrases-list" > logs/task-19.log 2>&1
if [ -f "../src/content/articles/cs/ru/"*.mdx ]; then
  echo "[TASK-19] ✅ Done"
else
  echo "[TASK-19] ❌ Failed"
fi
