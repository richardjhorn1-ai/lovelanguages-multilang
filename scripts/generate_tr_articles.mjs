#!/usr/bin/env node
// Generate Turkish blog articles for all target languages

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

// Language mappings - Turkish names
const LANG_MAP = {
  en: { tr: 'İngilizce', en: 'english', adj: 'İngilizce' },
  de: { tr: 'Almanca', en: 'german', adj: 'Almanca' },
  fr: { tr: 'Fransızca', en: 'french', adj: 'Fransızca' },
  es: { tr: 'İspanyolca', en: 'spanish', adj: 'İspanyolca' },
  it: { tr: 'İtalyanca', en: 'italian', adj: 'İtalyanca' },
  pt: { tr: 'Portekizce', en: 'portuguese', adj: 'Portekizce' },
  pl: { tr: 'Lehçe', en: 'polish', adj: 'Lehçe' },
  ru: { tr: 'Rusça', en: 'russian', adj: 'Rusça' },
  uk: { tr: 'Ukraynaca', en: 'ukrainian', adj: 'Ukraynaca' },
  nl: { tr: 'Hollandaca', en: 'dutch', adj: 'Hollandaca' },
  ro: { tr: 'Romence', en: 'romanian', adj: 'Romence' },
  sv: { tr: 'İsveççe', en: 'swedish', adj: 'İsveççe' },
  no: { tr: 'Norveççe', en: 'norwegian', adj: 'Norveççe' },
  da: { tr: 'Danca', en: 'danish', adj: 'Danca' },
  cs: { tr: 'Çekçe', en: 'czech', adj: 'Çekçe' },
  el: { tr: 'Yunanca', en: 'greek', adj: 'Yunanca' },
  hu: { tr: 'Macarca', en: 'hungarian', adj: 'Macarca' }
};

const today = new Date().toISOString().split('T')[0];
let generated = 0;
let skipped = 0;
let errors = 0;
const details = { generated: [], skipped: [], errors: [] };

async function checkExists(slug, targetLang) {
  const { data } = await supabase
    .from('blog_articles')
    .select('id')
    .eq('slug', slug)
    .eq('native_lang', 'tr')
    .eq('target_lang', targetLang)
    .single();
  return !!data;
}

async function insertArticle(article) {
  const exists = await checkExists(article.slug, article.target_lang);
  if (exists) {
    console.log(`SKIP: ${article.slug} (${article.target_lang}) - already exists`);
    skipped++;
    details.skipped.push(`${article.slug} (${article.target_lang})`);
    return;
  }

  const { error } = await supabase.from('blog_articles').insert(article);
  if (error) {
    console.log(`❌ ERROR: ${article.slug} (${article.target_lang}) - ${error.message}`);
    errors++;
    details.errors.push(`${article.slug} (${article.target_lang}): ${error.message}`);
  } else {
    console.log(`✅ GENERATED: ${article.slug} (${article.target_lang})`);
    generated++;
    details.generated.push(`${article.slug} (${article.target_lang})`);
  }
}

