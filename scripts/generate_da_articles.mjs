#!/usr/bin/env node
// Generate Danish blog articles for all target languages

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read env file manually
const envPath = path.join(process.env.HOME, 'lovelanguages-multilang/.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line.startsWith('#') || !line.includes('=')) return;
  const eqIndex = line.indexOf('=');
  const key = line.substring(0, eqIndex).trim();
  let value = line.substring(eqIndex + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  env[key] = value;
});

console.log('URL:', env.VITE_SUPABASE_URL);
console.log('Key exists:', !!env.VITE_SUPABASE_ANON_KEY);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

// Language mappings for Danish speakers
const LANG_MAP = {
  en: { da: 'Engelsk', en: 'english', adj: 'engelske' },
  de: { da: 'Tysk', en: 'german', adj: 'tyske' },
  fr: { da: 'Fransk', en: 'french', adj: 'franske' },
  es: { da: 'Spansk', en: 'spanish', adj: 'spanske' },
  it: { da: 'Italiensk', en: 'italian', adj: 'italienske' },
  pt: { da: 'Portugisisk', en: 'portuguese', adj: 'portugisiske' },
  pl: { da: 'Polsk', en: 'polish', adj: 'polske' },
  ru: { da: 'Russisk', en: 'russian', adj: 'russiske' },
  uk: { da: 'Ukrainsk', en: 'ukrainian', adj: 'ukrainske' },
  nl: { da: 'Hollandsk', en: 'dutch', adj: 'hollandske' },
  tr: { da: 'Tyrkisk', en: 'turkish', adj: 'tyrkiske' },
  ro: { da: 'Rumænsk', en: 'romanian', adj: 'rumænske' },
  sv: { da: 'Svensk', en: 'swedish', adj: 'svenske' },
  no: { da: 'Norsk', en: 'norwegian', adj: 'norske' },
  cs: { da: 'Tjekkisk', en: 'czech', adj: 'tjekkiske' },
  el: { da: 'Græsk', en: 'greek', adj: 'græske' },
  hu: { da: 'Ungarsk', en: 'hungarian', adj: 'ungarske' }
};

const today = new Date().toISOString().split('T')[0];
let generated = 0;
let skipped = 0;
let errors = 0;
const results = [];

async function checkExists(slug, targetLang) {
  const { data } = await supabase
    .from('blog_articles')
    .select('id')
    .eq('slug', slug)
    .eq('native_lang', 'da')
    .eq('target_lang', targetLang)
    .single();
  return !!data;
}

async function insertArticle(article) {
  const exists = await checkExists(article.slug, article.target_lang);
  if (exists) {
    console.log(`SKIP: ${article.slug} (${article.target_lang}) - already exists`);
    skipped++;
    results.push({ slug: article.slug, lang: article.target_lang, status: 'skipped' });
    return;
  }

  const { error } = await supabase.from('blog_articles').insert(article);
  if (error) {
    console.log(`❌ ERROR: ${article.slug} (${article.target_lang}) - ${error.message}`);
    errors++;
    results.push({ slug: article.slug, lang: article.target_lang, status: 'error', msg: error.message });
  } else {
    console.log(`✅ GENERATED: ${article.slug} (${article.target_lang})`);
    generated++;
    results.push({ slug: article.slug, lang: article.target_lang, status: 'generated' });
  }
}

