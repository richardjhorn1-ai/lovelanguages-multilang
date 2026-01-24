#!/usr/bin/env python3
"""
Update SEO for all romantic phrases articles across 12 native languages.
Improves title, meta description, CTA, and button text localization.
"""

import os
import re
from pathlib import Path

# Define CTA templates and button text by native language
NATIVE_LANG_CONFIG = {
    'de': {
        'button': 'Jetzt Starten',
        'cta_template': 'Bereit, {} mit deinem Partner zu meistern? Übe mit AI-Sprach-Chat, speichere Phrasen im Love Log, und dein Partner kann dein Tutor sein. Perfekt für bilinguale Paare!'
    },
    'en': {
        'button': 'Start Now',
        'cta_template': 'Ready to master {} with your partner? Practice with AI voice chat, save phrases to your Love Log, and your partner can be your tutor. Perfect for bilingual couples!'
    },
    'es': {
        'button': 'Comenzar Ahora',
        'cta_template': '¿Listo para dominar {} con tu pareja? Practica con chat de voz IA, Love Log para guardar frases, y tu pareja puede ser tu tutor. ¡Perfecto para parejas bilingües!'
    },
    'fr': {
        'button': 'Commencer Maintenant',
        'cta_template': 'Prêts à maîtriser {} ensemble? Pratiquez avec le chat vocal IA, sauvegardez vos phrases préférées dans Love Log, et votre partenaire peut devenir votre tuteur. Parfait pour couples bilingues!'
    },
    'it': {
        'button': 'Inizia Ora',
        'cta_template': 'Pronti a padroneggiare {} con il tuo partner? Esercitati con chat vocale AI, salva frasi nel Love Log, e il tuo partner può essere il tuo tutor. Perfetto per coppie bilingue!'
    },
    'nl': {
        'button': 'Begin Nu',
        'cta_template': 'Klaar om {} te beheersen met je partner? Oefen met AI voice chat, bewaar zinnen in je Love Log, en je partner kan je tutor zijn. Perfect voor meertalige stellen!'
    },
    'pl': {
        'button': 'Zacznij Teraz',
        'cta_template': 'Gotowy opanować {} z partnerem? Ćwicz z czatem głosowym AI, zapisuj frazy w Love Log, a Twój partner może być Twoim korepetytorem. Idealny dla par dwujęzycznych!'
    },
    'pt': {
        'button': 'Começar Agora',
        'cta_template': 'Pronto para dominar {} com seu parceiro? Pratique com chat de voz IA, salve frases no Love Log, e seu parceiro pode ser seu tutor. Perfeito para casais bilíngues!'
    },
    'ro': {
        'button': 'Începe Acum',
        'cta_template': 'Gata să stăpânești {} cu partenerul tău? Exersează cu chat vocal AI, salvează fraze în Love Log, iar partenerul tău poate fi tutore. Perfect pentru cupluri bilingve!'
    },
    'ru': {
        'button': 'Начать Сейчас',
        'cta_template': 'Готовы освоить {} с партнером? Практикуйтесь с AI голосовым чатом, сохраняйте фразы в Love Log, а партнер может стать вашим учителем. Идеально для двуязычных пар!'
    },
    'tr': {
        'button': 'Şimdi Başla',
        'cta_template': '{} partnerinle birlikte öğrenmeye hazır mısın? AI sesli sohbet ile pratik yap, Love Log\'a ifadeler kaydet ve partnerin senin öğretmenin olabilir. İki dilli çiftler için mükemmel!'
    },
    'uk': {
        'button': 'Почати Зараз',
        'cta_template': 'Готові опанувати {} з партнером? Практикуйте з AI голосовим чатом, зберігайте фрази в Love Log, а партнер може стати вашим вчителем. Ідеально для двомовних пар!'
    }
}

