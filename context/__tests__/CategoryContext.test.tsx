// CategoryContext.test.tsx — CategoryContext.test module.
//
// exports: none
// used_by: none
// rules: none

import React from 'react';
import { render, act, waitForElementToBeRemoved, renderHook } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { CategoryProvider, useCategories } from '../CategoryContext';
import { CategoryService } from '@/services/CategoryService';
import { IconService } from '@/services/IconService';
import { useAuth } from '../AuthContext';
import { ProductCategory } from '@/types/Product';

// --- Mocks ---

// Mock del LoggingService
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock di expo-crypto per randomUUID
jest.mock('expo-crypto', () => ({
  randomUUID: () => 'mock-uuid-123',
}));

// Mock di react-native Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Alert = {
    alert: jest.fn(),
  };
  return RN;
});

// Mock del servizio di autenticazione
jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock del servizio CategoryService
jest.mock('@/services/CategoryService', () => ({
  CategoryService: {
    getAllCategories: jest.fn(),
    addCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
  },
}));

// Mock del servizio IconService
jest.mock('@/services/IconService', () => ({
  IconService: {
    fetchIconForCategory: jest.fn(),
    convertToLocalIcon: jest.fn(),
  },
}));

// Type assertions per i mock
const mockedUseAuth = useAuth as jest.Mock;
const mockedGetAllCategories = CategoryService.getAllCategories as jest.Mock;
const mockedAddCategory = CategoryService.addCategory as jest.Mock;
const mockedUpdateCategory = CategoryService.updateCategory as jest.Mock;
const mockedDeleteCategory = CategoryService.deleteCategory as jest.Mock;
const mockedFetchIconForCategory = IconService.fetchIconForCategory as jest.Mock;
const mockedConvertToLocalIcon = IconService.convertToLocalIcon as jest.Mock;

// --- Componente di Test ---
const TestComponent = () => {
  const { categories, loading } = useCategories();
  if (loading) {
    return <Text testID="loading-text">Loading...</Text>;
  }
  return (
    <View testID="categories-view">
      {categories.map((cat) => (
        <Text key={cat.id} testID={`category-${cat.id}`}>
          {cat.name}
        </Text>
      ))}
    </View>
  );
};

// --- Dati di test ---
const mockCategories: ProductCategory[] = [
  {
    id: 'cat-1',
    name: 'Latticini',
    icon: '🥛',
    color: '#FFFFFF',
    isDefault: true,
  },
  {
    id: 'cat-2',
    name: 'Bevande',
    icon: '🥤',
    color: '#FF0000',
    isDefault: true,
  },
];

const mockUser = { id: 'test-user-id' };

