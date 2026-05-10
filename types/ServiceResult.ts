// ServiceResult.ts — ServiceResult module.
//
// exports: ServiceResult | createSuccessResult | createErrorResult
// used_by: hooks\__tests__\useProductDetail.test.ts
//         services\ProductStorage.ts
// rules:   The `ServiceResult<T>` discriminated union type must remain the single return type for all service methods, and the `createSuccessResult`/`createErrorResult` factory functions should always be used to construct results instead of manually building the union objects.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

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
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string };

/**
 * Helper function to create a successful ServiceResult.
 */
export function createSuccessResult<T>(data: T): ServiceResult<T> {
  return {
    success: true,
    data,
    error: null,
  };
}

/**
 * Helper function to create a failed ServiceResult.
 */
export function createErrorResult<T>(error: Error | string): ServiceResult<T> {
  return {
    success: false,
    data: null,
    error: error instanceof Error ? error.message : error,
  };
}
