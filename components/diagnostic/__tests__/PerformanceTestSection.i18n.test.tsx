import React from 'react';
import { render, act } from '@testing-library/react-native';
import i18next from 'i18next';
import { PerformanceTestSection } from '../PerformanceTestSection';
import type { DiagnosticTest, TestResult } from '@/hooks/useDiagnosticTests';

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

const tests: DiagnosticTest[] = [
  { id: 'api-performance', name: 'API', category: 'performance', run: jest.fn() },
  { id: 'system-health', name: 'System', category: 'system', run: jest.fn() },
];
const results: TestResult[] = [
  { testId: 'api-performance', success: true, duration: 120, data: { successCount: 2, tests: [{}, {}, {}] } },
  { testId: 'system-health', success: true, duration: 100, data: { overallHealth: 'OTTIMA' } },
];

it('translates diagnostic summaries without changing status codes', async () => {
  await i18next.changeLanguage('it');
  const screen = render(
    <PerformanceTestSection tests={tests} results={results} isRunning={false} onRunTest={jest.fn()} />
  );
  expect(screen.getByText('2/3 successi')).toBeTruthy();
  expect(screen.getByText('OTTIMA')).toBeTruthy();

  await act(async () => { await i18next.changeLanguage('en'); });
  expect(screen.getByText('2/3 passed')).toBeTruthy();
  expect(screen.getByText('EXCELLENT')).toBeTruthy();
  expect(results[1].data?.overallHealth).toBe('OTTIMA');
  await i18next.changeLanguage('it');
});
