#!/bin/bash
echo "[TASK-29] el/hu: Grammar Basics for Beginners"
./kimi-article-factory.sh single "Grammar Basics for Beginners" "hu" "el" "grammar-guide" > logs/task-29.log 2>&1
if [ -f "../src/content/articles/el/hu/"*.mdx ]; then
  echo "[TASK-29] ✅ Done"
else
  echo "[TASK-29] ❌ Failed"
fi
