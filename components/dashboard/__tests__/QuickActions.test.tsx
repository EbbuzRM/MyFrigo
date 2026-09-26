// QuickActions.test.tsx — QuickActions.test module.
//
// exports: none
// used_by: none
// rules:   none
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import i18next from 'i18next';
import { QuickActions } from '../QuickActions';
import { router } from 'expo-router';
import { initI18n } from '@/i18n';
import { itCatalogs } from '@/i18n/catalogs/it';
import { enCatalogs } from '@/i18n/catalogs/en';
import { ThemeProvider } from '@/context/ThemeContext';

jest.mock('expo-localization', () => ({
    getLocales: jest.fn(() => [{ languageTag: 'it-IT' }]),
}));

jest.mock('lucide-react-native', () => ({
    Plus: 'Plus',
    ScanBarcode: 'ScanBarcode'
}));

const mockTheme = {
    isDarkMode: false,
    toggleTheme: jest.fn(),
};

jest.mock('@/context/ThemeContext', () => ({
    useTheme: () => mockTheme,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock expo-router
jest.mock('expo-router', () => ({
    router: {
        push: jest.fn(),
    },
}));

describe('QuickActions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        initI18n();
    });

    afterEach(async () => {
        await i18next.changeLanguage('it');
    });

    const renderComponent = () => render(
        <ThemeProvider>
            <QuickActions />
        </ThemeProvider>
    );

    it('renders correctly with correct texts', () => {
        const { getByText } = renderComponent();

        expect(getByText(itCatalogs.dashboard.addProduct)).toBeTruthy();
        expect(getByText(itCatalogs.dashboard.scanProduct)).toBeTruthy();
    });

    it('renders texts from the i18n catalogs and updates them on language change', async () => {
        const screen = renderComponent();

        expect(screen.getByText(itCatalogs.dashboard.addProduct)).toBeTruthy();

        await act(async () => {
            await i18next.changeLanguage('en');
        });

        await waitFor(() => {
            expect(screen.getByText(enCatalogs.dashboard.addProduct)).toBeTruthy();
        });
        expect(screen.queryByText(itCatalogs.dashboard.addProduct)).toBeNull();
    });

    it('navigates to /add when Add button is pressed', () => {
        const { getByText } = renderComponent();

        fireEvent.press(getByText(itCatalogs.dashboard.addProduct));
        expect(router.push).toHaveBeenCalledWith('/add');
    });

    it('navigates to /scanner when Scan button is pressed', () => {
        const { getByText } = renderComponent();

        fireEvent.press(getByText(itCatalogs.dashboard.scanProduct));
        expect(router.push).toHaveBeenCalledWith('/scanner');
    });
});
