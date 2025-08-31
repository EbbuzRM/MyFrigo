const { device, expect, element, by, waitFor } = require('detox');
const { setupDetoxEnvironment } = require('./setup');
const { loginAsTestUser, logout } = require('./helpers');

describe('MyFrigo App - Navigation Tests', () => {
  // Questa configurazione viene eseguita una sola volta prima di tutti i test in questa suite.
  beforeAll(async () => {
    await setupDetoxEnvironment();

    // Avvia l'app con una nuova installazione pulita e concede i permessi.
    // 'delete: true' assicura che lo stato dell'app (es. sessione utente) non persista tra le esecuzioni.
    await device.launchApp({
      delete: true,
      permissions: {
        notifications: 'YES',
        camera: 'YES',
        photos: 'YES',
      },
    });
  });

  // Esegue il login prima di ogni test e il logout dopo,
  // garantendo che ogni test inizi da uno stato di login pulito e non influenzi i successivi.
  beforeEach(async () => {
    await loginAsTestUser();
  });

  afterEach(async () => {
    await logout();
  });

  it('should navigate to add product screen', async () => {
    await element(by.id('add-tab')).tap();
    // Verifica che la schermata di aggiunta sia visibile cercando un suo elemento specifico
    await waitFor(element(by.id('add-product-screen'))).toBeVisible().withTimeout(10000);
    await expect(element(by.id('add-product-screen'))).toBeVisible();
  });

  it('should navigate to products list from tab bar', async () => {
    await element(by.id('products-tab')).tap();
    // Verifica che la lista dei prodotti sia visibile
    await waitFor(element(by.id('products-list-screen'))).toBeVisible().withTimeout(10000);
    await expect(element(by.id('products-list-screen'))).toBeVisible();
  });

  // Questo test è saltato perché richiede uno stato specifico del database (prodotti esistenti)
  // che non è garantito durante l'esecuzione dei test di base.
  it.skip('should handle product detail navigation', () => {
    // Per implementare questo test:
    // 1. Naviga alla lista prodotti.
    // 2. Clicca su un elemento della lista (es. `by.id('product-item-1')`).
    // 3. Verifica che la schermata di dettaglio sia visibile (es. `by.id('product-detail-screen')`).
  });

  it('should navigate to settings tab', async () => {
    await element(by.id('settings-tab')).tap();
    // Verifica che la schermata delle impostazioni sia visibile
    await waitFor(element(by.id('settings-screen'))).toBeVisible().withTimeout(10000);
    await expect(element(by.id('settings-screen'))).toBeVisible();
  });
});