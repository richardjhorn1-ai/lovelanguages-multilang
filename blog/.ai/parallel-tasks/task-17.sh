#!/bin/bash
echo "[TASK-17] cs/pt: How to Say I Love You"
./kimi-article-factory.sh single "How to Say I Love You" "pt" "cs" "how-to-say" > logs/task-17.log 2>&1
if [ -f "../src/content/articles/cs/pt/"*.mdx ]; then
  echo "[TASK-17] ✅ Done"
else
  echo "[TASK-17] ❌ Failed"
fi