// Topic 1: 100 Most Common Words
function create100WordsArticle(targetCode) {
  const lang = LANG_MAP[targetCode];
  return {
    title: `De 100 mest almindelige ${lang.adj} ord for par`,
    slug: `100-most-common-${lang.en}-words`,
    description: `Lær de 100 vigtigste ${lang.adj} ord til hverdagen med din partner. Perfekt for begyndere der elsker at lære!`,
    native_lang: 'da',
    target_lang: targetCode,
    category: 'vocabulary',
    difficulty: 'beginner',
    tags: [lang.da, 'Ordforråd', 'Grundlæggende', 'Par', 'Begynder'],
    image: '/images/blog/vocabulary.jpg',
    read_time: 8,
    published: true,
    date: today,
    content: `import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import CTA from '@components/CTA.astro';

# De 100 mest almindelige ${lang.adj} ord for par

Vil du lære ${lang.da.toLowerCase()}, måske fordi din partner taler dette smukke sprog? Så er du kommet til det rette sted! Med disse 100 grundlæggende ord lægger du fundamentet for dine ${lang.da.toLowerCase()}-færdigheder.

## Hvorfor netop disse 100 ord?

Studier viser, at de 100 mest almindelige ord i et sprog udgør omkring 50% af alle daglige samtaler. Når du mestrer disse ord, forstår du allerede en stor del af, hvad din partner siger!

## Grundlæggende stedord

Stedord er kernen i enhver samtale. De vigtigste ${lang.adj} stedord er:

- **jeg** - det vigtigste ord til at tale om dig selv
- **du** - uundværligt i samtaler med din partner
- **vi** - det smukkeste ord for par!
- **han/hun/det** - til at tale om andre

## Vigtige verber

Disse verber får du brug for hele tiden:

1. **at være** - det vigtigste verbum overhovedet
2. **at have** - grundlæggende for hverdagen
3. **at gøre** - til aktiviteter
4. **at gå** - til bevægelse og planer
5. **at komme** - til at planlægge møder
6. **at ville** - til ønsker og planer
7. **at kunne** - til evner
8. **at sige** - til samtaler
9. **at se** - til observationer
10. **at vide/kende** - til informationer

<CultureTip>
${lang.da} har sin helt egen melodi og unikke charme. Lyt til ${lang.adj} musik eller se film for at få en fornemmelse af sproget!
</CultureTip>

## Adjektiver til komplimenter

Med disse adjektiver kan du sige søde ting til din partner:

- **god** - kan bruges til mange ting
- **smuk/pæn** - perfekt til komplimenter
- **stor/lille** - til beskrivelser
- **ny/gammel** - til sammenligninger
- **sød/kær** - ideel til din partner

## Spørgeord

Uden spørgsmål ingen samtaler! De vigtigste er:

| Dansk | Anvendelse |
|-------|------------|
| hvad | til ting |
| hvem | til personer |
| hvor | til steder |
| hvornår | til tid |
| hvorfor | til årsager |
| hvordan | til måde |

## Tidsangivelser

Til planlægning af dates og aftaler:

- **i dag** - til planer samme dag
- **i morgen** - til den nære fremtid
- **i går** - til at fortælle
- **nu** - til øjeblikket
- **senere** - til fleksible planer
- **altid** - til løfter ("Jeg vil altid elske dig")
- **aldrig** - men brug det kun positivt!

## Hverdagsord

Disse ord bruger du dagligt:

- ja / nej
- vær så venlig / tak
- og / eller / men
- her / der
- med / uden
- for / fra

## Tips til indlæring

1. **Lær dagligt**: 10-15 minutter om dagen er mere effektivt end lange sessioner
2. **Øv med din partner**: Bed ham/hende om at øve disse ord med dig
3. **Brug flashcards**: Skriv ordene ned og gentag regelmæssigt
4. **Kontekst er alt**: Lær ord i sætninger, ikke isoleret
5. **Vær tålmodig**: Det tager tid at lære et sprog, men det er besværet værd!

<CTA />`
  };
}

