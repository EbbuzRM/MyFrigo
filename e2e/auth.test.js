const { device, expect, element, by, waitFor } = require('detox');

// CREDENZIALI DI TEST UFFICIALI - NON MODIFICARE
const EMAIL = 'example@gmail.com';
const PASSWORD = 'A123456a';

describe('MyFrigo App - Test di Autenticazione Definitivo', () => {

  beforeEach(async () => {
    // Pulizia totale: disinstalla l'app e cancella tutti i dati.
    // Questo è il modo più affidabile per prevenire l'errore del token.
    await device.launchApp({
      delete: true,
      newInstance: true,
    });
  });

  it('dovrebbe eseguire il login e navigare correttamente', async () => {
    // 1. Gestione Permessi (con attesa generosa)
    // Diamo al sistema fino a 10 secondi per mostrare il dialogo.
    try {
      await waitFor(element(by.text('Consenti'))).toBeVisible().withTimeout(10000);
      console.log('[TEST LOG] Dialogo permessi trovato. Clicco "Consenti".');
      await element(by.text('Consenti')).tap();
    } catch (e) {
      console.log('[TEST LOG] Dialogo permessi non è apparso entro 10s. Proseguo.');
    }

    // 2. Attesa della schermata di Login
    await waitFor(element(by.id('login-screen'))).toBeVisible().withTimeout(20000);

    // 3. Inserimento Credenziali (NON MODIFICATE)
    await element(by.id('email-input')).typeText(EMAIL);
    await element(by.id('password-input')).typeText(PASSWORD);

    // 4. Tap sul Login
    await element(by.id('login-button')).tap();

    // 5. Attesa Dashboard (con timeout aumentato)
    await waitFor(element(by.id('index-screen'))).toBeVisible().withTimeout(20000);

    // Pausa aggiuntiva per permettere alla dashboard di caricare eventuali dati/animazioni
    console.log('[TEST LOG] Dashboard visibile. Pausa di 1 secondo prima della navigazione.');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 6. Navigazione tra i Tab
    await element(by.id('add-tab')).tap();
    await waitFor(element(by.id('add-product-screen'))).toBeVisible().withTimeout(15000);
    console.log('[TEST LOG] Navigazione ad "Aggiungi" OK.');

    await element(by.id('products-tab')).tap();
    await waitFor(element(by.id('products-list-screen'))).toBeVisible().withTimeout(15000);
    console.log('[TEST LOG] Navigazione a "Prodotti" OK.');
  });
});