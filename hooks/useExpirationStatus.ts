import { useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';

/**
 * @hook useExpirationStatus
 * @description Hook personalizzato che calcola lo stato di scadenza di un prodotto.
 * Restituisce un oggetto contenente un testo descrittivo (es. "Scade oggi") e i colori
 * appropriati per lo sfondo e il testo, adattandosi al tema chiaro/scuro.
 * @param {string} expirationDate - La data di scadenza del prodotto in formato stringa ISO.
 * @returns {{text: string, color: string, backgroundColor: string}} Lo stato di scadenza calcolato.
 */
export function useExpirationStatus(expirationDate: string) {
  const { isDarkMode } = useTheme();

  const status = useMemo(() => {
    const now = new Date();
    const expDate = new Date(expirationDate);
    const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const statusColors = {
      good: {
        light: { color: '#16a34a', background: '#f0fdf4' },
        dark: { color: '#4ade80', background: '#142e1f' },
      },
      warning: {
        light: { color: '#d97706', background: '#fefce8' },
        dark: { color: '#facc15', background: '#302a0f' },
      },
      expired: {
        light: { color: '#dc2626', background: '#fee2e2' },
        dark: { color: '#f87171', background: '#311919' },
      },
    };

    const theme = isDarkMode ? 'dark' : 'light';

    if (daysUntil < 0) {
      const { color, background } = statusColors.expired[theme];
      return { text: 'Scaduto', color, backgroundColor: background };
    } else if (daysUntil === 0) {
      const { color, background } = statusColors.warning[theme];
      return { text: 'Scade oggi', color, backgroundColor: background };
    } else if (daysUntil <= 3) {
      const { color, background } = statusColors.warning[theme];
      return { text: `${daysUntil} giorni`, color, backgroundColor: background };
    } else {
      const { color, background } = statusColors.good[theme];
      return { text: `${daysUntil} giorni`, color, backgroundColor: background };
    }
  }, [expirationDate, isDarkMode]);

  return status;
}