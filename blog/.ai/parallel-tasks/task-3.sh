#!/bin/bash
echo "[TASK-3] sv/el: Grammar Basics for Beginners"
./kimi-article-factory.sh single "Grammar Basics for Beginners" "el" "sv" "grammar-guide" > logs/task-3.log 2>&1
if [ -f "../src/content/articles/sv/el/"*.mdx ]; then
  echo "[TASK-3] ✅ Done"
else
  echo "[TASK-3] ❌ Failed"
fi
