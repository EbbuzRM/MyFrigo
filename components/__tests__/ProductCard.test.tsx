// ProductCard.test.tsx — ProductCard test module.
//
// exports: none
// used_by: none
// rules:   none

// Must mock before any imports
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const RN = require('react-native');
  const MockView = RN.View || ((props: any) => React.createElement('View', props, props.children));
  return {
    __esModule: true,
    default: {
      View: MockView,
      Text: RN.Text || ((props: any) => React.createElement('Text', props, props.children)),
      createAnimatedComponent: (component: any) => component,
    },
    View: MockView,
    Text: RN.Text || ((props: any) => React.createElement('Text', props, props.children)),
    createAnimatedComponent: (component: any) => component,
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn(() => 0),
    withSpring: jest.fn(() => 0),
    Easing: { ease: jest.fn() },
    interpolate: jest.fn(),
    Extrapolate: { CLAMP: 'clamp' },
  };
});

jest.mock('@/hooks/useCardAnimation', () => ({
  useCardAnimation: jest.fn(),
}));

jest.mock('@/hooks/useProductStatus', () => ({
  useProductStatus: jest.fn(),
}));

jest.mock('../ProductCardHeader', () => {
  const React = require('react');
  const RN = require('react-native');
  return {
    ProductCardHeader: (props: any) => {
      return React.createElement(RN.View, null,
        React.createElement(RN.Text, null, props.product?.name || ''),
        React.createElement(RN.TouchableOpacity, {
          testID: 'mock-consume-btn',
          onPress: props.onConsume,
        }, React.createElement(RN.Text, null, 'Consuma')),
        React.createElement(RN.TouchableOpacity, {
          testID: 'mock-delete-btn',
          onPress: props.onDelete,
        }, React.createElement(RN.Text, null, 'Elimina')),
      );
    },
  };
});

jest.mock('../ProductCardDetails', () => {
  const React = require('react');
  const RN = require('react-native');
  return {
    ProductCardDetails: (props: any) => {
      return React.createElement(RN.View, null,
        React.createElement(RN.Text, { testID: 'mock-expiration' }, props.formattedExpirationDate || ''),
        React.createElement(RN.Text, { testID: 'mock-purchase' }, props.formattedPurchaseDate || ''),
      );
    },
  };
});

jest.mock('../ProductCard.styles', () => ({
  getProductCardStyles: jest.fn(),
}));

// Override global LoggingService to add `warning` method
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    warning: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { render, fireEvent } from '@testing-library/react-native';
import { ProductCard } from '../ProductCard';
import { useCardAnimation } from '@/hooks/useCardAnimation';
import { useProductStatus } from '@/hooks/useProductStatus';
import { getProductCardStyles } from '../ProductCard.styles';
import { LoggingService } from '@/services/LoggingService';

describe('ProductCard', () => {
  const mockProduct = {
    id: 'prod-1',
    barcode: '8001234567890',
    name: 'Latte',
    brand: 'Parmalat',
    category: 'latticini',
    imageUrl: 'https://example.com/latte.jpg',
    expirationDate: '2026-12-31',
    purchaseDate: '2026-05-01',
    quantity: 2,
    quantities: [{ quantity: 1, unit: 'pz' }],
    addedMethod: 'manual' as const,
    status: 'active' as const,
    notes: '',
    userId: 'user-1',
    createdAt: '2026-05-01',
    updatedAt: '2026-05-01',
    isFrozen: false,
  };

  const mockCategoryInfo = {
    id: 'cat-1',
    name: 'Latticini',
    icon: '1F9C8',
    color: '#3b82f6',
  };

  const mockExpirationInfo = {
    color: '#16a34a',
    backgroundColor: '#dcfce7',
  };

  const mockFormattedExpirationDate = '31/12/2026';
  const mockFormattedPurchaseDate = jest.fn(() => '01/05/2026');

  const mockStyles = {
    card: { borderRadius: 12, padding: 12, marginHorizontal: 16, marginVertical: 4 },
    statusIndicator: { width: 5, borderRadius: 3, marginRight: 12 },
    content: { flex: 1, flexDirection: 'row' as const },
  };

  const defaultProps = {
    product: mockProduct,
    categoryInfo: mockCategoryInfo,
    onDelete: jest.fn(),
    onConsume: jest.fn(),
    onPress: jest.fn(),
    index: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCardAnimation as jest.Mock).mockReturnValue({ animatedStyle: {} });
    (useProductStatus as jest.Mock).mockReturnValue({
      expirationInfo: mockExpirationInfo,
      formattedExpirationDate: mockFormattedExpirationDate,
      formattedPurchaseDate: mockFormattedPurchaseDate,
    });
    (getProductCardStyles as jest.Mock).mockReturnValue(mockStyles);
  });

  it('should render product card with product and category info', () => {
    const { getByTestId } = render(<ProductCard {...defaultProps} />);
    expect(getByTestId('product-item-0')).toBeTruthy();
  });

  it('should render with correct testID based on index', () => {
    const { getByTestId } = render(
      <ProductCard {...defaultProps} index={3} />
    );
    expect(getByTestId('product-item-3')).toBeTruthy();
  });

  it('should return null when categoryInfo is undefined', () => {
    const { queryByTestId } = render(
      <ProductCard {...defaultProps} categoryInfo={undefined as any} />
    );
    expect(queryByTestId('product-item-0')).toBeNull();
  });

  it('should log warning when rendering skipped due to missing category', () => {
    render(
      <ProductCard {...defaultProps} categoryInfo={undefined as any} />
    );
    expect(LoggingService.warning).toHaveBeenCalledWith(
      'ProductCard',
      expect.stringContaining('missing product or category')
    );
  });

  it('should call onPress when card is pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <ProductCard {...defaultProps} onPress={onPress} />
    );
    fireEvent.press(getByTestId('product-item-0'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should pass correct props to useProductStatus hook', () => {
    render(<ProductCard {...defaultProps} />);
    expect(useProductStatus).toHaveBeenCalledWith(
      mockProduct.expirationDate,
      false,
      mockProduct.isFrozen
    );
  });

  it('should pass correct index to useCardAnimation', () => {
    render(<ProductCard {...defaultProps} />);
    expect(useCardAnimation).toHaveBeenCalledWith(0);
  });

  it('should call getProductCardStyles with theme values', () => {
    render(<ProductCard {...defaultProps} />);
    expect(getProductCardStyles).toHaveBeenCalledWith(false, expect.objectContaining({
      textPrimary: '#1a1a1a',
    }));
  });

  it('should handle card with frozen product', () => {
    const frozenProduct = { ...mockProduct, isFrozen: true };
    const { getByTestId } = render(
      <ProductCard {...defaultProps} product={frozenProduct} />
    );
    expect(getByTestId('product-item-0')).toBeTruthy();
    expect(useProductStatus).toHaveBeenCalledWith(
      frozenProduct.expirationDate,
      false,
      true
    );
  });

  it('should handle card with consumed product status', () => {
    const consumedProduct = { ...mockProduct, status: 'consumed' as const };
    const { getByTestId } = render(
      <ProductCard {...defaultProps} product={consumedProduct} />
    );
    expect(getByTestId('product-item-0')).toBeTruthy();
  });
});
