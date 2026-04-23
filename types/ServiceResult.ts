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
export type ServiceResult<T> = 
  | { success: true; data: T } 
  | { success: false; error: string };

/**
 * Helper function to create a successful ServiceResult.
 */
export function createSuccessResult<T>(data: T): ServiceResult<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Helper function to create a failed ServiceResult.
 */
export function createErrorResult<T>(error: Error | string): ServiceResult<T> {
  return {
    success: false,
    error: error instanceof Error ? error.message : error,
  };
}
