#!/usr/bin/env python3
"""
Fix compliments article titles to be in the native language.
"""

import re
import os

# Title templates by native language
TITLE_TEMPLATES = {
    'en': "{num} {lang} Compliments for Your Partner",
    'es': "{num} Cumplidos en {lang} para Tu Pareja",
    'fr': "{num} Compliments en {lang} pour Votre Partenaire",
    'de': "{num} {lang} Komplimente für Deinen Partner",
    'it': "{num} Complimenti in {lang} per il Tuo Partner",
    'pt': "{num} Elogios em {lang} para Seu Parceiro",
    'pl': "{num} Komplementów po {lang} dla Partnera",
    'ro': "{num} Complimente în {lang} pentru Partenerul Tău",
    'nl': "{num} Complimenten in {lang} voor Je Partner",
    'ru': "{num} комплиментов на {lang} для партнёра",
    'uk': "{num} компліментів {lang} для партнера",
    'cs': "{num} komplimentů v {lang} pro partnera",
    'sv': "{num} komplimanger på {lang} för din partner",
    'da': "{num} komplimenter på {lang} til din partner",
    'no': "{num} komplimenter på {lang} til partneren din",
    'el': "{num} κομπλιμέντα στα {lang} για τον σύντροφό σας",
    'hu': "{num} bók {lang} nyelven a partnerednek",
    'tr': "Partneriniz için {num} {lang} İltifat"
}

