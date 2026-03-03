#!/usr/bin/env python3.11
"""
Add internal links to blog articles — V2 with multilingual matching.

Two matching strategies combined:
1. MULTILINGUAL TOPIC PATTERNS — topic keywords translated to all 18 native languages
2. TITLE-BASED MATCHING — extract key phrases from article titles (already in native language)
   and find them in other articles' content

Usage:
  python3.11 scripts/add-internal-links-v2.py --pair en-pl --dry-run
  python3.11 scripts/add-internal-links-v2.py --pair cs-el --dry-run
  python3.11 scripts/add-internal-links-v2.py --all
  python3.11 scripts/add-internal-links-v2.py --all --dry-run
"""

import json, re, os, sys, subprocess, argparse
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional

# Config
SUPABASE_URL = "https://iiusoobuoxurysrhqptx.supabase.co/rest/v1"
MAX_LINKS_PER_ARTICLE = 12
MIN_PATTERN_LEN = 4
DATA_DIR = Path(__file__).parent.parent / "data" / "articles-v2"
DIFF_DIR = Path(__file__).parent.parent / "data" / "link-diffs-v2"

# ──────────────────────────────────────────────────────────────
# MULTILINGUAL TOPIC PATTERNS
# Each topic maps to phrases in all 18 languages.
# These are the words that actually appear in article content.
# ──────────────────────────────────────────────────────────────
TOPIC_PATTERNS = {
    'pronunciation': {
        'en': ['pronunciation', 'pronounce', 'how to say'],
        'es': ['pronunciación', 'pronunciar', 'cómo decir'],
        'fr': ['prononciation', 'prononcer', 'comment dire'],
        'de': ['Aussprache', 'aussprechen', 'wie sagt man'],
        'it': ['pronuncia', 'pronunciare', 'come si dice'],
        'pt': ['pronúncia', 'pronunciar', 'como dizer'],
        'nl': ['uitspraak', 'uitspreken', 'hoe zeg je'],
        'pl': ['wymowa', 'wymówić', 'jak powiedzieć'],
        'ru': ['произношение', 'произносить', 'как сказать'],
        'uk': ['вимова', 'вимовляти', 'як сказати'],
        'tr': ['telaffuz', 'söylemek', 'nasıl söylenir'],
        'ro': ['pronunție', 'pronunța', 'cum se spune'],
        'sv': ['uttal', 'uttala', 'hur säger man'],
        'no': ['uttale', 'hvordan sier man'],
        'da': ['udtale', 'hvordan siger man'],
        'cs': ['výslovnost', 'vyslovit', 'jak říct'],
        'el': ['προφορά', 'πώς να πεις'],
        'hu': ['kiejtés', 'kiejteni', 'hogyan mondjuk'],
    },
    'romantic': {
        'en': ['romantic phrases', 'love phrases', 'romantic expressions', 'romantic words'],
        'es': ['frases románticas', 'frases de amor', 'expresiones románticas'],
        'fr': ['phrases romantiques', 'mots d\'amour', 'expressions romantiques'],
        'de': ['romantische Sätze', 'Liebesworte', 'romantische Ausdrücke'],
        'it': ['frasi romantiche', 'frasi d\'amore', 'espressioni romantiche'],
        'pt': ['frases românticas', 'frases de amor', 'expressões românticas'],
        'nl': ['romantische zinnen', 'liefdeswoorden', 'romantische uitdrukkingen'],
        'pl': ['romantyczne zwroty', 'zwroty miłosne', 'romantyczne wyrażenia'],
        'ru': ['романтические фразы', 'любовные фразы', 'романтические выражения'],
        'uk': ['романтичні фрази', 'любовні фрази', 'романтичні вирази'],
        'tr': ['romantik sözler', 'aşk sözleri', 'romantik ifadeler'],
        'ro': ['fraze romantice', 'cuvinte de dragoste', 'expresii romantice'],
        'sv': ['romantiska fraser', 'kärleksord', 'romantiska uttryck'],
        'no': ['romantiske fraser', 'kjærlighetsord', 'romantiske uttrykk'],
        'da': ['romantiske sætninger', 'kærlighedsord', 'romantiske udtryk'],
        'cs': ['romantické fráze', 'milostné fráze', 'romantické výrazy'],
        'el': ['ρομαντικές φράσεις', 'φράσεις αγάπης', 'ρομαντικές εκφράσεις'],
        'hu': ['romantikus kifejezések', 'szerelmes kifejezések'],
    },
    'i-love-you': {
        'en': ['I love you', 'say I love you', 'express love'],
        'es': ['te quiero', 'te amo', 'expresar amor'],
        'fr': ['je t\'aime', 'exprimer l\'amour'],
        'de': ['ich liebe dich', 'Liebe ausdrücken'],
        'it': ['ti amo', 'esprimere amore'],
        'pt': ['eu te amo', 'expressar amor'],
        'nl': ['ik hou van je', 'liefde uiten'],
        'pl': ['kocham cię', 'wyrażać miłość'],
        'ru': ['я тебя люблю', 'выразить любовь'],
        'uk': ['я тебе кохаю', 'висловити кохання'],
        'tr': ['seni seviyorum', 'aşk ifade etmek'],
        'ro': ['te iubesc', 'a exprima dragostea'],
        'sv': ['jag älskar dig', 'uttrycka kärlek'],
        'no': ['jeg elsker deg', 'uttrykke kjærlighet'],
        'da': ['jeg elsker dig', 'udtrykke kærlighed'],
        'cs': ['miluji tě', 'vyjádřit lásku'],
        'el': ['σ\'αγαπώ', 'εκφράζω αγάπη'],
        'hu': ['szeretlek', 'szerelmet kifejezni'],
    },
    'pet-names': {
        'en': ['pet names', 'terms of endearment', 'nicknames', 'sweet names'],
        'es': ['apodos cariñosos', 'términos de cariño', 'nombres cariñosos'],
        'fr': ['surnoms affectueux', 'termes affectueux', 'petits noms'],
        'de': ['Kosenamen', 'Spitznamen', 'liebevolle Namen'],
        'it': ['nomignoli affettuosi', 'soprannomi', 'nomi dolci'],
        'pt': ['apelidos carinhosos', 'nomes carinhosos'],
        'nl': ['koosnaampjes', 'lieve namen', 'bijnamen'],
        'pl': ['czułe przezwiska', 'zdrobnienia', 'pieszczotliwe imiona'],
        'ru': ['ласковые прозвища', 'ласковые имена', 'уменьшительные'],
        'uk': ['ласкаві прізвиська', 'пестливі імена'],
        'tr': ['sevgi isimleri', 'tatlı isimler', 'lakaplar'],
        'ro': ['alinturile', 'porecle drăguțe', 'nume afectuoase'],
        'sv': ['smeknamn', 'kärleksnamn', 'öknamn'],
        'no': ['kjælenavn', 'kallenavn', 'kjærlige navn'],
        'da': ['kælenavne', 'øgenavne', 'kærlige navne'],
        'cs': ['mazlivá jména', 'přezdívky', 'láskyplná jména'],
        'el': ['χαϊδευτικά', 'τρυφερά ονόματα', 'υποκοριστικά'],
        'hu': ['becézések', 'kedveskedő nevek', 'becenevek'],
    },
    'compliments': {
        'en': ['compliments', 'flatter', 'praise', 'nice things to say'],
        'es': ['cumplidos', 'piropos', 'halagos', 'elogios'],
        'fr': ['compliments', 'flatter', 'faire des compliments'],
        'de': ['Komplimente', 'schmeicheln', 'loben'],
        'it': ['complimenti', 'fare complimenti', 'lusingare'],
        'pt': ['elogios', 'elogiar', 'cumprimentos'],
        'nl': ['complimenten', 'vleien', 'prijzen'],
        'pl': ['komplementy', 'pochlebstwa', 'chwalić'],
        'ru': ['комплименты', 'похвала', 'льстить'],
        'uk': ['компліменти', 'похвала', 'лестити'],
        'tr': ['iltifatlar', 'övgü', 'övmek'],
        'ro': ['complimente', 'laude', 'a flata'],
        'sv': ['komplimanger', 'beröm', 'smickra'],
        'no': ['komplimenter', 'ros', 'smigre'],
        'da': ['komplimenter', 'ros', 'smigre'],
        'cs': ['komplimenty', 'pochvaly', 'lichotky'],
        'el': ['κομπλιμέντα', 'φιλοφρονήσεις', 'κολακεία'],
        'hu': ['bókok', 'dicséret', 'hízelgés'],
    },
    'greetings': {
        'en': ['greetings', 'hello', 'goodbye', 'good morning', 'good night'],
        'es': ['saludos', 'hola', 'adiós', 'buenos días', 'buenas noches'],
        'fr': ['salutations', 'bonjour', 'au revoir', 'bonsoir', 'bonne nuit'],
        'de': ['Begrüßungen', 'Hallo', 'Auf Wiedersehen', 'Guten Morgen', 'Gute Nacht'],
        'it': ['saluti', 'ciao', 'arrivederci', 'buongiorno', 'buonanotte'],
        'pt': ['saudações', 'olá', 'adeus', 'bom dia', 'boa noite'],
        'nl': ['begroetingen', 'hallo', 'tot ziens', 'goedemorgen', 'goedenacht'],
        'pl': ['powitania', 'cześć', 'do widzenia', 'dzień dobry', 'dobranoc'],
        'ru': ['приветствия', 'привет', 'до свидания', 'доброе утро', 'спокойной ночи'],
        'uk': ['привітання', 'привіт', 'до побачення', 'доброго ранку', 'на добраніч'],
        'tr': ['selamlaşma', 'merhaba', 'güle güle', 'günaydın', 'iyi geceler'],
        'ro': ['salutări', 'bună', 'la revedere', 'bună dimineața', 'noapte bună'],
        'sv': ['hälsningar', 'hej', 'hejdå', 'god morgon', 'god natt'],
        'no': ['hilsener', 'hei', 'ha det', 'god morgen', 'god natt'],
        'da': ['hilsner', 'hej', 'farvel', 'godmorgen', 'godnat'],
        'cs': ['pozdravy', 'ahoj', 'nashledanou', 'dobré ráno', 'dobrou noc'],
        'el': ['χαιρετισμοί', 'γεια σου', 'αντίο', 'καλημέρα', 'καληνύχτα'],
        'hu': ['üdvözlések', 'szia', 'viszlát', 'jó reggelt', 'jó éjt'],
    },
    'birthday': {
        'en': ['birthday', 'birthday wishes', 'happy birthday'],
        'es': ['cumpleaños', 'feliz cumpleaños'],
        'fr': ['anniversaire', 'joyeux anniversaire'],
        'de': ['Geburtstag', 'alles Gute zum Geburtstag'],
        'it': ['compleanno', 'buon compleanno'],
        'pt': ['aniversário', 'feliz aniversário'],
        'nl': ['verjaardag', 'gefeliciteerd'],
        'pl': ['urodziny', 'wszystkiego najlepszego'],
        'ru': ['день рождения', 'с днём рождения'],
        'uk': ['день народження', 'з днем народження'],
        'tr': ['doğum günü', 'mutlu yıllar'],
        'ro': ['ziua de naștere', 'la mulți ani'],
        'sv': ['födelsedag', 'grattis på födelsedagen'],
        'no': ['bursdag', 'gratulerer med dagen'],
        'da': ['fødselsdag', 'tillykke med fødselsdagen'],
        'cs': ['narozeniny', 'všechno nejlepší'],
        'el': ['γενέθλια', 'χρόνια πολλά'],
        'hu': ['születésnap', 'boldog születésnapot'],
    },
    'anniversary': {
        'en': ['anniversary', 'anniversary wishes'],
        'es': ['aniversario', 'feliz aniversario'],
        'fr': ['anniversaire de mariage', 'anniversaire de couple'],
        'de': ['Jahrestag', 'Hochzeitstag'],
        'it': ['anniversario', 'buon anniversario'],
        'pt': ['aniversário de casamento', 'aniversário'],
        'nl': ['trouwdag', 'jubileum'],
        'pl': ['rocznica', 'rocznica ślubu'],
        'ru': ['годовщина', 'юбилей'],
        'uk': ['річниця', 'ювілей'],
        'tr': ['yıldönümü', 'evlilik yıldönümü'],
        'ro': ['aniversare', 'aniversarea căsătoriei'],
        'sv': ['årsdag', 'bröllopsdag'],
        'no': ['jubileum', 'bryllupsdag'],
        'da': ['jubilæum', 'bryllupsdag'],
        'cs': ['výročí', 'výročí svatby'],
        'el': ['επέτειος', 'επέτειος γάμου'],
        'hu': ['évforduló', 'házassági évforduló'],
    },
    'wedding': {
        'en': ['wedding', 'marriage', 'wedding vows', 'wedding phrases'],
        'es': ['boda', 'matrimonio', 'votos matrimoniales'],
        'fr': ['mariage', 'noces', 'vœux de mariage'],
        'de': ['Hochzeit', 'Ehe', 'Hochzeitsgelübde'],
        'it': ['matrimonio', 'nozze', 'voti nuziali'],
        'pt': ['casamento', 'votos de casamento'],
        'nl': ['bruiloft', 'huwelijk', 'huwelijksgeloften'],
        'pl': ['ślub', 'małżeństwo', 'przysięga małżeńska'],
        'ru': ['свадьба', 'брак', 'свадебные клятвы'],
        'uk': ['весілля', 'шлюб', 'весільні клятви'],
        'tr': ['düğün', 'evlilik', 'nikah yemini'],
        'ro': ['nuntă', 'căsătorie', 'jurăminte de nuntă'],
        'sv': ['bröllop', 'äktenskap', 'bröllopslöften'],
        'no': ['bryllup', 'ekteskap', 'bryllupsløfter'],
        'da': ['bryllup', 'ægteskab', 'bryllupsløfter'],
        'cs': ['svatba', 'manželství', 'svatební sliby'],
        'el': ['γάμος', 'γαμήλιοι όρκοι'],
        'hu': ['esküvő', 'házasság', 'esküvői fogadalmak'],
    },
    'family': {
        'en': ['family', 'meeting the family', "partner's family", 'in-laws', 'parents'],
        'es': ['familia', 'conocer a la familia', 'suegros', 'padres'],
        'fr': ['famille', 'rencontrer la famille', 'beaux-parents', 'parents'],
        'de': ['Familie', 'Familie kennenlernen', 'Schwiegereltern', 'Eltern'],
        'it': ['famiglia', 'incontrare la famiglia', 'suoceri', 'genitori'],
        'pt': ['família', 'conhecer a família', 'sogros', 'pais'],
        'nl': ['familie', 'familie ontmoeten', 'schoonfamilie', 'ouders'],
        'pl': ['rodzina', 'poznać rodzinę', 'teściowie', 'rodzice'],
        'ru': ['семья', 'познакомиться с семьёй', 'тёща', 'родители'],
        'uk': ['сім\'я', 'познайомитися з родиною', 'батьки'],
        'tr': ['aile', 'aileyle tanışma', 'kayınpeder', 'anne baba'],
        'ro': ['familie', 'cunoașterea familiei', 'socri', 'părinți'],
        'sv': ['familj', 'träffa familjen', 'svärföräldrar', 'föräldrar'],
        'no': ['familie', 'møte familien', 'svigerforeldre', 'foreldre'],
        'da': ['familie', 'møde familien', 'svigerforældre', 'forældre'],
        'cs': ['rodina', 'seznámení s rodinou', 'tcháni', 'rodiče'],
        'el': ['οικογένεια', 'γνωρίστε την οικογένεια', 'πεθερικά', 'γονείς'],
        'hu': ['család', 'családdal való találkozás', 'anyós', 'szülők'],
    },
    'texting': {
        'en': ['texting', 'text messages', 'messaging', 'chat abbreviations'],
        'es': ['mensajes de texto', 'enviar mensajes', 'abreviaturas de chat'],
        'fr': ['textos', 'messages texte', 'abréviations SMS'],
        'de': ['SMS', 'Textnachrichten', 'Chat-Abkürzungen'],
        'it': ['messaggi', 'messaggiare', 'abbreviazioni chat'],
        'pt': ['mensagens de texto', 'abreviações de chat'],
        'nl': ['sms\'en', 'berichten', 'chat-afkortingen'],
        'pl': ['wiadomości tekstowe', 'pisanie SMS', 'skróty czatowe'],
        'ru': ['текстовые сообщения', 'переписка', 'сокращения в чате'],
        'uk': ['текстові повідомлення', 'листування', 'скорочення в чаті'],
        'tr': ['mesajlaşma', 'kısa mesaj', 'chat kısaltmaları'],
        'ro': ['mesaje text', 'trimiterea mesajelor'],
        'sv': ['textmeddelanden', 'sms', 'chatt-förkortningar'],
        'no': ['tekstmeldinger', 'sms', 'chat-forkortelser'],
        'da': ['tekstbeskeder', 'sms', 'chat-forkortelser'],
        'cs': ['textové zprávy', 'psaní SMS', 'chatové zkratky'],
        'el': ['μηνύματα', 'γραπτά μηνύματα', 'συντομογραφίες chat'],
        'hu': ['szöveges üzenetek', 'SMS', 'chat rövidítések'],
    },
    'flirt': {
        'en': ['flirt', 'flirting', 'pick up lines', 'chat up'],
        'es': ['coquetear', 'flirtear', 'piropos', 'ligar'],
        'fr': ['flirter', 'draguer', 'séduire'],
        'de': ['flirten', 'Anmachsprüche', 'anbaggern'],
        'it': ['flirtare', 'corteggiare', 'rimorchiare'],
        'pt': ['flertar', 'paquerar', 'cantadas'],
        'nl': ['flirten', 'versieren', 'openingszinnen'],
        'pl': ['flirtować', 'podrywać', 'podryw'],
        'ru': ['флиртовать', 'заигрывать', 'ухаживать'],
        'uk': ['фліртувати', 'залицятися', 'загравати'],
        'tr': ['flört', 'flört etmek', 'kur yapmak'],
        'ro': ['a flirta', 'a cuceri', 'replici de agățat'],
        'sv': ['flirta', 'raggning', 'raggningsrepliker'],
        'no': ['flørte', 'sjekke opp', 'sjekkereplikker'],
        'da': ['flirte', 'score', 'scoringsreplikker'],
        'cs': ['flirtovat', 'balení', 'seznamovací fráze'],
        'el': ['φλερτ', 'φλερτάρω', 'ατάκες γνωριμίας'],
        'hu': ['flörtölni', 'felszedés', 'csajozás'],
    },
    'forgive': {
        'en': ['forgive', 'apologize', 'sorry', 'forgiveness', 'apology'],
        'es': ['perdonar', 'disculparse', 'lo siento', 'perdón'],
        'fr': ['pardonner', 's\'excuser', 'désolé', 'pardon'],
        'de': ['verzeihen', 'entschuldigen', 'Entschuldigung', 'Verzeihung'],
        'it': ['perdonare', 'scusarsi', 'mi dispiace', 'perdono'],
        'pt': ['perdoar', 'desculpar', 'desculpe', 'perdão'],
        'nl': ['vergeven', 'verontschuldigen', 'sorry', 'vergeving'],
        'pl': ['przebaczyć', 'przepraszać', 'przepraszam', 'przebaczenie'],
        'ru': ['простить', 'извиниться', 'прости', 'прощение'],
        'uk': ['пробачити', 'вибачитися', 'вибач', 'прощення'],
        'tr': ['affetmek', 'özür dilemek', 'özür', 'affedersin'],
        'ro': ['a ierta', 'a-și cere scuze', 'scuze', 'iertare'],
        'sv': ['förlåta', 'be om ursäkt', 'förlåt', 'förlåtelse'],
        'no': ['tilgi', 'be om unnskyldning', 'unnskyld', 'tilgivelse'],
        'da': ['tilgive', 'undskylde', 'undskyld', 'tilgivelse'],
        'cs': ['odpustit', 'omluvit se', 'promiň', 'odpuštění'],
        'el': ['συγχωρώ', 'ζητώ συγγνώμη', 'συγνώμη', 'συγχώρεση'],
        'hu': ['megbocsátani', 'bocsánatot kérni', 'bocsánat', 'megbocsátás'],
    },
    'argue': {
        'en': ['argue', 'argument', 'disagreement', 'conflict', 'fight'],
        'es': ['discutir', 'pelea', 'conflicto', 'desacuerdo'],
        'fr': ['se disputer', 'dispute', 'conflit', 'désaccord'],
        'de': ['streiten', 'Streit', 'Konflikt', 'Meinungsverschiedenheit'],
        'it': ['litigare', 'litigio', 'conflitto', 'disaccordo'],
        'pt': ['discutir', 'briga', 'conflito', 'desacordo'],
        'nl': ['ruzie maken', 'ruzie', 'conflict', 'onenigheid'],
        'pl': ['kłócić się', 'kłótnia', 'konflikt', 'nieporozumienie'],
        'ru': ['ссориться', 'ссора', 'конфликт', 'разногласие'],
        'uk': ['сваритися', 'сварка', 'конфлікт', 'розбіжність'],
        'tr': ['tartışmak', 'kavga', 'çatışma', 'anlaşmazlık'],
        'ro': ['a se certa', 'ceartă', 'conflict', 'dezacord'],
        'sv': ['bråka', 'bråk', 'konflikt', 'oenighet'],
        'no': ['krangle', 'krangel', 'konflikt', 'uenighet'],
        'da': ['skændes', 'skænderi', 'konflikt', 'uenighed'],
        'cs': ['hádat se', 'hádka', 'konflikt', 'neshoda'],
        'el': ['καυγαδίζω', 'καυγάς', 'σύγκρουση', 'διαφωνία'],
        'hu': ['veszekedni', 'veszekedés', 'konfliktus', 'nézeteltérés'],
    },
    'restaurant': {
        'en': ['restaurant', 'dining', 'ordering food', 'food vocabulary'],
        'es': ['restaurante', 'cenar', 'pedir comida', 'vocabulario de comida'],
        'fr': ['restaurant', 'dîner', 'commander', 'vocabulaire culinaire'],
        'de': ['Restaurant', 'essen gehen', 'Essen bestellen', 'Essensvokabular'],
        'it': ['ristorante', 'cenare', 'ordinare cibo'],
        'pt': ['restaurante', 'jantar', 'pedir comida'],
        'nl': ['restaurant', 'uit eten', 'eten bestellen'],
        'pl': ['restauracja', 'jedzenie', 'zamawianie jedzenia'],
        'ru': ['ресторан', 'ужинать', 'заказать еду'],
        'uk': ['ресторан', 'вечеряти', 'замовити їжу'],
        'tr': ['restoran', 'yemek yemek', 'yemek sipariş etmek'],
        'ro': ['restaurant', 'cină', 'a comanda mâncare'],
        'sv': ['restaurang', 'äta ute', 'beställa mat'],
        'no': ['restaurant', 'spise ute', 'bestille mat'],
        'da': ['restaurant', 'spise ude', 'bestille mad'],
        'cs': ['restaurace', 'večeřet', 'objednat jídlo'],
        'el': ['εστιατόριο', 'δείπνο', 'παραγγελία φαγητού'],
        'hu': ['étterem', 'vacsorázni', 'ételrendelés'],
    },
    'travel': {
        'en': ['travel', 'traveling', 'trip', 'vacation', 'journey'],
        'es': ['viajar', 'viaje', 'vacaciones'],
        'fr': ['voyager', 'voyage', 'vacances'],
        'de': ['reisen', 'Reise', 'Urlaub'],
        'it': ['viaggiare', 'viaggio', 'vacanza'],
        'pt': ['viajar', 'viagem', 'férias'],
        'nl': ['reizen', 'reis', 'vakantie'],
        'pl': ['podróżować', 'podróż', 'wakacje'],
        'ru': ['путешествовать', 'путешествие', 'отпуск'],
        'uk': ['подорожувати', 'подорож', 'відпустка'],
        'tr': ['seyahat', 'gezi', 'tatil'],
        'ro': ['a călători', 'călătorie', 'vacanță'],
        'sv': ['resa', 'resor', 'semester'],
        'no': ['reise', 'reiser', 'ferie'],
        'da': ['rejse', 'rejser', 'ferie'],
        'cs': ['cestovat', 'cestování', 'dovolená'],
        'el': ['ταξιδεύω', 'ταξίδι', 'διακοπές'],
        'hu': ['utazni', 'utazás', 'nyaralás'],
    },
    'grammar': {
        'en': ['grammar', 'verb conjugation', 'tenses', 'word order'],
        'es': ['gramática', 'conjugación', 'tiempos verbales'],
        'fr': ['grammaire', 'conjugaison', 'temps verbaux'],
        'de': ['Grammatik', 'Konjugation', 'Zeitformen', 'Wortstellung'],
        'it': ['grammatica', 'coniugazione', 'tempi verbali'],
        'pt': ['gramática', 'conjugação', 'tempos verbais'],
        'nl': ['grammatica', 'vervoeging', 'werkwoordsvormen'],
        'pl': ['gramatyka', 'koniugacja', 'czasy', 'szyk zdania'],
        'ru': ['грамматика', 'спряжение', 'времена глаголов'],
        'uk': ['граматика', 'відмінювання', 'часи дієслів'],
        'tr': ['dilbilgisi', 'fiil çekimi', 'zamanlar'],
        'ro': ['gramatică', 'conjugare', 'timpuri verbale'],
        'sv': ['grammatik', 'böjning', 'tempus'],
        'no': ['grammatikk', 'bøyning', 'tempus'],
        'da': ['grammatik', 'bøjning', 'tempus'],
        'cs': ['gramatika', 'časování', 'časy'],
        'el': ['γραμματική', 'κλίση ρημάτων', 'χρόνοι'],
        'hu': ['nyelvtan', 'igeragozás', 'igeidők'],
    },
    'emotions': {
        'en': ['emotions', 'feelings', 'express emotions', 'emotional'],
        'es': ['emociones', 'sentimientos', 'expresar emociones'],
        'fr': ['émotions', 'sentiments', 'exprimer ses émotions'],
        'de': ['Emotionen', 'Gefühle', 'Gefühle ausdrücken'],
        'it': ['emozioni', 'sentimenti', 'esprimere emozioni'],
        'pt': ['emoções', 'sentimentos', 'expressar emoções'],
        'nl': ['emoties', 'gevoelens', 'emoties uiten'],
        'pl': ['emocje', 'uczucia', 'wyrażać emocje'],
        'ru': ['эмоции', 'чувства', 'выражать эмоции'],
        'uk': ['емоції', 'почуття', 'висловити емоції'],
        'tr': ['duygular', 'hisler', 'duyguları ifade etmek'],
        'ro': ['emoții', 'sentimente', 'a exprima emoții'],
        'sv': ['känslor', 'uttrycka känslor'],
        'no': ['følelser', 'uttrykke følelser'],
        'da': ['følelser', 'udtrykke følelser'],
        'cs': ['emoce', 'pocity', 'vyjádřit emoce'],
        'el': ['συναισθήματα', 'εκφράζω συναισθήματα'],
        'hu': ['érzelmek', 'érzések', 'érzelmek kifejezése'],
    },
    'long-distance': {
        'en': ['long distance', 'distance relationship', 'apart', 'miss you'],
        'es': ['larga distancia', 'relación a distancia', 'te extraño', 'te echo de menos'],
        'fr': ['longue distance', 'relation à distance', 'tu me manques'],
        'de': ['Fernbeziehung', 'Langstreckenbeziehung', 'du fehlst mir'],
        'it': ['lunga distanza', 'relazione a distanza', 'mi manchi'],
        'pt': ['longa distância', 'relacionamento à distância', 'sinto sua falta'],
        'nl': ['langeafstandsrelatie', 'relatie op afstand', 'ik mis je'],
        'pl': ['na odległość', 'związek na odległość', 'tęsknię za tobą'],
        'ru': ['на расстоянии', 'отношения на расстоянии', 'скучаю по тебе'],
        'uk': ['на відстані', 'стосунки на відстані', 'сумую за тобою'],
        'tr': ['uzak mesafe', 'uzun mesafe ilişkisi', 'seni özlüyorum'],
        'ro': ['la distanță', 'relație la distanță', 'mi-e dor de tine'],
        'sv': ['distansförhållande', 'jag saknar dig'],
        'no': ['langdistanseforhold', 'jeg savner deg'],
        'da': ['langdistanceforhold', 'jeg savner dig'],
        'cs': ['na dálku', 'vztah na dálku', 'chybíš mi'],
        'el': ['σχέση σε απόσταση', 'μου λείπεις'],
        'hu': ['távkapcsolat', 'hiányzol'],
    },
    'christmas': {
        'en': ['christmas', 'holiday', 'festive', 'Merry Christmas'],
        'es': ['Navidad', 'festivo', 'Feliz Navidad'],
        'fr': ['Noël', 'fêtes', 'Joyeux Noël'],
        'de': ['Weihnachten', 'Feiertag', 'Frohe Weihnachten'],
        'it': ['Natale', 'festivo', 'Buon Natale'],
        'pt': ['Natal', 'festivo', 'Feliz Natal'],
        'nl': ['Kerstmis', 'feestdagen', 'Vrolijk Kerstfeest'],
        'pl': ['Boże Narodzenie', 'Święta', 'Wesołych Świąt'],
        'ru': ['Рождество', 'праздник', 'С Рождеством'],
        'uk': ['Різдво', 'свято', 'З Різдвом'],
        'tr': ['Noel', 'bayram', 'Mutlu Noeller'],
        'ro': ['Crăciun', 'sărbătoare', 'Crăciun fericit'],
        'sv': ['jul', 'högtid', 'God Jul'],
        'no': ['jul', 'høytid', 'God Jul'],
        'da': ['jul', 'højtid', 'Glædelig Jul'],
        'cs': ['Vánoce', 'svátek', 'Veselé Vánoce'],
        'el': ['Χριστούγεννα', 'γιορτή', 'Καλά Χριστούγεννα'],
        'hu': ['Karácsony', 'ünnep', 'Boldog Karácsonyt'],
    },
    'essential-phrases': {
        'en': ['essential phrases', 'basic phrases', 'key phrases', 'must-know phrases'],
        'es': ['frases esenciales', 'frases básicas', 'frases clave'],
        'fr': ['phrases essentielles', 'phrases de base', 'phrases clés'],
        'de': ['wichtige Sätze', 'grundlegende Sätze', 'Schlüsselsätze'],
        'it': ['frasi essenziali', 'frasi di base', 'frasi chiave'],
        'pt': ['frases essenciais', 'frases básicas', 'frases-chave'],
        'nl': ['essentiële zinnen', 'basiszinnen', 'belangrijke zinnen'],
        'pl': ['podstawowe zwroty', 'kluczowe zwroty', 'niezbędne zwroty'],
        'ru': ['основные фразы', 'базовые фразы', 'ключевые фразы'],
        'uk': ['основні фрази', 'базові фрази', 'ключові фрази'],
        'tr': ['temel ifadeler', 'anahtar ifadeler', 'bilmeniz gereken ifadeler'],
        'ro': ['fraze esențiale', 'fraze de bază', 'fraze cheie'],
        'sv': ['grundläggande fraser', 'viktiga fraser', 'nyckelfraser'],
        'no': ['grunnleggende fraser', 'viktige fraser', 'nøkkelfraser'],
        'da': ['grundlæggende sætninger', 'vigtige sætninger', 'nøglesætninger'],
        'cs': ['základní fráze', 'klíčové fráze', 'důležité fráze'],
        'el': ['βασικές φράσεις', 'απαραίτητες φράσεις', 'φράσεις-κλειδιά'],
        'hu': ['alapvető kifejezések', 'kulcskifejezések', 'fontos kifejezések'],
    },
    'common-words': {
        'en': ['common words', 'vocabulary', 'basic words', 'most common'],
        'es': ['palabras comunes', 'vocabulario', 'palabras básicas'],
        'fr': ['mots courants', 'vocabulaire', 'mots de base'],
        'de': ['häufige Wörter', 'Wortschatz', 'Grundwörter'],
        'it': ['parole comuni', 'vocabolario', 'parole di base'],
        'pt': ['palavras comuns', 'vocabulário', 'palavras básicas'],
        'nl': ['veelvoorkomende woorden', 'woordenschat', 'basiswoorden'],
        'pl': ['popularne słowa', 'słownictwo', 'podstawowe słowa'],
        'ru': ['распространённые слова', 'словарный запас', 'базовые слова'],
        'uk': ['поширені слова', 'словниковий запас', 'базові слова'],
        'tr': ['yaygın kelimeler', 'kelime hazinesi', 'temel kelimeler'],
        'ro': ['cuvinte comune', 'vocabular', 'cuvinte de bază'],
        'sv': ['vanliga ord', 'ordförråd', 'grundläggande ord'],
        'no': ['vanlige ord', 'ordforråd', 'grunnleggende ord'],
        'da': ['almindelige ord', 'ordforråd', 'grundlæggende ord'],
        'cs': ['běžná slova', 'slovní zásoba', 'základní slova'],
        'el': ['κοινές λέξεις', 'λεξιλόγιο', 'βασικές λέξεις'],
        'hu': ['gyakori szavak', 'szókincs', 'alapszavak'],
    },
    'love-letters': {
        'en': ['love letter', 'writing letters', 'letter to partner'],
        'es': ['carta de amor', 'escribir cartas', 'carta a mi pareja'],
        'fr': ['lettre d\'amour', 'écrire des lettres'],
        'de': ['Liebesbrief', 'Briefe schreiben'],
        'it': ['lettera d\'amore', 'scrivere lettere'],
        'pt': ['carta de amor', 'escrever cartas'],
        'nl': ['liefdesbrief', 'brieven schrijven'],
        'pl': ['list miłosny', 'pisanie listów'],
        'ru': ['любовное письмо', 'писать письма'],
        'uk': ['любовний лист', 'писати листи'],
        'tr': ['aşk mektubu', 'mektup yazmak'],
        'ro': ['scrisoare de dragoste', 'a scrie scrisori'],
        'sv': ['kärleksbrev', 'skriva brev'],
        'no': ['kjærlighetsbrev', 'skrive brev'],
        'da': ['kærlighedsbrev', 'skrive breve'],
        'cs': ['milostný dopis', 'psaní dopisů'],
        'el': ['ερωτική επιστολή', 'γράφοντας γράμματα'],
        'hu': ['szerelmes levél', 'levélírás'],
    },
    'miss-you': {
        'en': ['miss you', 'I miss you', 'missing you'],
        'es': ['te extraño', 'te echo de menos'],
        'fr': ['tu me manques', 'vous me manquez'],
        'de': ['du fehlst mir', 'ich vermisse dich'],
        'it': ['mi manchi', 'ti penso'],
        'pt': ['sinto sua falta', 'saudade'],
        'nl': ['ik mis je', 'ik mis jou'],
        'pl': ['tęsknię za tobą', 'tęsknię'],
        'ru': ['скучаю по тебе', 'я скучаю'],
        'uk': ['сумую за тобою', 'я сумую'],
        'tr': ['seni özlüyorum', 'özlüyorum'],
        'ro': ['mi-e dor de tine', 'îmi este dor'],
        'sv': ['jag saknar dig', 'saknar dig'],
        'no': ['jeg savner deg', 'savner deg'],
        'da': ['jeg savner dig', 'savner dig'],
        'cs': ['chybíš mi', 'stýská se mi'],
        'el': ['μου λείπεις', 'σε σκέφτομαι'],
        'hu': ['hiányzol', 'hiányzol nekem'],
    },
    'support': {
        'en': ['support', 'encourage', 'be there for', 'comfort'],
        'es': ['apoyo', 'animar', 'consolar', 'estar ahí'],
        'fr': ['soutien', 'encourager', 'réconforter'],
        'de': ['Unterstützung', 'ermutigen', 'trösten'],
        'it': ['sostegno', 'incoraggiare', 'confortare'],
        'pt': ['apoio', 'encorajar', 'confortar'],
        'nl': ['steun', 'aanmoedigen', 'troosten'],
        'pl': ['wsparcie', 'zachęcać', 'pocieszać'],
        'ru': ['поддержка', 'поддержать', 'утешить'],
        'uk': ['підтримка', 'підтримати', 'втішити'],
        'tr': ['destek', 'cesaretlendirmek', 'teselli etmek'],
        'ro': ['sprijin', 'încurajare', 'consolare'],
        'sv': ['stöd', 'uppmuntra', 'trösta'],
        'no': ['støtte', 'oppmuntre', 'trøste'],
        'da': ['støtte', 'opmuntre', 'trøste'],
        'cs': ['podpora', 'povzbudit', 'utěšit'],
        'el': ['υποστήριξη', 'ενθάρρυνση', 'παρηγοριά'],
        'hu': ['támogatás', 'bátorítás', 'vigasztalás'],
    },
}

