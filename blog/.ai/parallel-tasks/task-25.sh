#!/bin/bash
echo "[TASK-25] el/de: 50 Pet Names and Terms of Endearment"
./kimi-article-factory.sh single "50 Pet Names and Terms of Endearment" "de" "el" "phrases-list" > logs/task-25.log 2>&1
if [ -f "../src/content/articles/el/de/"*.mdx ]; then
  echo "[TASK-25] ✅ Done"
else
  echo "[TASK-25] ❌ Failed"
fi
