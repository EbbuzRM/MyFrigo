// ProfileMenu.test.tsx — ProfileMenu.test module.
//
// exports: none
// used_by: none
// rules:   none
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProfileMenu } from '../ProfileMenu';
import { router } from 'expo-router';
import { initI18n } from '@/i18n';
import { itCatalogs } from '@/i18n/catalogs/it';
import { ThemeProvider } from '@/context/ThemeContext';

jest.mock('expo-localization', () => ({
    getLocales: jest.fn(() => [{ languageTag: 'it-IT' }]),
}));

jest.mock('lucide-react-native', () => ({
    Settings: 'Settings',
    LogOut: 'LogOut'
}));

const mockTheme = {
    isDarkMode: false,
    toggleTheme: jest.fn(),
};

jest.mock('@/context/ThemeContext', () => ({
    useTheme: () => mockTheme,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-router', () => ({
    router: { push: jest.fn() }
}));

describe('ProfileMenu', () => {
    const defaultProps = {
        isVisible: true,
        onClose: jest.fn(),
        onLogout: jest.fn(),
        userName: 'John Doe',
    };

    const renderComponent = (props = {}) => render(
        <ThemeProvider>
            <ProfileMenu {...defaultProps} {...props} />
        </ThemeProvider>
    );

    beforeEach(() => {
        jest.clearAllMocks();
        initI18n();
    });

    it('does not render when isVisible is false', () => {
        const { getByTestId } = renderComponent({ isVisible: false });
        expect(getByTestId('profile-modal').props.visible).toBe(false);
    });

    it('renders correctly when visible', () => {
        const { getByText } = renderComponent();
        expect(getByText('John Doe')).toBeTruthy();
        expect(getByText(itCatalogs.dashboard.menuSettings)).toBeTruthy();
        expect(getByText(itCatalogs.dashboard.menuLogout)).toBeTruthy();
    });

    it('navigates to settings and closes menu on settings press', () => {
        const { getByText } = renderComponent();
        fireEvent.press(getByText(itCatalogs.dashboard.menuSettings));

        expect(router.push).toHaveBeenCalledWith('/(tabs)/settings');
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onLogout when logout is pressed', () => {
        const { getByTestId } = renderComponent();
        fireEvent.press(getByTestId('logout-button'));

        expect(defaultProps.onLogout).toHaveBeenCalled();
    });
});
