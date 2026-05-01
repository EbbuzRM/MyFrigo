import { renderHook } from '@testing-library/react-native';
import { useDashboardStats } from '../useDashboardStats';
import { Product } from '@/types/Product';

describe('useDashboardStats', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        // Set today to 2024-01-10T12:00:00Z
        jest.setSystemTime(new Date(Date.UTC(2024, 0, 10, 12, 0, 0)));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    const mockProducts: Product[] = [
        {
            id: '1',
            name: 'Milk',
            category: 'dairy',
            status: 'active',
            expirationDate: '2024-01-12', // Expires in 2 days -> expiring
            purchaseDate: '2024-01-01',
            addedMethod: 'manual',
            isFrozen: false,
            quantities: [{ quantity: 1, unit: 'default' }]
        },
        {
            id: '2',
            name: 'Cheese',
            category: 'dairy',
            status: 'active',
            expirationDate: '2024-01-20', // Expires in 10 days -> not expiring (if limit is 7)
            purchaseDate: '2024-01-01',
            addedMethod: 'manual',
            isFrozen: false,
            quantities: [{ quantity: 1, unit: 'default' }]
        },
        {
            id: '3',
            name: 'Yogurt',
            category: 'dairy',
            status: 'active',
            expirationDate: '2024-01-08', // Expired 2 days ago
            purchaseDate: '2024-01-01',
            addedMethod: 'manual',
            isFrozen: false,
            quantities: [{ quantity: 1, unit: 'default' }]
        },
        {
            id: '4',
            name: 'Frozen Peas',
            category: 'vegetables',
            status: 'active',
            expirationDate: '2024-01-12', // Expires in 2 days but frozen
            purchaseDate: '2024-01-01',
            addedMethod: 'manual',
            isFrozen: true,
            quantities: [{ quantity: 1, unit: 'default' }]
        },
        {
            id: '5',
            name: 'Consumed Bread',
            category: 'bakery',
            status: 'consumed',
            expirationDate: '2024-01-12', // Expires in 2 days but consumed
            consumedDate: '2024-01-09',
            purchaseDate: '2024-01-01',
            addedMethod: 'manual',
            isFrozen: false,
            quantities: [{ quantity: 1, unit: 'default' }]
        }
    ];

    it('should correctly identify expiring products within the given notification days', () => {
        const { result } = renderHook(() => useDashboardStats({
            allProducts: mockProducts,
            notificationDays: 7
        }));

        expect(result.current.expiringProducts).toHaveLength(1);
        expect(result.current.expiringProducts[0].id).toBe('1');
    });

    it('should correctly identify expired products', () => {
        const { result } = renderHook(() => useDashboardStats({
            allProducts: mockProducts,
            notificationDays: 7
        }));

        expect(result.current.expiredCount).toBe(1); // Only Yogurt
    });

    it('should not include frozen or consumed products in expiring list', () => {
        const { result } = renderHook(() => useDashboardStats({
            allProducts: mockProducts,
            notificationDays: 7
        }));

        const ids = result.current.expiringProducts.map(p => p.id);
        expect(ids).not.toContain('4'); // Frozen
        expect(ids).not.toContain('5'); // Consumed
    });
});
