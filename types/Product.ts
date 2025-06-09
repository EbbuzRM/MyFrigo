export interface Product {
  id: string;
  name: string;
  brand?: string;
  category: string;
  quantity: number;
  unit: string;
  purchaseDate: string;
  expirationDate: string;
  barcode?: string;
  imageUrl?: string;
  notes?: string;
  status: 'active' | 'expired' | 'consumed';
  consumedDate?: string;
  addedMethod: 'barcode' | 'photo' | 'manual';
  nutritionalInfo?: {
    calories?: number;
    proteins?: number;
    carbohydrates?: number;
    fats?: number;
  };
}

export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: 'dairy', name: 'Latticini', icon: '🥛', color: '#3B82F6' },
  { id: 'meat', name: 'Carne', icon: '🥩', color: '#EF4444' },
  { id: 'fish', name: 'Pesce', icon: '🐟', color: '#06B6D4' },
  { id: 'vegetables', name: 'Verdure', icon: '🥬', color: '#10B981' },
  { id: 'fruits', name: 'Frutta', icon: '🍎', color: '#F59E0B' },
  { id: 'grains', name: 'Cereali', icon: '🌾', color: '#D97706' },
  { id: 'beverages', name: 'Bevande', icon: '🥤', color: '#8B5CF6' },
  { id: 'snacks', name: 'Snack', icon: '🍿', color: '#EC4899' },
  { id: 'condiments', name: 'Condimenti', icon: '🧂', color: '#64748B' },
  { id: 'frozen', name: 'Surgelati', icon: '❄️', color: '#0EA5E9' },
  { id: 'canned', name: 'Conserve', icon: '🥫', color: '#DC2626' },
  { id: 'other', name: 'Altro', icon: '📦', color: '#6B7280' },
];