// --- Test Suite ---
describe('CategoryContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ user: null });
    mockedFetchIconForCategory.mockResolvedValue(null);
    mockedConvertToLocalIcon.mockReturnValue(undefined);
  });

  // Test 1: Rendering iniziale senza user
  it('should render with default categories when no user is present', async () => {
    mockedUseAuth.mockReturnValue({ user: null });
    mockedGetAllCategories.mockResolvedValue([]);

    const { getByTestId } = render(
      <CategoryProvider>
        <TestComponent />
      </CategoryProvider>
    );

    // Non dovrebbe esserci loading state senza user
    expect(getByTestId('categories-view')).toBeTruthy();
    expect(mockedGetAllCategories).not.toHaveBeenCalled();
  });

  // Test 2: Rendering iniziale con user
  it('should fetch and display categories when user is present', async () => {
    mockedUseAuth.mockReturnValue({ user: mockUser });
    mockedGetAllCategories.mockResolvedValue(mockCategories);

    const { getByTestId, queryByTestId } = render(
      <CategoryProvider>
        <TestComponent />
      </CategoryProvider>
    );

    // Inizialmente in loading
    expect(getByTestId('loading-text')).toBeTruthy();

    // Attende fine caricamento
    await waitForElementToBeRemoved(() => queryByTestId('loading-text'), { timeout: 3000 });

    // Verifica categorie
    expect(getByTestId('categories-view')).toBeTruthy();
    expect(mockedGetAllCategories).toHaveBeenCalled();
  });

  // Test 3: Loading state iniziale
  it('should show loading state initially when user is present', async () => {
    mockedUseAuth.mockReturnValue({ user: mockUser });
    mockedGetAllCategories.mockResolvedValue(mockCategories);

    const { getByTestId, queryByTestId } = render(
      <CategoryProvider>
        <TestComponent />
      </CategoryProvider>
    );

    expect(getByTestId('loading-text')).toBeTruthy();
    await waitForElementToBeRemoved(() => queryByTestId('loading-text'), { timeout: 3000 });
  });

  // Test 4: Nessuna categoria restituita
  it('should handle empty categories list', async () => {
    mockedUseAuth.mockReturnValue({ user: mockUser });
    mockedGetAllCategories.mockResolvedValue([]);

    const { queryByTestId, getByTestId } = render(
      <CategoryProvider>
        <TestComponent />
      </CategoryProvider>
    );

    expect(getByTestId('loading-text')).toBeTruthy();
    await waitForElementToBeRemoved(() => queryByTestId('loading-text'), { timeout: 3000 });

    expect(getByTestId('categories-view')).toBeTruthy();
  });

  // Test 5: Gestione errore caricamento categorie
  it('should handle error during categories fetch', async () => {
    mockedUseAuth.mockReturnValue({ user: mockUser });
    mockedGetAllCategories.mockRejectedValue(new Error('Fetch failed'));

    const { queryByTestId, getByTestId } = render(
      <CategoryProvider>
        <TestComponent />
      </CategoryProvider>
    );

    expect(getByTestId('loading-text')).toBeTruthy();
    await waitForElementToBeRemoved(() => queryByTestId('loading-text'), { timeout: 3000 });

    // Dovrebbe comunque visualizzare le categorie di default
    expect(getByTestId('categories-view')).toBeTruthy();
  });

  // Test 6: addCategory - successo
  it('should add a new category successfully', async () => {
    mockedUseAuth.mockReturnValue({ user: mockUser });
    mockedGetAllCategories.mockResolvedValue(mockCategories);
    mockedAddCategory.mockResolvedValue({
      ...mockCategories[0],
      id: 'new-cat-id',
      name: 'Nuova Categoria',
    });

    const { result } = renderHook(() => useCategories(), { wrapper: CategoryProvider });
    
    await act(async () => {
      await result.current.addCategory('Nuova Categoria');
    });

    expect(mockedAddCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Nuova Categoria',
        userId: mockUser.id,
      })
    );
  });

  // Test 7: addCategory - errore validazione (nome vuoto)
  it('should throw error when adding category with empty name', async () => {
    mockedUseAuth.mockReturnValue({ user: mockUser });
    mockedGetAllCategories.mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategories(), { wrapper: CategoryProvider });
    
    await act(async () => {
      await expect(result.current.addCategory(' ')).rejects.toThrow('Il nome della categoria non può essere vuoto.');
    });
  });

// Test 8: addCategory - errore duplicato
it('should throw error when adding duplicate category', async () => {
  mockedUseAuth.mockReturnValue({ user: mockUser });
  mockedGetAllCategories.mockResolvedValue(mockCategories);

  const { result } = renderHook(() => useCategories(), { wrapper: CategoryProvider });

  // Wait for categories to load
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  await act(async () => {
    await expect(result.current.addCategory('Latticini')).rejects.toThrow('Una categoria con questo nome esiste già.');
  });
});

  // Test 9: addCategory - nessun user
  it('should throw error when adding category without user', async () => {
    mockedUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useCategories(), { wrapper: CategoryProvider });
    
    await act(async () => {
      await expect(result.current.addCategory('Test')).rejects.toThrow('Devi essere loggato per creare una categoria.');
    });
  });

  // Test 10: addCategory - errore servizio
  it('should handle error when addCategory service fails', async () => {
    mockedUseAuth.mockReturnValue({ user: mockUser });
    mockedGetAllCategories.mockResolvedValue(mockCategories);
    mockedAddCategory.mockRejectedValue(new Error('Service error'));

    const { result } = renderHook(() => useCategories(), { wrapper: CategoryProvider });
    
    await act(async () => {
      await expect(result.current.addCategory('Nuova')).rejects.toThrow('Service error');
    });
  });

// Test 11: updateCategory - successo
it('should update category successfully', async () => {
  mockedUseAuth.mockReturnValue({ user: mockUser });
  mockedGetAllCategories.mockResolvedValue(mockCategories);
  mockedUpdateCategory.mockResolvedValue(undefined);

  const { result } = renderHook(() => useCategories(), { wrapper: CategoryProvider });

  // Wait for categories to load
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  await act(async () => {
    await result.current.updateCategory('cat-1', 'Latticini Aggiornati');
  });

  expect(mockedUpdateCategory).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 'cat-1',
      name: 'Latticini Aggiornati',
    })
  );
});

  // Test 12: updateCategory - errore validazione (nome vuoto)
  it('should throw error when updating category with empty name', async () => {
    mockedUseAuth.mockReturnValue({ user: mockUser });
    mockedGetAllCategories.mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategories(), { wrapper: CategoryProvider });
    
    await act(async () => {
      await expect(result.current.updateCategory('cat-1', ' ')).rejects.toThrow('Il nome della categoria non può essere vuoto.');
    });
  });

