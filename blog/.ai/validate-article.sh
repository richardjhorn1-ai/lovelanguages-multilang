#!/bin/bash
# Article Validation Script
# Run this on EVERY generated article before committing
# Usage: ./validate-article.sh path/to/article.mdx

FILE="$1"
ERRORS=0
WARNINGS=0

if [ -z "$FILE" ]; then
    echo "Usage: $0 <article.mdx>"
    exit 1
fi

if [ ! -f "$FILE" ]; then
    echo "❌ File not found: $FILE"
    exit 1
fi

echo "🔍 Validating: $FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Extract frontmatter (between first two ---)
FRONTMATTER=$(awk '/^---$/{p=!p;next}p' "$FILE" | head -50)

# ═══════════════════════════════════════════════════════
# FRONTMATTER CHECKS
# ═══════════════════════════════════════════════════════

echo ""
echo "📋 FRONTMATTER CHECKS:"

# Required fields
for field in title description category difficulty readTime date language nativeLanguage; do
    if ! echo "$FRONTMATTER" | grep -q "^${field}:"; then
        echo "  ❌ Missing required field: $field"
        ERRORS=$((ERRORS + 1))
    else
        echo "  ✅ Has $field"
    fi
done

# Category validation
CATEGORY=$(echo "$FRONTMATTER" | grep "^category:" | cut -d: -f2 | tr -d ' ')
VALID_CATEGORIES="phrases vocabulary grammar culture situations pronunciation"
if ! echo "$VALID_CATEGORIES" | grep -qw "$CATEGORY"; then
    echo "  ❌ Invalid category: '$CATEGORY' (must be: $VALID_CATEGORIES)"
    ERRORS=$((ERRORS + 1))
fi

# Difficulty validation
DIFFICULTY=$(echo "$FRONTMATTER" | grep "^difficulty:" | cut -d: -f2 | tr -d ' ')
VALID_DIFFICULTIES="beginner intermediate advanced"
if ! echo "$VALID_DIFFICULTIES" | grep -qw "$DIFFICULTY"; then
    echo "  ❌ Invalid difficulty: '$DIFFICULTY' (must be: $VALID_DIFFICULTIES)"
    ERRORS=$((ERRORS + 1))
fi

# readTime must be a number (not "5 min")
READTIME=$(echo "$FRONTMATTER" | grep "^readTime:" | cut -d: -f2 | tr -d ' ')
if echo "$READTIME" | grep -q "[a-zA-Z]"; then
    echo "  ❌ readTime must be a NUMBER, not string: '$READTIME'"
    ERRORS=$((ERRORS + 1))
fi

# Language code validation
LANG=$(echo "$FRONTMATTER" | grep "^language:" | cut -d: -f2 | tr -d ' ')
NATIVE=$(echo "$FRONTMATTER" | grep "^nativeLanguage:" | cut -d: -f2 | tr -d ' ')
VALID_LANGS="en es fr it pt ro de nl sv no da pl cs ru uk el hu tr"
if [ -n "$LANG" ] && ! echo "$VALID_LANGS" | grep -qw "$LANG"; then
    echo "  ❌ Invalid language code: '$LANG'"
    ERRORS=$((ERRORS + 1))
fi
if [ -n "$NATIVE" ] && ! echo "$VALID_LANGS" | grep -qw "$NATIVE"; then
    echo "  ❌ Invalid nativeLanguage code: '$NATIVE'"
    ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════
# COMPONENT PROP CHECKS
# ═══════════════════════════════════════════════════════

echo ""
echo "🧩 COMPONENT PROP CHECKS:"

# Check for WRONG props (language-specific instead of generic)
BAD_PROPS=$(grep -c 'polish=\|swedish=\|spanish=\|french=\|german=\|italian=' "$FILE" || true)
BAD_PROPS=${BAD_PROPS:-0}
if [ "$BAD_PROPS" -gt 0 ]; then
    echo "  ❌ Found $BAD_PROPS language-specific props (use word=/translation= instead)"
    grep -n 'polish=\|swedish=\|spanish=\|french=\|german=\|italian=' "$FILE" | head -5
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ No language-specific props found"
fi

# Check VocabCard has word=
VOCABCARD_COUNT=$(grep -c "<VocabCard" "$FILE" || true)
VOCABCARD_COUNT=${VOCABCARD_COUNT:-0}
if [ "$VOCABCARD_COUNT" -gt 0 ]; then
    VOCABCARD_WITH_WORD=$(grep -A5 "<VocabCard" "$FILE" | grep -c "word=" || true)
    VOCABCARD_WITH_WORD=${VOCABCARD_WITH_WORD:-0}
    if [ "$VOCABCARD_WITH_WORD" -lt "$VOCABCARD_COUNT" ]; then
        echo "  ❌ Some VocabCard components missing 'word=' prop"
        ERRORS=$((ERRORS + 1))
    else
        echo "  ✅ All $VOCABCARD_COUNT VocabCard components have word= prop"
    fi
