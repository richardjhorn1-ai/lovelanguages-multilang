#!/usr/bin/env python3
"""
Fix compliments article descriptions to be properly localized.
"""

import re

# Common compliment phrases by language (gender-neutral where possible)
NATIVE_PHRASES = {
    'en': 'You look amazing',
    'es': 'Eres hermosa/o',
    'fr': 'Tu es belle/beau',
    'de': 'Du bist wunderschön',
    'it': 'Sei bellissima/o',
    'pt': 'Você é linda/o',
    'pl': 'Jesteś piękna/y',
    'ro': 'Ești frumoasă',
    'nl': 'Je bent mooi',
    'ru': 'Ты прекрасна/ен',
    'uk': 'Ти прекрасна/ий',
    'cs': 'Jsi krásná/ý',
    'sv': 'Du är vacker',
    'da': 'Du er smuk',
    'no': 'Du er vakker',
    'el': 'Είσαι όμορφη/ος',
    'hu': 'Gyönyörű vagy',
    'tr': 'Çok güzelsin'
}

# Description templates by native language
DESC_TEMPLATES = {
    'en': "Master '{phrase}' and {count}+ {lang} compliments. Pronunciation guide included.",
    'es': "Domina '{phrase}' y más cumplidos en {lang}. Guía de pronunciación incluida.",
    'fr': "Maîtrisez '{phrase}' et {count}+ compliments en {lang}. Guide de prononciation inclus.",
    'de': "Meistere '{phrase}' und {count}+ {lang} Komplimente. Ausspracheführer enthalten.",
    'it': "Impara '{phrase}' e {count}+ complimenti in {lang}. Guida alla pronuncia inclusa.",
    'pt': "Domine '{phrase}' e {count}+ elogios em {lang}. Guia de pronúncia incluído.",
    'pl': "Opanuj '{phrase}' i {count}+ komplementów po {lang}. Przewodnik wymowy dołączony.",
    'ro': "Stăpânește '{phrase}' și {count}+ complimente în {lang}. Ghid de pronunție inclus.",
    'nl': "Beheers '{phrase}' en {count}+ complimenten in {lang}. Uitspraakgids inbegrepen.",
    'ru': "Освойте '{phrase}' и {count}+ комплиментов на {lang}. Руководство по произношению.",
    'uk': "Опануйте '{phrase}' та {count}+ компліментів {lang}. Посібник з вимови.",
    'cs': "Zvládněte '{phrase}' a {count}+ komplimentů v {lang}. Průvodce výslovností.",
    'sv': "Bemästra '{phrase}' och {count}+ komplimanger på {lang}. Uttalguide inkluderad.",
    'da': "Mestre '{phrase}' og {count}+ komplimenter på {lang}. Udtalsguide inkluderet.",
    'no': "Mestre '{phrase}' og {count}+ komplimenter på {lang}. Uttalsguide inkludert.",
    'el': "Κατακτήστε το '{phrase}' και {count}+ κομπλιμέντα στα {lang}. Οδηγός προφοράς.",
    'hu': "Sajátítsd el a(z) '{phrase}' és {count}+ bókot {lang} nyelven. Kiejtési útmutató.",
    'tr': "'{phrase}' ve {count}+ {lang} iltifatı öğrenin. Telaffuz kılavuzu dahil."
}

