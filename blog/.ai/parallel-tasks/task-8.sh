#!/bin/bash
echo "[TASK-8] no/hu: How to Say I Love You"
./kimi-article-factory.sh single "How to Say I Love You" "hu" "no" "how-to-say" > logs/task-8.log 2>&1
if [ -f "../src/content/articles/no/hu/"*.mdx ]; then
  echo "[TASK-8] ✅ Done"
else
  echo "[TASK-8] ❌ Failed"
fi
