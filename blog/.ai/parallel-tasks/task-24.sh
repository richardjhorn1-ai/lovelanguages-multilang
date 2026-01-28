#!/bin/bash
echo "[TASK-24] cs/el: 50 Pet Names and Terms of Endearment"
./kimi-article-factory.sh single "50 Pet Names and Terms of Endearment" "el" "cs" "phrases-list" > logs/task-24.log 2>&1
if [ -f "../src/content/articles/cs/el/"*.mdx ]; then
  echo "[TASK-24] ✅ Done"
else
  echo "[TASK-24] ❌ Failed"
fi
