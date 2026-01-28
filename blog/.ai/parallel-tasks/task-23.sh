#!/bin/bash
echo "[TASK-23] cs/sv: How to Say I Love You"
./kimi-article-factory.sh single "How to Say I Love You" "sv" "cs" "how-to-say" > logs/task-23.log 2>&1
if [ -f "../src/content/articles/cs/sv/"*.mdx ]; then
  echo "[TASK-23] ✅ Done"
else
  echo "[TASK-23] ❌ Failed"
fi