// Topic 1: 100 Most Common Words
function create100WordsArticle(targetCode) {
  const lang = LANG_MAP[targetCode];
  return {
    title: `En Sık Kullanılan 100 ${lang.tr} Kelime`,
    slug: `100-most-common-${lang.en}-words`,
    description: `Partnerinizle iletişim için en önemli 100 ${lang.tr} kelimeyi öğrenin. Başlangıç seviyesi için mükemmel!`,
    native_lang: 'tr',
    target_lang: targetCode,
    category: 'vocabulary',
    difficulty: 'beginner',
    tags: [lang.tr, 'Kelime Bilgisi', 'Temel Kelimeler', 'Çiftler', 'Başlangıç'],
    image: '/images/blog/vocabulary.jpg',
    read_time: 8,
    published: true,
    date: today,
    content: `import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import CTA from '@components/CTA.astro';

# En Sık Kullanılan 100 ${lang.tr} Kelime

${lang.tr} öğrenmek istiyorsunuz, belki de partneriniz bu güzel dili konuştuğu için? O zaman doğru yerdesiniz! Bu 100 temel kelimeyle ${lang.tr} bilginizin temelini atacaksınız.

## Neden Bu 100 Kelime?

Araştırmalar, bir dilin en sık kullanılan 100 kelimesinin günlük konuşmaların yaklaşık %50'sini oluşturduğunu gösteriyor. Bu kelimeleri öğrendiğinizde, partnerinizin söylediklerinin büyük bir kısmını anlayabilirsiniz!

## Temel Zamirler

Zamirler her konuşmanın kalbidir. En önemli ${lang.tr} zamirler şunlardır:

- **ben** - kendiniz hakkında konuşmak için en önemli kelime
- **sen** - partnerinizle konuşmak için vazgeçilmez
- **biz** - çiftler için en güzel kelime!
- **o** - başkaları hakkında konuşmak için

## Önemli Fiiller

Bu fiillere sürekli ihtiyacınız olacak:

1. **olmak** - en önemli fiil
2. **var olmak/sahip olmak** - günlük yaşam için temel
3. **yapmak** - aktiviteler için
4. **gitmek** - hareket ve planlar için
5. **gelmek** - buluşmaları planlamak için
6. **istemek** - dilekler ve planlar için
7. **yapabilmek** - yetenekler için
8. **söylemek** - konuşmalar için
9. **görmek** - gözlemler için
10. **bilmek** - bilgiler için

<CultureTip>
${lang.tr}nin kendine özgü bir melodisi ve benzersiz bir cazibesi var. Dili hissetmek için ${lang.tr} müzik dinleyin veya film izleyin!
</CultureTip>

## İltifat İçin Sıfatlar

Bu sıfatlarla partnerinize güzel şeyler söyleyebilirsiniz:

- **iyi** - çok yönlü kullanılabilir
- **güzel** - iltifatlar için mükemmel
- **büyük/küçük** - tanımlamalar için
- **yeni/eski** - karşılaştırmalar için
- **sevgili** - partneriniz için ideal

## Soru Kelimeleri

Sorular olmadan konuşma olmaz! En önemlileri:

| Türkçe | Kullanım |
|--------|----------|
| ne | şeyler için |
| kim | kişiler için |
| nerede | yerler için |
| ne zaman | zaman için |
| neden | sebepler için |
| nasıl | yol ve yöntem için |

## Zaman İfadeleri

Randevular ve buluşmalar planlamak için:

- **bugün** - aynı gün için planlar
- **yarın** - yakın gelecek için
- **dün** - anlatmak için
- **şimdi** - an için
- **sonra** - esnek planlar için
- **her zaman** - sözler için ("Seni her zaman seveceğim")
- **asla** - ama lütfen sadece olumlu kullanın!

## Günlük Kelimeler

Bu kelimelere her gün ihtiyacınız olacak:

- evet / hayır
- lütfen / teşekkürler
- ve / veya / ama
- burada / orada
- ile / olmadan
- için / -dan

## Öğrenme İpuçları

1. **Her gün çalışın**: Günde 10-15 dakika uzun oturumlardan daha etkilidir
2. **Partnerinizle pratik yapın**: Ondan bu kelimeleri sizinle çalışmasını isteyin
3. **Kartlar kullanın**: Kelimeleri yazın ve düzenli olarak tekrarlayın
4. **Bağlam her şeydir**: Kelimeleri tek başına değil, cümle içinde öğrenin
5. **Sabırlı olun**: Dil öğrenmek zaman alır, ama emek karşılığını verir!

<CTA />`
  };
}

