// imageStorage.test.ts — tests for imageStorage module.
//
// exports: none
// used_by: none
// rules:   none

import { saveImagePermanently, deleteProductImage } from '../imageStorage';
import { LoggingService } from '../../services/LoggingService';

// ── Mocks ────────────────────────────────────────────────────────────

// Mock expo-file-system with controllable in-memory state.
// We track calls and behavior so tests can assert copy/delete semantics
// without touching the real filesystem.
jest.mock('expo-file-system', () => {
  // Map of URI -> "file on disk" marker.
  const fileSystem = new Set<string>();
  // List of created directories.
  const directories = new Set<string>();
  // Track calls to `copy` for verification.
  const copyCalls: Array<{ from: string; to: string }> = [];
  // Track calls to `delete` for verification.
  const deleteCalls: string[] = [];

  /**
   * Joins URI parts into a single, normalized URI string.
   * Mirrors the behavior of expo-file-system v19 constructors:
   * - A single string argument is preserved as-is (e.g. 'file:///tmp/x.jpg').
   * - A File/Directory instance contributes its own `uri`.
   * - Multiple plain strings are joined with '/' (no escaping for `://`).
   */
  function joinUris(
    uris: Array<string | FakeFile | FakeDirectory>,
    kind: 'file' | 'directory'
  ): string {
    const parts: string[] = [];
    for (const u of uris) {
      if (typeof u === 'string') {
        parts.push(u);
      } else {
        parts.push(u.uri);
      }
    }
    if (parts.length === 1) {
      return parts[0];
    }
    // For multi-arg construction, strip trailing slashes from each part
    // except the last, and join with a single slash.
    const cleaned = parts.map((p, i) => {
      if (i === parts.length - 1) return p.replace(/\/+$/, '');
      return p.replace(/\/+$/, '');
    });
    const joined = cleaned.join('/');
    // Restore the kind marker only when the first part is a plain path
    // (no `://` already present, e.g. for `Paths.document` instances).
    if (kind === 'file' && !joined.startsWith('file:') && !joined.startsWith('content:')) {
      return `file://${joined.startsWith('/') ? '' : '/'}${joined}`;
    }
    return joined;
  }

  class FakeFile {
    public readonly uri: string;
    public exists: boolean;

    constructor(...uris: Array<string | FakeFile | FakeDirectory>) {
      this.uri = joinUris(uris, 'file');
      this.exists = fileSystem.has(this.uri);
    }

    copy(destination: FakeFile | FakeDirectory): void {
      const destUri = destination instanceof FakeFile ? destination.uri : destination.uri;
      copyCalls.push({ from: this.uri, to: destUri });
      fileSystem.add(destUri);
    }

    delete(): void {
      deleteCalls.push(this.uri);
      fileSystem.delete(this.uri);
    }
  }

  class FakeDirectory {
    public readonly uri: string;
    public exists: boolean;

    constructor(...uris: Array<string | FakeFile | FakeDirectory>) {
      this.uri = joinUris(uris, 'directory');
      this.exists = directories.has(this.uri);
    }

    create(options?: { intermediates?: boolean; idempotent?: boolean }): void {
      directories.add(this.uri);
      // Recursively create parent directories if intermediates is true.
      if (options?.intermediates) {
        // Strip a leading "file://" so the split works on path components.
        const pathPart = this.uri.replace(/^file:\/\//, '');
        const parts = pathPart.split('/').filter(Boolean);
        let acc = '';
        for (const part of parts) {
          acc += '/' + part;
          directories.add(acc);
        }
      }
    }
  }

  // The "document" directory used by Paths.document is a Directory instance.
  // Its URI must be a proper file:// URI to match how the real
  // expo-file-system v19 behaves on iOS/Android.
  const documentDir = new FakeDirectory('file:///mock/documents');
  directories.add(documentDir.uri);

  return {
    Paths: {
      document: documentDir,
    },
    Directory: jest.fn().mockImplementation((...uris: Array<string | FakeFile | FakeDirectory>) => {
      return new FakeDirectory(...uris);
    }),
    File: jest.fn().mockImplementation((...uris: Array<string | FakeFile | FakeDirectory>) => {
      return new FakeFile(...uris);
    }),
    // Test helpers exposed for assertions.
    __testHelpers: {
      fileSystem,
      directories,
      copyCalls,
      deleteCalls,
      FakeFile,
      FakeDirectory,
    },
  };
});

// Mock LoggingService
jest.mock('../../services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    debug: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  },
}));

// Pull the test helpers for assertion purposes.
import * as FileSystemModule from 'expo-file-system';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const helpers = (FileSystemModule as any).__testHelpers;
const { fileSystem, directories, copyCalls, deleteCalls } = helpers;

// ── Tests ────────────────────────────────────────────────────────────

