import { useMemo } from 'react';
import { Product } from '@/types/Product';
import { getLocalISODate } from '@/utils/dateUtils/formatters';

interface UseDashboardStatsParams {
    allProducts: Product[];
    notificationDays: number | undefined;
}

interface DashboardStats {
    expiringProducts: Product[];
    expiredCount: number;
}

/**
 * Calculate dashboard statistics for products.
 * Uses local dates consistently to avoid timezone issues.
 */
export function useDashboardStats({ allProducts, notificationDays = 7 }: UseDashboardStatsParams): DashboardStats {
    return useMemo(() => {
        // Get today's date in local timezone (YYYY-MM-DD format)
        const todayStr = getLocalISODate();
        const today = new Date(todayStr + 'T00:00:00');
        const msPerDay = 1000 * 60 * 60 * 24;

        // 1. Array ordinato dei prodotti in scadenza
        const expiringProducts = allProducts
            .filter(p => {
                if (!p.expirationDate) return false;

                // Parse expiration date in local timezone (append time to avoid UTC shift)
                const expirationDate = new Date(p.expirationDate + 'T00:00:00');

                // Calculate days until expiration using local dates
                const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / msPerDay);

                return daysUntilExpiration >= 0 && daysUntilExpiration <= notificationDays && !p.consumedDate && !p.isFrozen;
            })
            .sort((a, b) => {
                const dateA = new Date(a.expirationDate + 'T00:00:00');
                const dateB = new Date(b.expirationDate + 'T00:00:00');
                return dateA.getTime() - dateB.getTime();
            });

        // 2. Conteggio dei prodotti già scaduti
        const expiredCount = allProducts.filter(p => {
            if (!p.expirationDate) return false;
            
            // Parse expiration date in local timezone
            const expirationDate = new Date(p.expirationDate + 'T00:00:00');
            
            return p.status === 'active' && expirationDate < today && !p.isFrozen;
        }).length;

        return {
            expiringProducts,
            expiredCount
        };
    }, [allProducts, notificationDays]);
}
