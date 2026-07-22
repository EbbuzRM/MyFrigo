// imageStorage.ts — imageStorage module.
//
// exports: SaveImageOptions | saveImagePermanently | deleteProductImage
// used_by: hooks\__tests__\useCamera.test.ts
//                   hooks\useCamera.ts
// rules:   - Non creare cartelle in tmp, URI persistente solo in documentDirectory; le immagini prodotto devono sopravvivere a reinstallazione, OOM e Offload App iOS.
//          - Eliminare un'immagine prodotto solo se il file è dentro a documentDirectory/products/ (controllo di sicurezza obbligatorio).
//          - Ignorare silenziosamente gli errori di cancellazione per non bloccare il flusso utente: meglio un'immagine orfana su disco che un crash.
// agent:   deepseek/deepseek-chat | deepseek | 2026-06-02 | gsd-executor | implement persistent image storage helper
// message: 

import { Paths, Directory, File } from 'expo-file-system';
import { LoggingService } from '@/services/LoggingService';

const TAG = 'imageStorage';
const PRODUCTS_DIR_NAME = 'products';
const FILE_EXTENSION = '.jpg';

/**
 * Returns the products directory located inside the document directory.
 * Lazily created on first use; the directory is not guaranteed to exist
 * on the file system after construction.
 */
function getProductsDirectory(): Directory {
  return new Directory(Paths.document, PRODUCTS_DIR_NAME);
}

/**
 * Ensures the products directory exists, creating it (with intermediates)
 * if it is missing. Idempotent: safe to call multiple times.
 */
function ensureProductsDirectory(): Directory {
  const productsDir = getProductsDirectory();
  if (!productsDir.exists) {
    productsDir.create({ intermediates: true, idempotent: true });
  }
  return productsDir;
}

/**
 * Generates a unique file name for a persistent product image.
 * Format: `product_<timestamp>_<random>.<ext>`.
 */
function generateUniqueFileName(extension: string = FILE_EXTENSION): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  return `product_${timestamp}_${random}${extension}`;
}

/**
 * Options for `saveImagePermanently`.
 */
export interface SaveImageOptions {
  /** Optional custom file name (without extension). If not provided, a unique one is generated. */
  fileName?: string;
}

/**
 * Copies an image from `sourceUri` into the products directory inside
 * the document directory, so the image is safe from being deleted by
 * the OS (tmp/cleanup, Offload App, OOM, etc.).
 *
 * @param sourceUri The source URI (typically `file:///tmp/...` from camera
 *                  or `file://...` from `ImageManipulator`).
 * @param options   Optional configuration such as a custom file name.
 * @returns The persistent `file://` URI of the saved image.
 * @throws  If the directory cannot be created or the file cannot be copied.
 */
export async function saveImagePermanently(
  sourceUri: string,
  options?: SaveImageOptions
): Promise<string> {
  const productsDir = ensureProductsDirectory();

  const fileName = options?.fileName
    ? `${options.fileName}${FILE_EXTENSION}`
    : generateUniqueFileName();

  const destinationFile = new File(productsDir, fileName);
  const sourceFile = new File(sourceUri);

  sourceFile.copy(destinationFile);

  LoggingService.info(TAG, `Image saved permanently: ${destinationFile.uri}`);
  return destinationFile.uri;
}

/**
 * Normalizes a URI by stripping a trailing slash, if present.
 */
function stripTrailingSlash(uri: string): string {
  return uri.endsWith('/') ? uri.slice(0, -1) : uri;
}

/**
 * Deletes a product image from disk. Only deletes the file when it is
 * located inside the products directory inside the document directory
 * (safety check to prevent accidental deletion of unrelated files).
 * All errors are logged and swallowed: a failed cleanup is preferred
 * over a crash that would block the user's flow.
 *
 * @param uri The URI of the image to delete.
 */
export async function deleteProductImage(uri: string): Promise<void> {
  try {
    if (!uri) {
      return;
    }

    const productsDir = getProductsDirectory();

    // If the products directory itself doesn't exist, there's nothing to delete.
    if (!productsDir.exists) {
      return;
    }

    const file = new File(uri);

    // Safety check: only delete files inside the products directory.
    // We compare normalized URIs to avoid false negatives due to trailing slashes.
    const productsDirUri = stripTrailingSlash(productsDir.uri);
    const fileUri = stripTrailingSlash(file.uri);

    if (!fileUri.startsWith(`${productsDirUri}/`)) {
      LoggingService.warning(
        TAG,
        `Refusing to delete file outside products directory: ${uri}`
      );
      return;
    }

    if (file.exists) {
      file.delete();
      LoggingService.info(TAG, `Product image deleted: ${uri}`);
    } else {
      LoggingService.debug(TAG, `Product image did not exist, nothing to delete: ${uri}`);
    }
  } catch (error) {
    // Silently ignore errors - better an orphan image on disk than a crash.
    LoggingService.warning(TAG, `Error deleting product image: ${uri}`, error);
  }
}
