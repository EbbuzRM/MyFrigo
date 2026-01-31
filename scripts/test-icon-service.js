// Test script per verificare che IconService trovi "olive"
const { IconService } = require('./services/IconService');

async function testIconService() {
    console.log('=== Test IconService ===\n');

    // Test 1: Carica database
    console.log('1. Caricamento database...');
    const data = IconService.loadLocalEmojiData();
    console.log(`   Database contiene ${data.length} emoji\n`);

    // Test 2: Cerca "olive"
    console.log('2. Ricerca "olive"...');
    const searchResults = IconService.searchInLocalData('olive');
    console.log(`   Trovati ${searchResults.length} risultati:`);
    searchResults.forEach(r => console.log(`   - ${r.annotation} (${r.hexcode}): ${r.svg}`));
    console.log('');

    // Test 3: fetchIconForCategory
    console.log('3. fetchIconForCategory("Olive")...');
    const icon = await IconService.fetchIconForCategory('Olive');
    console.log(`   Risultato: ${icon}`);
    console.log('');

    // Test 4: fetchIconForCategory con minuscolo
    console.log('4. fetchIconForCategory("olive")...');
    const icon2 = await IconService.fetchIconForCategory('olive');
    console.log(`   Risultato: ${icon2}`);
    console.log('');

    // Test 5: Verifica traduzione
    console.log('5. Test traduzione "Olive" -> inglese...');
    const translated = IconService.translateToEnglish('Olive');
    console.log(`   Tradotto: ${translated}`);
    console.log('');
}

testIconService().then(() => {
    console.log('✅ Test completati!');
}).catch(err => {
    console.error('❌ Errore:', err);
});
