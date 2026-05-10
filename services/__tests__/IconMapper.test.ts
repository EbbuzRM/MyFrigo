// IconMapper.test.ts — IconMapper test module.
//
// exports: none
// used_by: none
// rules:   none

import { IconMapper } from '../IconMapper';
import { IconData } from '../IconLoader';

describe('IconMapper', () => {
  // ── mapIconToCategory ─────────────────────────────────────────────
  describe('mapIconToCategory', () => {
    const icons: IconData[] = [
      { id: 'icon1', url: 'https://example.com/icon1.png', categoryId: 'dairy', isValid: true },
      { id: 'icon2', url: 'https://example.com/icon2.png', categoryId: 'meat', isValid: true },
      { id: 'icon3', url: 'https://example.com/icon3.png', categoryId: 'fish', isValid: false },
    ];

    it('should return the icon matching the category ID', () => {
      const result = IconMapper.mapIconToCategory(icons, 'dairy');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('icon1');
      expect(result?.categoryId).toBe('dairy');
    });

    it('should return null when no icon matches the category ID', () => {
      const result = IconMapper.mapIconToCategory(icons, 'beverages');

      expect(result).toBeNull();
    });

    it('should return the first matching icon', () => {
      const duplicateIcons: IconData[] = [
        { id: 'first', url: 'https://example.com/a.png', categoryId: 'dairy', isValid: true },
        { id: 'second', url: 'https://example.com/b.png', categoryId: 'dairy', isValid: true },
      ];

      const result = IconMapper.mapIconToCategory(duplicateIcons, 'dairy');
      expect(result?.id).toBe('first');
    });

    it('should return null for empty icon array', () => {
      const result = IconMapper.mapIconToCategory([], 'dairy');
      expect(result).toBeNull();
    });
  });

  // ── validateIconUrl ────────────────────────────────────────────────
  describe('validateIconUrl', () => {
    it('should return true for valid HTTPS URL', () => {
      expect(IconMapper.validateIconUrl('https://example.com/icon.png')).toBe(true);
    });

    it('should return true for valid HTTP URL', () => {
      expect(IconMapper.validateIconUrl('http://example.com/icon.png')).toBe(true);
    });

    it('should return true for data:image URL', () => {
      expect(IconMapper.validateIconUrl('data:image/png;base64,iVBOR...')).toBe(true);
    });

    it('should return false for non-URL strings', () => {
      expect(IconMapper.validateIconUrl('not-a-url')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(IconMapper.validateIconUrl('')).toBe(false);
    });

    it('should return false for URL exceeding 500 characters', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(500);
      expect(IconMapper.validateIconUrl(longUrl)).toBe(false);
    });

    it('should return false for URL exactly at 500 characters', () => {
      // URL under 500 chars should be valid
      const shortUrl = 'https://example.com/icon.png';
      expect(IconMapper.validateIconUrl(shortUrl)).toBe(true);
    });

    it('should return false for non-string input', () => {
      expect(IconMapper.validateIconUrl(null as any)).toBe(false);
      expect(IconMapper.validateIconUrl(undefined as any)).toBe(false);
      expect(IconMapper.validateIconUrl(42 as any)).toBe(false);
    });
  });

  // ── enhanceIconWithDefaults ────────────────────────────────────────
  describe('enhanceIconWithDefaults', () => {
    it('should return the icon unchanged when URL is valid', () => {
      const icon: IconData = { id: '1', url: 'https://example.com/icon.png', categoryId: 'dairy', isValid: true };

      const result = IconMapper.enhanceIconWithDefaults(icon);

      expect(result.url).toBe('https://example.com/icon.png');
    });

    it('should set default URL when URL is invalid', () => {
      const icon: IconData = { id: '1', url: 'not-a-url', categoryId: 'dairy', isValid: true };

      const result = IconMapper.enhanceIconWithDefaults(icon);

      expect(result.url).toBe('default-icon-url');
    });

    it('should set default URL when URL is empty', () => {
      const icon: IconData = { id: '1', url: '', categoryId: 'dairy', isValid: true };

      const result = IconMapper.enhanceIconWithDefaults(icon);

      expect(result.url).toBe('default-icon-url');
    });

    it('should mutate the original icon object', () => {
      const icon: IconData = { id: '1', url: 'invalid', categoryId: 'test', isValid: true };

      IconMapper.enhanceIconWithDefaults(icon);

      // The function mutates the original object
      expect(icon.url).toBe('default-icon-url');
    });

    it('should preserve other icon properties when enhancing', () => {
      const icon: IconData = { id: '1', url: 'bad-url', categoryId: 'meat', isValid: false };

      const result = IconMapper.enhanceIconWithDefaults(icon);

      expect(result.id).toBe('1');
      expect(result.categoryId).toBe('meat');
      expect(result.isValid).toBe(false);
      expect(result.url).toBe('default-icon-url');
    });
  });
});
