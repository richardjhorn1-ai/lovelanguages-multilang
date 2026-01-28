#!/bin/bash
echo "[TASK-10] da/ro: Meeting Your Partner's Family"
./kimi-article-factory.sh single "Meeting Your Partner's Family" "ro" "da" "practical-guide" > logs/task-10.log 2>&1
if [ -f "../src/content/articles/da/ro/"*.mdx ]; then
  echo "[TASK-10] ✅ Done"
else
  echo "[TASK-10] ❌ Failed"
fi
