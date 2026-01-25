#!/bin/bash
# Love Languages Article Factory
# Generates articles using local LLMs with brand voice

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOG_DIR="$(dirname "$SCRIPT_DIR")"
ARTICLES_DIR="$BLOG_DIR/src/content/articles"
QUARANTINE_DIR="$BLOG_DIR/.ai/quarantine"

# Models
GENERATOR_MODEL="qwen3:14b"
REVIEWER_MODEL="deepseek-r1:14b"

# Quality thresholds
MIN_SCORE=85
MAX_RETRIES=3

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $1"; }

# Load brand guide
BRAND_GUIDE=$(cat "$SCRIPT_DIR/BRAND_GUIDE.md")

generate_article() {
    local topic="$1"
    local target_lang="$2"
    local native_lang="$3"
    local template="$4"
    
    local template_content=$(cat "$SCRIPT_DIR/STRUCTURE_TEMPLATES/$template.md")
    local example_article=$(ls "$ARTICLES_DIR/en/pl/"*.mdx | head -1 | xargs cat)
    
    log "Generating: $topic ($native_lang → $target_lang)"
    
    local prompt="You are writing an article for Love Languages, a language learning app for couples.

<brand_guide>
$BRAND_GUIDE
</brand_guide>

<structure_template>
$template_content
</structure_template>

<example_article>
$example_article
</example_article>

TASK: Write a complete MDX article about: $topic
TARGET LANGUAGE: $target_lang
NATIVE LANGUAGE (article written in): $native_lang

REQUIREMENTS:
1. Follow the structure template EXACTLY
2. Match the brand voice from the guide
3. Include all required components (VocabCard, CultureTip, etc.)
4. Write in $native_lang (this is the language readers speak)
5. Teach $target_lang vocabulary/phrases
6. Include pronunciation guides for EVERY phrase
7. Make it romantic and couple-focused

Output ONLY the complete MDX file, starting with --- for frontmatter."

    ollama run "$GENERATOR_MODEL" "$prompt"
}

review_article() {
    local article_content="$1"
    local review_type="$2"  # "grammar" or "brand"
    
    local review_prompt=""
    
    if [ "$review_type" == "grammar" ]; then
        review_prompt="Review this article for:
1. Grammar and spelling errors (in the article's language)
2. Factual accuracy of language examples
3. Pronunciation guide correctness
4. MDX syntax errors

Article:
$article_content

Rate 0-100 and list specific issues. Format:
SCORE: [number]
ISSUES:
- [issue 1]
- [issue 2]
..."
    else
        review_prompt="Review this article for brand alignment:

<brand_guide>
$BRAND_GUIDE
</brand_guide>

Article:
$article_content

Check:
1. Does it match our voice (supportive, romantic, not academic)?
2. Are phrases couple-focused and practical?
3. Does it have emotional hooks?
4. Is it culturally appropriate?

Rate 0-100 and list specific issues. Format:
SCORE: [number]
ISSUES:
- [issue 1]
- [issue 2]
..."
    fi
    
    ollama run "$REVIEWER_MODEL" "$review_prompt"
}

fix_issues() {
    local article_content="$1"
    local issues="$2"
    
    local fix_prompt="Fix these specific issues in the article:

ISSUES TO FIX:
$issues

ARTICLE:
$article_content

Output the COMPLETE fixed article (full MDX file)."

    ollama run "$GENERATOR_MODEL" "$fix_prompt"
}

parse_score() {
    local review_output="$1"
    echo "$review_output" | grep -oP 'SCORE:\s*\K[0-9]+' | head -1
}

process_article() {
    local topic="$1"
    local target_lang="$2"
    local native_lang="$3"
    local template="${4:-phrases-list}"
    local slug=$(echo "$topic" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g')
    
    mkdir -p "$QUARANTINE_DIR"
    mkdir -p "$ARTICLES_DIR/$native_lang/$target_lang"
    
    local output_file="$ARTICLES_DIR/$native_lang/$target_lang/$slug.mdx"
    local attempt=1
    
    # Generate initial article
    local article=$(generate_article "$topic" "$target_lang" "$native_lang" "$template")
    
    while [ $attempt -le $MAX_RETRIES ]; do
        log "Review attempt $attempt/$MAX_RETRIES"
        
        # Grammar review
        local grammar_review=$(review_article "$article" "grammar")
        local grammar_score=$(parse_score "$grammar_review")
        log "Grammar score: $grammar_score"
        
        # Brand review
        local brand_review=$(review_article "$article" "brand")
        local brand_score=$(parse_score "$brand_review")
        log "Brand score: $brand_score"
        
        # Check if passes
        if [ "${grammar_score:-0}" -ge $MIN_SCORE ] && [ "${brand_score:-0}" -ge $MIN_SCORE ]; then
            log "✅ PASSED! Saving to $output_file"
            echo "$article" > "$output_file"
            return 0
        fi
        
        # Collect issues for fixing
        local all_issues="GRAMMAR ISSUES:
$grammar_review

BRAND ISSUES:
$brand_review"
        
        # Try to fix
        if [ $attempt -lt $MAX_RETRIES ]; then
            warn "Attempting auto-fix..."
            article=$(fix_issues "$article" "$all_issues")
        fi
        
        ((attempt++))
    done
    
    # Failed all attempts - quarantine
    error "Failed after $MAX_RETRIES attempts. Quarantining."
    echo "$article" > "$QUARANTINE_DIR/$slug-$(date +%Y%m%d%H%M%S).mdx"
    echo "$all_issues" > "$QUARANTINE_DIR/$slug-$(date +%Y%m%d%H%M%S)-issues.txt"
    return 1
}

# Usage example:
# ./article-factory.sh "50 Spanish Terms of Endearment" es en phrases-list

if [ $# -lt 3 ]; then
    echo "Usage: $0 <topic> <target_lang> <native_lang> [template]"
    echo "Example: $0 '50 Spanish Pet Names' es en phrases-list"
    exit 1
fi

process_article "$1" "$2" "$3" "${4:-phrases-list}"
