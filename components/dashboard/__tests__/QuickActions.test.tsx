import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuickActions } from '../QuickActions';
import { router } from 'expo-router';
import { DASHBOARD_CONTENT } from '@/constants/content';
import { ThemeProvider } from '@/context/ThemeContext';

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
    });

    const renderComponent = () => render(
        <ThemeProvider>
            <QuickActions />
        </ThemeProvider>
    );

    it('renders correctly with correct texts', () => {
        const { getByText } = renderComponent();

        expect(getByText(DASHBOARD_CONTENT.BTN_ADD)).toBeTruthy();
        expect(getByText(DASHBOARD_CONTENT.BTN_SCAN)).toBeTruthy();
    });

    it('navigates to /add when Add button is pressed', () => {
        const { getByText } = renderComponent();

        fireEvent.press(getByText(DASHBOARD_CONTENT.BTN_ADD));
        expect(router.push).toHaveBeenCalledWith('/add');
    });

    it('navigates to /scanner when Scan button is pressed', () => {
        const { getByText } = renderComponent();

        fireEvent.press(getByText(DASHBOARD_CONTENT.BTN_SCAN));
        expect(router.push).toHaveBeenCalledWith('/scanner');
    });
});
