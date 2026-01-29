#!/bin/bash
# Generate German blog articles for all target languages

cd ~/lovelanguages-multilang
source .env.local

# Language mappings
declare -A DE_LANG_NAMES=(
  [en]="Englisch" [fr]="Französisch" [es]="Spanisch" [it]="Italienisch" [pt]="Portugiesisch"
  [pl]="Polnisch" [ru]="Russisch" [uk]="Ukrainisch" [nl]="Niederländisch" [tr]="Türkisch"
  [ro]="Rumänisch" [sv]="Schwedisch" [no]="Norwegisch" [da]="Dänisch" [cs]="Tschechisch"
  [el]="Griechisch" [hu]="Ungarisch"
)

declare -A EN_LANG_NAMES=(
  [en]="english" [fr]="french" [es]="spanish" [it]="italian" [pt]="portuguese"
  [pl]="polish" [ru]="russian" [uk]="ukrainian" [nl]="dutch" [tr]="turkish"
  [ro]="romanian" [sv]="swedish" [no]="norwegian" [da]="danish" [cs]="czech"
  [el]="greek" [hu]="hungarian"
)

# Counters
generated=0
skipped=0
errors=0
today=$(date +%Y-%m-%d)

# Function to insert article
insert_article() {
  local json_file="$1"
  local slug="$2"
  local target="$3"

  # Check if exists
  exists=$(curl -s "${VITE_SUPABASE_URL}/rest/v1/blog_articles?slug=eq.${slug}&native_lang=eq.de&target_lang=eq.${target}&select=id" \
    -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}")

  if [ "$exists" != "[]" ]; then
    echo "SKIP: $slug ($target) - already exists"
    ((skipped++))
    return 0
  fi

  # Insert
  response=$(curl -s -w "\n%{http_code}" -X POST "${VITE_SUPABASE_URL}/rest/v1/blog_articles" \
    -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d @"$json_file")

  http_code=$(echo "$response" | tail -1)

  if [ "$http_code" = "201" ]; then
    echo "✅ GENERATED: $slug ($target)"
    ((generated++))
  else
    echo "❌ ERROR: $slug ($target) - HTTP $http_code"
    ((errors++))
  fi
}

echo "=== German Article Generation Started ==="
echo "Date: $today"
echo ""

