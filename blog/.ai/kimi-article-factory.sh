#!/bin/bash
# Love Languages Article Factory — Kimi K2.5 Edition
# Generates high-quality blog articles using Moonshot's Kimi API

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOG_DIR="$(dirname "$SCRIPT_DIR")"
ARTICLES_DIR="$BLOG_DIR/src/content/articles"
QUARANTINE_DIR="$BLOG_DIR/.ai/quarantine"
LOG_DIR="$BLOG_DIR/.ai/logs"

# API Config
KIMI_API_KEY="${KIMI_API_KEY:-sk-kpGbm89XQbbdDmQcxITBx3urX5HAw9cq6Pp5Cwn4EG5DjSho}"
KIMI_ENDPOINT="https://api.moonshot.ai/v1/chat/completions"
KIMI_MODEL="kimi-k2-turbo-preview"

# Quality settings
MAX_RETRIES=2
DELAY_BETWEEN_ARTICLES=2  # seconds

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠${NC} $1"; }
error() { echo -e "${RED}[$(date '+%H:%M:%S')] ✗${NC} $1"; }
info() { echo -e "${BLUE}[$(date '+%H:%M:%S')] ℹ${NC} $1"; }

# Load files
BRAND_GUIDE=$(cat "$SCRIPT_DIR/BRAND_GUIDE.md")

# Get language names
get_language_name() {
    local code="$1"
    case "$code" in
        en) echo "English" ;;
        es) echo "Spanish" ;;
        fr) echo "French" ;;
        de) echo "German" ;;
        it) echo "Italian" ;;
        pt) echo "Portuguese" ;;
        pl) echo "Polish" ;;
        nl) echo "Dutch" ;;
        ru) echo "Russian" ;;
        uk) echo "Ukrainian" ;;
        tr) echo "Turkish" ;;
        ro) echo "Romanian" ;;
        cs) echo "Czech" ;;
        el) echo "Greek" ;;
        hu) echo "Hungarian" ;;
        sv) echo "Swedish" ;;
        no) echo "Norwegian" ;;
        da) echo "Danish" ;;
        *) echo "$code" ;;
    esac
}

# Call Kimi API
call_kimi() {
    local prompt="$1"
    local max_tokens="${2:-8000}"

    local response=$(curl -s --max-time 180 "$KIMI_ENDPOINT" \
        -H "Authorization: Bearer $KIMI_API_KEY" \
        -H "Content-Type: application/json" \
        -d "$(jq -n \
            --arg model "$KIMI_MODEL" \
            --arg prompt "$prompt" \
            --argjson max_tokens "$max_tokens" \
            '{
                model: $model,
                messages: [{"role": "user", "content": $prompt}],
                temperature: 0.7,
                max_tokens: $max_tokens
            }')")

    # Check for errors
    local error_msg=$(echo "$response" | jq -r '.error.message // empty')
    if [ -n "$error_msg" ]; then
        error "API Error: $error_msg"
        return 1
    fi

    echo "$response" | jq -r '.choices[0].message.content // empty'
}