fi

# Check PhraseOfDay has pronunciation (REQUIRED)
PHRASEOFDAY_COUNT=$(grep -c "<PhraseOfDay" "$FILE" || true)
PHRASEOFDAY_COUNT=${PHRASEOFDAY_COUNT:-0}
if [ "$PHRASEOFDAY_COUNT" -gt 0 ]; then
    PHRASEOFDAY_WITH_PRON=$(grep -A5 "<PhraseOfDay" "$FILE" | grep -c "pronunciation=" || true)
    PHRASEOFDAY_WITH_PRON=${PHRASEOFDAY_WITH_PRON:-0}
    if [ "$PHRASEOFDAY_WITH_PRON" -lt "$PHRASEOFDAY_COUNT" ]; then
        echo "  ❌ PhraseOfDay MISSING required 'pronunciation=' prop"
        ERRORS=$((ERRORS + 1))
    else
        echo "  ✅ PhraseOfDay has pronunciation= prop"
    fi
fi

# Check CultureTip has flag (for non-Polish articles)
if [ "$LANG" != "pl" ]; then
    CULTURETIP_COUNT=$(grep -c "<CultureTip" "$FILE" || true)
    CULTURETIP_COUNT=${CULTURETIP_COUNT:-0}
    if [ "$CULTURETIP_COUNT" -gt 0 ]; then
        CULTURETIP_WITH_FLAG=$(grep -c 'CultureTip.*flag=' "$FILE" || true)
        CULTURETIP_WITH_FLAG=${CULTURETIP_WITH_FLAG:-0}
        if [ "$CULTURETIP_WITH_FLAG" -lt "$CULTURETIP_COUNT" ]; then
            echo "  ⚠️  $((CULTURETIP_COUNT - CULTURETIP_WITH_FLAG)) CultureTip(s) missing flag= prop (will default to 🇵🇱)"
            WARNINGS=$((WARNINGS + 1))
        else
            echo "  ✅ All CultureTip components have flag= prop"
        fi
    fi
fi

# ═══════════════════════════════════════════════════════
# MDX SYNTAX CHECKS
# ═══════════════════════════════════════════════════════

echo ""
echo "📝 MDX SYNTAX CHECKS:"

# Check for <3 (breaks MDX)
HEART_COUNT=$(grep -c "<3" "$FILE" || true)
HEART_COUNT=${HEART_COUNT:-0}
if [ "$HEART_COUNT" -gt 0 ]; then
    echo "  ❌ Found '<3' which breaks MDX parsing - use ❤️ emoji instead"
    grep -n "<3" "$FILE"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ No '<3' syntax issues"
fi

# ═══════════════════════════════════════════════════════
# CONTENT QUALITY CHECKS
# ═══════════════════════════════════════════════════════

echo ""
echo "📊 CONTENT QUALITY CHECKS:"

# Word count (minimum 500)
WORD_COUNT=$(wc -w < "$FILE" | tr -d ' ')
if [ "$WORD_COUNT" -lt 500 ]; then
    echo "  ⚠️  Low word count: $WORD_COUNT (recommend 500+)"
    WARNINGS=$((WARNINGS + 1))
else
    echo "  ✅ Word count: $WORD_COUNT"
fi

# Internal links (minimum 2)
INTERNAL_LINKS=$(grep -c '/learn/[a-z]' "$FILE" || true)
INTERNAL_LINKS=${INTERNAL_LINKS:-0}
if [ "$INTERNAL_LINKS" -lt 1 ]; then
    echo "  ❌ Only $INTERNAL_LINKS internal links (need at least 1)"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ Has $INTERNAL_LINKS internal links"
fi

# Has CTA
CTA_COUNT=$(grep -c "<CTA" "$FILE" || true)
CTA_COUNT=${CTA_COUNT:-0}
if [ "$CTA_COUNT" -eq 0 ]; then
    echo "  ❌ Missing CTA component"
    ERRORS=$((ERRORS + 1))
else
    echo "  ✅ Has CTA component"
fi

# Has PhraseOfDay
if [ "$PHRASEOFDAY_COUNT" -eq 0 ]; then
    echo "  ⚠️  No PhraseOfDay component (recommended)"
    WARNINGS=$((WARNINGS + 1))
else
    echo "  ✅ Has PhraseOfDay component"
fi

# ═══════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ERRORS" -gt 0 ]; then
    echo "❌ FAILED: $ERRORS error(s), $WARNINGS warning(s)"
    echo "   Fix errors before committing!"
    exit 1
elif [ "$WARNINGS" -gt 0 ]; then
    echo "⚠️  PASSED with $WARNINGS warning(s)"
    echo "   Consider fixing warnings for better quality"
    exit 0
else
    echo "✅ PASSED: All checks passed!"
    exit 0
fi
