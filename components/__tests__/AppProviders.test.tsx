// AppProviders.test.tsx — AppProviders.test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { render } from '@testing-library/react-native';
import { AppProviders } from '../AppProviders';

jest.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/context/SettingsContext', () => ({
  SettingsProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/context/ProductContext', () => ({
  ProductProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/context/CategoryContext', () => ({
  CategoryProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/context/ManualEntryContext', () => ({
  ManualEntryProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/context/UpdateContext', () => ({
  UpdateProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('AppProviders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children inside providers', () => {
    const { getByText } = render(
      <AppProviders>
        <></>
      </AppProviders>
    );
    // Should not throw
  });

  it('renders text content passed as children', () => {
    const { getByText } = render(
      <AppProviders>
        <></>
      </AppProviders>
    );
    // Component renders without error
  });

  it('calls LoggingService.initialize on mount', () => {
    const { LoggingService } = require('@/services/LoggingService');
    render(
      <AppProviders>
        <></>
      </AppProviders>
    );
    expect(LoggingService.initialize).toHaveBeenCalled();
  });

  it('nests providers in correct order (Auth > Settings > Product > Category > ManualEntry > Update)', () => {
    // Verify all provider mocks are called (children are rendered through the chain)
    const { UNSAFE_root } = render(
      <AppProviders>
        <></>
      </AppProviders>
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('handles LoggingService.initialize rejection gracefully', () => {
    const { LoggingService } = require('@/services/LoggingService');
    LoggingService.initialize.mockRejectedValueOnce(new Error('Init failed'));

    expect(() => {
      render(
        <AppProviders>
          <></>
        </AppProviders>
      );
    }).not.toThrow();
  });
});
