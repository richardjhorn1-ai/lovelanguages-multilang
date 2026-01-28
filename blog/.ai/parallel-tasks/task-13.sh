#!/bin/bash
echo "[TASK-13] da/el: How to Say I Love You"
./kimi-article-factory.sh single "How to Say I Love You" "el" "da" "how-to-say" > logs/task-13.log 2>&1
if [ -f "../src/content/articles/da/el/"*.mdx ]; then
  echo "[TASK-13] ✅ Done"
else
  echo "[TASK-13] ❌ Failed"
fi
