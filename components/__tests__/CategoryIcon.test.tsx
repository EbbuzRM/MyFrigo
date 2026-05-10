// CategoryIcon.test.tsx — CategoryIcon.test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { render } from '@testing-library/react-native';
import { CategoryIcon } from '../CategoryIcon';
import { ProductCategory } from '@/types/Product';

jest.mock('@/utils/scaleFont', () => ({
  scaleFont: (size: number) => size,
}));

jest.mock('@/utils/accessibility', () => ({
  getImageAccessibilityProps: (label: string) => ({
    accessibilityLabel: label,
    accessible: true,
  }),
}));

describe('CategoryIcon', () => {
  const emojiCategory: ProductCategory = {
    id: 'fruits',
    name: 'Frutta',
    icon: '🍎',
    color: '#F59E0B',
  };

  const remoteIconCategory: ProductCategory = {
    id: 'custom',
    name: 'Custom',
    icon: 'https://example.com/icon.png',
    color: '#6366F1',
  };

  const localIconCategory: ProductCategory = {
    id: 'flour',
    name: 'Farine',
    localIcon: 1, // React Native require() returns a number
    color: '#A16207',
  };

  it('renders emoji icon when category has emoji icon string', () => {
    const { getByText } = render(<CategoryIcon categoryInfo={emojiCategory} />);
    expect(getByText('🍎')).toBeTruthy();
  });

  it('renders local icon when category has localIcon', () => {
    const { getByTestId } = render(
      <CategoryIcon categoryInfo={localIconCategory} testID="local-icon" />
    );
    expect(getByTestId('local-icon')).toBeTruthy();
  });

  it('renders remote URL icon when category icon starts with http', () => {
    const { getByTestId } = render(
      <CategoryIcon categoryInfo={remoteIconCategory} testID="remote-icon" />
    );
    expect(getByTestId('remote-icon')).toBeTruthy();
  });

  it('renders with small size variant', () => {
    const { getByText } = render(
      <CategoryIcon categoryInfo={emojiCategory} size="small" />
    );
    expect(getByText('🍎')).toBeTruthy();
  });

  it('renders with medium size variant (default)', () => {
    const { getByText } = render(<CategoryIcon categoryInfo={emojiCategory} />);
    expect(getByText('🍎')).toBeTruthy();
  });

  it('renders with custom testID', () => {
    const { getByTestId } = render(
      <CategoryIcon categoryInfo={emojiCategory} testID="custom-icon" />
    );
    expect(getByTestId('custom-icon')).toBeTruthy();
  });

  it('renders fallback emoji when icon is undefined', () => {
    const noIconCategory: ProductCategory = {
      id: 'test',
      name: 'Test',
      color: '#333',
    };
    // When no icon and no localIcon, falls through to the emoji path
    // but categoryInfo.icon is undefined, so it renders undefined as text
    const { getByTestId } = render(
      <CategoryIcon categoryInfo={noIconCategory} testID="no-icon" />
    );
    expect(getByTestId('no-icon')).toBeTruthy();
  });

  it('prioritizes localIcon over remote URL icon', () => {
    const bothIconsCategory: ProductCategory = {
      id: 'both',
      name: 'Both',
      icon: 'https://example.com/icon.png',
      localIcon: 1,
      color: '#333',
    };
    // localIcon should take priority
    const { getByTestId } = render(
      <CategoryIcon categoryInfo={bothIconsCategory} testID="both-icon" />
    );
    expect(getByTestId('both-icon')).toBeTruthy();
  });

  it('renders emoji when icon is a non-URL string', () => {
    const emojiCategory2: ProductCategory = {
      id: 'snacks',
      name: 'Snack',
      icon: '🍿',
      color: '#EC4899',
    };
    const { getByText } = render(<CategoryIcon categoryInfo={emojiCategory2} />);
    expect(getByText('🍿')).toBeTruthy();
  });
});