# Language names in each native language (for CTA text)
LANG_NAMES_IN_NATIVE = {
    'de': {
        'cs': 'Tschechisch', 'da': 'Dänisch', 'el': 'Griechisch', 'en': 'Englisch',
        'es': 'Spanisch', 'fr': 'Französisch', 'hu': 'Ungarisch', 'it': 'Italienisch',
        'nl': 'Niederländisch', 'no': 'Norwegisch', 'pl': 'Polnisch', 'pt': 'Portugiesisch',
        'ro': 'Rumänisch', 'ru': 'Russisch', 'sv': 'Schwedisch', 'tr': 'Türkisch', 'uk': 'Ukrainisch'
    },
    'en': {
        'cs': 'Czech', 'da': 'Danish', 'de': 'German', 'el': 'Greek', 'es': 'Spanish',
        'fr': 'French', 'hu': 'Hungarian', 'it': 'Italian', 'nl': 'Dutch', 'no': 'Norwegian',
        'pl': 'Polish', 'pt': 'Portuguese', 'ro': 'Romanian', 'ru': 'Russian',
        'sv': 'Swedish', 'tr': 'Turkish', 'uk': 'Ukrainian'
    },
    'es': {
        'cs': 'checo', 'da': 'danés', 'de': 'alemán', 'el': 'griego', 'en': 'inglés',
        'fr': 'francés', 'hu': 'húngaro', 'it': 'italiano', 'nl': 'neerlandés',
        'no': 'noruego', 'pl': 'polaco', 'pt': 'portugués', 'ro': 'rumano',
        'ru': 'ruso', 'sv': 'sueco', 'tr': 'turco', 'uk': 'ucraniano'
    },
    'fr': {
        'cs': 'le tchèque', 'da': 'le danois', 'de': 'l\'allemand', 'el': 'le grec',
        'en': 'l\'anglais', 'es': 'l\'espagnol', 'hu': 'le hongrois', 'it': 'l\'italien',
        'nl': 'le néerlandais', 'no': 'le norvégien', 'pl': 'le polonais',
        'pt': 'le portugais', 'ro': 'le roumain', 'ru': 'le russe', 'sv': 'le suédois',
        'tr': 'le turc', 'uk': 'l\'ukrainien'
    },
    'it': {
        'cs': 'il ceco', 'da': 'il danese', 'de': 'il tedesco', 'el': 'il greco',
        'en': 'l\'inglese', 'es': 'lo spagnolo', 'fr': 'il francese', 'hu': 'l\'ungherese',
        'nl': 'l\'olandese', 'no': 'il norvegese', 'pl': 'il polacco', 'pt': 'il portoghese',
        'ro': 'il rumeno', 'ru': 'il russo', 'sv': 'lo svedese', 'tr': 'il turco',
        'uk': 'l\'ucraino'
    },
    'nl': {
        'cs': 'Tsjechisch', 'da': 'Deens', 'de': 'Duits', 'el': 'Grieks', 'en': 'Engels',
        'es': 'Spaans', 'fr': 'Frans', 'hu': 'Hongaars', 'it': 'Italiaans', 'no': 'Noors',
        'pl': 'Pools', 'pt': 'Portugees', 'ro': 'Roemeens', 'ru': 'Russisch',
        'sv': 'Zweeds', 'tr': 'Turks', 'uk': 'Oekraïens'
    },
    'pl': {
        'cs': 'czeski', 'da': 'duński', 'de': 'niemiecki', 'el': 'grecki', 'en': 'angielski',
        'es': 'hiszpański', 'fr': 'francuski', 'hu': 'węgierski', 'it': 'włoski',
        'nl': 'holenderski', 'no': 'norweski', 'pt': 'portugalski', 'ro': 'rumuński',
        'ru': 'rosyjski', 'sv': 'szwedzki', 'tr': 'turecki', 'uk': 'ukraiński'
    },
    'pt': {
        'cs': 'tcheco', 'da': 'dinamarquês', 'de': 'alemão', 'el': 'grego', 'en': 'inglês',
        'es': 'espanhol', 'fr': 'francês', 'hu': 'húngaro', 'it': 'italiano',
        'nl': 'holandês', 'no': 'norueguês', 'pl': 'polonês', 'ro': 'romeno',
        'ru': 'russo', 'sv': 'sueco', 'tr': 'turco', 'uk': 'ucraniano'
    },
    'ro': {
        'cs': 'cehă', 'da': 'daneză', 'de': 'germană', 'el': 'greacă', 'en': 'engleză',
        'es': 'spaniolă', 'fr': 'franceză', 'hu': 'maghiară', 'it': 'italiană',
        'nl': 'olandeză', 'no': 'norvegiană', 'pl': 'poloneză', 'pt': 'portugheză',
        'ru': 'rusă', 'sv': 'suedeză', 'tr': 'turcă', 'uk': 'ucraineană'
    },
    'ru': {
        'cs': 'чешский', 'da': 'датский', 'de': 'немецкий', 'el': 'греческий',
        'en': 'английский', 'es': 'испанский', 'fr': 'французский', 'hu': 'венгерский',
        'it': 'итальянский', 'nl': 'голландский', 'no': 'норвежский', 'pl': 'польский',
        'pt': 'португальский', 'ro': 'румынский', 'sv': 'шведский', 'tr': 'турецкий',
        'uk': 'украинский'
    },
    'tr': {
        'cs': 'Çekçe', 'da': 'Danca', 'de': 'Almanca', 'el': 'Yunanca', 'en': 'İngilizce',
        'es': 'İspanyolca', 'fr': 'Fransızca', 'hu': 'Macarca', 'it': 'İtalyanca',
        'nl': 'Flemenkçe', 'no': 'Norveççe', 'pl': 'Lehçe', 'pt': 'Portekizce',
        'ro': 'Rumence', 'ru': 'Rusça', 'sv': 'İsveççe', 'uk': 'Ukraynaca'
    },
    'uk': {
        'cs': 'чеську', 'da': 'данську', 'de': 'німецьку', 'el': 'грецьку',
        'en': 'англійську', 'es': 'іспанську', 'fr': 'французьку', 'hu': 'угорську',
        'it': 'італійську', 'nl': 'голландську', 'no': 'норвезьку', 'pl': 'польську',
        'pt': 'португальську', 'ro': 'румунську', 'ru': 'російську', 'sv': 'шведську',
        'tr': 'турецьку'
    }
}

