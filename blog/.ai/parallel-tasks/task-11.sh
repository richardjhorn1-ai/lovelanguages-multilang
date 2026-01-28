#!/bin/bash
echo "[TASK-11] da/ro: 50 Pet Names and Terms of Endearment"
./kimi-article-factory.sh single "50 Pet Names and Terms of Endearment" "ro" "da" "phrases-list" > logs/task-11.log 2>&1
if [ -f "../src/content/articles/da/ro/"*.mdx ]; then
  echo "[TASK-11] ✅ Done"
else
  echo "[TASK-11] ❌ Failed"
fi
