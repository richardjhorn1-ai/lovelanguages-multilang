#!/bin/bash
echo "[TASK-2] sv/el: Meeting Your Partner's Family"
./kimi-article-factory.sh single "Meeting Your Partner's Family" "el" "sv" "practical-guide" > logs/task-2.log 2>&1
if [ -f "../src/content/articles/sv/el/"*.mdx ]; then
  echo "[TASK-2] ✅ Done"
else
  echo "[TASK-2] ❌ Failed"
fi