# Language names in different languages
LANG_NAMES = {
    'en': {
        'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
        'it': 'Italian', 'pt': 'Portuguese', 'pl': 'Polish', 'ro': 'Romanian',
        'nl': 'Dutch', 'ru': 'Russian', 'uk': 'Ukrainian', 'cs': 'Czech',
        'sv': 'Swedish', 'da': 'Danish', 'no': 'Norwegian', 'el': 'Greek',
        'hu': 'Hungarian', 'tr': 'Turkish'
    },
    'es': {
        'en': 'Inglés', 'es': 'Español', 'fr': 'Francés', 'de': 'Alemán',
        'it': 'Italiano', 'pt': 'Portugués', 'pl': 'Polaco', 'ro': 'Rumano',
        'nl': 'Neerlandés', 'ru': 'Ruso', 'uk': 'Ucraniano', 'cs': 'Checo',
        'sv': 'Sueco', 'da': 'Danés', 'no': 'Noruego', 'el': 'Griego',
        'hu': 'Húngaro', 'tr': 'Turco'
    },
    'fr': {
        'en': 'Anglais', 'es': 'Espagnol', 'fr': 'Français', 'de': 'Allemand',
        'it': 'Italien', 'pt': 'Portugais', 'pl': 'Polonais', 'ro': 'Roumain',
        'nl': 'Néerlandais', 'ru': 'Russe', 'uk': 'Ukrainien', 'cs': 'Tchèque',
        'sv': 'Suédois', 'da': 'Danois', 'no': 'Norvégien', 'el': 'Grec',
        'hu': 'Hongrois', 'tr': 'Turc'
    },
    'de': {
        'en': 'Englisch', 'es': 'Spanisch', 'fr': 'Französisch', 'de': 'Deutsch',
        'it': 'Italienisch', 'pt': 'Portugiesisch', 'pl': 'Polnisch', 'ro': 'Rumänisch',
        'nl': 'Niederländisch', 'ru': 'Russisch', 'uk': 'Ukrainisch', 'cs': 'Tschechisch',
        'sv': 'Schwedisch', 'da': 'Dänisch', 'no': 'Norwegisch', 'el': 'Griechisch',
        'hu': 'Ungarisch', 'tr': 'Türkisch'
    },
    'it': {
        'en': 'Inglese', 'es': 'Spagnolo', 'fr': 'Francese', 'de': 'Tedesco',
        'it': 'Italiano', 'pt': 'Portoghese', 'pl': 'Polacco', 'ro': 'Rumeno',
        'nl': 'Olandese', 'ru': 'Russo', 'uk': 'Ucraino', 'cs': 'Ceco',
        'sv': 'Svedese', 'da': 'Danese', 'no': 'Norvegese', 'el': 'Greco',
        'hu': 'Ungherese', 'tr': 'Turco'
    },
    'pt': {
        'en': 'Inglês', 'es': 'Espanhol', 'fr': 'Francês', 'de': 'Alemão',
        'it': 'Italiano', 'pt': 'Português', 'pl': 'Polonês', 'ro': 'Romeno',
        'nl': 'Holandês', 'ru': 'Russo', 'uk': 'Ucraniano', 'cs': 'Tcheco',
        'sv': 'Sueco', 'da': 'Dinamarquês', 'no': 'Norueguês', 'el': 'Grego',
        'hu': 'Húngaro', 'tr': 'Turco'
    },
    'pl': {
        'en': 'angielsku', 'es': 'hiszpańsku', 'fr': 'francusku', 'de': 'niemiecku',
        'it': 'włosku', 'pt': 'portugalsku', 'pl': 'polsku', 'ro': 'rumuńsku',
        'nl': 'niderlandzku', 'ru': 'rosyjsku', 'uk': 'ukraińsku', 'cs': 'czesku',
        'sv': 'szwedzku', 'da': 'duńsku', 'no': 'norwesku', 'el': 'grecku',
        'hu': 'węgiersku', 'tr': 'turecku'
    },
    'ro': {
        'en': 'engleză', 'es': 'spaniolă', 'fr': 'franceză', 'de': 'germană',
        'it': 'italiană', 'pt': 'portugheză', 'pl': 'polonă', 'ro': 'română',
        'nl': 'olandeză', 'ru': 'rusă', 'uk': 'ucraineană', 'cs': 'cehă',
        'sv': 'suedeză', 'da': 'daneză', 'no': 'norvegiană', 'el': 'greacă',
        'hu': 'maghiară', 'tr': 'turcă'
    },
    'nl': {
        'en': 'Engels', 'es': 'Spaans', 'fr': 'Frans', 'de': 'Duits',
        'it': 'Italiaans', 'pt': 'Portugees', 'pl': 'Pools', 'ro': 'Roemeens',
        'nl': 'Nederlands', 'ru': 'Russisch', 'uk': 'Oekraïens', 'cs': 'Tsjechisch',
        'sv': 'Zweeds', 'da': 'Deens', 'no': 'Noors', 'el': 'Grieks',
        'hu': 'Hongaars', 'tr': 'Turks'
    },
    'ru': {
        'en': 'английском', 'es': 'испанском', 'fr': 'французском', 'de': 'немецком',
        'it': 'итальянском', 'pt': 'португальском', 'pl': 'польском', 'ro': 'румынском',
        'nl': 'голландском', 'ru': 'русском', 'uk': 'украинском', 'cs': 'чешском',
        'sv': 'шведском', 'da': 'датском', 'no': 'норвежском', 'el': 'греческом',
        'hu': 'венгерском', 'tr': 'турецком'
    },
    'uk': {
        'en': 'англійської', 'es': 'іспанської', 'fr': 'французької', 'de': 'німецької',
        'it': 'італійської', 'pt': 'португальської', 'pl': 'польської', 'ro': 'румунської',
        'nl': 'нідерландської', 'ru': 'російської', 'uk': 'української', 'cs': 'чеської',
        'sv': 'шведської', 'da': 'данської', 'no': 'норвезької', 'el': 'грецької',
        'hu': 'угорської', 'tr': 'турецької'
    },
    'cs': {
        'en': 'anglicky', 'es': 'španělsky', 'fr': 'francouzsky', 'de': 'německy',
        'it': 'italsky', 'pt': 'portugalsky', 'pl': 'polsky', 'ro': 'rumunsky',
        'nl': 'holandsky', 'ru': 'rusky', 'uk': 'ukrajinsky', 'cs': 'česky',
        'sv': 'švédsky', 'da': 'dánsky', 'no': 'norsky', 'el': 'řecky',
        'hu': 'maďarsky', 'tr': 'turecky'
    },
    'sv': {
        'en': 'engelska', 'es': 'spanska', 'fr': 'franska', 'de': 'tyska',
        'it': 'italienska', 'pt': 'portugisiska', 'pl': 'polska', 'ro': 'rumänska',
        'nl': 'nederländska', 'ru': 'ryska', 'uk': 'ukrainska', 'cs': 'tjeckiska',
        'sv': 'svenska', 'da': 'danska', 'no': 'norska', 'el': 'grekiska',
        'hu': 'ungerska', 'tr': 'turkiska'
    },
    'da': {
        'en': 'engelsk', 'es': 'spansk', 'fr': 'fransk', 'de': 'tysk',
        'it': 'italiensk', 'pt': 'portugisisk', 'pl': 'polsk', 'ro': 'rumænsk',
        'nl': 'nederlandsk', 'ru': 'russisk', 'uk': 'ukrainsk', 'cs': 'tjekkisk',
        'sv': 'svensk', 'da': 'dansk', 'no': 'norsk', 'el': 'græsk',
        'hu': 'ungarsk', 'tr': 'tyrkisk'
    },
    'no': {
        'en': 'engelsk', 'es': 'spansk', 'fr': 'fransk', 'de': 'tysk',
        'it': 'italiensk', 'pt': 'portugisisk', 'pl': 'polsk', 'ro': 'rumensk',
        'nl': 'nederlandsk', 'ru': 'russisk', 'uk': 'ukrainsk', 'cs': 'tsjekkisk',
        'sv': 'svensk', 'da': 'dansk', 'no': 'norsk', 'el': 'gresk',
        'hu': 'ungarsk', 'tr': 'tyrkisk'
    },
    'el': {
        'en': 'αγγλικά', 'es': 'ισπανικά', 'fr': 'γαλλικά', 'de': 'γερμανικά',
        'it': 'ιταλικά', 'pt': 'πορτογαλικά', 'pl': 'πολωνικά', 'ro': 'ρουμανικά',
        'nl': 'ολλανδικά', 'ru': 'ρωσικά', 'uk': 'ουκρανικά', 'cs': 'τσεχικά',
        'sv': 'σουηδικά', 'da': 'δανικά', 'no': 'νορβηγικά', 'el': 'ελληνικά',
        'hu': 'ουγγρικά', 'tr': 'τουρκικά'
    },
    'hu': {
        'en': 'angol', 'es': 'spanyol', 'fr': 'francia', 'de': 'német',
        'it': 'olasz', 'pt': 'portugál', 'pl': 'lengyel', 'ro': 'román',
        'nl': 'holland', 'ru': 'orosz', 'uk': 'ukrán', 'cs': 'cseh',
        'sv': 'svéd', 'da': 'dán', 'no': 'norvég', 'el': 'görög',
        'hu': 'magyar', 'tr': 'török'
    },
    'tr': {
        'en': 'İngilizce', 'es': 'İspanyolca', 'fr': 'Fransızca', 'de': 'Almanca',
        'it': 'İtalyanca', 'pt': 'Portekizce', 'pl': 'Lehçe', 'ro': 'Rumence',
        'nl': 'Felemenkçe', 'ru': 'Rusça', 'uk': 'Ukraynaca', 'cs': 'Çekçe',
        'sv': 'İsveççe', 'da': 'Danca', 'no': 'Norveççe', 'el': 'Yunanca',
        'hu': 'Macarca', 'tr': 'Türkçe'
    }
}

