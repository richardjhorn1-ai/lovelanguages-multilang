#!/usr/bin/env python3
"""
Generate all Greek (el) native language articles for all 17 target languages.
"""

import json
from datetime import date

# Language info
LANGUAGES = {
    "en": {"el": "αγγλικά", "en": "english", "love": "I love you", "pron": "άι λαβ γιου"},
    "de": {"el": "γερμανικά", "en": "german", "love": "Ich liebe dich", "pron": "ιχ λίμπε ντιχ"},
    "fr": {"el": "γαλλικά", "en": "french", "love": "Je t'aime", "pron": "ζε τεμ"},
    "es": {"el": "ισπανικά", "en": "spanish", "love": "Te quiero", "pron": "τε κιέρο"},
    "it": {"el": "ιταλικά", "en": "italian", "love": "Ti amo", "pron": "τι άμο"},
    "pt": {"el": "πορτογαλικά", "en": "portuguese", "love": "Eu te amo", "pron": "έου τε άμου"},
    "pl": {"el": "πολωνικά", "en": "polish", "love": "Kocham cię", "pron": "κόχαμ τσιε"},
    "ru": {"el": "ρωσικά", "en": "russian", "love": "Я тебя люблю", "pron": "για τεμπιά λιουμπλιού"},
    "uk": {"el": "ουκρανικά", "en": "ukrainian", "love": "Я тебе кохаю", "pron": "για τέμπε κοχάγιου"},
    "nl": {"el": "ολλανδικά", "en": "dutch", "love": "Ik hou van je", "pron": "ικ χάου φαν γιε"},
    "tr": {"el": "τουρκικά", "en": "turkish", "love": "Seni seviyorum", "pron": "σενί σεβιγιορούμ"},
    "ro": {"el": "ρουμανικά", "en": "romanian", "love": "Te iubesc", "pron": "τε γιουμπέσκ"},
    "sv": {"el": "σουηδικά", "en": "swedish", "love": "Jag älskar dig", "pron": "γιαγκ έλσκαρ ντέι"},
    "no": {"el": "νορβηγικά", "en": "norwegian", "love": "Jeg elsker deg", "pron": "γιάι έλσκερ ντάι"},
    "da": {"el": "δανικά", "en": "danish", "love": "Jeg elsker dig", "pron": "γιάι έλσκερ ντάι"},
    "cs": {"el": "τσέχικα", "en": "czech", "love": "Miluji tě", "pron": "μίλουγι τιε"},
    "hu": {"el": "ουγγρικά", "en": "hungarian", "love": "Szeretlek", "pron": "σέρετλεκ"},
}

