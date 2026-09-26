export type NotificationLanguage = 'it' | 'en';

export interface NotificationProduct {
  product_name: string;
  days_remaining: number;
}

export function renderExpiredNotification(products: NotificationProduct[], language: NotificationLanguage) {
  const names = products.map(product => `"${product.product_name}"`).join(', ');
  if (language === 'it') {
    return {
      title: 'Prodotti Scaduti!',
      body: products.length === 1
        ? `Il prodotto ${names} è scaduto oggi.`
        : `${products.length} prodotti scaduti oggi: ${names}`,
    };
  }
  return {
    title: 'Expired products',
    body: products.length === 1
      ? `The product ${names} expired today.`
      : `${products.length} products expired today: ${names}`,
  };
}

export function renderPreWarningNotification(products: NotificationProduct[], language: NotificationLanguage) {
  const lines = products.map(product => {
    const name = `"${product.product_name}"`;
    if (language === 'it') {
      return `${name} ${product.days_remaining === 1 ? 'scade domani' : `scade tra ${product.days_remaining} giorni`}`;
    }
    return `${name} ${product.days_remaining === 1 ? 'expires tomorrow' : `expires in ${product.days_remaining} days`}`;
  }).join(', ');
  if (language === 'it') {
    return {
      title: 'Prodotti in Scadenza!',
      body: products.length === 1 ? `Il prodotto ${lines}.` : `${products.length} prodotti in scadenza: ${lines}`,
    };
  }
  return {
    title: 'Products expiring soon',
    body: products.length === 1 ? `The product ${lines}.` : `${products.length} products expiring soon: ${lines}`,
  };
}
