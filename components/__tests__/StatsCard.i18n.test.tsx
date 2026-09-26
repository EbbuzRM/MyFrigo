import React from 'react';
import { act, render } from '@testing-library/react-native';
import i18next from 'i18next';
import { StatsCard } from '../StatsCard';
import { initI18n } from '@/i18n';
import { itCatalogs } from '@/i18n/catalogs/it';
import { enCatalogs } from '@/i18n/catalogs/en';

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'it-IT' }]),
}));

jest.mock('@/utils/accessibility', () => jest.requireActual('@/utils/accessibility'));

describe('StatsCard localization', () => {
  beforeEach(() => {
    initI18n();
  });

  afterEach(async () => {
    await i18next.changeLanguage('it');
  });

  it('localizes clickable-card accessibility hint when language changes', async () => {
    const screen = render(
      <StatsCard
        title="Prodotti Attivi"
        value="4"
        icon={null}
        lightBackgroundColor="#ffffff"
        darkBackgroundColor="#000000"
        onPress={jest.fn()}
      />,
    );
    const card = () => screen.getByTestId('stats-card-prodotti-attivi');

    expect(card().props.accessibilityHint).toBe(itCatalogs.accessibility.statsCardHint);

    await act(async () => {
      await i18next.changeLanguage('en');
    });

    expect(card().props.accessibilityHint).toBe(enCatalogs.accessibility.statsCardHint);
  });
});