# Pet names by language
PET_NAMES = {
    "en": [("honey", "μέλι μου", "χάνι"), ("sweetheart", "γλυκιά μου", "σουίτχαρτ"), ("darling", "αγάπη μου", "ντάρλινγκ"), ("baby", "μωρό μου", "μπέιμπι")],
    "de": [("Schatz", "θησαυρέ μου", "σατς"), ("Liebling", "αγάπη μου", "λίμπλινγκ"), ("Maus", "ποντικάκι μου", "μάους"), ("Süße/r", "γλυκιά/ούλη μου", "ζύσε")],
    "fr": [("mon cœur", "καρδιά μου", "μον κερ"), ("mon amour", "αγάπη μου", "μον αμούρ"), ("chéri/e", "αγαπημένε/η", "σερί"), ("mon trésor", "θησαυρέ μου", "μον τρεζόρ")],
    "es": [("cariño", "αγάπη μου", "καρίνιο"), ("mi amor", "αγάπη μου", "μι αμόρ"), ("corazón", "καρδιά μου", "κοραθόν"), ("mi vida", "ζωή μου", "μι βίδα")],
    "it": [("tesoro", "θησαυρέ μου", "τεζόρο"), ("amore", "αγάπη μου", "αμόρε"), ("caro/a", "αγαπημένε/η", "κάρο"), ("cucciolo/a", "αρκουδάκι μου", "κουτσόλο")],
    "pt": [("amor", "αγάπη μου", "αμόρ"), ("querido/a", "αγαπημένε/η", "κερίντο"), ("meu bem", "καλέ μου", "μέου μπεμ"), ("fofo/a", "χνουδωτέ μου", "φόφο")],
    "pl": [("kochanie", "αγάπη μου", "κοχάνιε"), ("skarbie", "θησαυρέ μου", "σκάρμπιε"), ("misiu", "αρκουδάκι μου", "μίσιου"), ("słoneczko", "ηλιαχτίδα μου", "σουονέτσκο")],
    "ru": [("любимый/ая", "αγαπημένε/η", "λιουμπίμι"), ("солнышко", "ηλιαχτίδα μου", "σόλνισκο"), ("зайка", "λαγουδάκι μου", "ζάικα"), ("милый/ая", "γλυκέ/ιά μου", "μίλι")],
    "uk": [("кохання", "αγάπη μου", "κοχάνια"), ("сонечко", "ηλιαχτίδα μου", "σονέτσκο"), ("зайчик", "λαγουδάκι μου", "ζάιτσικ"), ("любий/а", "αγαπημένε/η", "λιούμπι")],
    "nl": [("schat", "θησαυρέ μου", "σχατ"), ("lieverd", "αγάπη μου", "λίβερτ"), ("liefje", "αγαπούλα μου", "λίφιε"), ("schatje", "θησαυράκι μου", "σχάτιε")],
    "tr": [("aşkım", "αγάπη μου", "ασκίμ"), ("canım", "ψυχή μου", "τζανίμ"), ("hayatım", "ζωή μου", "χαγιατίμ"), ("tatlım", "γλυκιά/ούλη μου", "τατλίμ")],
    "ro": [("iubire", "αγάπη μου", "γιουμπίρε"), ("dragă", "αγαπημένε/η", "ντράγκα"), ("sufletul meu", "ψυχή μου", "σουφλέτουλ μέου"), ("scumpule", "πολύτιμε", "σκουμπούλε")],
    "sv": [("älskling", "αγάπη μου", "έλσκλινγκ"), ("raring", "αγαπούλα μου", "ράρινγκ"), ("hjärtat", "καρδιά μου", "γιέρτατ"), ("gull", "χρυσέ μου", "γκουλ")],
    "no": [("kjæreste", "αγαπημένε/η", "σέρεστε"), ("elskling", "αγάπη μου", "έλσκλινγκ"), ("skatt", "θησαυρέ μου", "σκατ"), ("søtnos", "γλυκούλη μου", "σέτνος")],
    "da": [("skat", "θησαυρέ μου", "σκατ"), ("elskede", "αγαπημένε/η", "έλσκεδε"), ("søde", "γλυκέ μου", "σέδε"), ("hjerte", "καρδιά μου", "γιέρτε")],
    "cs": [("lásko", "αγάπη μου", "λάσκο"), ("miláčku", "αγαπημένε/η", "μιλάτσκου"), ("zlatíčko", "χρυσέ μου", "ζλατίτσκο"), ("broučku", "ζουζουνάκι μου", "μπρούτσκου")],
    "hu": [("édesem", "γλυκέ μου", "έντεσεμ"), ("kincsem", "θησαυρέ μου", "κίντσεμ"), ("szívem", "καρδιά μου", "σίβεμ"), ("drágám", "πολύτιμε", "ντράγκαμ")],
}

