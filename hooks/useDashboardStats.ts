import { useMemo } from 'react';
import { Product } from '@/types/Product';

interface UseDashboardStatsParams {
    allProducts: Product[];
    notificationDays: number | undefined;
}

interface DashboardStats {
    expiringProducts: Product[];
    expiredCount: number;
}

export function useDashboardStats({ allProducts, notificationDays = 7 }: UseDashboardStatsParams): DashboardStats {
    return useMemo(() => {
        const today = new Date();
        // Calcoliamo la mezzanotte di oggi (UTC) per il confronto UTC-based
        const startOfTodayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

        // Calcoliamo la mezzanotte di oggi in formato locale per i prodotti scaduti
        const startOfTodayLocal = new Date();
        startOfTodayLocal.setHours(0, 0, 0, 0);

        // 1. Array ordinato dei prodotti in scadenza
        const expiringProducts = allProducts
            .filter(p => {
                if (!p.expirationDate) return false;

                const expirationParts = p.expirationDate.split('-').map(Number);
                // Costruiamo la data di scadenza a mezzanotte in UTC
                const startOfExpirationUTC = Date.UTC(expirationParts[0], expirationParts[1] - 1, expirationParts[2]);

                // Calcola differenza in giorni
                const diffDays = (startOfExpirationUTC - startOfTodayUTC) / (1000 * 60 * 60 * 24);

                return diffDays >= 0 && diffDays <= notificationDays && !p.consumedDate && !p.isFrozen;
            })
            .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());

        // 2. Conteggio dei prodotti già scaduti
        const expiredCount = allProducts.filter(p => {
            if (!p.expirationDate) return false;
            const expirationDate = new Date(p.expirationDate);
            expirationDate.setHours(0, 0, 0, 0);
            return p.status === 'active' && expirationDate < startOfTodayLocal && !p.isFrozen;
        }).length;

        return {
            expiringProducts,
            expiredCount
        };
    }, [allProducts, notificationDays]);
}
