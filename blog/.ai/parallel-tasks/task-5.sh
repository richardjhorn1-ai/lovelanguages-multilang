#!/bin/bash
echo "[TASK-5] no/uk: How to Say I Love You"
./kimi-article-factory.sh single "How to Say I Love You" "uk" "no" "how-to-say" > logs/task-5.log 2>&1
if [ -f "../src/content/articles/no/uk/"*.mdx ]; then
  echo "[TASK-5] ✅ Done"
else
  echo "[TASK-5] ❌ Failed"
fi