describe('imageStorage', () => {
  beforeEach(() => {
    // Reset in-memory state between tests.
    fileSystem.clear();
    directories.clear();
    copyCalls.length = 0;
    deleteCalls.length = 0;
    // Re-seed the document directory (Paths.document) and its products
    // subdirectory (the default save location).
    directories.add('file:///mock/documents');
    directories.add('file:///mock/documents/products');
    jest.clearAllMocks();
  });

  // ── saveImagePermanently ─────────────────────────────────────────

  describe('saveImagePermanently', () => {
    it('should copy the file from sourceUri to the products directory', async () => {
      // Seed the source file in the (mock) filesystem so the File instance exists.
      fileSystem.add('file:///tmp/photo-123.jpg');

      const result = await saveImagePermanently('file:///tmp/photo-123.jpg');

      // The destination must be inside the products directory.
      expect(result).toMatch(/^file:\/\/\/mock\/documents\/products\/product_.+\.jpg$/);
      // A copy call should have been issued from source to destination.
      expect(copyCalls).toHaveLength(1);
      expect(copyCalls[0].from).toBe('file:///tmp/photo-123.jpg');
      expect(copyCalls[0].to).toBe(result);
      // The destination file should now exist on the (mock) filesystem.
      expect(fileSystem.has(result)).toBe(true);
    });

    it('should create the products directory if it does not exist', async () => {
      // Ensure document exists but products does NOT.
      directories.add('file:///mock/documents');
      directories.delete('file:///mock/documents/products');

      await saveImagePermanently('file:///tmp/photo.jpg');

      expect(directories.has('file:///mock/documents/products')).toBe(true);
    });

    it('should not throw if the products directory already exists (idempotent)', async () => {
      // Pre-create the products directory.
      directories.add('file:///mock/documents');
      directories.add('file:///mock/documents/products');

      await expect(
        saveImagePermanently('file:///tmp/photo.jpg')
      ).resolves.toMatch(/^file:\/\/\/mock\/documents\/products\/product_.+\.jpg$/);
    });

    it('should generate a unique file name when no fileName is provided', async () => {
      const uri1 = await saveImagePermanently('file:///tmp/a.jpg');
      const uri2 = await saveImagePermanently('file:///tmp/b.jpg');

      expect(uri1).not.toBe(uri2);
      // Both URIs must follow the unique-name pattern.
      expect(uri1).toMatch(/^file:\/\/\/mock\/documents\/products\/product_\d+_[a-z0-9]+\.jpg$/);
      expect(uri2).toMatch(/^file:\/\/\/mock\/documents\/products\/product_\d+_[a-z0-9]+\.jpg$/);
    });

    it('should accept a custom fileName option', async () => {
      const result = await saveImagePermanently('file:///tmp/photo.jpg', {
        fileName: 'my-product-001',
      });

      expect(result).toBe('file:///mock/documents/products/my-product-001.jpg');
      expect(fileSystem.has(result)).toBe(true);
    });

    it('should append the .jpg extension to a custom fileName', async () => {
      const result = await saveImagePermanently('file:///tmp/photo.jpg', {
        fileName: 'no-extension',
      });

      // The function must always end with .jpg regardless of input.
      expect(result.endsWith('.jpg')).toBe(true);
    });

    it('should return a persistent URI pointing into the products directory', async () => {
      const result = await saveImagePermanently('file:///tmp/photo.jpg');

      // The result must be under the products directory.
      expect(result.startsWith('file:///mock/documents/products/')).toBe(true);
    });

    it('should log the saved URI via LoggingService', async () => {
      await saveImagePermanently('file:///tmp/photo.jpg');

      expect(LoggingService.info).toHaveBeenCalledWith(
        'imageStorage',
        expect.stringContaining('Image saved permanently:')
      );
    });
  });

  // ── deleteProductImage ───────────────────────────────────────────

  describe('deleteProductImage', () => {
    it('should remove a file that lives inside the products directory', async () => {
      // Seed a file inside the products directory.
      const target = 'file:///mock/documents/products/product_123_abc.jpg';
      fileSystem.add(target);
      directories.add('file:///mock/documents/products');

      await deleteProductImage(target);

      expect(fileSystem.has(target)).toBe(false);
      expect(deleteCalls).toContain(target);
    });

    it('should NOT remove a file that lives outside the products directory (safety)', async () => {
      // Seed a file OUTSIDE the products directory (e.g., a tmp file).
      const target = 'file:///tmp/sensitive.jpg';
      fileSystem.add(target);
      directories.add('file:///mock/documents/products');

      await deleteProductImage(target);

      // File should still be present.
      expect(fileSystem.has(target)).toBe(true);
      // Delete should never have been called for this URI.
      expect(deleteCalls).not.toContain(target);
    });

    it('should NOT remove a file in a sibling directory that shares a prefix with the products dir', async () => {
      // The file URI starts with the products dir path but is actually
      // a sibling directory (e.g., a "products_backup" path).
      const target = 'file:///mock/documents/products_backup/image.jpg';
      fileSystem.add(target);
      directories.add('file:///mock/documents/products');
      directories.add('file:///mock/documents/products_backup');

      await deleteProductImage(target);

      expect(fileSystem.has(target)).toBe(true);
    });

    it('should be a no-op when the products directory does not exist', async () => {
      directories.delete('file:///mock/documents/products');
      const target = 'file:///mock/documents/products/product.jpg';

      await expect(deleteProductImage(target)).resolves.toBeUndefined();
      expect(deleteCalls).toHaveLength(0);
    });

    it('should silently ignore errors thrown during delete (no crash)', async () => {
      // The function must never throw.
      const target = 'file:///mock/documents/products/does-not-exist.jpg';
      directories.add('file:///mock/documents/products');

      await expect(deleteProductImage(target)).resolves.toBeUndefined();
      // File did not exist, so nothing was deleted, and no crash.
    });

    it('should silently ignore empty/null URI', async () => {
      await expect(deleteProductImage('')).resolves.toBeUndefined();
      // No delete call.
      expect(deleteCalls).toHaveLength(0);
    });

    it('should log a warning when refusing to delete a file outside the products directory', async () => {
      const target = 'file:///tmp/outside.jpg';
      fileSystem.add(target);

      await deleteProductImage(target);

      expect(LoggingService.warning).toHaveBeenCalledWith(
        'imageStorage',
        expect.stringContaining('Refusing to delete file outside products directory')
      );
    });
  });
});
