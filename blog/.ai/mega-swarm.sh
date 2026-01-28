#!/bin/bash
# Kimi K2.5 MEGA Swarm — 3 agents per language
# 18 languages × 3 agents = 54 parallel agents

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[MEGA]${NC} $1"; }
info() { echo -e "${BLUE}[MEGA]${NC} $1"; }

NATIVES="en es fr de it pt nl pl ru uk tr ro sv no da cs el hu"

log "🚀 MEGA SWARM — 54 Parallel Agents"
log "3 agents per language, split task ranges"
echo ""

# Kill any existing kimi processes
log "Stopping any existing agents..."
pkill -f "kimi-article-factory" 2>/dev/null
sleep 2

mkdir -p logs

# Launch 3 agents per language with different task ranges
for native in $NATIVES; do
    csv_file="tasks/tasks-${native}.csv"

    if [ ! -f "$csv_file" ]; then
        echo "⚠️  CSV not found: $csv_file"
        continue
    fi

    # Agent 1: tasks 1-57
    info "Launching ${native}-A (tasks 1-57)"
    ./kimi-article-factory.sh tasks "$csv_file" 1 57 > "logs/${native}-A-$(date +%H%M).log" 2>&1 &
    sleep 0.5

    # Agent 2: tasks 58-114
    info "Launching ${native}-B (tasks 58-114)"
    ./kimi-article-factory.sh tasks "$csv_file" 58 114 > "logs/${native}-B-$(date +%H%M).log" 2>&1 &
    sleep 0.5

    # Agent 3: tasks 115-170
    info "Launching ${native}-C (tasks 115-170)"
    ./kimi-article-factory.sh tasks "$csv_file" 115 170 > "logs/${native}-C-$(date +%H%M).log" 2>&1 &
    sleep 0.5
done

echo ""
log "✅ All 54 agents launched!"
log "Each language has 3 agents working in parallel"
echo ""

# Quick status
sleep 5
running=$(ps aux | grep "kimi-article-factory" | grep -v grep | wc -l)
log "Active processes: $running"
echo ""
log "Monitor with: watch -n 30 'find src/content/articles -name \"*.mdx\" | wc -l'"
log "Or run: ./check-progress.sh"