def extract_frontmatter_and_content(file_content):
    """Extract frontmatter and content from MDX file."""
    match = re.match(r'^---\n(.*?)\n---\n(.*)$', file_content, re.DOTALL)
    if not match:
        return None, file_content
    return match.group(1), match.group(2)

def parse_frontmatter(frontmatter):
    """Parse frontmatter into dict."""
    data = {}
    for line in frontmatter.split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip().strip('"\'')
            data[key] = value
    return data

def improve_title(old_title, native_lang, target_lang):
    """Generate proper localized title."""
    # Extract number if present
    num_match = re.search(r'\d+', old_title)
    number = num_match.group(0) if num_match else '50'

    # Get template
    template = TITLE_TEMPLATES.get(native_lang, TITLE_TEMPLATES['en'])

    # Get language name in native language
    lang_names = LANG_NAMES.get(native_lang, LANG_NAMES['en'])
    lang_name = lang_names.get(target_lang, target_lang.upper())

    # Format title
    new_title = template.format(num=number, lang=lang_name)

    # Ensure under 60 chars
    if len(new_title) > 60:
        new_title = template.format(num='', lang=lang_name).strip()

    return new_title

def process_file(filepath):
    """Process a single compliments article file."""
    print(f"Processing: {filepath}")

    # Read file
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract frontmatter and content
    frontmatter, body = extract_frontmatter_and_content(content)
    if not frontmatter:
        print(f"  ⚠ No frontmatter found, skipping")
        return False

    # Parse frontmatter
    data = parse_frontmatter(frontmatter)

    # Get languages
    native_lang = data.get('nativeLanguage', data.get('language', 'en'))
    # Extract target language from path
    path_parts = filepath.split('/')
    target_lang = path_parts[-2]  # Second to last part is target language

    # Get current title
    title_match = re.search(r'title:\s*["\']?([^"\'\n]+)["\']?', frontmatter)
    if not title_match:
        print(f"  ⚠ No title found, skipping")
        return False

    old_title = title_match.group(1)

    # Improve title
    new_title = improve_title(old_title, native_lang, target_lang)

    # Update frontmatter with proper escaping
    new_frontmatter = re.sub(
        r'title:\s*["\']?[^"\'\n]+["\']?',
        f'title: "{new_title}"',
        frontmatter,
        count=1
    )

    # Reconstruct file
    new_content = f"---\n{new_frontmatter}\n---\n{body}"

    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"  ✓ Updated title: {new_title}")
    return True

def main():
    # Read file list
    with open('/tmp/compliments_files.txt', 'r') as f:
        files = [line.strip() for line in f if line.strip()]

    print(f"Found {len(files)} compliments articles to fix\n")

    success_count = 0
    for filepath in files:
        if process_file(filepath):
            success_count += 1
        print()

    print(f"\n✅ Successfully processed {success_count}/{len(files)} files")

if __name__ == '__main__':
    main()