# Language names in different languages (for descriptions)
LANG_NAMES_FOR_DESC = {
    'en': {
        'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
        'it': 'Italian', 'pt': 'Portuguese', 'pl': 'Polish', 'ro': 'Romanian',
        'nl': 'Dutch', 'ru': 'Russian', 'uk': 'Ukrainian', 'cs': 'Czech',
        'sv': 'Swedish', 'da': 'Danish', 'no': 'Norwegian', 'el': 'Greek',
        'hu': 'Hungarian', 'tr': 'Turkish'
    },
    'es': {
        'en': 'inglés', 'es': 'español', 'fr': 'francés', 'de': 'alemán',
        'it': 'italiano', 'pt': 'portugués', 'pl': 'polaco', 'ro': 'rumano',
        'nl': 'neerlandés', 'ru': 'ruso', 'uk': 'ucraniano', 'cs': 'checo',
        'sv': 'sueco', 'da': 'danés', 'no': 'noruego', 'el': 'griego',
        'hu': 'húngaro', 'tr': 'turco'
    },
    'fr': {
        'en': 'anglais', 'es': 'espagnol', 'fr': 'français', 'de': 'allemand',
        'it': 'italien', 'pt': 'portugais', 'pl': 'polonais', 'ro': 'roumain',
        'nl': 'néerlandais', 'ru': 'russe', 'uk': 'ukrainien', 'cs': 'tchèque',
        'sv': 'suédois', 'da': 'danois', 'no': 'norvégien', 'el': 'grec',
        'hu': 'hongrois', 'tr': 'turc'
    },
    'de': {
        'en': 'Englisch', 'es': 'Spanisch', 'fr': 'Französisch', 'de': 'Deutsch',
        'it': 'Italienisch', 'pt': 'Portugiesisch', 'pl': 'Polnisch', 'ro': 'Rumänisch',
        'nl': 'Niederländisch', 'ru': 'Russisch', 'uk': 'Ukrainisch', 'cs': 'Tschechisch',
        'sv': 'Schwedisch', 'da': 'Dänisch', 'no': 'Norwegisch', 'el': 'Griechisch',
        'hu': 'Ungarisch', 'tr': 'Türkisch'
    },
    'it': {
        'en': 'inglese', 'es': 'spagnolo', 'fr': 'francese', 'de': 'tedesco',
        'it': 'italiano', 'pt': 'portoghese', 'pl': 'polacco', 'ro': 'rumeno',
        'nl': 'olandese', 'ru': 'russo', 'uk': 'ucraino', 'cs': 'ceco',
        'sv': 'svedese', 'da': 'danese', 'no': 'norvegese', 'el': 'greco',
        'hu': 'ungherese', 'tr': 'turco'
    },
    'pt': {
        'en': 'inglês', 'es': 'espanhol', 'fr': 'francês', 'de': 'alemão',
        'it': 'italiano', 'pt': 'português', 'pl': 'polonês', 'ro': 'romeno',
        'nl': 'holandês', 'ru': 'russo', 'uk': 'ucraniano', 'cs': 'tcheco',
        'sv': 'sueco', 'da': 'dinamarquês', 'no': 'norueguês', 'el': 'grego',
        'hu': 'húngaro', 'tr': 'turco'
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

def improve_description(native_lang, target_lang, old_title):
    """Generate proper localized description."""
    # Extract number from title
    num_match = re.search(r'\d+', old_title)
    number = num_match.group(0) if num_match else '50'

    # Get phrase for target language
    phrase = NATIVE_PHRASES.get(target_lang, 'compliment')

    # Get template
    template = DESC_TEMPLATES.get(native_lang, DESC_TEMPLATES['en'])

    # Get language name
    lang_names = LANG_NAMES_FOR_DESC.get(native_lang, LANG_NAMES_FOR_DESC['en'])
    lang_name = lang_names.get(target_lang, target_lang)

    # Format description
    new_desc = template.format(phrase=phrase, count=number, lang=lang_name)

    # Ensure under 155 chars
    if len(new_desc) > 155:
        # Shorter version without count
        if native_lang == 'en':
            new_desc = f"Learn {lang_name} compliments with '{phrase}'. Pronunciation guide included."
        else:
            new_desc = template.format(phrase=phrase, count='', lang=lang_name).replace('  ', ' ')

    return new_desc

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
    native_lang = data.get('nativeLanguage', 'en')
    # Extract target language from path
    path_parts = filepath.split('/')
    target_lang = path_parts[-2]  # Second to last part is target language

    # Get current title for number extraction
    title = data.get('title', '')

    # Improve description
    new_desc = improve_description(native_lang, target_lang, title)

    # Update frontmatter
    new_frontmatter = re.sub(
        r'description:\s*"[^"]*"',
        f'description: "{new_desc}"',
        frontmatter,
        count=1
    )

    # Reconstruct file
    new_content = f"---\n{new_frontmatter}\n---\n{body}"

    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"  ✓ Updated description: {new_desc[:70]}...")
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