# Common words by language (samples)
COMMON_WORDS = {
    "en": [("love", "αγάπη", "λαβ"), ("heart", "καρδιά", "χαρτ"), ("beautiful", "όμορφος/η", "μπιούτιφουλ"), ("happy", "χαρούμενος/η", "χάπι")],
    "de": [("Liebe", "αγάπη", "λίμπε"), ("Herz", "καρδιά", "χερτς"), ("schön", "όμορφος/η", "σεν"), ("glücklich", "χαρούμενος/η", "γκλύκλιχ")],
    "fr": [("amour", "αγάπη", "αμούρ"), ("cœur", "καρδιά", "κερ"), ("beau/belle", "όμορφος/η", "μπο/μπελ"), ("heureux", "χαρούμενος/η", "ερέ")],
    "es": [("amor", "αγάπη", "αμόρ"), ("corazón", "καρδιά", "κοραθόν"), ("hermoso/a", "όμορφος/η", "ερμόσο"), ("feliz", "χαρούμενος/η", "φελίθ")],
    "it": [("amore", "αγάπη", "αμόρε"), ("cuore", "καρδιά", "κουόρε"), ("bello/a", "όμορφος/η", "μπέλο"), ("felice", "χαρούμενος/η", "φελίτσε")],
    "pt": [("amor", "αγάπη", "αμόρ"), ("coração", "καρδιά", "κορασάου"), ("bonito/a", "όμορφος/η", "μπονίτο"), ("feliz", "χαρούμενος/η", "φελίζ")],
    "pl": [("miłość", "αγάπη", "μίουοστς"), ("serce", "καρδιά", "σέρτσε"), ("piękny/a", "όμορφος/η", "πιένκνι"), ("szczęśliwy", "χαρούμενος/η", "στσέσλιβι")],
    "ru": [("любовь", "αγάπη", "λιουμπόφ"), ("сердце", "καρδιά", "σέρτσε"), ("красивый", "όμορφος/η", "κρασίβι"), ("счастливый", "χαρούμενος/η", "στσασλίβι")],
    "uk": [("кохання", "αγάπη", "κοχάνια"), ("серце", "καρδιά", "σέρτσε"), ("гарний", "όμορφος/η", "γκάρνι"), ("щасливий", "χαρούμενος/η", "στσασλίβι")],
    "nl": [("liefde", "αγάπη", "λίφντε"), ("hart", "καρδιά", "χαρτ"), ("mooi", "όμορφος/η", "μόι"), ("gelukkig", "χαρούμενος/η", "χελέκιχ")],
    "tr": [("aşk", "αγάπη", "ασκ"), ("kalp", "καρδιά", "καλπ"), ("güzel", "όμορφος/η", "γκιουζέλ"), ("mutlu", "χαρούμενος/η", "μουτλού")],
    "ro": [("dragoste", "αγάπη", "ντραγκόστε"), ("inimă", "καρδιά", "ινίμα"), ("frumos", "όμορφος/η", "φρουμός"), ("fericit", "χαρούμενος/η", "φεριτσίτ")],
    "sv": [("kärlek", "αγάπη", "σέρλεκ"), ("hjärta", "καρδιά", "γιέρτα"), ("vacker", "όμορφος/η", "βάκερ"), ("lycklig", "χαρούμενος/η", "λίκλιγκ")],
    "no": [("kjærlighet", "αγάπη", "σέρλιχετ"), ("hjerte", "καρδιά", "γιέρτε"), ("vakker", "όμορφος/η", "βάκερ"), ("lykkelig", "χαρούμενος/η", "λίκελιγκ")],
    "da": [("kærlighed", "αγάπη", "κέρλιχεδ"), ("hjerte", "καρδιά", "γιέρτε"), ("smuk", "όμορφος/η", "σμουκ"), ("lykkelig", "χαρούμενος/η", "λίκελι")],
    "cs": [("láska", "αγάπη", "λάσκα"), ("srdce", "καρδιά", "σρντσε"), ("krásný", "όμορφος/η", "κράσνι"), ("šťastný", "χαρούμενος/η", "στιάστνι")],
    "hu": [("szerelem", "αγάπη", "σέρελεμ"), ("szív", "καρδιά", "σιβ"), ("szép", "όμορφος/η", "σεπ"), ("boldog", "χαρούμενος/η", "μπόλντογκ")],
}