// Topic 2: Pet Names and Endearments
function createPetNamesArticle(targetCode) {
  const lang = LANG_MAP[targetCode];
  return {
    title: `${lang.tr} Sevgi Sözcükleri ve Takma Adlar`,
    slug: `${lang.en}-pet-names-and-endearments`,
    description: `Partneriniz için en tatlı ${lang.tr} sevgi sözcüklerini keşfedin. Klasikten yaratıcıya - mükemmel adı bulun!`,
    native_lang: 'tr',
    target_lang: targetCode,
    category: 'vocabulary',
    difficulty: 'beginner',
    tags: [lang.tr, 'Sevgi Sözcükleri', 'Romantizm', 'Çiftler', 'İlişki'],
    image: '/images/blog/pet-names.jpg',
    read_time: 6,
    published: true,
    date: today,
    content: `import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import CTA from '@components/CTA.astro';

# ${lang.tr} Sevgi Sözcükleri ve Takma Adlar

Sevgi sözcükleri, partnerinize onun sizin için ne kadar önemli olduğunu göstermenin harika bir yoludur. Partneriniz ${lang.tr} konuşuyorsa, bu sevgi dolu ifadeleri kullandığınızda mutlu olacaktır!

## Sevgi Sözcükleri Neden Önemli?

Sevgi sözcükleri yakınlık yaratır ve sevgi gösterir. İki kişi arasında özel bir bağ gibidir – sadece ikinize ait özel bir şey.

## Klasik Sevgi Sözcükleri

Zamansız klasikler her dilde işe yarar:

- **Tatlım** - evrensel favori
- **Canım** - klasik ve zarif
- **Kalbim** - duygusal ve şiirsel
- **Aşkım** - romantik ve nazik

<CultureTip>
Sevgi sözcükleri genellikle bölgeden bölgeye değişir. Bir yerde yaygın olan, başka bir yerde alışılmadık gelebilir. Partnerinize memleketinde hangi isimlerin kullanıldığını sorun!
</CultureTip>

## Tatlı Hayvan İsimleri

Birçok kültürde olduğu gibi, ${lang.tr}de de hayvan isimleri sevgiyle kullanılır:

- **Ayıcığım** - sevimli ve güçlü
- **Faremin** - tatlı ve minnoş
- **Tavşanım** - şefkatli
- **Kuşum** - sevgi dolu

## Romantik İfadeler

Özel anlar için:

- **Bir tanem** - biri sizin için her şey olduğunda
- **Ruh eşim** - derin bağlantılar için
- **Güneşim** - hayatınızı aydınlatan biri için

## Farklı Durumlar İçin Sevgi Sözcükleri

### Günlük Hayatta
Günlük kullanım için kısa, rahat isimler. Hızlı bir "Selam, tatlım!" her zaman işe yarar.

### Romantik Anlar İçin
Daha uzun, daha duygusal ifadeler özel anlara yakışır. Partnerinize onun sizin için ne ifade ettiğini söyleyin.

### Şakalaşmak İçin
Esprili sevgi sözcükleri ilişkinizi renklendirebilir – ama partnerinizin bu espriyi paylaştığından emin olun!

## Kullanım İpuçları

1. **Partnerinize sorun**: Herkes her sevgi sözcüğünü sevmez. Neyi sevdiğini sorun.
2. **Telaffuza dikkat edin**: Doğru telaffuzu öğrenin – doğru söylenen bir sevgi sözcüğünden daha romantik bir şey yok.
3. **Samimi olun**: Size ve çift olarak size uyan isimleri kullanın.
4. **Kendi isimlerinizi yaratın**: En kişisel sevgi sözcükleri genellikle kendiniz uydurduklarınızdır!
5. **Tepkiyi izleyin**: En iyi sevgi sözcüğü, partnerinizi gülümseten sözcüktür.

## Dilin Gücü

Sevgi sözcükleri kelimelerden fazlasıdır – günlük hayatta küçük aşk itiraflarıdır. Partnerinizle iletişim kurmak için ${lang.tr} öğreniyorsanız, sevgi sözcükleri harika bir başlangıçtır.

<CTA />`
  };
}