# Generic headings that appear in almost every article — useless for linking
HEADING_STOPLIST = {
    # EN
    'conclusion', 'introduction', 'summary', 'final thoughts', 'quick tips',
    'tips and tricks', 'key takeaways', 'getting started', 'frequently asked questions',
    # FR
    'conclusion', 'introduction', 'résumé', 'conseils pratiques', 'points clés',
    # ES
    'conclusión', 'introducción', 'resumen', 'consejos prácticos',
    # DE
    'zusammenfassung', 'einleitung', 'fazit', 'praktische tipps',
    # IT
    'conclusione', 'introduzione', 'riassunto', 'consigli pratici',
    # PT
    'conclusão', 'introdução', 'resumo', 'dicas práticas',
    # NL
    'conclusie', 'inleiding', 'samenvatting', 'praktische tips',
    # PL
    'podsumowanie', 'wprowadzenie', 'wnioski', 'praktyczne wskazówki',
    # RU
    'заключение', 'введение', 'итоги', 'практические советы',
    # UK
    'висновок', 'вступ', 'підсумки', 'практичні поради',
    # TR
    'sonuç', 'giriş', 'özet', 'pratik ipuçları',
    # RO
    'concluzie', 'introducere', 'rezumat', 'sfaturi practice',
    # SV
    'sammanfattning', 'inledning', 'slutsats', 'praktiska tips',
    # NO
    'konklusjon', 'innledning', 'sammendrag', 'praktiske tips',
    # DA
    'konklusion', 'indledning', 'sammenfatning', 'praktiske tips',
    # CS
    'závěr', 'úvod', 'shrnutí', 'praktické tipy',
    # EL
    'συμπέρασμα', 'εισαγωγή', 'περίληψη', 'πρακτικές συμβουλές',
    # HU
    'összefoglalás', 'bevezetés', 'következtetés', 'gyakorlati tippek',
}