// Topic 2: Pet Names and Endearments
function createPetNamesArticle(targetCode) {
  const lang = LANG_MAP[targetCode];
  return {
    title: `${lang.da} kælenavne og kærlige udtryk for par`,
    slug: `${lang.en}-pet-names-and-endearments`,
    description: `Opdag de sødeste ${lang.adj} kælenavne til din partner. Fra klassiske til kreative - find det perfekte navn!`,
    native_lang: 'da',
    target_lang: targetCode,
    category: 'vocabulary',
    difficulty: 'beginner',
    tags: [lang.da, 'Kælenavne', 'Romantik', 'Par', 'Forhold'],
    image: '/images/blog/pet-names.jpg',
    read_time: 6,
    published: true,
    date: today,
    content: `import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import CTA from '@components/CTA.astro';

# ${lang.da} kælenavne og kærlige udtryk for par

Kælenavne er en vidunderlig måde at vise din partner, hvor meget han eller hun betyder for dig. Hvis din partner taler ${lang.da.toLowerCase()}, vil det helt sikkert glæde dem, når du bruger disse kærlige udtryk!

## Hvorfor er kælenavne vigtige?

Kælenavne skaber intimitet og viser hengivenhed. De er som et hemmeligt bånd mellem to mennesker – noget særligt, der kun tilhører jer to.

## Klassiske kælenavne

De tidløse klassikere virker på alle sprog:

- **Skat** - den universelle favorit
- **Kæreste** - klassisk og elegant
- **Mit hjerte** - følelsesfuld og poetisk
- **Min elskede** - romantisk og øm

<CultureTip>
Kælenavne varierer ofte fra region til region. Hvad der er almindeligt ét sted, kan lyde usædvanligt et andet. Spørg din partner, hvilke navne der bruges i hans/hendes hjemland!
</CultureTip>

## Søde dyrenavne

Som i mange kulturer bruges dyrenavne også på ${lang.da.toLowerCase()}:

- **Bamse** (lille bjørn) - nusset og stærk
- **Mus/Musse** (lille mus) - sød og nuttet
- **Kanin** (lille kanin) - øm
- **Spurv** (lille spurv) - kærlig

## Romantiske udtryk

Til særlige øjeblikke:

- **Mit et og alt** - når nogen er alt for dig
- **Min sjæleven** - til dybe forbindelser
- **Mit solskin** - til en, der lyser op i dit liv

## Kælenavne til forskellige lejligheder

### I hverdagen
Korte, afslappede navne til daglig brug. Et hurtigt "Hej, skat!" virker altid.

### Til romantiske øjeblikke
Længere, mere følelsesfulde udtryk passer til særlige øjeblikke. Fortæl din partner, hvad de betyder for dig.

### Til at drille
Humoristiske kælenavne kan løsne stemningen i jeres forhold – men sørg for, at din partner deler humoren!

## Tips til brug

1. **Spørg din partner**: Ikke alle kan lide alle kælenavne. Spørg, hvad han/hun kan lide.
2. **Pas på udtalen**: Øv den rigtige udtale – intet er mere romantisk end et korrekt udtalt kælenavn.
3. **Vær autentisk**: Brug navne, der passer til jer som par.
4. **Skab egne navne**: De mest personlige kælenavne er ofte selvopfundne!
5. **Læg mærke til reaktionen**: Det bedste kælenavn er det, der får din partner til at smile.

## Sprogets magt

Kælenavne er mere end ord – de er små kærlighedserklæringer i hverdagen. Når du lærer ${lang.da.toLowerCase()} for at kommunikere med din partner, er kælenavne en vidunderlig begyndelse.

<CTA />`
  };
}

