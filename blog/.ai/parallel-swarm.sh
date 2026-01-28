#!/bin/bash
# Kimi K2.5 Parallel Swarm Launcher
# Runs multiple native language generations in parallel

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[SWARM]${NC} $1"; }
info() { echo -e "${BLUE}[SWARM]${NC} $1"; }

# Default: run 6 new native languages in parallel
NATIVES="${1:-sv no da cs el hu}"
MAX_PARALLEL="${2:-6}"

log "Starting Kimi K2.5 Swarm"
log "Languages: $NATIVES"
log "Max parallel: $MAX_PARALLEL"
echo ""

# Track PIDs
declare -a PIDS
declare -A LANG_PIDS

# Launch each native in background
for native in $NATIVES; do
    csv_file="tasks/tasks-${native}.csv"

    if [ ! -f "$csv_file" ]; then
        echo "⚠️  CSV not found: $csv_file"
        continue
    fi

    info "Launching agent for: $native"

    # Run in background, redirect output to log
    ./kimi-article-factory.sh tasks "$csv_file" > "logs/${native}-swarm-$(date +%Y%m%d%H%M%S).log" 2>&1 &

    pid=$!
    PIDS+=($pid)
    LANG_PIDS[$native]=$pid

    log "Started $native (PID: $pid)"

    # Small delay to avoid API rate limits
    sleep 2
done

echo ""
log "All agents launched!"
log "PIDs: ${PIDS[*]}"
echo ""

# Monitor loop
log "Monitoring progress... (Ctrl+C to stop monitoring, agents will continue)"
echo ""

while true; do
    running=0
    completed=0

    for native in $NATIVES; do
        pid=${LANG_PIDS[$native]}
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            ((running++))
            # Get last log line
            log_file=$(ls -t "logs/${native}-swarm-"*.log 2>/dev/null | head -1)
            if [ -f "$log_file" ]; then
                last_line=$(tail -1 "$log_file" 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g')
                printf "  🔄 %-3s: %s\n" "$native" "${last_line:0:60}"
            fi
        else
            ((completed++))
            printf "  ✅ %-3s: Completed\n" "$native"
        fi
    done

    echo ""
    echo "Running: $running | Completed: $completed / ${#PIDS[@]}"
    echo "---"

    # Exit if all done
    if [ $running -eq 0 ]; then
        log "All agents completed!"
        break
    fi

    sleep 30
done

echo ""
log "=== Final Summary ==="
for native in $NATIVES; do
    log_file=$(ls -t "logs/${native}-swarm-"*.log 2>/dev/null | head -1)
    if [ -f "$log_file" ]; then
        summary=$(grep -E "Success:|Failed:|Skipped:" "$log_file" | tail -3)
        echo "$native: $summary"
    fi
done
