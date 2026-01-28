#!/bin/bash
echo "[TASK-27] el/ro: 50 Pet Names and Terms of Endearment"
./kimi-article-factory.sh single "50 Pet Names and Terms of Endearment" "ro" "el" "phrases-list" > logs/task-27.log 2>&1
if [ -f "../src/content/articles/el/ro/"*.mdx ]; then
  echo "[TASK-27] ✅ Done"
else
  echo "[TASK-27] ❌ Failed"
fi
