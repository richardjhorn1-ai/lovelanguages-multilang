#!/bin/bash
echo "[TASK-21] cs/tr: Meeting Your Partner's Family"
./kimi-article-factory.sh single "Meeting Your Partner's Family" "tr" "cs" "practical-guide" > logs/task-21.log 2>&1
if [ -f "../src/content/articles/cs/tr/"*.mdx ]; then
  echo "[TASK-21] ✅ Done"
else
  echo "[TASK-21] ❌ Failed"
fi
