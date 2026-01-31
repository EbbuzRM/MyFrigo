import { Product } from '@/types/Product';
import { ServiceResult, createSuccessResult, createErrorResult } from '@/types/ServiceResult';
import { supabase } from './supabaseClient';
import { TablesInsert, TablesUpdate } from '@/types/supabase';
import { convertProductToCamelCase, convertProductToSnakeCase, convertProductsToCamelCase } from '../utils/caseConverter';
import { randomUUID } from 'expo-crypto';
import { LoggingService } from './LoggingService';
import { TemplateService } from './TemplateService';

/**
 * Service for managing products in Supabase storage.
 * All methods return standardized ServiceResult<T> for consistent error handling.
 */
export class ProductStorage {
  private static readonly TIMEOUT_MS = 15000;

  /** Get current user ID or return error if not authenticated. */
  private static async getCurrentUserId(): Promise<ServiceResult<string>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user ? createSuccessResult(session.user.id) : createErrorResult(new Error('User not authenticated'));
    } catch (error) {
      return createErrorResult(error instanceof Error ? error : new Error('Failed to get session'));
    }
  }

  /** Validate that a string ID is not empty. */
  private static validateId(id: string, name: string): Error | null {
    return !id || id.trim().length === 0 ? new Error(`${name} is required`) : null;
  }

  /** Handle database errors with logging. */
  private static handleError(operation: string, error: unknown): Error {
    const err = error instanceof Error ? error : new Error('Unknown error');
    LoggingService.error('ProductStorage', operation, error);
    return err;
  }

  /** Fetch all products for current user, sorted by expiration date. */
  static async getProducts(): Promise<ServiceResult<Product[]>> {
    const userResult = await this.getCurrentUserId();
    if (!userResult.success) return createErrorResult<Product[]>(userResult.error!);
    try {
      const { data, error } = await supabase.from('products').select('*').eq('user_id', userResult.data!);
      if (error) throw error;
      const products = data ? convertProductsToCamelCase(data) : [];
      products.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
      return createSuccessResult(products);
    } catch (error) { return createErrorResult(this.handleError('Error in getProducts', error)); }
  }

  /** Get single product by ID. */
  static async getProductById(productId: string): Promise<ServiceResult<Product | null>> {
    const validationError = this.validateId(productId, 'Product ID');
    if (validationError) return createErrorResult(validationError);
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', productId).single();
      if (error) throw error;
      return createSuccessResult(data ? convertProductToCamelCase(data) : null);
    } catch (error) { return createErrorResult(this.handleError(`Error getting product by ID ${productId}`, error)); }
  }

  /** Subscribe to real-time product changes. */
  static listenToProducts(callback: () => void): () => void {
    const channel = supabase.channel('public:products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
      LoggingService.info('ProductStorage', 'Change detected in products table');
      callback();
    }).subscribe((status) => { if (status === 'SUBSCRIBED') LoggingService.info('ProductStorage', 'Realtime channel subscribed'); });
    return () => supabase.removeChannel(channel);
  }

  /** Save product to database (insert or update). */
  static async saveProduct(product: Partial<Product>): Promise<ServiceResult<void>> {
    const userResult = await this.getCurrentUserId();
    if (!userResult.success) return userResult as ServiceResult<void>;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout during product save')), this.TIMEOUT_MS));
      await Promise.race([this.performUpsert(product, userResult.data!), timeoutPromise]);
      return createSuccessResult(undefined);
    } catch (error) { return createErrorResult(this.handleError('Error saving product', error)); }
  }

  private static async performUpsert(product: Partial<Product>, userId: string): Promise<void> {
    const productToUpsert = this.prepareProductForUpsert(product);
    const snakeCaseProduct = convertProductToSnakeCase(productToUpsert);
    (snakeCaseProduct as Record<string, unknown>).user_id = userId;
    if (productToUpsert.isFrozen !== undefined) (snakeCaseProduct as Record<string, unknown>).is_frozen = productToUpsert.isFrozen;
    const { error } = await supabase.from('products').upsert(snakeCaseProduct as TablesInsert<'products'>);
    if (error) throw error;
    if (productToUpsert.barcode) this.saveTemplateNonBlocking(productToUpsert as Product);
  }

  private static prepareProductForUpsert(product: Partial<Product>): Partial<Product> {
    const prepared = { ...product };
    if (!prepared.id) { prepared.id = randomUUID(); prepared.status ??= 'active'; }
    return prepared;
  }

  private static saveTemplateNonBlocking(product: Product): void {
    TemplateService.saveProductTemplate(product).catch((error) => LoggingService.error('ProductStorage', 'Error saving template (non-blocking)', error));
  }

  /** Delete product by ID. */
  static async deleteProduct(productId: string): Promise<ServiceResult<void>> {
    const validationError = this.validateId(productId, 'Product ID');
    if (validationError) return createErrorResult(validationError);
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      return createSuccessResult(undefined);
    } catch (error) { return createErrorResult(this.handleError('Error deleting product', error)); }
  }

  /** Update product status and optionally set consumed date. */
  static async updateProductStatus(productId: string, status: Product['status']): Promise<ServiceResult<void>> {
    const idError = this.validateId(productId, 'Product ID');
    if (idError) return createErrorResult(idError);
    try {
      const updatedFields: Partial<Product> = { status };
      if (status === 'consumed') updatedFields.consumedDate = new Date().toISOString();
      const { error } = await supabase.from('products').update(convertProductToSnakeCase(updatedFields) as TablesUpdate<'products'>).eq('id', productId);
      if (error) throw error;
      return createSuccessResult(undefined);
    } catch (error) { return createErrorResult(this.handleError('Error updating product status', error)); }
  }

  /** Get products expiring in last 2 days with active status. */
  static async getExpiredProducts(): Promise<ServiceResult<Product[]>> {
    const userResult = await this.getCurrentUserId();
    if (!userResult.success) return createErrorResult<Product[]>(userResult.error!);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);
    try {
      const { data, error } = await supabase.from('products').select('*').eq('user_id', userResult.data!).eq('status', 'active').lt('expiration_date', twoDaysAgo.toISOString()).order('expiration_date', { ascending: true });
      if (error) throw error;
      return createSuccessResult(data ? convertProductsToCamelCase(data) : []);
    } catch (error) { return createErrorResult(this.handleError('Error getting expired products', error)); }
  }

  /** Get products with status 'expired'. */
  static async getTrulyExpiredProducts(): Promise<ServiceResult<Product[]>> {
    const userResult = await this.getCurrentUserId();
    if (!userResult.success) return createErrorResult<Product[]>(userResult.error!);
    try {
      const { data, error } = await supabase.from('products').select('*').eq('user_id', userResult.data!).eq('status', 'expired');
      if (error) throw error;
      return createSuccessResult(data ? convertProductsToCamelCase(data) : []);
    } catch (error) { return createErrorResult(this.handleError('Error getting truly expired products', error)); }
  }

  /** Move multiple products to history by setting status to 'expired'. */
  static async moveProductsToHistory(productIds: string[]): Promise<ServiceResult<void>> {
    if (!productIds.length) return createSuccessResult(undefined);
    try {
      const { error } = await supabase.from('products').update({ status: 'expired' } as TablesUpdate<'products'>).in('id', productIds);
      if (error) throw error;
      LoggingService.info('ProductStorage', `${productIds.length} products moved to history`);
      return createSuccessResult(undefined);
    } catch (error) { return createErrorResult(this.handleError('Error moving products to history', error)); }
  }

  /** Update product image URL. */
  static async updateProductImage(productId: string, imageUrl: string): Promise<ServiceResult<void>> {
    const idError = this.validateId(productId, 'Product ID');
    if (idError) return createErrorResult(idError);
    if (!imageUrl?.trim()) return createErrorResult(new Error('Image URL is required'));
    try {
      const { error } = await supabase.from('products').update({ image_url: imageUrl } as TablesUpdate<'products'>).eq('id', productId);
      if (error) throw error;
      return createSuccessResult(undefined);
    } catch (error) { return createErrorResult(this.handleError('Error updating product image', error)); }
  }

  /** Get all consumed products ordered by consumed date (descending). */
  static async getHistory(): Promise<ServiceResult<Product[]>> {
    const userResult = await this.getCurrentUserId();
    if (!userResult.success) return createErrorResult<Product[]>(userResult.error!);
    try {
      const { data, error } = await supabase.from('products').select('*').eq('user_id', userResult.data!).eq('status', 'consumed').order('consumed_date', { ascending: false });
      if (error) throw error;
      return createSuccessResult(data ? convertProductsToCamelCase(data) : []);
    } catch (error) { return createErrorResult(this.handleError('Error getting history', error)); }
  }

  /** Restore consumed product back to active status. */
  static async restoreConsumedProduct(productId: string): Promise<ServiceResult<void>> {
    const result = await this.updateProductStatus(productId, 'active');
    if (result.success) LoggingService.info('ProductStorage', `Product ${productId} restored successfully`);
    else LoggingService.error('ProductStorage', `Error restoring product ${productId}`, result.error);
    return result;
  }
}