// Topic 3: How to Say I Love You
function createILoveYouArticle(targetCode) {
  const lang = LANG_MAP[targetCode];
  return {
    title: `Sådan siger du "Jeg elsker dig" på ${lang.da.toLowerCase()}`,
    slug: `how-to-say-i-love-you-in-${lang.en}`,
    description: `Lær alle måder at sige "jeg elsker dig" på ${lang.da.toLowerCase()}. Fra basale udtryk til dybt romantiske erklæringer.`,
    native_lang: 'da',
    target_lang: targetCode,
    category: 'vocabulary',
    difficulty: 'beginner',
    tags: [lang.da, 'Kærlighed', 'Romantik', 'Par', 'Udtryk'],
    image: '/images/blog/i-love-you.jpg',
    read_time: 7,
    published: true,
    date: today,
    content: `import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import CTA from '@components/CTA.astro';

# Sådan siger du "Jeg elsker dig" på ${lang.da.toLowerCase()}

Når du lærer ${lang.da.toLowerCase()} for en, du elsker, er der én sætning, der betyder mere end alle andre: **"Jeg elsker dig."** Men på ${lang.da.toLowerCase()} er der så meget mere nuance og skønhed i at udtrykke kærlighed end en simpel oversættelse.

Lad os udforske alle måder at sige "Jeg elsker dig" på ${lang.da.toLowerCase()}, fra det hverdagsagtige til det dybt romantiske.

## Det grundlæggende udtryk

Det mest direkte og kraftfulde udtryk for kærlighed på ${lang.da.toLowerCase()}. Dette er sætningen, du vil bruge oftest. Den er direkte, oprigtig og bærer reel følelsesmæssig vægt.

## Forståelse af ${lang.adj} kærlighedsudtryk

${lang.da} har et rigt ordforråd for kærlighed, fordi sprogets talere ofte er dybt romantiske. Her er, hvordan udtrykkene fordeler sig:

### Grundlæggende udtryk
- **"Jeg elsker dig"** - standardudtrykket
- **"Jeg elsker dig meget"** - mere intenst
- **"Jeg elsker dig af hele mit hjerte"** - meget romantisk

<CultureTip>
I mange kulturer har det at sige "jeg elsker dig" stor betydning. I modsætning til nogle kulturer, hvor "I love you" siges ofte og afslappet, kan det ${lang.adj} udtryk være mere reserveret til virkelig meningsfulde øjeblikke. Når du siger det, vil din partner føle det dybt.
</CultureTip>

## Romantiske variationer

Vil du gå ud over det basale? Her er sætninger, der vil få din partners hjerte til at smelte:

### "Du er mit alt"
At fortælle nogen, at de er alt for dig, er en af de mest kraftfulde ting, du kan sige.

### "Jeg kan ikke leve uden dig"
En dramatisk, men oprigtig erklæring af din dybe hengivenhed.

### "Du er mit livs kærlighed"
For når du virkelig mener det – dette er reserveret til de mest seriøse forhold.

## Verbet "at elske"

At forstå, hvordan man bøjer verbet "at elske" vil hjælpe dig med at udtrykke dine følelser på mange måder:

| Person | Form |
|--------|------|
| Jeg | elsker |
| Du | elsker |
| Han/Hun | elsker |
| Vi | elsker |
| I | elsker |
| De | elsker |

## Kælenavne at kombinere med

Når du siger "Jeg elsker dig", er det naturligt at tilføje et kælenavn:

- **Skat** - sød og kær
- **Kæreste** - klassisk
- **Min elskede** - romantisk
- **Mit hjerte** - poetisk

## Øvelse gør mester

Den bedste måde at lære disse sætninger på er at bruge dem. Start med det grundlæggende udtryk og sig det, når du føler det. Din partner vil sætte pris på indsatsen, selvom din udtale ikke er perfekt.

Husk: på ${lang.da.toLowerCase()} betyder følelsen bag dine ord mere end perfekt grammatik. Når du siger "Jeg elsker dig" på deres sprog, siger du "Jeg elsker dig nok til at lære, hvordan man siger det."

<CTA />`
  };
}

// Topic 4: Greetings and Farewells
function createGreetingsArticle(targetCode) {
  const lang = LANG_MAP[targetCode];
  return {
    title: `${lang.da} hilsner og farvel for par`,
    slug: `${lang.en}-greetings-and-farewells`,
    description: `Mestre ${lang.adj} hilsner og farvel til din partner. Fra godmorgen til godnat - lær dem alle sammen!`,
    native_lang: 'da',
    target_lang: targetCode,
    category: 'vocabulary',
    difficulty: 'beginner',
    tags: [lang.da, 'Hilsner', 'Farvel', 'Par', 'Samtale'],
    image: '/images/blog/greetings.jpg',
    read_time: 6,
    published: true,
    date: today,
    content: `import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import CTA from '@components/CTA.astro';

# ${lang.da} hilsner og farvel for par

Den måde, du hilser på din partner og siger farvel, sætter tonen for jeres interaktioner. At lære ${lang.adj} hilsner viser, at du bekymrer dig nok til at tale deres sprog – selv i de små øjeblikke.

## Hvorfor hilsner er vigtige

De første ord, du siger til din partner hver dag, er vigtige. Et kærligt "godmorgen" på ${lang.da.toLowerCase()} kan starte deres dag med et smil!

## Morgenhilsner

Start dagen rigtigt med disse ${lang.adj} morgenhilsner:

- **Godmorgen** - standard og venligt
- **Godmorgen, skat** - tilføj et kælenavn for ekstra varme
- **Sov du godt?** - vis omsorg for deres hvile
- **Drømte du sødt?** - romantisk morgenspørgsmål

<CultureTip>
I mange kulturer er der specifikke etikette omkring hilsner. Nogle kulturer foretrækker mere formelle hilsner, mens andre er afslappede. Lær, hvad der føles naturligt i din partners kultur!
</CultureTip>

## Daglige hilsner

Til når I mødes i løbet af dagen:

- **Hej** - afslappet og venligt
- **Hej skat** - kærligt
- **Hvordan har du det?** - vis interesse
- **Jeg har savnet dig** - efter tid fra hinanden

## Eftermiddags- og aftenhilsner

Specifikke hilsner til forskellige tider af dagen:

| Tidspunkt | Hilsen |
|-----------|--------|
| Eftermiddag | God eftermiddag |
| Aften | Godaften |
| Sen aften | God nat (snart) |

## Romantiske hilsner

For de særlige øjeblikke:

- **Der er du jo, min smukke** - når du ser din partner
- **Jeg har tænkt på dig hele dagen** - viser hengivenhed
- **Mit hjerte slår hurtigere, når jeg ser dig** - romantisk

## Farvel for par

At sige farvel kan være svært – her er, hvordan du gør det kærligt:

### Korte farvel
- **Farvel** - standard
- **Vi ses** - afslappet
- **Vi ses snart** - optimistisk

### Kærlige farvel
- **Jeg savner dig allerede** - romantisk
- **Tænk på mig** - ømt
- **Jeg glæder mig til at se dig igen** - forventningsfuldt

### Godnat-sætninger
- **Godnat** - standard
- **Sov godt** - omsorgsfuldt
- **Drøm sødt** - romantisk
- **Godnat, min elskede** - dybt kærligt

## Tips til autentiske hilsner

1. **Brug den rigtige formalitet**: Afslappet med partner, måske mere formel med deres familie
2. **Tilføj fysisk hengivenhed**: Kombiner ord med knus eller kys
3. **Vær konsekvent**: Daglige kærlige hilsner opbygger intimitet
4. **Personliggør**: Lav jeres egne specielle hilsner
5. **Udtale er vigtig**: Øv for at lyde naturlig

<CTA />`
  };
}

