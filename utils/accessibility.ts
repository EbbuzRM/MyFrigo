/**
 * Utilità per l'accessibilità in React Native
 * 
 * Questo file contiene funzioni di utilità per migliorare l'accessibilità
 * dei componenti React Native, come la generazione di attributi di accessibilità
 * e la gestione di screen reader.
 */

import { AccessibilityProps, AccessibilityRole } from 'react-native';
import { Product, ProductCategory } from '@/types/Product';

/**
 * Interfaccia per gli attributi di accessibilità estesi
 */
export interface AccessibilityAttributes extends AccessibilityProps {
  accessible: boolean;
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string;
}

/**
 * Genera attributi di accessibilità per un pulsante
 * @param label Etichetta del pulsante
 * @param hint Suggerimento per l'azione del pulsante
 * @returns Attributi di accessibilità per il pulsante
 */
export function getButtonAccessibilityProps(
  label: string,
  hint?: string
): AccessibilityAttributes {
  return {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: label,
    accessibilityHint: hint,
  };
}

/**
 * Genera attributi di accessibilità per un elemento di input
 * @param label Etichetta dell'input
 * @param hint Suggerimento per l'input
 * @returns Attributi di accessibilità per l'input
 */
export function getInputAccessibilityProps(
  label: string,
  hint?: string
): AccessibilityAttributes {
  return {
    accessible: true,
    accessibilityRole: 'text',
    accessibilityLabel: label,
    accessibilityHint: hint,
  };
}

/**
 * Genera attributi di accessibilità per una scheda prodotto
 * @param product Prodotto da descrivere
 * @param category Categoria del prodotto
 * @returns Attributi di accessibilità per la scheda prodotto
 */
export function getProductCardAccessibilityProps(
  product: Product,
  category?: ProductCategory
): AccessibilityAttributes {
  const productName = product.name || 'Prodotto senza nome';
  const brandInfo = product.brand ? `, marca ${product.brand}` : '';
  const categoryInfo = category ? `, categoria ${category.name}` : '';
  const expirationInfo = product.expirationDate 
    ? `, scade il ${new Date(product.expirationDate).toLocaleDateString('it-IT')}`
    : '';
  
  return {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: `${productName}${brandInfo}${categoryInfo}${expirationInfo}`,
    accessibilityHint: 'Tocca per visualizzare i dettagli del prodotto',
  };
}

/**
 * Genera attributi di accessibilità per un pulsante di eliminazione
 * @param itemName Nome dell'elemento da eliminare
 * @returns Attributi di accessibilità per il pulsante di eliminazione
 */
export function getDeleteButtonAccessibilityProps(
  itemName: string
): AccessibilityAttributes {
  return {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: `Elimina ${itemName}`,
    accessibilityHint: `Tocca per eliminare ${itemName}`,
  };
}

/**
 * Genera attributi di accessibilità per un pulsante di azione
 * @param action Nome dell'azione
 * @param itemName Nome dell'elemento su cui eseguire l'azione
 * @returns Attributi di accessibilità per il pulsante di azione
 */
export function getActionButtonAccessibilityProps(
  action: string,
  itemName: string
): AccessibilityAttributes {
  return {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: `${action} ${itemName}`,
    accessibilityHint: `Tocca per ${action.toLowerCase()} ${itemName}`,
  };
}

/**
 * Genera attributi di accessibilità per un elemento di lista
 * @param label Etichetta dell'elemento
 * @param hint Suggerimento per l'elemento
 * @returns Attributi di accessibilità per l'elemento di lista
 */
export function getListItemAccessibilityProps(
  label: string,
  hint?: string
): AccessibilityAttributes {
  return {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: label,
    accessibilityHint: hint,
  };
}

/**
 * Genera attributi di accessibilità per una card di impostazioni
 * @param title Titolo dell'impostazione
 * @param description Descrizione dell'impostazione
 * @param hasControl Indica se la card ha un controllo (es. Switch)
 * @returns Attributi di accessibilità per la card di impostazioni
 */
export function getSettingsCardAccessibilityProps(
  title: string,
  description?: string,
  hasControl?: boolean
): AccessibilityAttributes {
  const label = description
    ? `${title}, ${description}`
    : title;
  
  const hint = hasControl
    ? "Contiene un controllo interattivo"
    : "Tocca per modificare questa impostazione";
  
  return {
    accessible: true,
    accessibilityRole: hasControl ? 'none' : 'button',
    accessibilityLabel: label,
    accessibilityHint: hint,
  };
}