// Test 13: updateCategory - errore duplicato
it('should throw error when updating to duplicate name', async () => {
  mockedUseAuth.mockReturnValue({ user: mockUser });
  mockedGetAllCategories.mockResolvedValue(mockCategories);

  const { result } = renderHook(() => useCategories(), { wrapper: CategoryProvider });

  // Wait for categories to load
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  await act(async () => {
    await expect(result.current.updateCategory('cat-2', 'Latticini')).rejects.toThrow('Una categoria con questo nome esiste già.');
  });
});

// Test 14: updateCategory - categoria non trovata
it('should throw error when updating non-existent category', async () => {
  mockedUseAuth.mockReturnValue({ user: mockUser });
  mockedGetAllCategories.mockResolvedValue(mockCategories);

  const { result } = renderHook(() => useCategories(), { wrapper: CategoryProvider });

  // Wait for categories to load
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  await act(async () => {
    await expect(result.current.updateCategory('non-existent-id', 'Test')).rejects.toThrow('Categoria non trovata.');
  });
});

  // Test 15: updateCategory - nessun user
  it('should throw error when updating category without user', async () => {
    mockedUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useCategories(), { wrapper: CategoryProvider });
    
    await act(async () => {
      await expect(result.current.updateCategory('cat-1', 'Test')).rejects.toThrow('Devi essere loggato per modificare una categoria.');
    });
  });

  // Test 16: deleteCategory - successo
  it('should delete category successfully', async () => {
    mockedUseAuth.mockReturnValue({ user: mockUser });
    mockedGetAllCategories.mockResolvedValue(mockCategories);
    mockedDeleteCategory.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCategories(), { wrapper: CategoryProvider });
    
    await act(async () => {
      await result.current.deleteCategory('cat-1');
    });

    expect(mockedDeleteCategory).toHaveBeenCalledWith('cat-1');
  });

// Test 17: deleteCategory - errore e rollback
it('should rollback on delete error', async () => {
  mockedUseAuth.mockReturnValue({ user: mockUser });
  mockedGetAllCategories.mockResolvedValue(mockCategories);
  mockedDeleteCategory.mockRejectedValue(new Error('Delete failed'));

  const { result } = renderHook(() => useCategories(), { wrapper: CategoryProvider });

  // Wait for categories to load
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  // deleteCategory should NOT throw, it handles errors internally
  await act(async () => {
    await result.current.deleteCategory('cat-1');
  });

  // Verify the category was NOT removed (rollback happened)
  const category = result.current.getCategoryById('cat-1');
  expect(category).toBeDefined();
  expect(category?.name).toBe('Latticini');
});

// Test 18: getCategoryById - trovato
it('should return category by id', async () => {
  mockedUseAuth.mockReturnValue({ user: mockUser });
  mockedGetAllCategories.mockResolvedValue(mockCategories);

  const { result } = renderHook(() => useCategories(), { wrapper: CategoryProvider });

  // Wait for categories to load
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  const category = result.current.getCategoryById('cat-1');
  expect(category).toBeDefined();
  expect(category?.name).toBe('Latticini');
});

// Test 19: getCategoryById - non trovato
it('should return undefined for non-existent category', async () => {
  mockedUseAuth.mockReturnValue({ user: mockUser });
  mockedGetAllCategories.mockResolvedValue(mockCategories);

  const { result } = renderHook(() => useCategories(), { wrapper: CategoryProvider });

  // Wait for categories to load
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  const category = result.current.getCategoryById('non-existent-id');
  expect(category).toBeUndefined();
});

  // Test 20: Icon migration - percorso icona obsoleto
  it('should migrate old icon paths', async () => {
    const categoriesWithOldIcons: ProductCategory[] = [
      {
        id: 'cat-old',
        name: 'Test Category',
        icon: 'icon_products/test.png',
        color: '#FFFFFF',
        isDefault: false,
      },
    ];

    mockedUseAuth.mockReturnValue({ user: mockUser });
    mockedGetAllCategories.mockResolvedValue(categoriesWithOldIcons);
    mockedUpdateCategory.mockResolvedValue(undefined);

    render(
      <CategoryProvider>
        <TestComponent />
      </CategoryProvider>
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Verifica che updateCategory sia stato chiamato per la migrazione
    expect(mockedUpdateCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cat-old',
        icon: expect.stringContaining('assets/icon_products/'),
      })
    );
  });
});
