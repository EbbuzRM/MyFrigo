import { renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useAppLifecycle } from '../useAppLifecycle';
import { LoggingService } from '@/services/LoggingService';

// Mock Dependencies
jest.mock('react-native', () => ({
    AppState: {
        addEventListener: jest.fn()
    }
}));

jest.mock('@/services/LoggingService', () => ({
    LoggingService: {
        info: jest.fn()
    }
}));

describe('useAppLifecycle', () => {
    it('should register AppState listener on mount and remove it on unmount', () => {
        const mockRemove = jest.fn();
        const mockAddEventListener = AppState.addEventListener as jest.Mock;
        mockAddEventListener.mockReturnValue({ remove: mockRemove });

        const onForeground = jest.fn();

        const { unmount } = renderHook(() => useAppLifecycle(onForeground));

        expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));

        unmount();

        expect(mockRemove).toHaveBeenCalled();
    });

    it('should call onForeground callback when AppState changes to active', () => {
        const mockAddEventListener = AppState.addEventListener as jest.Mock;
        let registeredCallback: (state: string) => void = () => { };

        // Capture the callback passed to addEventListener
        mockAddEventListener.mockImplementation((event, callback) => {
            if (event === 'change') {
                registeredCallback = callback;
            }
            return { remove: jest.fn() };
        });

        const onForeground = jest.fn();
        renderHook(() => useAppLifecycle(onForeground));

        // Simulate returning to active
        registeredCallback('active');

        expect(onForeground).toHaveBeenCalledTimes(1);
        expect(LoggingService.info).toHaveBeenCalledWith('AppLifecycle', expect.any(String));
    });

    it('should not call onForeground callback when AppState changes to background', () => {
        const mockAddEventListener = AppState.addEventListener as jest.Mock;
        let registeredCallback: (state: string) => void = () => { };

        mockAddEventListener.mockImplementation((event, callback) => {
            if (event === 'change') {
                registeredCallback = callback;
            }
            return { remove: jest.fn() };
        });

        const onForeground = jest.fn();
        renderHook(() => useAppLifecycle(onForeground));

        // Simulate going to background
        registeredCallback('background');

        expect(onForeground).not.toHaveBeenCalled();
    });
});