/**
 * Genera attributi di accessibilità per una card di statistiche
 * @param title Titolo della statistica
 * @param value Valore della statistica
 * @param isClickable Indica se la card è cliccabile
 * @returns Attributi di accessibilità per la card di statistiche
 */
export function getStatsCardAccessibilityProps(
  title: string,
  value: string,
  isClickable: boolean
): AccessibilityAttributes {
  const label = `${title}: ${value}`;
  const hint = isClickable
    ? "Tocca per visualizzare maggiori dettagli"
    : undefined;
  
  return {
    accessible: true,
    accessibilityRole: isClickable ? 'button' : 'text',
    accessibilityLabel: label,
    accessibilityHint: hint,
  };
}

/**
 * Genera attributi di accessibilità per una card di scadenza
 * @param product Prodotto da descrivere
 * @param expirationStatus Stato di scadenza del prodotto
 * @returns Attributi di accessibilità per la card di scadenza
 */
export function getExpirationCardAccessibilityProps(
  product: Product,
  expirationStatus: { text: string }
): AccessibilityAttributes {
  const productName = product.name || 'Prodotto senza nome';
  const brandInfo = product.brand ? `, marca ${product.brand}` : '';
  const expirationInfo = product.expirationDate
    ? `, scade il ${new Date(product.expirationDate).toLocaleDateString('it-IT')}`
    : '';
  const statusInfo = `, stato: ${expirationStatus.text}`;
  
  return {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: `${productName}${brandInfo}${expirationInfo}${statusInfo}`,
    accessibilityHint: 'Tocca per visualizzare i dettagli del prodotto',
  };
}

/**
 * Genera attributi di accessibilità per un componente pressable animato
 * @param label Etichetta del componente
 * @param hint Suggerimento per l'azione del componente
 * @param role Ruolo di accessibilità (default: 'button')
 * @returns Attributi di accessibilità per il componente pressable animato
 */
export function getAnimatedPressableAccessibilityProps(
  label: string,
  hint?: string,
  role: AccessibilityRole = 'button'
): AccessibilityAttributes {
  return {
    accessible: true,
    accessibilityRole: role,
    accessibilityLabel: label,
    accessibilityHint: hint,
  };
}

/**
 * Genera attributi di accessibilità per un pulsante di filtro categoria
 * @param categoryName Nome della categoria
 * @param count Numero di elementi nella categoria
 * @param isSelected Indica se la categoria è selezionata
 * @returns Attributi di accessibilità per il pulsante di filtro categoria
 */
export function getCategoryFilterAccessibilityProps(
  categoryName: string,
  count: number,
  isSelected: boolean
): AccessibilityAttributes {
  const label = `Categoria ${categoryName}, ${count} ${count === 1 ? 'prodotto' : 'prodotti'}`;
  const hint = isSelected
    ? `Categoria già selezionata`
    : `Tocca per filtrare i prodotti per categoria ${categoryName}`;
  
  return {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: { selected: isSelected },
  };
}

/**
 * Genera attributi di accessibilità per un'immagine
 * @param description Descrizione dell'immagine
 * @returns Attributi di accessibilità per l'immagine
 */
export function getImageAccessibilityProps(
  description: string
): AccessibilityAttributes {
  return {
    accessible: true,
    accessibilityRole: 'image',
    accessibilityLabel: description,
  };
}

/**
 * Genera attributi di accessibilità per un elemento di testo
 * @param text Testo da leggere
 * @returns Attributi di accessibilità per l'elemento di testo
 */
export function getTextAccessibilityProps(
  text: string
): AccessibilityAttributes {
  return {
    accessible: true,
    accessibilityRole: 'text',
    accessibilityLabel: text,
  };
}

export default {
  getButtonAccessibilityProps,
  getInputAccessibilityProps,
  getProductCardAccessibilityProps,
  getDeleteButtonAccessibilityProps,
  getActionButtonAccessibilityProps,
  getListItemAccessibilityProps,
  getImageAccessibilityProps,
  getTextAccessibilityProps,
  getSettingsCardAccessibilityProps,
  getStatsCardAccessibilityProps,
  getExpirationCardAccessibilityProps,
  getAnimatedPressableAccessibilityProps,
  getCategoryFilterAccessibilityProps,
};