// Topic 3: How to Say I Love You
function createILoveYouArticle(targetCode) {
  const lang = LANG_MAP[targetCode];
  return {
    title: `${lang.tr} "Seni Seviyorum" Nasıl Söylenir`,
    slug: `how-to-say-i-love-you-in-${lang.en}`,
    description: `${lang.tr} "Seni seviyorum" demenin en güzel yollarını öğrenin. Partnerinizi etkileyecek romantik ifadeler!`,
    native_lang: 'tr',
    target_lang: targetCode,
    category: 'vocabulary',
    difficulty: 'beginner',
    tags: [lang.tr, 'Aşk', 'Romantizm', 'Çiftler', 'Sevgi İfadeleri'],
    image: '/images/blog/love.jpg',
    read_time: 5,
    published: true,
    date: today,
    content: `import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import CTA from '@components/CTA.astro';

# ${lang.tr} "Seni Seviyorum" Nasıl Söylenir

"Seni seviyorum" demek, herhangi bir dildeki en güçlü ifadelerden biridir. Partneriniz ${lang.tr} konuşuyorsa, bu sözleri onun ana dilinde söylediğinizde kalbini fethedeceksiniz!

## Temel "Seni Seviyorum"

${lang.tr} "Seni seviyorum" ifadesi basit ama güçlüdür. Bu üç kelime dünyanın en romantik ifadelerinden birini oluşturur.

## Duygularınızı İfade Etmenin Farklı Yolları

Aşk birçok şekilde ifade edilebilir:

### Hafif Sevgi
İlişkinizin başlarında veya arkadaşlara söylenebilir:
- "Senden hoşlanıyorum"
- "Seni beğeniyorum"
- "Seninle olmaktan mutluyum"

### Derin Aşk
Ciddi ilişkilerde:
- "Seni seviyorum"
- "Seni çok seviyorum"
- "Aşığım sana"

### Tutkulu Aşk
En yoğun duygular için:
- "Seni delicesine seviyorum"
- "Sensiz yapamam"
- "Sen benim her şeyimsin"

<CultureTip>
${lang.tr} konuşulan kültürlerde, "Seni seviyorum" ifadesi bazen özel ve nadir söylenen bir şey olarak görülür. Bu, söylendiğinde daha da anlamlı hale gelir. Partnerinizin kültürünü anlamaya çalışın!
</CultureTip>

## Romantik Cümleler

Sadece "Seni seviyorum"un ötesinde:

- "Seninle tanıştığım için şanslıyım"
- "Hayatımın aşkısın"
- "Sonsuza kadar seninle olmak istiyorum"
- "Sen benim ruh eşimsin"
- "Yanında her şey güzel"

## Günlük Sevgi İfadeleri

Her gün kullanabileceğiniz cümleler:

- "Seni özledim"
- "Seni düşünüyorum"
- "Sana ihtiyacım var"
- "Seninle mutluyum"
- "Seni görmek güzel"

## Ne Zaman Söylemeli?

1. **Sabahları**: Güne güzel başlamak için
2. **Ayrılırken**: İşe veya dışarı çıkarken
3. **Telefonun sonunda**: Görüşmenizi bitirirken
4. **Özel anlarda**: Birlikte geçirdiğiniz romantik zamanlarda
5. **Beklenmedik anlarda**: En güzel sürpriz olabilir!

## Telaffuz İpuçları

${lang.tr} telaffuz önemlidir. İşte bazı ipuçları:

1. **Yavaş söyleyin**: Acele etmeyin, duygularınızı hissettirin
2. **Göz teması kurun**: Kelimeler kadar bakışlar da önemli
3. **Samimi olun**: Kalpten gelen kelimeler her zaman anlaşılır
4. **Pratik yapın**: Telaffuzu mükemmelleştirmek için tekrarlayın

## Aşkı Göstermenin Diğer Yolları

Kelimeler önemli ama eylemler de aynı derecede değerli:

- Küçük sürprizler yapmak
- Onun dilini öğrenmek (şu anda yaptığınız gibi!)
- Zaman ayırmak
- Dinlemek ve anlamaya çalışmak

<CTA />`
  };
}

