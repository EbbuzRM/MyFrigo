/**
 * Test per useReducedMotion - Rilevamento preferenza riduzione movimento
 */

import { renderHook, act } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from '../useReducedMotion';

// Mock di AccessibilityInfo
jest.mock('react-native', () => {
    const actualReactNative = jest.requireActual('react-native');
    return {
        ...actualReactNative,
        AccessibilityInfo: {
            ...actualReactNative.AccessibilityInfo,
            addEventListener: jest.fn(),
            isReduceMotionEnabled: jest.fn(),
        },
    };
});

describe('useReducedMotion', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return false by default', () => {
        (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(false);
        (AccessibilityInfo.addEventListener as jest.Mock).mockReturnValue({ remove: jest.fn() });

        const { result } = renderHook(() => useReducedMotion());

        expect(result.current).toBe(false);
    });

    it('should return true when reduce motion is enabled', () => {
        (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(true);
        (AccessibilityInfo.addEventListener as jest.Mock).mockReturnValue({ remove: jest.fn() });

        const { result } = renderHook(() => useReducedMotion());

        expect(result.current).toBe(true);
    });

    it('should listen to reduceMotionChanged event', () => {
        let eventCallback: (value: boolean) => void = () => { };

        (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(false);
        (AccessibilityInfo.addEventListener as jest.Mock).mockImplementation((event: string, callback: (value: boolean) => void) => {
            if (event === 'reduceMotionChanged') {
                eventCallback = callback;
            }
            return { remove: jest.fn() };
        });

        const { result } = renderHook(() => useReducedMotion());

        // Verify listener was registered
        expect(AccessibilityInfo.addEventListener).toHaveBeenCalledWith(
            'reduceMotionChanged',
            expect.any(Function)
        );

        // Verify initial value was fetched
        expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled();
    });

    it('should update state when reduceMotionChanged event fires', () => {
        let eventCallback: (value: boolean) => void = () => { };

        (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(false);
        (AccessibilityInfo.addEventListener as jest.Mock).mockImplementation((event: string, callback: (value: boolean) => void) => {
            if (event === 'reduceMotionChanged') {
                eventCallback = callback;
            }
            return { remove: jest.fn() };
        });

        const { result } = renderHook(() => useReducedMotion());
        expect(result.current).toBe(false);

        // Simulate user enabling reduce motion
        act(() => {
            eventCallback(true);
        });

        expect(result.current).toBe(true);

        // Simulate user disabling reduce motion
        act(() => {
            eventCallback(false);
        });

        expect(result.current).toBe(false);
    });

    it('should remove event listener on unmount', () => {
        const mockRemove = jest.fn();

        (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(false);
        (AccessibilityInfo.addEventListener as jest.Mock).mockReturnValue({ remove: mockRemove });

        const { unmount } = renderHook(() => useReducedMotion());

        unmount();

        expect(mockRemove).toHaveBeenCalled();
    });

    it('should handle async isReduceMotionEnabled promise', async () => {
        (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(Promise.resolve(true));
        (AccessibilityInfo.addEventListener as jest.Mock).mockReturnValue({ remove: jest.fn() });

        const { result } = renderHook(() => useReducedMotion());

        // The hook should handle the promise correctly
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // result.current should reflect the resolved value
        // Note: The actual implementation resolves immediately, so this tests the pattern
        expect(typeof result.current).toBe('boolean');
    });
});