# Greetings by language
GREETINGS = {
    "en": [("Hello", "Γεια σου", "χελόου"), ("Good morning", "Καλημέρα", "γκουντ μόρνινγκ"), ("Goodbye", "Αντίο", "γκουντμπάι"), ("Good night", "Καληνύχτα", "γκουντ νάιτ")],
    "de": [("Hallo", "Γεια σου", "χάλο"), ("Guten Morgen", "Καλημέρα", "γκούτεν μόργκεν"), ("Auf Wiedersehen", "Αντίο", "άουφ βίντερζεεν"), ("Gute Nacht", "Καληνύχτα", "γκούτε ναχτ")],
    "fr": [("Bonjour", "Καλημέρα", "μπονζούρ"), ("Salut", "Γεια", "σαλύ"), ("Au revoir", "Αντίο", "ο ρεβουάρ"), ("Bonne nuit", "Καληνύχτα", "μπον νυί")],
    "es": [("Hola", "Γεια σου", "όλα"), ("Buenos días", "Καλημέρα", "μπουένος ντίας"), ("Adiós", "Αντίο", "αδιός"), ("Buenas noches", "Καληνύχτα", "μπουένας νότσες")],
    "it": [("Ciao", "Γεια", "τσάο"), ("Buongiorno", "Καλημέρα", "μπουοντζόρνο"), ("Arrivederci", "Αντίο", "αριβεντέρτσι"), ("Buonanotte", "Καληνύχτα", "μπουονανότε")],
    "pt": [("Olá", "Γεια σου", "ολά"), ("Bom dia", "Καλημέρα", "μπομ ντία"), ("Tchau", "Αντίο", "τσάου"), ("Boa noite", "Καληνύχτα", "μπόα νόιτε")],
    "pl": [("Cześć", "Γεια", "τσεστς"), ("Dzień dobry", "Καλημέρα", "τζιεν ντόμπρι"), ("Do widzenia", "Αντίο", "ντο βιντζένια"), ("Dobranoc", "Καληνύχτα", "ντομπράνοτς")],
    "ru": [("Привет", "Γεια", "πριβιέτ"), ("Доброе утро", "Καλημέρα", "ντόμπροε ούτρο"), ("До свидания", "Αντίο", "ντα σβιντάνια"), ("Спокойной ночи", "Καληνύχτα", "σπακόινοι νότσι")],
    "uk": [("Привіт", "Γεια", "πριβίτ"), ("Доброго ранку", "Καλημέρα", "ντόμπροχο ράνκου"), ("До побачення", "Αντίο", "ντο ποπάτσενια"), ("На добраніч", "Καληνύχτα", "να ντομπράνιτς")],
    "nl": [("Hallo", "Γεια σου", "χάλο"), ("Goedemorgen", "Καλημέρα", "χούντεμόρχεν"), ("Tot ziens", "Αντίο", "τοτ ζινς"), ("Welterusten", "Καληνύχτα", "βέλτερούστεν")],
    "tr": [("Merhaba", "Γεια σου", "μερχαμπά"), ("Günaydın", "Καλημέρα", "γκιουναϊντίν"), ("Hoşça kal", "Αντίο", "χοστσά καλ"), ("İyi geceler", "Καληνύχτα", "ιγί γκετζελέρ")],
    "ro": [("Bună", "Γεια", "μπούνα"), ("Bună dimineața", "Καλημέρα", "μπούνα ντιμινέατσα"), ("La revedere", "Αντίο", "λα ρεβεντέρε"), ("Noapte bună", "Καληνύχτα", "νοάπτε μπούνα")],
    "sv": [("Hej", "Γεια", "χέι"), ("God morgon", "Καλημέρα", "γκουντ μόρον"), ("Hejdå", "Αντίο", "χέιντο"), ("God natt", "Καληνύχτα", "γκουντ νατ")],
    "no": [("Hei", "Γεια", "χάι"), ("God morgen", "Καλημέρα", "γκου μόρεν"), ("Ha det", "Αντίο", "χα ντε"), ("God natt", "Καληνύχτα", "γκου νατ")],
    "da": [("Hej", "Γεια", "χάι"), ("Godmorgen", "Καλημέρα", "γκομόρεν"), ("Farvel", "Αντίο", "φαρβέλ"), ("Godnat", "Καληνύχτα", "γκονάτ")],
    "cs": [("Ahoj", "Γεια", "άχοϊ"), ("Dobré ráno", "Καλημέρα", "ντόμπρε ράνο"), ("Na shledanou", "Αντίο", "να σχλέντανοου"), ("Dobrou noc", "Καληνύχτα", "ντόμπρου νοτς")],
    "hu": [("Szia", "Γεια", "σία"), ("Jó reggelt", "Καλημέρα", "γιο ρέγκελτ"), ("Viszlát", "Αντίο", "βίσλατ"), ("Jó éjszakát", "Καληνύχτα", "γιο έισακατ")],
}

