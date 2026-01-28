#!/bin/bash
# Generate task CSVs for each native language
# Each CSV contains 10 P0 topics × 17 target languages = 170 tasks

TASK_DIR="$(dirname "$0")"
cd "$TASK_DIR"

# All 18 native languages
NATIVES="en es fr de it pt nl pl ru uk tr ro sv no da cs el hu"

# All 18 target languages (same list)
TARGETS="en es fr de it pt nl pl ru uk tr ro sv no da cs el hu"

# Function to get language name from code
get_lang_name() {
  case "$1" in
    en) echo "english" ;;
    es) echo "spanish" ;;
    fr) echo "french" ;;
    de) echo "german" ;;
    it) echo "italian" ;;
    pt) echo "portuguese" ;;
    nl) echo "dutch" ;;
    pl) echo "polish" ;;
    ru) echo "russian" ;;
    uk) echo "ukrainian" ;;
    tr) echo "turkish" ;;
    ro) echo "romanian" ;;
    sv) echo "swedish" ;;
    no) echo "norwegian" ;;
    da) echo "danish" ;;
    cs) echo "czech" ;;
    el) echo "greek" ;;
    hu) echo "hungarian" ;;
  esac
}

# Function to capitalize first letter
capitalize() {
  echo "$1" | awk '{print toupper(substr($0,1,1)) substr($0,2)}'
}

# Generate CSV for each native language
for native in $NATIVES; do
  csv_file="tasks-${native}.csv"

  # CSV header
  echo "task_id,native_lang,target_lang,topic_id,template,slug,title,output_path" > "$csv_file"

  task_num=1

  for target in $TARGETS; do
    # Skip if native == target (can't learn your own language)
    [ "$native" = "$target" ] && continue

    target_name=$(get_lang_name "$target")
    target_name_cap=$(capitalize "$target_name")

    # P0 Topic 1: How to say I love you
    slug="how-to-say-i-love-you-in-${target_name}"
    title="How to Say I Love You in ${target_name_cap}"
    echo "${task_num},${native},${target},1,how-to-say,${slug},\"${title}\",src/content/articles/${native}/${target}/${slug}.mdx" >> "$csv_file"
    ((task_num++))

    # P0 Topic 2: Pet names
    slug="${target_name}-pet-names-for-your-partner"
    title="${target_name_cap} Pet Names for Your Partner"
    echo "${task_num},${native},${target},2,phrases-list,${slug},\"${title}\",src/content/articles/${native}/${target}/${slug}.mdx" >> "$csv_file"
    ((task_num++))

    # P0 Topic 3: Essential phrases
    slug="essential-${target_name}-phrases-for-couples"
    title="Essential ${target_name_cap} Phrases for Couples"
    echo "${task_num},${native},${target},3,phrases-list,${slug},\"${title}\",src/content/articles/${native}/${target}/${slug}.mdx" >> "$csv_file"
    ((task_num++))

    # P0 Topic 4: Meeting family
    slug="meeting-your-partners-${target_name}-family"
    title="Meeting Your Partner's ${target_name_cap} Family"
    echo "${task_num},${native},${target},4,practical-guide,${slug},\"${title}\",src/content/articles/${native}/${target}/${slug}.mdx" >> "$csv_file"
    ((task_num++))

    # P0 Topic 5: Greetings
    slug="${target_name}-greetings-and-farewells"
    title="${target_name_cap} Greetings and Farewells"
    echo "${task_num},${native},${target},5,phrases-list,${slug},\"${title}\",src/content/articles/${native}/${target}/${slug}.mdx" >> "$csv_file"
    ((task_num++))

    # P0 Topic 6: Date night
    slug="${target_name}-date-night-vocabulary"
    title="${target_name_cap} Date Night Vocabulary"
    echo "${task_num},${native},${target},6,phrases-list,${slug},\"${title}\",src/content/articles/${native}/${target}/${slug}.mdx" >> "$csv_file"
    ((task_num++))

    # P0 Topic 7: Romantic phrases
    slug="romantic-${target_name}-phrases-for-every-occasion"
    title="Romantic ${target_name_cap} Phrases for Every Occasion"
    echo "${task_num},${native},${target},7,phrases-list,${slug},\"${title}\",src/content/articles/${native}/${target}/${slug}.mdx" >> "$csv_file"
    ((task_num++))

    # P0 Topic 8: Pronunciation guide
    slug="${target_name}-pronunciation-guide-for-beginners"
    title="${target_name_cap} Pronunciation Guide for Beginners"
    echo "${task_num},${native},${target},8,grammar-guide,${slug},\"${title}\",src/content/articles/${native}/${target}/${slug}.mdx" >> "$csv_file"
    ((task_num++))

    # P0 Topic 9: Grammar basics
    slug="${target_name}-grammar-basics-for-beginners"
    title="${target_name_cap} Grammar Basics for Beginners"
    echo "${task_num},${native},${target},9,grammar-guide,${slug},\"${title}\",src/content/articles/${native}/${target}/${slug}.mdx" >> "$csv_file"
    ((task_num++))

    # P0 Topic 10: Is X hard to learn
    slug="is-${target_name}-hard-to-learn"
    title="Is ${target_name_cap} Hard to Learn?"
    echo "${task_num},${native},${target},10,comparison,${slug},\"${title}\",src/content/articles/${native}/${target}/${slug}.mdx" >> "$csv_file"
    ((task_num++))
  done

  echo "Generated $csv_file with $((task_num-1)) tasks"
done

echo ""
echo "=== Summary ==="
echo "- 18 CSV files created"
echo "- Each has 170 tasks (10 topics × 17 targets)"
echo "- Total: 3,060 tasks"