LANGS = ['en','es','fr','de','it','pt','nl','pl','ru','uk','tr','ro','sv','no','da','cs','el','hu']

def get_supabase_key():
    env_file = os.path.expanduser("~/clawd/secrets/.env.tokens")
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line.startswith("SUPABASE_SERVICE_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise ValueError("SUPABASE_SERVICE_KEY not found")

def fetch_articles(native: str, target: str, key: str) -> List[dict]:
    articles = []
    offset = 0
    batch = 1000
    while True:
        r = subprocess.run([
            'curl', '-s',
            f'{SUPABASE_URL}/blog_articles?select=id,slug,title,category,content_html,native_lang,target_lang'
            f'&native_lang=eq.{native}&target_lang=eq.{target}&order=slug&limit={batch}&offset={offset}',
            '-H', f'apikey: {key}',
            '-H', f'Authorization: Bearer {key}'
        ], capture_output=True, text=True, timeout=30)
        data = json.loads(r.stdout)
        if not data or isinstance(data, dict):
            break
        articles.extend(data)
        if len(data) < batch:
            break
        offset += batch
    return articles


def get_topic_patterns_for_lang(lang: str) -> Dict[str, List[str]]:
    """Get all topic patterns for a specific native language."""
    result = {}
    for topic, lang_map in TOPIC_PATTERNS.items():
        phrases = lang_map.get(lang, [])
        # Also include English as fallback (many articles use English terms)
        en_phrases = lang_map.get('en', [])
        combined = list(set(phrases + en_phrases))
        if combined:
            result[topic] = combined
    return result


def extract_title_phrases(title: str, min_words: int = 2, min_chars: int = 8) -> List[str]:
    """Extract meaningful multi-word phrases from article titles for matching.

    Titles are in the native language, so they match content naturally.
    We extract multi-word phrases only — single words like "famille", "espagnol",
    "conclusion" are too generic and cause false matches.

    Rules:
    - Must be at least min_words words (default 2)
    - Must be at least min_chars characters (default 8)
    - Skip very long phrases (>60 chars) as too specific
    """
    # Clean title
    clean = title
    for suffix in [' | Love Languages', ' — Love Languages']:
        clean = clean.replace(suffix, '')
    clean = clean.strip()

    phrases = []

    def is_good_phrase(p: str) -> bool:
        p = p.strip()
        words = p.split()
        return len(words) >= min_words and len(p) >= min_chars and len(p) <= 60

    # Full cleaned title (if not too long)
    if is_good_phrase(clean) and len(clean) <= 80:
        phrases.append(clean)

    # Split on common delimiters and get sub-phrases
    parts = re.split(r'[:\-–—|,]', clean)
    for part in parts:
        part = part.strip()
        if is_good_phrase(part):
            phrases.append(part)

    # Extract quoted phrases if any
    quoted = re.findall(r'"([^"]+)"', clean)
    phrases.extend(q for q in quoted if is_good_phrase(q))

    return phrases


def build_link_targets_v2(articles: List[dict], native: str, target: str) -> List[dict]:
    """Build link targets using both multilingual topics AND title-based matching."""
    topic_patterns = get_topic_patterns_for_lang(native)
    targets = []

    for article in articles:
        slug = article['slug']
        title = article.get('title', '')
        href = f'/learn/{native}/{target}/{slug}/'

        patterns = []

        # === STRATEGY 1: Multilingual topic patterns ===
        for topic_key, topic_phrases in topic_patterns.items():
            if topic_key in slug or any(p.lower() in title.lower() for p in topic_phrases):
                patterns.extend(topic_phrases)

        # === STRATEGY 2: Title-based patterns ===
        title_phrases = extract_title_phrases(title)
        patterns.extend(title_phrases)

        # === STRATEGY 2b: H2 headings as patterns (multi-word only) ===
        content = article.get('content_html', '')
        h2s = re.findall(r'<h2[^>]*>(.*?)</h2>', content, re.DOTALL)
        for h2 in h2s:
            clean_h2 = re.sub(r'<[^>]+>', '', h2).strip()
            words = clean_h2.split()
            if len(words) >= 2 and len(clean_h2) >= 8 and len(clean_h2) <= 60:
                if clean_h2.lower() not in HEADING_STOPLIST:
                    patterns.append(clean_h2)

        # Deduplicate and filter — require multi-word OR long single words
        seen = set()
        unique_patterns = []
        for p in patterns:
            key = p.lower().strip()
            if key in seen or key in HEADING_STOPLIST:
                continue
            # Require multi-word phrases (2+ words) to avoid generic single-word matches
            words = key.split()
            if len(words) < 2:
                continue
            if len(key) < MIN_PATTERN_LEN:
                continue
            seen.add(key)
            unique_patterns.append(p)

        # Display text for link anchor fallback
        display_text = title
        for suffix in [' | Love Languages', ' — Love Languages']:
            display_text = display_text.replace(suffix, '')

        targets.append({
            'slug': slug,
            'title': title,
            'display_text': display_text.strip(),
            'href': href,
            'patterns': unique_patterns,
            'category': article.get('category', ''),
        })

    return targets


def is_inside_tag(content: str, pos: int) -> bool:
    """Check if position is inside an HTML tag."""
    before = content[:pos]
    # Count unmatched <
    open_tags = before.count('<') - before.count('>')
    return open_tags > 0


def is_inside_link(content: str, pos: int) -> bool:
    """Check if position is inside an existing <a> tag."""
    before = content[:pos]
    last_a_open = before.rfind('<a ')
    last_a_close = before.rfind('</a>')
    return last_a_open > last_a_close


def find_link_opportunities(article: dict, targets: List[dict],
                            native: str, target: str) -> List[dict]:
    """Find link opportunities using both pattern strategies."""
    content = article.get('content_html', '')
    slug = article['slug']
    opportunities = []

    other_targets = [t for t in targets if t['slug'] != slug]
    linked_slugs: Set[str] = set()
    existing_links = set(re.findall(r'href="(/learn/[^"]+)"', content))

    # Pre-count existing internal links
    for t in other_targets:
        if t['href'] in existing_links:
            linked_slugs.add(t['slug'])

    for t in other_targets:
        if t['slug'] in linked_slugs:
            continue

        # Sort patterns: longer first (more specific = better match)
        sorted_patterns = sorted(t['patterns'], key=len, reverse=True)

        for pattern in sorted_patterns:
            if len(pattern) < MIN_PATTERN_LEN:
                continue

            escaped = re.escape(pattern)
            regex = re.compile(
                rf'(?<!["\'>=/])({escaped})(?!["\'])',
                re.IGNORECASE
            )

            # Search through content for matches
            for match in regex.finditer(content):
                pos = match.start()

                if is_inside_tag(content, pos):
                    continue
                if is_inside_link(content, pos):
                    continue

                opportunities.append({
                    'target_slug': t['slug'],
                    'target_href': t['href'],
                    'target_title': t['display_text'],
                    'matched_text': match.group(0),
                    'position': pos,
                    'pattern': pattern,
                })
                linked_slugs.add(t['slug'])
                break  # One link per target, move to next target

            if t['slug'] in linked_slugs:
                break  # Found a match for this target, next target

        if len(linked_slugs) >= MAX_LINKS_PER_ARTICLE:
            break

    return opportunities


def apply_links(content: str, opportunities: List[dict]) -> str:
    """Apply link opportunities to content HTML."""
    if not opportunities:
        return content

    # Sort by position descending to preserve earlier positions
    opps = sorted(opportunities, key=lambda x: -x['position'])

    for opp in opps:
        pos = opp['position']
        matched = opp['matched_text']
        href = opp['target_href']

        before = content[:pos]
        after = content[pos + len(matched):]
        link = f'<a href="{href}">{matched}</a>'
        content = before + link + after

    return content


def process_pair(native: str, target: str, key: str, dry_run: bool = False) -> dict:
    """Process a single language pair."""
    print(f"\n{'='*60}")
    print(f"Processing {native}→{target}")
    print(f"{'='*60}")

    articles = fetch_articles(native, target, key)
    print(f"  Fetched {len(articles)} articles")

    if not articles:
        return {'pair': f'{native}-{target}', 'total': 0, 'modified': 0, 'links_added': 0}

    targets = build_link_targets_v2(articles, native, target)

    modified_articles = []
    stats = {'total': len(articles), 'modified': 0, 'links_added': 0, 'already_linked': 0, 'no_matches': 0}

    for article in articles:
        content = article.get('content_html', '')
        existing = len(re.findall(r'href="(/learn/[^"]+)"', content))

        if existing >= MAX_LINKS_PER_ARTICLE:
            stats['already_linked'] += 1
            continue

        opportunities = find_link_opportunities(article, targets, native, target)

        if opportunities:
            new_content = apply_links(content, opportunities)
            if new_content != content:
                article['content_html_original'] = content
                article['content_html'] = new_content
                article['links_added'] = len(opportunities)
                modified_articles.append(article)
                stats['modified'] += 1
                stats['links_added'] += len(opportunities)

                if dry_run:
                    print(f"  [{len(opportunities):2d} links] {article['slug']}")
                    for opp in opportunities[:3]:
                        print(f"           → {opp['target_slug']} (matched: '{opp['matched_text'][:40]}')")
        else:
            stats['no_matches'] += 1

    print(f"\n  Results: {stats['modified']}/{stats['total']} modified, "
          f"{stats['links_added']} links added, "
          f"{stats['already_linked']} already full, "
          f"{stats['no_matches']} no matches found")

    if not dry_run and modified_articles:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        DIFF_DIR.mkdir(parents=True, exist_ok=True)

        output_file = DATA_DIR / f"{native}-{target}.json"
        save_data = []
        for a in modified_articles:
            save_data.append({
                'id': a['id'],
                'slug': a['slug'],
                'title': a['title'],
                'links_added': a['links_added'],
                'content_html': a['content_html'],
            })
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, ensure_ascii=False, indent=2)

        diff_file = DIFF_DIR / f"{native}-{target}-diff.txt"
        with open(diff_file, 'w', encoding='utf-8') as f:
            for a in modified_articles:
                f.write(f"\n{'='*60}\n")
                f.write(f"Article: {a['slug']}\n")
                f.write(f"Links added: {a['links_added']}\n")
                old_links = set(re.findall(r'href="(/learn/[^"]+)"', a.get('content_html_original', '')))
                new_links = set(re.findall(r'href="(/learn/[^"]+)"', a['content_html']))
                added = new_links - old_links
                for link in sorted(added):
                    f.write(f"  + {link}\n")

        print(f"  Saved to {output_file}")

    return stats


