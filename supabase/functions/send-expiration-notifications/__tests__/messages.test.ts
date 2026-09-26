import { renderExpiredNotification, renderPreWarningNotification } from '../messages';

describe('expiration notification messages', () => {
  const product = { product_name: 'Latte', days_remaining: 1 };

  it('keeps the original product name in both languages', () => {
    expect(renderExpiredNotification([product], 'it').body).toBe('Il prodotto "Latte" è scaduto oggi.');
    expect(renderExpiredNotification([product], 'en').body).toBe('The product "Latte" expired today.');
  });

  it('uses the correct singular and plural warning phrases', () => {
    expect(renderPreWarningNotification([product], 'en').body).toBe('The product "Latte" expires tomorrow.');
    expect(renderPreWarningNotification([product, { product_name: 'Pane', days_remaining: 3 }], 'it').body)
      .toBe('2 prodotti in scadenza: "Latte" scade domani, "Pane" scade tra 3 giorni');
  });
});
