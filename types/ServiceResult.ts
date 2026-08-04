// ServiceResult.ts — ServiceResult module.
//
// exports: ServiceResult | createSuccessResult | createErrorResult
// used_by: hooks\__tests__\useProductDetail.test.ts
//                   hooks\__tests__\useProductSave.test.ts
//                   services\ProductStorage.ts
// rules:   The `ServiceResult<T>` discriminated union type must remain the single return type for all service methods, and the `createSuccessResult`/`createErrorResult` factory functions should always be used to construct results instead of manually building the union objects.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

/**
 * Discriminated union that standardizes the return type of all service-layer
 * methods. Instead of throwing exceptions or returning `T | null`, every
 * service method returns a `ServiceResult<T>` so that callers can
 * exhaustively handle both success and failure paths in a type-safe manner.
 *
 * ## Pattern: Discriminated Union
 *
 * The `success` boolean acts as the discriminant. TypeScript narrows `data`
 * to `T` when `success` is `true` and to `null` when `success` is `false`,
 * eliminating the need for runtime null-checks on the data payload.
 *
 * ## When to use it
 *
 * Use `ServiceResult<T>` for **every** service method that performs an
 * operation with a typed payload — typically CRUD operations against
 * Supabase, REST APIs, or local storage:
 *
 * - `ProductStorage.getProducts()` → `ServiceResult<Product[]>`
 * - `ProductStorage.createProduct(...)` → `ServiceResult<Product>`
 * - `SettingsService.updateSettings(...)` → `ServiceResult<AppSettings>`
 *
 * Do **not** use it for:
 * - Pure utility functions that cannot fail (return `T` directly).
 * - Functions that only perform side-effects with no return value
 *   (use `void` or `Promise<void>`).
 *
 * ## How to construct
 *
 * Always use the factory functions `createSuccessResult` and
 * `createErrorResult` — never build the union object manually. This keeps
 * the shape consistent and allows future fields to be added in one place.
 *
 * ## Relationship with errorHandler.ts
 *
 * `ServiceResult<T>` and `errorHandler.ts` are **complementary**, not
 * alternative, error-handling mechanisms:
 *
 * - `errorHandler.ts` (Facade + Strategy pattern) converts raw `unknown`
 *   errors into a structured `AppError`.
 * - `ServiceResult<T>` wraps the outcome of a service call, carrying either
 *   the typed data or a string error message.
 *
 * Typical flow inside a service method:
 * ```typescript
 * try {
 *   const { data, error } = await supabase.from('products').select();
 *   if (error) {
 *     // errorHandler normalizes the raw error → AppError
 *     const appError = handleError(error);
 *     // ServiceResult carries the normalized message to the caller
 *     return createErrorResult<Product[]>(appError.message);
 *   }
 *   return createSuccessResult(data);
 * } catch (e) {
 *   return createErrorResult<Product[]>(handleError(e).message);
 * }
 * ```
 *
 * @template T The type of data returned on success
 *
 * @example
 * ```typescript
 * // Inside a service method
 * async function getProducts(): Promise<ServiceResult<Product[]>> {
 *   try {
 *     const { data, error } = await supabase.from('products').select('*');
 *     if (error) {
 *       const appError = handleError(error);
 *       return createErrorResult<Product[]>(appError.message);
 *     }
 *     return createSuccessResult(data);
 *   } catch (e) {
 *     return createErrorResult<Product[]>(handleError(e).message);
 *   }
 * }
 *
 * // Caller — exhaustive type narrowing
 * const result = await getProducts();
 * if (result.success) {
 *   console.log(result.data); // Product[] — no null check needed
 * } else {
 *   console.error(result.error); // string
 * }
 * ```
 */
export type ServiceResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string };

/**
 * Factory function that constructs a successful `ServiceResult<T>`.
 *
 * Always use this helper instead of building the union object manually so
 * that the shape remains consistent across the codebase and future fields
 * can be added in a single location.
 *
 * @template T The type of data carried by the result
 * @param data The typed payload to return on success
 * @returns A `ServiceResult<T>` with `success: true`
 *
 * @example
 * ```typescript
 * return createSuccessResult<Product>(savedProduct);
 * ```
 */
export function createSuccessResult<T>(data: T): ServiceResult<T> {
  return {
    success: true,
    data,
    error: null,
  };
}

/**
 * Factory function that constructs a failed `ServiceResult<T>`.
 *
 * Always use this helper instead of building the union object manually so
 * that the shape remains consistent across the codebase and future fields
 * can be added in a single location.
 *
 * Accepts either an `Error` instance (its `.message` is extracted) or a
 * plain string, making it convenient to wrap both structured errors from
 * `errorHandler.handleError()` and ad-hoc error messages.
 *
 * @template T The type of data that *would* have been returned on success
 * @param error An `Error` instance or a plain string describing the failure
 * @returns A `ServiceResult<T>` with `success: false`
 *
 * @example
 * ```typescript
 * // From a normalized AppError
 * const appError = handleError(rawError);
 * return createErrorResult<Product>(appError.message);
 *
 * // From an ad-hoc message
 * return createErrorResult<Product>('Product not found');
 * ```
 */
export function createErrorResult<T>(error: Error | string): ServiceResult<T> {
  return {
    success: false,
    data: null,
    error: error instanceof Error ? error.message : error,
  };
}
