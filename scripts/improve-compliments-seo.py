#!/usr/bin/env python3
"""
Script to improve SEO for all compliments articles across all native languages.
Applies:
1. Title: Under 60 chars, pattern "[Number] [Lang] Compliments for Your Partner"
2. Meta description: Under 155 chars, include native compliment phrase
3. CTA: Mention Word Gifts, AI voice for delivery, Partner as tutor
4. Button text: Localized to native language
"""

import re
import os
from pathlib import Path

# Button text translations by native language
BUTTON_TEXT = {
    'en': 'Start Learning',
    'es': 'Comenzar a Aprender',
    'fr': 'Commencer à Apprendre',
    'de': 'Jetzt Lernen',
    'it': 'Inizia a Imparare',
    'pt': 'Começar a Aprender',
    'pl': 'Rozpocznij Naukę',
    'ro': 'Începe să Înveți',
    'nl': 'Begin met Leren',
    'ru': 'Начать Обучение',
    'uk': 'Почати Навчання',
    'cs': 'Začít se Učit',
    'sv': 'Börja Lära',
    'da': 'Begynd at Lære',
    'no': 'Begynn å Lære',
    'el': 'Ξεκινήστε τη Μάθηση',
    'hu': 'Kezdj el Tanulni',
    'tr': 'Öğrenmeye Başla'
}

# CTA text templates by native language
CTA_TEMPLATES = {
    'en': "Ready to master these compliments? With Love Languages, your partner can send you Word Gifts with compliments in authentic AI voice. Practice with AI voice chat until you're confident. Your partner becomes your tutor!",
    'es': "¿Listo para dominar estos cumplidos? Con Love Languages, tu pareja puede enviarte Word Gifts con cumplidos en voz AI auténtica. Practica con el chat de voz AI hasta que tengas confianza. ¡Tu pareja se convierte en tu tutor!",
    'fr': "Prêt(e) à maîtriser ces compliments ? Avec Love Languages, votre partenaire peut vous envoyer des Word Gifts avec compliments en voix IA authentique. Pratiquez avec le chat vocal IA jusqu'à ce que vous soyez confiant(e). Votre partenaire devient votre tuteur !",
    'de': "Bereit, diese Komplimente zu meistern? Mit Love Languages kann dein Partner dir Word Gifts mit Komplimenten in authentischer KI-Stimme senden. Übe mit KI-Sprach-Chat, bis du selbstbewusst bist. Dein Partner wird dein Tutor!",
    'it': "Pronto a pronunciare questi complimenti perfettamente? Con Love Languages, il tuo partner può inviarti Word Gifts con complimenti in voce AI autentica. Pratica con la chat vocale AI finché non sarai sicuro. Il tuo partner diventa il tuo tutor!",
    'pt': "Pronto para dominar esses elogios? Com Love Languages, seu parceiro pode enviar Word Gifts com elogios em voz AI autêntica. Pratique com o chat de voz AI até ter confiança. Seu parceiro se torna seu tutor!",
    'pl': "Gotowy, aby opanować te komplimenty? Dzięki Love Languages Twój partner może wysyłać Ci Word Gifts z komplementami w autentycznym głosie AI. Ćwicz wymowę przez czat AI, aż będziesz pewny siebie. Twój partner staje się Twoim tutorem!",
    'ro': "Gata să stăpânești aceste complimente? Cu Love Languages, partenerul tău poate trimite Word Gifts cu complimente în voce AI autentică. Exersează cu chat-ul vocal AI până devii încrezător. Partenerul tău devine tutorele tău!",
    'nl': "Klaar om deze complimenten te beheersen? Met Love Languages kan je partner je Word Gifts sturen met complimenten in authentieke AI-stem. Oefen met AI-spraakchat tot je zelfverzekerd bent. Je partner wordt je tutor!",
    'ru': "Готовы освоить эти комплименты? С Love Languages ваш партнёр может отправлять вам Word Gifts с комплиментами голосом AI. Практикуйте с голосовым чатом AI, пока не обретёте уверенность. Ваш партнёр становится вашим преподавателем!",
    'uk': "Готові опанувати ці компліменти? З Love Languages ваш партнер може надсилати вам Word Gifts з компліментами голосом AI. Практикуйте з голосовим чатом AI, поки не набудете впевненості. Ваш партнер стає вашим викладачем!",
    'cs': "Připraveni zvládnout tyto komplimenty? S Love Languages vám partner může posílat Word Gifts s komplimenty v autentickém AI hlasu. Procvičujte s AI hlasovým chatem, dokud nebudete sebevědomí. Váš partner se stane vaším lektorem!",
    'sv': "Redo att bemästra dessa komplimanger? Med Love Languages kan din partner skicka Word Gifts med komplimanger i autentisk AI-röst. Öva med AI-röstchatt tills du känner dig säker. Din partner blir din lärare!",
    'da': "Klar til at mestre disse komplimenter? Med Love Languages kan din partner sende dig Word Gifts med komplimenter i autentisk AI-stemme. Øv med AI-stemmechat indtil du er selvsikker. Din partner bliver din lærer!",
    'no': "Klar til å mestre disse komplimentene? Med Love Languages kan partneren din sende deg Word Gifts med komplimenter i autentisk AI-stemme. Øv med AI-stemmechat til du er selvsikker. Partneren din blir læreren din!",
    'el': "Έτοιμοι να κατακτήσετε αυτά τα κομπλιμέντα; Με το Love Languages, ο σύντροφός σας μπορεί να σας στείλει Word Gifts με κομπλιμέντα σε αυθεντική φωνή AI. Εξασκηθείτε με φωνητική συνομιλία AI μέχρι να αισθανθείτε σίγουροι. Ο σύντροφός σας γίνεται ο δάσκαλός σας!",
    'hu': "Készen áll ezeket a bókokat elsajátítani? A Love Languages-szel partnere Word Gifts-eket küldhet autentikus AI hanggal. Gyakoroljon AI hangchatttel, amíg magabiztossá nem válik. Partnere tanárává válik!",
    'tr': "Bu iltifatları ustalaştırmaya hazır mısınız? Love Languages ile partneriniz size otantik AI sesiyle iltifatlar içeren Word Gifts gönderebilir. Kendinize güvenene kadar AI sesli sohbetle pratik yapın. Partneriniz öğretmeniniz olur!"
}