# Process each target language
for target in fr es it pt pl ru uk nl tr ro sv no da cs el hu; do
  lang_en="${EN_LANG_NAMES[$target]}"
  lang_de="${DE_LANG_NAMES[$target]}"

  echo "--- Processing: $lang_de ($target) ---"

  # Topic 1: 100 Most Common Words
  slug="100-most-common-${lang_en}-words"

  cat > /tmp/article_100words.json << JSONEND
{
  "title": "Die 100 häufigsten ${lang_de}en Wörter für Paare",
  "slug": "${slug}",
  "description": "Lerne die 100 wichtigsten ${lang_de}en Wörter für den Alltag mit deinem Partner. Perfekt für Anfänger - starte jetzt!",
  "native_lang": "de",
  "target_lang": "${target}",
  "category": "vocabulary",
  "difficulty": "beginner",
  "tags": ["${lang_de}", "Vokabeln", "Grundwortschatz", "Paare", "Anfänger"],
  "image": "/images/blog/vocabulary.jpg",
  "read_time": 8,
  "published": true,
  "date": "${today}",
  "content": "import VocabCard from '@components/VocabCard.astro';\nimport CultureTip from '@components/CultureTip.astro';\nimport CTA from '@components/CTA.astro';\n\n# Die 100 häufigsten ${lang_de}en Wörter für Paare\n\nDu möchtest ${lang_de} lernen, vielleicht weil dein Partner diese wunderbare Sprache spricht? Dann bist du hier genau richtig! Mit diesen 100 grundlegenden Wörtern legst du das Fundament für deine ${lang_de}-Kenntnisse.\n\n## Warum diese 100 Wörter?\n\nStudien zeigen, dass die 100 häufigsten Wörter einer Sprache etwa 50% aller alltäglichen Gespräche ausmachen. Wenn du diese Wörter beherrschst, verstehst du schon einen großen Teil dessen, was dein Partner sagt!\n\n## Grundlegende Pronomen\n\nPronomen sind das Herzstück jeder Unterhaltung. Hier sind die wichtigsten:\n\n**Ich, Du, Wir** - Diese drei Wörter wirst du ständig brauchen, besonders wenn du mit deinem Partner sprichst.\n\n## Wichtige Verben\n\nVerben bringen Leben in deine Sätze. Die wichtigsten sind:\n\n- sein (to be)\n- haben (to have)\n- machen/tun (to do)\n- gehen (to go)\n- kommen (to come)\n- wollen (to want)\n- können (to can)\n- sagen (to say)\n- sehen (to see)\n- wissen/kennen (to know)\n\n## Adjektive für jeden Tag\n\nMit Adjektiven kannst du deinem Partner Komplimente machen:\n\n- gut (good)\n- schön (beautiful)\n- groß (big)\n- klein (small)\n- neu (new)\n- alt (old)\n\n<CultureTip>\nJede Sprache hat ihre eigene Melodie und ihren Rhythmus. Höre ${lang_de}e Musik oder schaue Filme, um ein Gefühl für die Sprache zu bekommen!\n</CultureTip>\n\n## Fragewörter\n\nUm Gespräche zu führen, brauchst du Fragewörter:\n\n- was (what)\n- wer (who)\n- wo (where)\n- wann (when)\n- warum (why)\n- wie (how)\n\n## Zeitangaben\n\n- heute (today)\n- morgen (tomorrow)\n- gestern (yesterday)\n- jetzt (now)\n- später (later)\n- immer (always)\n- nie (never)\n\n## Weitere nützliche Wörter\n\n| Deutsch | Bedeutung |\n|---------|----------|\n| ja | yes |\n| nein | no |\n| bitte | please |\n| danke | thank you |\n| und | and |\n| oder | or |\n| aber | but |\n| mit | with |\n| für | for |\n| von | from |\n\n## Tipps zum Lernen\n\n1. **Lerne täglich**: 10-15 Minuten pro Tag sind effektiver als eine Stunde pro Woche\n2. **Übe mit deinem Partner**: Bitte ihn/sie, diese Wörter mit dir zu üben\n3. **Nutze Karteikarten**: Schreibe die Wörter auf Karten und wiederhole sie regelmäßig\n4. **Kontext ist wichtig**: Lerne Wörter in Sätzen, nicht isoliert\n\n<CTA />"
}
JSONEND

  insert_article /tmp/article_100words.json "$slug" "$target"

  # Topic 2: Pet Names and Endearments
  slug="${lang_en}-pet-names-and-endearments"

  cat > /tmp/article_petnames.json << JSONEND
{
  "title": "${lang_de}e Kosenamen und Liebkosungen für Paare",
  "slug": "${slug}",
  "description": "Entdecke die süßesten ${lang_de}en Kosenamen für deinen Partner. Von klassisch bis kreativ - finde den perfekten Namen!",
  "native_lang": "de",
  "target_lang": "${target}",
  "category": "vocabulary",
  "difficulty": "beginner",
  "tags": ["${lang_de}", "Kosenamen", "Romantik", "Paare", "Beziehung"],
  "image": "/images/blog/pet-names.jpg",
  "read_time": 6,
  "published": true,
  "date": "${today}",
  "content": "import VocabCard from '@components/VocabCard.astro';\nimport CultureTip from '@components/CultureTip.astro';\nimport CTA from '@components/CTA.astro';\n\n# ${lang_de}e Kosenamen und Liebkosungen für Paare\n\nKosenamen sind eine wunderbare Art, deinem Partner zu zeigen, wie viel er oder sie dir bedeutet. Wenn dein Partner ${lang_de} spricht, wird es ihn/sie sicher freuen, wenn du diese liebevollen Ausdrücke verwendest!\n\n## Klassische Kosenamen\n\nDiese Kosenamen sind zeitlos und werden in fast jeder ${lang_de}sprachigen Region verstanden:\n\n**Schatz / Liebling** - Die klassischsten Kosenamen, die nie aus der Mode kommen.\n\n**Mein Herz** - Ein gefühlvoller Ausdruck, der zeigt, wie wichtig dir dein Partner ist.\n\n## Süße Tiernamen\n\nWie in vielen Kulturen werden auch im ${lang_de}en gerne Tiernamen als Kosenamen verwendet:\n\n- Bärchen (little bear)\n- Mäuschen (little mouse)\n- Häschen (bunny)\n- Spätzchen (little sparrow)\n\n<CultureTip>\nKosenamen variieren oft regional. Was in einer Region üblich ist, kann in einer anderen ungewöhnlich klingen. Frage deinen Partner, welche Namen in seiner/ihrer Heimat gebräuchlich sind!\n</CultureTip>\n\n## Romantische Ausdrücke\n\nNeben Kosenamen gibt es viele romantische Ausdrücke:\n\n- Meine Liebe (my love)\n- Mein Ein und Alles (my everything)\n- Seelenverwandter (soulmate)\n\n## Kosenamen für verschiedene Anlässe\n\n### Im Alltag\nVerwende lockere, kurze Kosenamen für den täglichen Gebrauch.\n\n### Für romantische Momente\nLängere, gefühlvollere Ausdrücke passen zu besonderen Momenten.\n\n### Zum Necken\nHumorvolle Kosenamen können eure Beziehung auflockern.\n\n## Tipps zur Verwendung\n\n1. **Frage deinen Partner**: Nicht jeder mag jeden Kosenamen\n2. **Achte auf die Aussprache**: Übe die richtige Aussprache\n3. **Sei authentisch**: Verwende Namen, die zu euch als Paar passen\n4. **Kreiere eigene Namen**: Die persönlichsten Kosenamen sind oft selbst erfunden\n\n<CTA />"
}
JSONEND

  insert_article /tmp/article_petnames.json "$slug" "$target"

  sleep 0.5  # Rate limiting
done

echo ""
echo "=== Generation Complete ==="
echo "Generated: $generated"
echo "Skipped: $skipped"
echo "Errors: $errors"