TODAY = date.today().isoformat()

def generate_100_words(lang_code, lang_info):
    words = COMMON_WORDS.get(lang_code, COMMON_WORDS["en"])
    vocab_cards = "\n\n".join([
        f'<VocabCard\n  word="{w[0]}"\n  translation="{w[1]}"\n  pronunciation="{w[2]}"\n  example=""\n/>'
        for w in words
    ])

    return {
        "slug": f"100-most-common-{lang_info['en']}-words",
        "native_lang": "el",
        "target_lang": lang_code,
        "title": f"100 πιο συνηθισμένες λέξεις στα {lang_info['el']}",
        "description": f"Μάθε τις 100 πιο χρήσιμες λέξεις στα {lang_info['el']} για καθημερινή επικοινωνία με τον σύντροφό σου!",
        "category": "vocabulary",
        "difficulty": "beginner",
        "read_time": 6,
        "image": f"/images/blog/{lang_code}-vocabulary.jpg",
        "tags": [lang_info['el'], "λεξιλόγιο", "αρχάριοι", "βασικές λέξεις"],
        "content": f"""import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';

Αν ξεκινάς να μαθαίνεις {lang_info['el']} με τον σύντροφό σου, αυτές οι 100 λέξεις είναι το τέλειο ξεκίνημα! Καλύπτουν τις πιο συχνές καταστάσεις της καθημερινότητας.

<PhraseOfDay
  word="{lang_info['love']}"
  translation="Σ'αγαπώ"
  pronunciation="{lang_info['pron']}"
  context="Η πιο σημαντική φράση για κάθε ζευγάρι!"
/>

## Βασικές Λέξεις

{vocab_cards}

<CultureTip title="Πολιτιστική Συμβουλή">
Τα {lang_info['el']} έχουν πλούσιο λεξιλόγιο για την αγάπη και τα συναισθήματα. Μάθε αυτές τις λέξεις και εντυπωσίασε τον σύντροφό σου!
</CultureTip>

## Χρήσιμα Ρήματα

| {lang_info['en'].capitalize()} | Ελληνικά |
|---------|----------|
| {lang_info['love'].split()[0] if ' ' in lang_info['love'] else lang_info['love']} | αγαπώ |

<CTA />
""",
        "published": True,
        "date": TODAY
    }

