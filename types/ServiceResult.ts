/**
 * Standardized service result type for consistent API responses.
 * Use this type for all service methods that interact with external data sources.
 *
 * @template T The type of data returned on success
 *
 * @example
 * ```typescript
 * const result: ServiceResult<Product[]> = await ProductStorage.getProducts();
 * if (result.success) {
 *   console.log(result.data); // Product[]
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export interface ServiceResult<T> {
  /** The data returned on success, null on failure */
  data: T | null;
  /** The error if operation failed, null on success */
  error: Error | null;
  /** Whether the operation was successful */
  success: boolean;
}

/**
 * Helper function to create a successful ServiceResult.
 *
 * @template T The type of data
 * @param data The data to return
 * @returns A successful ServiceResult
 */
export function createSuccessResult<T>(data: T): ServiceResult<T> {
  return {
    data,
    error: null,
    success: true,
  };
}

/**
 * Helper function to create a failed ServiceResult.
 *
 * @template T The type of data (used for type inference)
 * @param error The error that occurred
 * @returns A failed ServiceResult
 */
export function createErrorResult<T>(error: Error): ServiceResult<T> {
  return {
    data: null,
    error,
    success: false,
  };
}