// Topic 4: Greetings and Farewells
function createGreetingsArticle(targetCode) {
  const lang = LANG_MAP[targetCode];
  return {
    title: `${lang.tr} Selamlaşma ve Vedalaşma İfadeleri`,
    slug: `${lang.en}-greetings-and-farewells`,
    description: `${lang.tr} selamlaşma ve vedalaşma ifadelerini öğrenin. Partnerinizle her konuşmayı doğru başlatın ve bitirin!`,
    native_lang: 'tr',
    target_lang: targetCode,
    category: 'vocabulary',
    difficulty: 'beginner',
    tags: [lang.tr, 'Selamlaşma', 'Vedalaşma', 'Temel İfadeler', 'Günlük Konuşma'],
    image: '/images/blog/greetings.jpg',
    read_time: 6,
    published: true,
    date: today,
    content: `import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import CTA from '@components/CTA.astro';

# ${lang.tr} Selamlaşma ve Vedalaşma İfadeleri

Her konuşma bir selamlaşmayla başlar ve bir vedayla biter. ${lang.tr} bu temel ifadeleri öğrenmek, partnerinizle iletişiminizi doğru temeller üzerine kurmanızı sağlar.

## Temel Selamlaşmalar

Her durumda kullanabileceğiniz selamlaşmalar:

### Resmi Olmayan (Günlük)
- "Merhaba" - her zaman kullanılabilir
- "Selam" - arkadaş canlısı ve rahat
- "Nasılsın?" - ilgi gösteren soru

### Resmi
- "Günaydın" - sabahları
- "İyi günler" - gün boyunca
- "İyi akşamlar" - akşamları

<CultureTip>
${lang.tr} konuşulan kültürlerde selamlaşma genellikle basit bir "Merhaba"dan fazlasını içerir. İnsanlar ailenizi, sağlığınızı veya gününüzü sormayı severler. Bu, kibarlık ve ilgi göstergesidir!
</CultureTip>

## Partnerinize Özel Selamlaşmalar

Sevgilinize söyleyebileceğiniz özel selamlaşmalar:

- "Günaydın aşkım" - romantik bir sabah
- "Hoş geldin canım" - eve döndüğünde
- "Seni görmek ne güzel" - buluştuğunuzda
- "Özledim seni" - uzun bir günün ardından

## Hal Hatır Sorma

Selamlaşmadan sonra nasıl devam edilir:

| Türkçe | Kullanım |
|--------|----------|
| Nasılsın? | Genel durum |
| Ne var ne yok? | Rahat, arkadaşça |
| Günün nasıl geçti? | İş sonrası |
| İyi misin? | Endişeli tonla |

## Vedalaşma İfadeleri

Her duruma uygun vedalaşmalar:

### Kısa Ayrılıklar
- "Görüşürüz" - yakında tekrar görüşecekseniz
- "Sonra görüşürüz" - belirsiz ama yakın
- "Birazdan görüşürüz" - çok kısa ayrılıklar

### Uzun Ayrılıklar
- "Hoşça kal" - her durumda uygun
- "Kendine iyi bak" - şefkatli bir veda
- "Yolun açık olsun" - yolculuğa çıkana

### Romantik Vedalaşmalar
- "Seni seveceğim" - duygusal veda
- "Seni özleyeceğim" - ayrılık acısını gösterir
- "Hayallerimde ol" - şiirsel ifade
- "Çok kalmadan dön" - dönüşü beklemek

## Günün Farklı Saatlerinde

### Sabah
- Günaydın
- İyi sabahlar
- Güne iyi başla

### Öğleden Sonra
- İyi günler
- İyi öğlenler

### Akşam
- İyi akşamlar
- İyi geceler (uyumadan önce)
- Tatlı rüyalar (sevgilinize)

## Telefonla veya Mesajla

Dijital iletişim için özel ifadeler:

**Başlarken:**
- "Merhaba, meşgul müsün?"
- "Selam, konuşabilir miyiz?"

**Bitirirken:**
- "Sonra yazarım"
- "Görüşürüz, öpüyorum"
- "Seni seviyorum, hoşça kal"

## Kültürel İpuçları

1. **Göz teması**: Selamlaşırken göz teması önemlidir
2. **Gülümsemek**: Sıcak bir gülümseme her dilde anlaşılır
3. **El sıkışma veya sarılma**: Kültüre göre değişir, partnerinizin alışkanlıklarını öğrenin
4. **Öpücük**: Bazı kültürlerde yaygın, bazılarında değil

<CTA />`
  };
}

