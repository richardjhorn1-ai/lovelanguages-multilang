#!/bin/bash
echo "[TASK-30] hu/cs: How to Say I Love You"
./kimi-article-factory.sh single "How to Say I Love You" "cs" "hu" "how-to-say" > logs/task-30.log 2>&1
if [ -f "../src/content/articles/hu/cs/"*.mdx ]; then
  echo "[TASK-30] ✅ Done"
else
  echo "[TASK-30] ❌ Failed"
fi