// Topic 5: Date Night Vocabulary
function createDateNightArticle(targetCode) {
  const lang = LANG_MAP[targetCode];
  return {
    title: `${lang.da} ordforråd til romantiske aftener`,
    slug: `${lang.en}-date-night-vocabulary`,
    description: `Essentielt ${lang.adj} ordforråd til dates med din partner. Fra restauranter til romantiske gåture!`,
    native_lang: 'da',
    target_lang: targetCode,
    category: 'vocabulary',
    difficulty: 'beginner',
    tags: [lang.da, 'Dating', 'Romantik', 'Par', 'Ordforråd'],
    image: '/images/blog/date-night.jpg',
    read_time: 7,
    published: true,
    date: today,
    content: `import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import CTA from '@components/CTA.astro';

# ${lang.da} ordforråd til romantiske aftener

Planlægger du en romantisk aften med din ${lang.da.toLowerCase()}talende partner? At kende det rigtige ordforråd gør hele forskellen! Fra at foreslå planer til at rose deres udseende, denne guide har alt, hvad du har brug for.

## Invitation til en date

Start med at spørge din partner ud:

- **Vil du gå ud med mig i aften?** - klassisk invitation
- **Hvad med middag sammen?** - afslappet forslag
- **Jeg vil gerne tage dig med ud** - romantisk intention
- **Lad os gøre noget særligt** - skaber spænding

<CultureTip>
Dating-kulturen varierer meget fra land til land. I nogle kulturer forventes det, at manden betaler; i andre deles regningen. Lær din partners kulturelle forventninger for at undgå akavede øjeblikke!
</CultureTip>

## Restaurant-ordforråd

Essentielle sætninger til at spise ude:

### Bestilling
- **Et bord til to, tak** - ankomst
- **Kan vi se menukortet?** - komme i gang
- **Hvad anbefaler du?** - bed om forslag
- **Jeg vil gerne bestille...** - afgive ordre

### Under måltidet
- **Det smager fantastisk!** - kompliment til maden
- **Vil du smage?** - dele med din partner
- **Skål!** - til at hæve glasset
- **For os!** - romantisk skål

### Betaling
- **Må vi bede om regningen?** - når I er færdige
- **Jeg betaler** - galant tilbud
- **Lad os dele** - moderne tilgang

## Komplimenter til din date

Få din partner til at føle sig speciel:

- **Du ser fantastisk ud** - universelt kompliment
- **Du er smuk/flot** - direkte og romantisk
- **Jeg elsker dit smil** - specifikt og sødt
- **Du får mit hjerte til at banke** - dybt romantisk

## Romantiske aktiviteter

Forslag til, hvad I kan lave:

| Aktivitet | Ord |
|-----------|-----|
| Film | biograf, film |
| Gåtur | gåtur, park |
| Musik | koncert, musik |
| Dans | danse, klub |
| Drink | bar, vin, cocktail |

## Samtale-starters

Hold samtalen i gang:

- **Fortæl mig om din dag** - vis interesse
- **Hvad drømmer du om?** - gå dybere
- **Hvad gør dig glad?** - lær dem at kende
- **Hvad ville du gøre, hvis...?** - sjov hypotetisk

## Afslutning af aftenen

Afslut aftenen romantisk:

- **Jeg har haft en vidunderlig aften** - udtryk taknemmelighed
- **Tak for en dejlig aften** - simpel og sød
- **Jeg vil gerne se dig igen** - viser interesse
- **Godnat, min elskede** - romantisk farvel

## Tips til en perfekt date

1. **Lær nøglesætninger**: Forbered dig på de mest sandsynlige situationer
2. **Øv udtale**: Spørg din partner om hjælp før daten
3. **Vær ikke bange for fejl**: Din indsats er det, der tæller
4. **Bland sprog**: Det er okay at blande, hvis du går i stå
5. **Fokuser på forbindelse**: Sprog er et værktøj, ikke målet

## Romantiske ord at kende

Ord der sætter stemningen:

- **Kærlighed** - det vigtigste ord
- **Romantisk** - perfekt til at beskrive aftenen
- **Smuk/Smukke** - til alt, der er flot
- **Sammen** - det, det hele handler om
- **For evigt** - for de seriøse øjeblikke

<CTA />`
  };
}