# Generate article
generate_article() {
    local topic="$1"
    local target_lang="$2"
    local native_lang="$3"
    local template="$4"

    local target_name=$(get_language_name "$target_lang")
    local native_name=$(get_language_name "$native_lang")

    # Load template
    local template_file="$SCRIPT_DIR/STRUCTURE_TEMPLATES/$template.md"
    if [ ! -f "$template_file" ]; then
        error "Template not found: $template"
        return 1
    fi
    local template_content=$(cat "$template_file")

    # Load example article for reference
    local example_article=""
    local example_file=$(ls "$ARTICLES_DIR/en/pl/"*.mdx 2>/dev/null | head -1)
    if [ -f "$example_file" ]; then
        example_article=$(head -200 "$example_file")
    fi

    # Get available articles for internal linking
    local available_articles=""
    local article_dir="$ARTICLES_DIR/$native_lang/$target_lang"
    if [ -d "$article_dir" ]; then
        available_articles=$(ls "$article_dir"/*.mdx 2>/dev/null | xargs -I{} basename {} .mdx | head -20 | sed "s|^|/learn/$native_lang/$target_lang/|" | sed 's|$|/|')
    fi

    # Always provide P0 topic links as fallback (these will exist after Phase 2)
    local p0_links="/learn/$native_lang/$target_lang/how-to-say-i-love-you-in-$(get_language_name "$target_lang" | tr '[:upper:]' '[:lower:]')/
/learn/$native_lang/$target_lang/$(get_language_name "$target_lang" | tr '[:upper:]' '[:lower:]')-pet-names-for-your-partner/
/learn/$native_lang/$target_lang/essential-$(get_language_name "$target_lang" | tr '[:upper:]' '[:lower:]')-phrases-for-couples/
/learn/$native_lang/$target_lang/$(get_language_name "$target_lang" | tr '[:upper:]' '[:lower:]')-greetings-and-farewells/
/learn/$native_lang/$target_lang/$(get_language_name "$target_lang" | tr '[:upper:]' '[:lower:]')-date-night-vocabulary/
/learn/$native_lang/$target_lang/romantic-$(get_language_name "$target_lang" | tr '[:upper:]' '[:lower:]')-phrases-for-every-occasion/"

    # Combine available and P0 links
    if [ -z "$available_articles" ]; then
        available_articles="$p0_links"
    else
        available_articles="$available_articles
$p0_links"
    fi

    local today=$(date '+%Y-%m-%d')

    local prompt="You are an expert content writer for Love Languages, a language learning app for international couples.

<brand_guide>
$BRAND_GUIDE
</brand_guide>

<structure_template>
$template_content
</structure_template>

<example_article_format>
$example_article
</example_article_format>

TASK: Write a complete MDX article.

TOPIC: $topic
TARGET LANGUAGE: $target_name ($target_lang) — this is the language being taught
NATIVE LANGUAGE: $native_name ($native_lang) — write the article IN this language (the reader speaks this)
DATE: $today

INTERNAL LINKS - YOU MUST INCLUDE AT LEAST 2 OF THESE (markdown format):
$available_articles

Example of how to include internal links in text:
\"Om du vill lära dig fler kärleksfulla fraser, kolla in [engelska smeknamn för din partner](/learn/sv/en/english-pet-names-for-your-partner/).\"
\"Läs också vår guide till [romantiska engelska fraser](/learn/sv/en/romantic-english-phrases-for-every-occasion/).\"

CRITICAL REQUIREMENTS (WILL BE VALIDATED - ARTICLE REJECTED IF NOT MET):
1. Write the article body in $native_name (NOT English, unless native_lang is 'en')
2. Follow the structure template EXACTLY
3. Include ALL required MDX components (VocabCard, CultureTip, PhraseOfDay, CTA)
4. Every $target_name phrase MUST have a pronunciation guide
5. Make it romantic and couple-focused throughout
6. MANDATORY: Include at least 2 internal links from the list above using markdown format [text](/learn/.../) - weave them naturally into the text. THIS IS REQUIRED FOR VALIDATION.
7. Frontmatter must include: title, description, category, difficulty, readTime, date, image, tags, nativeLanguage, language

COMPONENT PROPS (CRITICAL - use exactly these prop names):
- VocabCard: word="TARGET_WORD" translation="TRANSLATION" pronunciation="PHONETIC" example="EXAMPLE_SENTENCE"
- PhraseOfDay: word="TARGET_PHRASE" translation="TRANSLATION" pronunciation="PHONETIC" context="USAGE_CONTEXT"
- CultureTip: flag="FLAG_EMOJI" title="SHORT_TITLE" then content between opening and closing tags
- CTA: just <CTA /> with no props

FLAG EMOJIS BY LANGUAGE:
en=🇬🇧, es=🇪🇸, fr=🇫🇷, de=🇩🇪, it=🇮🇹, pt=🇵🇹, pl=🇵🇱, nl=🇳🇱, ru=🇷🇺, uk=🇺🇦, tr=🇹🇷, ro=🇷🇴, cs=🇨🇿, el=🇬🇷, hu=🇭🇺, sv=🇸🇪, no=🇳🇴, da=🇩🇰

DO NOT use language-specific prop names like swedish=, polish=, spanish=, french=, etc. ALWAYS use word= and translation=.

OUTPUT FORMAT:
- Start with --- (frontmatter)
- Then imports
- Then article content
- End with <CTA />

Output ONLY the complete MDX file. No explanations before or after."

    call_kimi "$prompt" 8000
}

# Validate article
validate_article() {
    local content="$1"
    local errors=""

    # Check frontmatter
    if ! echo "$content" | head -1 | grep -q "^---"; then
        errors="$errors\n- Missing frontmatter (should start with ---)"
    fi

    # Check required fields
    for field in title description category difficulty date nativeLanguage language; do
        if ! echo "$content" | grep -q "^$field:"; then
            errors="$errors\n- Missing frontmatter field: $field"
        fi
    done

    # Check imports
    if ! echo "$content" | grep -q "import.*from.*@components"; then
        errors="$errors\n- Missing component imports"
    fi

    # Check required components
    if ! echo "$content" | grep -q "<PhraseOfDay"; then
        errors="$errors\n- Missing PhraseOfDay component"
    fi
    if ! echo "$content" | grep -q "<CTA"; then
        errors="$errors\n- Missing CTA component"
    fi

    # Check minimum length
    local word_count=$(echo "$content" | wc -w)
    if [ "$word_count" -lt 500 ]; then
        errors="$errors\n- Article too short ($word_count words, need 500+)"
    fi

    # Check internal links (minimum 2)
    local link_count=$(echo "$content" | grep -c '/learn/[a-z]' || true)
    if [ "$link_count" -lt 2 ]; then
        errors="$errors\n- Not enough internal links ($link_count found, need 2+)"
    fi

    # Check for forbidden props (language-specific)
    if echo "$content" | grep -q 'polish=\|swedish=\|spanish=\|french='; then
        errors="$errors\n- Found language-specific props (use word=/translation= instead)"
    fi

    # Check for <3 (breaks MDX)
    if echo "$content" | grep -q '<3'; then
        errors="$errors\n- Found '<3' which breaks MDX (use ❤️ emoji instead)"
    fi

    if [ -n "$errors" ]; then
        echo -e "$errors"
        return 1
    fi

    return 0
}

# Process single article
process_article() {
    local topic="$1"
    local target_lang="$2"
    local native_lang="$3"
    local template="${4:-phrases-list}"

    # Generate slug
    local slug=$(echo "$topic" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')

    local output_dir="$ARTICLES_DIR/$native_lang/$target_lang"
    local output_file="$output_dir/$slug.mdx"

    # Check if already exists
    if [ -f "$output_file" ]; then
        info "Already exists: $output_file"
        return 0
    fi

    mkdir -p "$output_dir"
    mkdir -p "$QUARANTINE_DIR"
    mkdir -p "$LOG_DIR"

    log "Generating: $topic ($native_lang → $target_lang)"

    local attempt=1
    local article=""

    while [ $attempt -le $MAX_RETRIES ]; do
        log "Attempt $attempt/$MAX_RETRIES..."

        article=$(generate_article "$topic" "$target_lang" "$native_lang" "$template")

        if [ -z "$article" ]; then
            warn "Empty response, retrying..."
            ((attempt++))
            sleep 2
            continue
        fi

        # Validate
        local validation_errors=$(validate_article "$article")

        if [ -z "$validation_errors" ]; then
            log "✅ Validation passed!"
            echo "$article" > "$output_file"
            log "Saved: $output_file"
            return 0
        else
            warn "Validation failed:$validation_errors"
        fi

        ((attempt++))
        sleep 2
    done

    # Failed - quarantine
    error "Failed after $MAX_RETRIES attempts. Quarantining."
    local timestamp=$(date +%Y%m%d%H%M%S)
    echo "$article" > "$QUARANTINE_DIR/${slug}-${timestamp}.mdx"
    echo -e "Topic: $topic\nTarget: $target_lang\nNative: $native_lang\nErrors: $validation_errors" > "$QUARANTINE_DIR/${slug}-${timestamp}-errors.txt"
    return 1
}

# Batch process from CSV (old format)
batch_process() {
    local csv_file="$1"
    local success=0
    local failed=0

    log "Starting batch process from: $csv_file"

    while IFS=',' read -r topic target_lang native_lang template; do
        # Skip header and empty lines
        [[ "$topic" == "topic" ]] && continue
        [[ -z "$topic" ]] && continue

        if process_article "$topic" "$target_lang" "$native_lang" "$template"; then
            ((success++))
        else
            ((failed++))
        fi

        sleep "$DELAY_BETWEEN_ARTICLES"
    done < "$csv_file"

    log "Batch complete: $success succeeded, $failed failed"
}

# Process task CSV (new format: task_id,native_lang,target_lang,topic_id,template,slug,title,output_path)
process_task_csv() {
    local csv_file="$1"
    local start_task="${2:-1}"
    local end_task="${3:-9999}"
    local success=0
    local failed=0
    local skipped=0

    local native_lang=$(basename "$csv_file" | sed 's/tasks-//' | sed 's/.csv//')
    local log_file="$LOG_DIR/${native_lang}-$(date +%Y%m%d%H%M%S).log"

    log "Processing tasks from: $csv_file"
    log "Task range: $start_task to $end_task"
    log "Log file: $log_file"

    echo "=== Generation Log ===" > "$log_file"
    echo "Started: $(date)" >> "$log_file"
    echo "CSV: $csv_file" >> "$log_file"
    echo "" >> "$log_file"

    while IFS=',' read -r task_id n_lang t_lang topic_id template slug title output_path; do
        # Skip header
        [[ "$task_id" == "task_id" ]] && continue
        [[ -z "$task_id" ]] && continue

        # Check task range
        [[ "$task_id" -lt "$start_task" ]] && continue
        [[ "$task_id" -gt "$end_task" ]] && break

        # Clean up title (remove quotes)
        title=$(echo "$title" | sed 's/^"//;s/"$//')

        # Check if file exists
        local full_output_path="$BLOG_DIR/$output_path"
        if [ -f "$full_output_path" ]; then
            info "[$task_id] SKIP: $slug (exists)"
            echo "[$(date '+%H:%M:%S')] Task $task_id: ⏭️ SKIPPED - $slug (exists)" >> "$log_file"
            ((skipped++))
            continue
        fi

        log "[$task_id] Generating: $title"

        # Map topic_id to actual topic name for the prompt
        local topic_name
        case "$topic_id" in
            1) topic_name="How to Say I Love You" ;;
            2) topic_name="Pet Names and Terms of Endearment (50+)" ;;
            3) topic_name="Essential Phrases for Couples" ;;
            4) topic_name="Meeting Your Partner's Family" ;;
            5) topic_name="Greetings and Farewells" ;;
            6) topic_name="Date Night Vocabulary" ;;
            7) topic_name="Romantic Phrases for Every Occasion" ;;
            8) topic_name="Pronunciation Guide for Beginners" ;;
            9) topic_name="Grammar Basics for Beginners" ;;
            10) topic_name="Is This Language Hard to Learn?" ;;
            *) topic_name="$title" ;;
        esac

        if process_article "$topic_name" "$t_lang" "$n_lang" "$template"; then
            echo "[$(date '+%H:%M:%S')] Task $task_id: ✅ SUCCESS - $slug" >> "$log_file"
            ((success++))
        else
            echo "[$(date '+%H:%M:%S')] Task $task_id: ❌ FAILED - $slug" >> "$log_file"
            ((failed++))
        fi

        sleep "$DELAY_BETWEEN_ARTICLES"
    done < "$csv_file"

    echo "" >> "$log_file"
    echo "=== Summary ===" >> "$log_file"
    echo "Completed: $(date)" >> "$log_file"
    echo "Success: $success" >> "$log_file"
    echo "Failed: $failed" >> "$log_file"
    echo "Skipped: $skipped" >> "$log_file"

    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "✅ Success: $success"
    log "❌ Failed: $failed"
    log "⏭️  Skipped: $skipped"
    log "📝 Log: $log_file"
}

# Usage
usage() {
    echo "Love Languages Article Factory — Kimi K2.5 Edition"
    echo ""
    echo "Usage:"
    echo "  $0 single <topic> <target_lang> <native_lang> [template]"
    echo "  $0 batch <csv_file>"
    echo "  $0 tasks <task_csv> [start_task] [end_task]"
    echo "  $0 test"
    echo ""
    echo "Templates: phrases-list, how-to-say, grammar-guide, cultural-guide, practical-guide, comparison"
    echo ""
    echo "Examples:"
    echo "  $0 single '50 Spanish Pet Names' es en phrases-list"
    echo "  $0 batch articles-to-generate.csv"
    echo "  $0 tasks tasks/tasks-sv.csv           # Process all Swedish tasks"
    echo "  $0 tasks tasks/tasks-sv.csv 1 10      # Process tasks 1-10 only"
    echo "  $0 test  # Generate one test article"
}

# Test generation
test_generation() {
    log "Running test generation..."
    process_article "How to Say I Love You in Spanish" "es" "en" "how-to-say"
}

# Main
case "${1:-}" in
    tasks)
        if [ $# -lt 2 ]; then
            usage
            exit 1
        fi
        process_task_csv "$2" "${3:-1}" "${4:-9999}"
        ;;
    single)
        if [ $# -lt 4 ]; then
            usage
            exit 1
        fi
        process_article "$2" "$3" "$4" "${5:-phrases-list}"
        ;;
    batch)
        if [ $# -lt 2 ]; then
            usage
            exit 1
        fi
        batch_process "$2"
        ;;
    test)
        test_generation
        ;;
    *)
        usage
        exit 1
        ;;
esac