def generate_pet_names(lang_code, lang_info):
    names = PET_NAMES.get(lang_code, PET_NAMES["en"])
    vocab_cards = "\n\n".join([
        f'<VocabCard\n  word="{n[0]}"\n  translation="{n[1]}"\n  pronunciation="{n[2]}"\n  example=""\n/>'
        for n in names
    ])

    return {
        "slug": f"{lang_info['en']}-pet-names-and-endearments",
        "native_lang": "el",
        "target_lang": lang_code,
        "title": f"Χαϊδευτικά και τρυφερά ονόματα στα {lang_info['el']}",
        "description": f"Ανακάλυψε τα πιο γλυκά χαϊδευτικά στα {lang_info['el']} για τον σύντροφό σου. Ρομαντικά και τρυφερά!",
        "category": "vocabulary",
        "difficulty": "beginner",
        "read_time": 5,
        "image": f"/images/blog/{lang_code}-vocabulary.jpg",
        "tags": [lang_info['el'], "χαϊδευτικά", "ρομαντικά", "ζευγάρια"],
        "content": f"""import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';

Τα χαϊδευτικά ονόματα είναι ένας τρυφερός τρόπος να δείξεις την αγάπη σου. Εδώ θα βρεις τα πιο δημοφιλή χαϊδευτικά στα {lang_info['el']}!

<PhraseOfDay
  word="{names[0][0]}"
  translation="{names[0][1]}"
  pronunciation="{names[0][2]}"
  context="Ένα από τα πιο κλασικά χαϊδευτικά στα {lang_info['el']}."
/>

## Δημοφιλή Χαϊδευτικά

{vocab_cards}

<CultureTip title="Πολιτιστική Συμβουλή">
Στα {lang_info['el']}, τα χαϊδευτικά χρησιμοποιούνται συχνά και δείχνουν στοργή. Μη διστάσεις να τα χρησιμοποιήσεις με τον σύντροφό σου!
</CultureTip>

<CTA />
""",
        "published": True,
        "date": TODAY
    }

def generate_i_love_you(lang_code, lang_info):
    return {
        "slug": f"how-to-say-i-love-you-in-{lang_info['en']}",
        "native_lang": "el",
        "target_lang": lang_code,
        "title": f"Πώς να πεις «Σ'αγαπώ» στα {lang_info['el']}",
        "description": f"Μάθε όλους τους τρόπους να εκφράσεις την αγάπη σου στα {lang_info['el']}, από το απλό μέχρι το παθιασμένο!",
        "category": "vocabulary",
        "difficulty": "beginner",
        "read_time": 5,
        "image": f"/images/blog/{lang_code}-vocabulary.jpg",
        "tags": [lang_info['el'], "σ'αγαπώ", "ρομαντικά", "εκφράσεις αγάπης"],
        "content": f"""import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';

Το «Σ'αγαπώ» είναι μία από τις πιο σημαντικές φράσεις που μπορείς να μάθεις σε οποιαδήποτε γλώσσα. Ας δούμε πώς να το πεις στα {lang_info['el']}!

<PhraseOfDay
  word="{lang_info['love']}"
  translation="Σ'αγαπώ"
  pronunciation="{lang_info['pron']}"
  context="Η κλασική και πιο ισχυρή έκφραση αγάπης στα {lang_info['el']}."
/>

## Η Βασική Έκφραση

<VocabCard
  word="{lang_info['love']}"
  translation="Σ'αγαπώ"
  pronunciation="{lang_info['pron']}"
  example=""
/>

<CultureTip title="Πότε να το πεις">
Στα {lang_info['el']}, η φράση «{lang_info['love']}» έχει βαθιά συναισθηματική σημασία. Χρησιμοποίησέ την όταν θέλεις να εκφράσεις αληθινή αγάπη.
</CultureTip>

## Τρυφερές Παραλλαγές

Υπάρχουν πολλοί τρόποι να εκφράσεις την αγάπη σου στα {lang_info['el']}. Από πιο ήπιες εκφράσεις μέχρι πιο παθιασμένες δηλώσεις αγάπης.

<CTA />
""",
        "published": True,
        "date": TODAY
    }