async function main() {
  console.log('=== Danish (da) Article Generation Started ===');
  console.log(`Date: ${today}`);
  console.log('');

  const targetLanguages = ['en', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'ru', 'uk', 'nl', 'tr', 'ro', 'sv', 'no', 'cs', 'el', 'hu'];

  for (const target of targetLanguages) {
    console.log(`--- Processing: ${LANG_MAP[target].da} (${target}) ---`);

    // Topic 1: 100 Most Common Words
    await insertArticle(create100WordsArticle(target));

    // Topic 2: Pet Names and Endearments
    await insertArticle(createPetNamesArticle(target));

    // Topic 3: How to Say I Love You
    await insertArticle(createILoveYouArticle(target));

    // Topic 4: Greetings and Farewells
    await insertArticle(createGreetingsArticle(target));

    // Topic 5: Date Night Vocabulary
    await insertArticle(createDateNightArticle(target));

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('');
  console.log('=== Generation Complete ===');
  console.log(`Generated: ${generated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);

  // Write summary
  const summary = `# Danish Blog Article Generation - Batch 1

**Completed:** ${new Date().toISOString()}
**Native Language:** da (Danish)

## Results

- **Generated:** ${generated}
- **Skipped:** ${skipped}
- **Errors:** ${errors}
- **Total processed:** ${generated + skipped + errors}

## Topics Generated

| # | Topic | Slug Pattern | Languages |
|---|-------|--------------|-----------|
| 1 | 100 Most Common Words | \`100-most-common-[lang]-words\` | ${targetLanguages.length} |
| 2 | Pet Names & Endearments | \`[lang]-pet-names-and-endearments\` | ${targetLanguages.length} |
| 3 | How to Say I Love You | \`how-to-say-i-love-you-in-[lang]\` | ${targetLanguages.length} |
| 4 | Greetings & Farewells | \`[lang]-greetings-and-farewells\` | ${targetLanguages.length} |
| 5 | Date Night Vocabulary | \`[lang]-date-night-vocabulary\` | ${targetLanguages.length} |

## Target Languages (17)

${targetLanguages.map(code => `- ${LANG_MAP[code].da} (${code})`).join('\n')}

## Detailed Results

${results.map(r => `- ${r.status === 'generated' ? '✅' : r.status === 'skipped' ? '⏭️' : '❌'} \`${r.slug}\` (${r.lang}) - ${r.status}${r.msg ? ': ' + r.msg : ''}`).join('\n')}

## Notes

- All titles, descriptions, and content are in **Danish**
- All slugs are in **English** for URL consistency
- Category: \`vocabulary\` for all articles
- Difficulty: \`beginner\` for all articles
`;

  const logsDir = path.join(process.env.HOME, 'lovelanguages-multilang/generation_logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(logsDir, 'da_batch1.md'),
    summary
  );

  console.log('');
  console.log('Summary saved to: ~/lovelanguages-multilang/generation_logs/da_batch1.md');
}

main().catch(console.error);
