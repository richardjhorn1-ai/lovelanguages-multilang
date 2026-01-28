#!/bin/bash
echo "[TASK-9] da/de: Meeting Your Partner's Family"
./kimi-article-factory.sh single "Meeting Your Partner's Family" "de" "da" "practical-guide" > logs/task-9.log 2>&1
if [ -f "../src/content/articles/da/de/"*.mdx ]; then
  echo "[TASK-9] ✅ Done"
else
  echo "[TASK-9] ❌ Failed"
fi