# Language names in their native languages
LANG_NAMES_NATIVE = {
    'en': 'English',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
    'pl': 'Polski',
    'ro': 'Română',
    'nl': 'Nederlands',
    'ru': 'Русский',
    'uk': 'Українська',
    'cs': 'Čeština',
    'sv': 'Svenska',
    'da': 'Dansk',
    'no': 'Norsk',
    'el': 'Ελληνικά',
    'hu': 'Magyar',
    'tr': 'Türkçe'
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

def improve_title(title, target_lang):
    """Improve title to be under 60 chars with pattern."""
    # Extract number if present
    num_match = re.search(r'\d+', title)
    number = num_match.group(0) if num_match else '50'

    # Get language name
    lang_name = LANG_NAMES_NATIVE.get(target_lang, target_lang.upper())

    # Create optimized title
    new_title = f"{number} {lang_name} Compliments for Your Partner"

    if len(new_title) > 60:
        new_title = f"{lang_name} Compliments for Your Partner"

    return new_title

def improve_description(description, target_lang):
    """Improve description to be under 155 chars with native phrase."""
    # Common compliment phrases by language
    native_phrases = {
        'en': 'You look amazing',
        'es': 'Eres hermosa',
        'fr': 'Tu es belle',
        'de': 'Du bist wunderschön',
        'it': 'Sei bellissima',
        'pt': 'Você é linda',
        'pl': 'Jesteś piękna',
        'ro': 'Ești frumoasă',
        'nl': 'Je bent mooi',
        'ru': 'Ты прекрасна',
        'uk': 'Ти прекрасна',
        'cs': 'Jsi krásná',
        'sv': 'Du är vacker',
        'da': 'Du er smuk',
        'no': 'Du er vakker',
        'el': 'Είσαι όμορφη',
        'hu': 'Gyönyörű vagy',
        'tr': 'Çok güzelsin'
    }

    phrase = native_phrases.get(target_lang, 'amazing')
    lang_name = LANG_NAMES_NATIVE.get(target_lang, target_lang.upper())

    new_desc = f"Master '{phrase}' and more {lang_name} compliments. Pronunciation guide for authentic delivery."

    if len(new_desc) > 155:
        new_desc = f"Learn {lang_name} compliments with '{phrase}'. Pronunciation guide included."

    return new_desc

def improve_cta(content, native_lang, target_lang):
    """Improve CTA section with Word Gifts messaging."""
    cta_text = CTA_TEMPLATES.get(native_lang, CTA_TEMPLATES['en'])
    button_text = BUTTON_TEXT.get(native_lang, BUTTON_TEXT['en'])

    # Add target language to button if it makes sense
    if native_lang in ['en', 'es', 'fr', 'de', 'it', 'pt']:
        lang_name = LANG_NAMES_NATIVE.get(target_lang, target_lang.upper())
        button_text = button_text + ' ' + lang_name

    # Find and replace CTA
    cta_pattern = r'<CTA\s+text="[^"]*"\s+buttonText="[^"]*"\s*/>'
    cta_pattern_multiline = r'<CTA\s+text="[^"]*"\s+buttonText="[^"]*"\s*\n/>'

    new_cta = f'<CTA\n  text="{cta_text}"\n  buttonText="{button_text}"\n/>'

    # Try both patterns
    if re.search(cta_pattern, content):
        content = re.sub(cta_pattern, new_cta, content)
    elif re.search(cta_pattern_multiline, content):
        content = re.sub(cta_pattern_multiline, new_cta, content)

    return content

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

    # Improve title
    old_title = data.get('title', '')
    new_title = improve_title(old_title, target_lang)

    # Improve description
    old_desc = data.get('description', '')
    new_desc = improve_description(old_desc, target_lang)

    # Update frontmatter
    new_frontmatter = frontmatter.replace(
        f'title: "{old_title}"', f'title: "{new_title}"'
    ).replace(
        f"title: '{old_title}'", f"title: '{new_title}'"
    ).replace(
        f'title: {old_title}', f'title: "{new_title}"'
    )

    new_frontmatter = new_frontmatter.replace(
        f'description: "{old_desc}"', f'description: "{new_desc}"'
    ).replace(
        f"description: '{old_desc}'", f"description: '{new_desc}'"
    ).replace(
        f'description: {old_desc}', f'description: "{new_desc}"'
    )

    # Improve CTA in body
    new_body = improve_cta(body, native_lang, target_lang)

    # Reconstruct file
    new_content = f"---\n{new_frontmatter}\n---\n{new_body}"

    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"  ✓ Updated title: {new_title[:50]}...")
    print(f"  ✓ Updated description: {new_desc[:50]}...")
    print(f"  ✓ Updated CTA")
    return True

def main():
    # Read file list
    with open('/tmp/compliments_files.txt', 'r') as f:
        files = [line.strip() for line in f if line.strip()]

    print(f"Found {len(files)} compliments articles to process\n")

    success_count = 0
    for filepath in files:
        if process_file(filepath):
            success_count += 1
        print()

    print(f"\n✅ Successfully processed {success_count}/{len(files)} files")

if __name__ == '__main__':
    main()
