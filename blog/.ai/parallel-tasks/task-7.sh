#!/bin/bash
echo "[TASK-7] no/el: Grammar Basics for Beginners"
./kimi-article-factory.sh single "Grammar Basics for Beginners" "el" "no" "grammar-guide" > logs/task-7.log 2>&1
if [ -f "../src/content/articles/no/el/"*.mdx ]; then
  echo "[TASK-7] ✅ Done"
else
  echo "[TASK-7] ❌ Failed"
fi
