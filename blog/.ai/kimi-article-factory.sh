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

CRITICAL REQUIREMENTS:
1. Write the article body in $native_name (NOT English, unless native_lang is 'en')
2. Follow the structure template EXACTLY
3. Include ALL required MDX components (VocabCard, CultureTip, PhraseOfDay, CTA)
4. Every $target_name phrase MUST have a pronunciation guide
5. Make it romantic and couple-focused throughout
6. Include at least 2-3 internal links to related articles (use format: /learn/[native]/[target]/[slug]/)
7. Frontmatter must include: title, description, category, difficulty, readTime, date, image, tags, nativeLanguage, language

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

# Batch process from CSV
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

# Usage
usage() {
    echo "Love Languages Article Factory — Kimi K2.5 Edition"
    echo ""
    echo "Usage:"
    echo "  $0 single <topic> <target_lang> <native_lang> [template]"
    echo "  $0 batch <csv_file>"
    echo "  $0 test"
    echo ""
    echo "Templates: phrases-list, how-to-say, grammar-guide, cultural-guide, practical-guide, comparison"
    echo ""
    echo "Examples:"
    echo "  $0 single '50 Spanish Pet Names' es en phrases-list"
    echo "  $0 batch articles-to-generate.csv"
    echo "  $0 test  # Generate one test article"
}

# Test generation
test_generation() {
    log "Running test generation..."
    process_article "How to Say I Love You in Spanish" "es" "en" "how-to-say"
}

# Main
case "${1:-}" in
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
