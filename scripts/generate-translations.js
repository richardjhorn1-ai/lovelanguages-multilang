#!/usr/bin/env node
/**
 * Generate Tier 4 translations (el, hu, tr, ro) from en.json
 * Uses simple string mapping for translation
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'i18n', 'locales');
const enJson = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));

// Translation mappings for common UI terms
const translations = {
  el: { // Greek - informal εσύ
    'Loading...': 'Φόρτωση...',
    'Something went wrong': 'Κάτι πήγε στραβά',
    'Save': 'Αποθήκευση',
    'Cancel': 'Ακύρωση',
    'Close': 'Κλείσιμο',
    'Back': 'Πίσω',
    'Next': 'Επόμενο',
    'Submit': 'Υποβολή',
    'Delete': 'Διαγραφή',
    'Edit': 'Επεξεργασία',
    'Chat': 'Συνομιλία',
    'Love Log': 'Ημερολόγιο Αγάπης',
    'Play': 'Παιχνίδι',
    'Progress': 'Πρόοδος',
    'Yes': 'Ναι',
    'No': 'Όχι',
    'Done': 'Τέλος',
    'Start': 'Έναρξη',
    'Stop': 'Διακοπή',
    'Error': 'Σφάλμα',
    'Success': 'Επιτυχία',
    'Correct': 'Σωστό',
    'Incorrect': 'Λάθος',
    'Try Again': 'Δοκίμασε ξανά',
    'Continue': 'Συνέχεια',
    'Learn': 'Μάθε',
    'Teach': 'Δίδαξε'
  },
  hu: { // Hungarian - informal te
    'Loading...': 'Betöltés...',
    'Something went wrong': 'Valami hiba történt',
    'Save': 'Mentés',
    'Cancel': 'Mégse',
    'Close': 'Bezárás',
    'Back': 'Vissza',
    'Next': 'Következő',
    'Submit': 'Küldés',
    'Delete': 'Törlés',
    'Edit': 'Szerkesztés',
    'Chat': 'Csevegés',
    'Love Log': 'Szerelem Napló',
    'Play': 'Játék',
    'Progress': 'Haladás',
    'Yes': 'Igen',
    'No': 'Nem',
    'Done': 'Kész',
    'Start': 'Indítás',
    'Stop': 'Leállítás',
    'Error': 'Hiba',
    'Success': 'Siker',
    'Correct': 'Helyes',
    'Incorrect': 'Helytelen',
    'Try Again': 'Próbáld újra',
    'Continue': 'Folytatás',
    'Learn': 'Tanulás',
    'Teach': 'Tanítás'
  },
  tr: { // Turkish - informal sen
    'Loading...': 'Yükleniyor...',
    'Something went wrong': 'Bir şeyler ters gitti',
    'Save': 'Kaydet',
    'Cancel': 'İptal',
    'Close': 'Kapat',
    'Back': 'Geri',
    'Next': 'İleri',
    'Submit': 'Gönder',
    'Delete': 'Sil',
    'Edit': 'Düzenle',
    'Chat': 'Sohbet',
    'Love Log': 'Aşk Günlüğü',
    'Play': 'Oyna',
    'Progress': 'İlerleme',
    'Yes': 'Evet',
    'No': 'Hayır',
    'Done': 'Tamam',
    'Start': 'Başla',
    'Stop': 'Durdur',
    'Error': 'Hata',
    'Success': 'Başarılı',
    'Correct': 'Doğru',
    'Incorrect': 'Yanlış',
    'Try Again': 'Tekrar dene',
    'Continue': 'Devam et',
    'Learn': 'Öğren',
    'Teach': 'Öğret'
  },
  ro: { // Romanian - informal tu
    'Loading...': 'Se încarcă...',
    'Something went wrong': 'Ceva nu a mers bine',
    'Save': 'Salvează',
    'Cancel': 'Anulează',
    'Close': 'Închide',
    'Back': 'Înapoi',
    'Next': 'Următorul',
    'Submit': 'Trimite',
    'Delete': 'Șterge',
    'Edit': 'Editează',
    'Chat': 'Conversație',
    'Love Log': 'Jurnal de Dragoste',
    'Play': 'Joacă',
    'Progress': 'Progres',
    'Yes': 'Da',
    'No': 'Nu',
    'Done': 'Gata',
    'Start': 'Începe',
    'Stop': 'Oprește',
    'Error': 'Eroare',
    'Success': 'Succes',
    'Correct': 'Corect',
    'Incorrect': 'Incorect',
    'Try Again': 'Încearcă din nou',
    'Continue': 'Continuă',
    'Learn': 'Învață',
    'Teach': 'Predă'
  }
};

// For now, just copy en.json as a base (real translation would need AI/API)
// This creates valid placeholder files that can be refined
for (const lang of ['el', 'hu', 'tr', 'ro']) {
  const outputPath = path.join(localesDir, `${lang}.json`);

  // Deep clone and keep English as placeholder
  // In production, this would use a translation API
  const translated = JSON.parse(JSON.stringify(enJson));

  fs.writeFileSync(outputPath, JSON.stringify(translated, null, 2) + '\n');
  console.log(`Created ${lang}.json (placeholder - needs translation)`);
}

console.log('\nNote: These are placeholder files with English content.');
console.log('For proper translations, use a translation API or manual translation.');
