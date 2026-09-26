import { getUnitLabel } from '../units';

describe('unit labels', () => {
  it('keeps stored unit IDs separate from display labels', () => {
    expect(getUnitLabel('pz', 'it')).toBe('pz');
    expect(getUnitLabel('pz', 'en')).toBe('pcs');
    expect(getUnitLabel('conf', 'en', true)).toBe('pack (package)');
    expect(getUnitLabel('kg', 'en')).toBe('kg');
  });

  it('preserves unknown or custom units', () => {
    expect(getUnitLabel('custom unit', 'en')).toBe('custom unit');
  });
});
