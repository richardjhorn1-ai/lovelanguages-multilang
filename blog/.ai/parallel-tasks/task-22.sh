#!/bin/bash
echo "[TASK-22] cs/ro: Meeting Your Partner's Family"
./kimi-article-factory.sh single "Meeting Your Partner's Family" "ro" "cs" "practical-guide" > logs/task-22.log 2>&1
if [ -f "../src/content/articles/cs/ro/"*.mdx ]; then
  echo "[TASK-22] ✅ Done"
else
  echo "[TASK-22] ❌ Failed"
fi