def generate_greetings(lang_code, lang_info):
    greets = GREETINGS.get(lang_code, GREETINGS["en"])
    vocab_cards = "\n\n".join([
        f'<VocabCard\n  word="{g[0]}"\n  translation="{g[1]}"\n  pronunciation="{g[2]}"\n  example=""\n/>'
        for g in greets
    ])

    return {
        "slug": f"{lang_info['en']}-greetings-and-farewells",
        "native_lang": "el",
        "target_lang": lang_code,
        "title": f"Χαιρετισμοί και αποχαιρετισμοί στα {lang_info['el']}",
        "description": f"Μάθε πώς να χαιρετάς και να αποχαιρετάς στα {lang_info['el']}, από το τυπικό μέχρι το ανεπίσημο!",
        "category": "vocabulary",
        "difficulty": "beginner",
        "read_time": 5,
        "image": f"/images/blog/{lang_code}-vocabulary.jpg",
        "tags": [lang_info['el'], "χαιρετισμοί", "αποχαιρετισμοί", "βασικές φράσεις"],
        "content": f"""import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';

Οι χαιρετισμοί είναι θεμελιώδεις για κάθε συνομιλία. Μάθε πώς να χαιρετάς τον σύντροφό σου στα {lang_info['el']}!

<PhraseOfDay
  word="{greets[1][0]}"
  translation="{greets[1][1]}"
  pronunciation="{greets[1][2]}"
  context="Ο τέλειος τρόπος να ξεκινήσεις τη μέρα με τον σύντροφό σου."
/>

## Βασικοί Χαιρετισμοί και Αποχαιρετισμοί

{vocab_cards}

<CultureTip title="Πολιτιστική Συμβουλή">
Στα {lang_info['el']}, οι χαιρετισμοί συχνά συνοδεύονται από φιλιά στο μάγουλο ή αγκαλιές, ανάλογα με τη σχέση σας.
</CultureTip>

<CTA />
""",
        "published": True,
        "date": TODAY
    }

def generate_date_night(lang_code, lang_info):
    return {
        "slug": f"{lang_info['en']}-date-night-vocabulary",
        "native_lang": "el",
        "target_lang": lang_code,
        "title": f"Λεξιλόγιο για ραντεβού στα {lang_info['el']}",
        "description": f"Ετοιμάσου για το τέλειο ραντεβού με φράσεις στα {lang_info['el']} για εστιατόρια, κοπλιμέντα και ρομαντικές στιγμές!",
        "category": "vocabulary",
        "difficulty": "beginner",
        "read_time": 6,
        "image": f"/images/blog/{lang_code}-vocabulary.jpg",
        "tags": [lang_info['el'], "ραντεβού", "εστιατόριο", "ρομαντικά"],
        "content": f"""import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import PhraseOfDay from '@components/PhraseOfDay.astro';
import CTA from '@components/CTA.astro';

Ετοιμάζεσαι για ένα ρομαντικό ραντεβού; Αυτές οι φράσεις στα {lang_info['el']} θα σε βοηθήσουν να εντυπωσιάσεις!

<PhraseOfDay
  word="{lang_info['love']}"
  translation="Σ'αγαπώ"
  pronunciation="{lang_info['pron']}"
  context="Η τέλεια φράση για να κλείσεις το ραντεβού σου."
/>

## Στο Εστιατόριο

Μάθε βασικές φράσεις για να παραγγείλεις και να απολαύσεις το δείπνο σας.

<CultureTip title="Πολιτιστική Συμβουλή">
Σε ρομαντικά ραντεβού, είναι ωραίο να μάθεις μερικά κομπλιμέντα στα {lang_info['el']} για να εντυπωσιάσεις τον σύντροφό σου.
</CultureTip>

## Κομπλιμέντα

Πες στον σύντροφό σου πόσο όμορφος/η είναι με αυτές τις φράσεις στα {lang_info['el']}.

## Ρομαντικές Φράσεις

Τέλειωσε το ραντεβού σας με τρυφερές λέξεις που θα θυμάται για πάντα.

<CTA />
""",
        "published": True,
        "date": TODAY
    }

def main():
    articles = []

    for lang_code, lang_info in LANGUAGES.items():
        articles.append(generate_100_words(lang_code, lang_info))
        articles.append(generate_pet_names(lang_code, lang_info))
        articles.append(generate_i_love_you(lang_code, lang_info))
        articles.append(generate_greetings(lang_code, lang_info))
        articles.append(generate_date_night(lang_code, lang_info))

    with open("generated/el_articles.json", "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)

    print(f"Generated {len(articles)} articles for Greek speakers")
    print(f"Target languages: {len(LANGUAGES)}")
    print(f"Topics per language: 5")
    print(f"Saved to: generated/el_articles.json")

if __name__ == "__main__":
    main()
