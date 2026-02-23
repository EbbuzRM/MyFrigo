import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DashboardHeader } from '../DashboardHeader';
import { DASHBOARD_CONTENT } from '@/constants/content';
import { ThemeProvider } from '@/context/ThemeContext';

jest.mock('lucide-react-native', () => ({
    Bell: 'Bell',
    BellOff: 'BellOff',
    User: 'User'
}));

const mockTheme = {
    isDarkMode: false,
    toggleTheme: jest.fn(),
};

jest.mock('@/context/ThemeContext', () => ({
    useTheme: () => mockTheme,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('DashboardHeader', () => {
    const defaultProps = {
        permissionStatus: 'granted',
        onBellPress: jest.fn(),
        onProfilePress: jest.fn(),
    };

    const renderComponent = (props = {}) => render(
        <ThemeProvider>
            <DashboardHeader {...defaultProps} {...props} />
        </ThemeProvider>
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the title correctly', () => {
        const { getByText } = renderComponent();
        expect(getByText(DASHBOARD_CONTENT.TITLE)).toBeTruthy();
    });

    it('displays user initials when provided', () => {
        const { getByText } = renderComponent({ displayInitials: 'AB' });
        expect(getByText('AB')).toBeTruthy();
    });

    it('calls onProfilePress when profile button is tapped', () => {
        const { getByTestId } = renderComponent();
        fireEvent.press(getByTestId('profile-button'));
        expect(defaultProps.onProfilePress).toHaveBeenCalled();
    });

    it('calls onBellPress when title container is tapped and permission is denied', () => {
        const { getByText } = renderComponent({ permissionStatus: 'denied' });
        fireEvent.press(getByText(DASHBOARD_CONTENT.TITLE));
        expect(defaultProps.onBellPress).toHaveBeenCalled();
    });

    it('disables bell press when permission is granted', () => {
        const { getByTestId } = renderComponent({ permissionStatus: 'granted' });
        expect(getByTestId('bell-button').props.accessibilityState?.disabled || getByTestId('bell-button').props.disabled).toBe(true);
    });
});