def extract_metadata(content):
    """Extract frontmatter metadata."""
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if match:
        return match.group(1)
    return None

def update_romantic_article(file_path):
    """Update a single romantic phrases article with improved SEO."""

    # Extract native and target language from path
    parts = Path(file_path).parts
    native_lang = parts[-3]  # e.g., 'es'
    target_lang = parts[-2]  # e.g., 'en'

    if native_lang not in NATIVE_LANG_CONFIG:
        print(f"Skipping {file_path}: unknown native language {native_lang}")
        return False

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Get config for this native language
        config = NATIVE_LANG_CONFIG[native_lang]
        button_text = config['button']
        target_lang_name = LANG_NAMES_IN_NATIVE.get(native_lang, {}).get(target_lang, target_lang.upper())
        cta_text = config['cta_template'].format(target_lang_name)

        # Update CTA section - find existing CTA and replace
        cta_pattern = r'<CTA\s+text="[^"]*"\s+buttonText="[^"]*"\s*/>'
        cta_pattern_multiline = r'<CTA\s+text="[^"]*"\s+buttonText="[^"]*"\s*/>'

        new_cta = f'<CTA\n  text="{cta_text}"\n  buttonText="{button_text}"\n/>'

        # Try to replace CTA
        if re.search(cta_pattern, content):
            content = re.sub(cta_pattern, new_cta, content)

        # Only update if content changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Updated: {file_path}")
            return True
        else:
            print(f"- No changes needed: {file_path}")
            return False

    except Exception as e:
        print(f"✗ Error processing {file_path}: {str(e)}")
        return False

def main():
    """Process all romantic phrases articles."""
    base_dir = Path(__file__).parent / 'blog' / 'src' / 'content' / 'articles'

    # Find all romantic phrases articles
    romantic_files = []
    for native_lang_dir in base_dir.iterdir():
        if not native_lang_dir.is_dir():
            continue
        for target_lang_dir in native_lang_dir.iterdir():
            if not target_lang_dir.is_dir():
                continue
            for mdx_file in target_lang_dir.glob('*romantic*.mdx'):
                romantic_files.append(mdx_file)

    print(f"Found {len(romantic_files)} romantic phrases articles\n")

    updated = 0
    skipped = 0
    errors = 0

    for file_path in sorted(romantic_files):
        result = update_romantic_article(file_path)
        if result:
            updated += 1
        elif result is False:
            errors += 1
        else:
            skipped += 1

    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Updated: {updated}")
    print(f"  Skipped: {skipped}")
    print(f"  Errors: {errors}")
    print(f"  Total: {len(romantic_files)}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