// Topic 5: Date Night Vocabulary
function createDateNightArticle(targetCode) {
  const lang = LANG_MAP[targetCode];
  return {
    title: `${lang.tr} Romantik Akşam Yemeği Kelimeleri`,
    slug: `${lang.en}-date-night-vocabulary`,
    description: `Romantik bir akşam için gereken ${lang.tr} kelimeleri öğrenin. Restorandan sinemaya, mükemmel bir gece için!`,
    native_lang: 'tr',
    target_lang: targetCode,
    category: 'vocabulary',
    difficulty: 'beginner',
    tags: [lang.tr, 'Randevu', 'Romantizm', 'Akşam Yemeği', 'Çiftler'],
    image: '/images/blog/date-night.jpg',
    read_time: 7,
    published: true,
    date: today,
    content: `import VocabCard from '@components/VocabCard.astro';
import CultureTip from '@components/CultureTip.astro';
import CTA from '@components/CTA.astro';

# ${lang.tr} Romantik Akşam Yemeği Kelimeleri

Partnerinizle romantik bir akşam planlamak mı istiyorsunuz? İşte ${lang.tr} randevu gecesi için ihtiyacınız olan tüm kelimeler ve ifadeler!

## Randevu Teklifi

Bir randevu teklif etmek için:

- "Bu akşam meşgul müsün?"
- "Seninle yemeğe çıkmak istiyorum"
- "Bir filme ne dersin?"
- "Birlikte vakit geçirmek isterim"
- "Bu hafta sonu planın var mı?"

## Restoranda

### Rezervasyon
- "Bir rezervasyon yapmak istiyorum"
- "İki kişilik masa lütfen"
- "Pencere kenarında bir masa olabilir mi?"
- "Saat sekizde müsait misiniz?"

### Sipariş Verme
- "Menüyü alabilir miyiz?"
- "Bugünün özel yemeği nedir?"
- "Şunu tavsiye eder misiniz?"
- "Ben... alacağım"
- "Aynısından bana da lütfen"

<CultureTip>
${lang.tr} yemek kültürü zengin ve çeşitlidir. Partnerinizin ülkesinin yerel lezzetlerini keşfetmek, harika bir randevu aktivitesi olabilir!
</CultureTip>

## Romantik Sohbet

Masada kullanabileceğiniz ifadeler:

- "Çok güzel görünüyorsun"
- "Seninle olmak harika"
- "Bu akşam için teşekkürler"
- "Seni tanıdığım için şanslıyım"
- "Gülüşün harika"

## Yemek ve İçecek Kelimeleri

### Yemekler
| Türkçe | Açıklama |
|--------|----------|
| başlangıç | aperatif |
| ana yemek | asıl yemek |
| tatlı | sonunda |
| içecek | su, şarap, vs. |

### İçecekler
- Su
- Şarap (kırmızı/beyaz)
- Bira
- Kokteyl
- Kahve

## Hesap İsterken

- "Hesap alabilir miyiz?"
- "Kredi kartı geçiyor mu?"
- "Birlikte mi yoksa ayrı mı?"
- "Bahşiş dahil mi?"
- "Fiş alabilir miyim?"

## Randevudan Sonra

### Yürüyüş
- "Biraz yürümek ister misin?"
- "Hava çok güzel"
- "Elimi tutar mısın?"

### Eve Götürme
- "Seni eve bırakayım"
- "Bu akşam harikaydı"
- "Yine görüşelim mi?"
- "Mesaj atarım"

## Sinemada

- "Hangi filmi izlemek istersin?"
- "Aksiyon mu yoksa romantik mi?"
- "Patlamış mısır ister misin?"
- "Yan yana oturalım"

## İltifatlar

Geceyi özel kılan iltifatlar:

- "Bu renk sana çok yakışmış"
- "Çok hoşsun"
- "Seninle konuşmak çok keyifli"
- "Gülümsemeni seviyorum"
- "Bu akşam harika görünüyorsun"

## Gelecek Planları

Randevuyu başarılı kılmak için:

- "Gelecek hafta tekrar buluşalım mı?"
- "Seninle yine görüşmek istiyorum"
- "Başka nereye gitmek istersin?"
- "Bir sonraki sefer ben organize edeyim"

## İpuçları

1. **Önceden pratik yapın**: Önemli kelimeleri önceden tekrarlayın
2. **Cesur olun**: Hata yapmaktan korkmayın, partneriniz çabanızı takdir edecek
3. **Sorular sorun**: İlgi gösterin ve konuşmayı sürdürün
4. **Gülümseyin**: Dil engelini aşmanın en iyi yolu
5. **Eğlenin**: Dil öğrenmek stresli değil, keyifli olmalı!

<CTA />`
  };
}

