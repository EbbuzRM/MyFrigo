// accessibility.ts — italian catalog for the `accessibility` domain.
//
// exports: accessibilityIt
// used_by: i18n/catalogs/it/index.ts
// rules:   Semantic keys only — never derived from the italian text.
// agent:   executor | 2026-09-22 | Fase A i18n | base keys (content migrates in Fase B)

export const accessibilityIt = {
  categoryFilterCount_one: 'Categoria {{name}}, {{count}} prodotto',
  categoryFilterCount_other: 'Categoria {{name}}, {{count}} prodotti',
  categoryFilterSelected: 'Categoria già selezionata',
  categoryFilterHint: 'Tocca per filtrare i prodotti per categoria {{name}}',
  loadingIndicator: 'Caricamento in corso',
  closeButtonLabel: 'Pulsante chiudi',
  categoryIconLabel: 'Icona categoria {{name}}',
  statsCardHint: 'Tocca per visualizzare maggiori dettagli',
  productCardHint: 'Tocca per visualizzare i dettagli del prodotto',
  productBrandLabel: ', marca {{brand}}',
  productCategoryLabel: ', categoria {{category}}',
  productExpirationDateLabel: ', scade il {{date}}',
  productsListLabel: 'Lista dei prodotti',
  refreshProductsListLabel: 'Aggiorna lista prodotti',
  consumeProductLabel: 'Segna {{name}} come consumato',
  consumeProductHint: 'Tocca per segnare {{name}} come consumato',
  deleteProductLabel: 'Elimina {{name}}',
  deleteProductHint: 'Tocca per eliminare {{name}}',
} satisfies Record<string, string>;