def main():
    parser = argparse.ArgumentParser(description='Add internal links v2 — multilingual matching')
    parser.add_argument('--pair', type=str, help='Language pair (e.g., en-pl)')
    parser.add_argument('--all', action='store_true', help='Process all pairs')
    parser.add_argument('--dry-run', action='store_true', help='Preview without saving')
    parser.add_argument('--native', type=str, help='Process all pairs for a native language')
    args = parser.parse_args()

    key = get_supabase_key()

    if args.pair:
        native, target = args.pair.split('-')
        process_pair(native, target, key, args.dry_run)
    elif args.native:
        r = subprocess.run([
            'curl', '-s',
            f'{SUPABASE_URL}/blog_articles?select=target_lang&native_lang=eq.{args.native}&target_lang=neq.all',
            '-H', f'apikey: {key}', '-H', f'Authorization: Bearer {key}'
        ], capture_output=True, text=True, timeout=30)
        data = json.loads(r.stdout)
        targets = sorted(set(a['target_lang'] for a in data))
        print(f"Processing {args.native}→ [{', '.join(targets)}]")
        total_stats = {'modified': 0, 'links_added': 0}
        for t in targets:
            stats = process_pair(args.native, t, key, args.dry_run)
            total_stats['modified'] += stats.get('modified', 0)
            total_stats['links_added'] += stats.get('links_added', 0)
        print(f"\nTOTAL for {args.native}: {total_stats['modified']} modified, {total_stats['links_added']} links")
    elif args.all:
        all_articles = []
        offset = 0
        while True:
            r = subprocess.run([
                'curl', '-s',
                f'{SUPABASE_URL}/blog_articles?select=native_lang,target_lang&limit=1000&offset={offset}'
                f'&target_lang=neq.all',
                '-H', f'apikey: {key}', '-H', f'Authorization: Bearer {key}'
            ], capture_output=True, text=True, timeout=30)
            data = json.loads(r.stdout)
            if not data:
                break
            all_articles.extend(data)
            if len(data) < 1000:
                break
            offset += 1000

        pairs = sorted(set((a['native_lang'], a['target_lang']) for a in all_articles))
        print(f"Processing {len(pairs)} language pairs...")

        total_stats = {'modified': 0, 'links_added': 0}
        for native, target in pairs:
            stats = process_pair(native, target, key, args.dry_run)
            total_stats['modified'] += stats.get('modified', 0)
            total_stats['links_added'] += stats.get('links_added', 0)

        print(f"\n{'='*60}")
        print(f"TOTAL: {total_stats['modified']} articles modified, {total_stats['links_added']} links added")
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