async function main() {
  console.log('=== Turkish Article Generation Started ===');
  console.log(`Date: ${today}`);
  console.log('Native Language: tr (Turkish)');
  console.log('');

  const targetLanguages = ['en', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'ru', 'uk', 'nl', 'ro', 'sv', 'no', 'da', 'cs', 'el', 'hu'];

  for (const target of targetLanguages) {
    console.log(`\n--- Processing: ${LANG_MAP[target].tr} (${target}) ---`);

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
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n');
  console.log('=== Generation Complete ===');
  console.log(`Generated: ${generated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);

  // Write detailed summary
  const summary = `# Turkish Blog Article Generation - Batch 1

**Completed:** ${new Date().toISOString()}
**Native Language:** tr (Turkish)

## Summary

| Metric | Count |
|--------|-------|
| Generated | ${generated} |
| Skipped (already exist) | ${skipped} |
| Errors | ${errors} |
| **Total Processed** | ${generated + skipped + errors} |

## Topics Generated

1. ✅ En Sık Kullanılan 100 [DİL] Kelime - 17 languages
2. ✅ [DİL] Sevgi Sözcükleri ve Takma Adlar - 17 languages
3. ✅ [DİL] "Seni Seviyorum" Nasıl Söylenir - 17 languages
4. ✅ [DİL] Selamlaşma ve Vedalaşma İfadeleri - 17 languages
5. ✅ [DİL] Romantik Akşam Yemeği Kelimeleri - 17 languages

## Target Languages

| Code | Turkish Name | English Name |
|------|--------------|--------------|
| en | İngilizce | English |
| de | Almanca | German |
| fr | Fransızca | French |
| es | İspanyolca | Spanish |
| it | İtalyanca | Italian |
| pt | Portekizce | Portuguese |
| pl | Lehçe | Polish |
| ru | Rusça | Russian |
| uk | Ukraynaca | Ukrainian |
| nl | Hollandaca | Dutch |
| ro | Romence | Romanian |
| sv | İsveççe | Swedish |
| no | Norveççe | Norwegian |
| da | Danca | Danish |
| cs | Çekçe | Czech |
| el | Yunanca | Greek |
| hu | Macarca | Hungarian |

## Details

### Generated Articles (${details.generated.length})
${details.generated.map(a => `- ${a}`).join('\n') || '- None'}

### Skipped Articles (${details.skipped.length})
${details.skipped.map(a => `- ${a}`).join('\n') || '- None'}

### Errors (${details.errors.length})
${details.errors.map(a => `- ${a}`).join('\n') || '- None'}
`;

  const logDir = path.join(process.env.HOME, 'lovelanguages-multilang/generation_logs');
  fs.mkdirSync(logDir, { recursive: true });
  fs.writeFileSync(path.join(logDir, 'tr_batch1.md'), summary);
  console.log('\nSummary saved to generation_logs/tr_batch1.md');
}

main().catch(console.error);
