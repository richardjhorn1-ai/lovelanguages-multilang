#!/bin/bash
echo "[TASK-12] da/sv: How to Say I Love You"
./kimi-article-factory.sh single "How to Say I Love You" "sv" "da" "how-to-say" > logs/task-12.log 2>&1
if [ -f "../src/content/articles/da/sv/"*.mdx ]; then
  echo "[TASK-12] ✅ Done"
else
  echo "[TASK-12] ❌ Failed"
fi
