#!/usr/bin/env python3
"""
Fix empty CTAs in romantic phrases articles.
"""

import os
from pathlib import Path

# Files with empty CTAs that need fixing
FILES_TO_FIX = [
    'uk/pl/romantic-polish-phrases-for-couples.mdx',
    'uk/sv/romantic-swedish-phrases-for-couples.mdx',
    'uk/da/romantic-danish-phrases-for-couples.mdx',
    'uk/no/romantic-norwegian-phrases-for-couples.mdx',
    'uk/it/romantic-italian-phrases-for-couples.mdx',
    'uk/ro/romantic-romanian-phrases-for-couples.mdx',
    'uk/pt/romantic-portuguese-phrases-for-couples.mdx',
    'uk/nl/romantic-dutch-phrases-for-couples.mdx',
    'en/cs/czech-romantic-phrases-every-occasion.mdx',
    'en/ro/romanian-romantic-phrases-every-occasion.mdx',
    'en/uk/ukrainian-romantic-phrases-every-occasion.mdx',
    'en/hu/hungarian-romantic-phrases-every-occasion.mdx',
    'en/nl/dutch-romantic-phrases-every-occasion.mdx',
    'en/tr/turkish-romantic-phrases-every-occasion.mdx',
]

# CTA templates by native language
CTA_TEMPLATES = {
    'uk': {
        'template': 'Готові опанувати {} з партнером? Практикуйте з AI голосовим чатом, зберігайте фрази в Love Log, а партнер може стати вашим вчителем. Ідеально для двомовних пар!',
        'button': 'Почати Зараз'
    },
    'en': {
        'template': 'Ready to master {} with your partner? Practice with AI voice chat, save phrases to your Love Log, and your partner can be your tutor. Perfect for bilingual couples!',
        'button': 'Start Now'
    }
}

# Language names in Ukrainian
LANG_NAMES_UK = {
    'pl': 'польську', 'sv': 'шведську', 'da': 'данську', 'no': 'норвезьку',
    'it': 'італійську', 'ro': 'румунську', 'pt': 'португальську', 'nl': 'голландську'
}

# Language names in English
LANG_NAMES_EN = {
    'cs': 'Czech', 'ro': 'Romanian', 'uk': 'Ukrainian', 'hu': 'Hungarian',
    'nl': 'Dutch', 'tr': 'Turkish'
}

def fix_empty_cta(file_path):
    """Fix empty CTA in a single file."""

    # Extract native and target language from path
    parts = Path(file_path).parts
    native_lang = parts[-3]
    target_lang = parts[-2]

    # Get template
    if native_lang not in CTA_TEMPLATES:
        print(f"Skipping {file_path}: no template for {native_lang}")
        return False

    template_info = CTA_TEMPLATES[native_lang]

    # Get target language name
    if native_lang == 'uk':
        lang_name = LANG_NAMES_UK.get(target_lang, target_lang.upper())
    else:  # en
        lang_name = LANG_NAMES_EN.get(target_lang, target_lang.upper())

    cta_text = template_info['template'].format(lang_name)
    button_text = template_info['button']

    # Read file
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace empty CTA
        new_cta = f'''<CTA
  text="{cta_text}"
  buttonText="{button_text}"
/>'''

        updated_content = content.replace('<CTA />', new_cta)

        if updated_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            print(f"✓ Fixed: {file_path}")
            return True
        else:
            print(f"- No change: {file_path}")
            return False

    except Exception as e:
        print(f"✗ Error: {file_path}: {str(e)}")
        return False

def main():
    """Fix all empty CTAs."""
    base_dir = Path(__file__).parent / 'blog' / 'src' / 'content' / 'articles'

    fixed = 0
    for rel_path in FILES_TO_FIX:
        file_path = base_dir / rel_path
        if fix_empty_cta(file_path):
            fixed += 1

    print(f"\n{'='*60}")
    print(f"Fixed {fixed} / {len(FILES_TO_FIX)} files")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
