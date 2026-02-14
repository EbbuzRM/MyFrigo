import { Product } from '@/types/Product';
import { ServiceResult, createSuccessResult, createErrorResult } from '@/types/ServiceResult';
import { supabase } from './supabaseClient';
import { TablesInsert, TablesUpdate } from '@/types/supabase';
import { convertProductToCamelCase, convertProductToSnakeCase, convertProductsToCamelCase } from '../utils/caseConverter';
import { randomUUID } from 'expo-crypto';
import { LoggingService } from './LoggingService';
import { TemplateService } from './TemplateService';

/**
 * Servizio per la gestione dei prodotti nel database Supabase.
 * Tutti i metodi restituiscono ServiceResult<T> standardizzato per una gestione degli errori consistente.
 */
export class ProductStorage {
  private static readonly TIMEOUT_MS = 15000;

  /** Ottiene l'ID utente corrente o restituisce errore se non autenticato. */
  private static async getCurrentUserId(): Promise<ServiceResult<string>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user ? createSuccessResult(session.user.id) : createErrorResult(new Error('Utente non autenticato'));
    } catch (error) {
      return createErrorResult(error instanceof Error ? error : new Error('Impossibile ottenere la sessione'));
    }
  }

  /** Valida che un ID stringa non sia vuoto. */
  private static validateId(id: string, name: string): Error | null {
    return !id || id.trim().length === 0 ? new Error(`${name} è richiesto`) : null;
  }

  /** Gestisce errori del database con logging. */
  private static handleError(operation: string, error: unknown): Error {
    const err = error instanceof Error ? error : new Error('Errore sconosciuto');
    LoggingService.error('ProductStorage', operation, error);
    return err;
  }

  /** Recupera tutti i prodotti per l'utente corrente, ordinati per data di scadenza. */
  static async getProducts(): Promise<ServiceResult<Product[]>> {
    const userResult = await this.getCurrentUserId();
    if (!userResult.success) return createErrorResult<Product[]>(userResult.error!);
    try {
      const { data, error } = await supabase.from('products').select('*').eq('user_id', userResult.data!).order('expiration_date', { ascending: true });
      if (error) throw error;
      const products = data ? convertProductsToCamelCase(data) : [];
      return createSuccessResult(products);
    } catch (error) {
      return createErrorResult(this.handleError('Errore in getProducts', error));
    }
  }

  /** Ottiene un singolo prodotto per ID. */
  static async getProductById(productId: string): Promise<ServiceResult<Product | null>> {
    const validationError = this.validateId(productId, 'ID Prodotto');
    if (validationError) return createErrorResult(validationError);
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', productId).single();
      if (error) throw error;
      return createSuccessResult(data ? convertProductToCamelCase(data) : null);
    } catch (error) {
      return createErrorResult(this.handleError(`Errore nel recupero prodotto con ID ${productId}`, error));
    }
  }

  /** Sottoscrive ai cambiamenti dei prodotti in tempo reale. */
  static listenToProducts(callback: () => void): () => void {
    const channel = supabase.channel('public:products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
      LoggingService.info('ProductStorage', 'Rilevata modifica nella tabella products');
      callback();
    }).subscribe((status) => { if (status === 'SUBSCRIBED') LoggingService.info('ProductStorage', 'Canale realtime sottoscritto'); });
    return () => supabase.removeChannel(channel);
  }

  /** Salva il prodotto nel database (inserimento o aggiornamento). */
  static async saveProduct(product: Partial<Product>): Promise<ServiceResult<void>> {
    const userResult = await this.getCurrentUserId();
    if (!userResult.success) return userResult as ServiceResult<void>;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout durante salvataggio prodotto')), this.TIMEOUT_MS));
      await Promise.race([this.performUpsert(product, userResult.data!), timeoutPromise]);
      return createSuccessResult(undefined);
    } catch (error) {
      return createErrorResult(this.handleError('Errore nel salvataggio prodotto', error));
    }
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
    TemplateService.saveProductTemplate(product).catch((error) => LoggingService.error('ProductStorage', 'Errore salvataggio template (non bloccante)', error));
  }

  /** Elimina un prodotto per ID. */
  static async deleteProduct(productId: string): Promise<ServiceResult<void>> {
    const validationError = this.validateId(productId, 'ID Prodotto');
    if (validationError) return createErrorResult(validationError);
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      return createSuccessResult(undefined);
    } catch (error) {
      return createErrorResult(this.handleError('Errore nell\'eliminazione prodotto', error));
    }
  }

  /** Aggiorna lo stato del prodotto e opzionalmente imposta la data di consumo. */
  static async updateProductStatus(productId: string, status: Product['status']): Promise<ServiceResult<void>> {
    const idError = this.validateId(productId, 'ID Prodotto');
    if (idError) return createErrorResult(idError);
    try {
      const updatedFields: Partial<Product> = { status };
      if (status === 'consumed') updatedFields.consumedDate = new Date().toISOString();
      const { error } = await supabase.from('products').update(convertProductToSnakeCase(updatedFields) as TablesUpdate<'products'>).eq('id', productId);
      if (error) throw error;
      return createSuccessResult(undefined);
    } catch (error) {
      return createErrorResult(this.handleError('Errore nell\'aggiornamento stato prodotto', error));
    }
  }

  /** Ottiene i prodotti scaduti negli ultimi 2 giorni con stato attivo. */
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
    } catch (error) {
      return createErrorResult(this.handleError('Errore nel recupero prodotti scaduti', error));
    }
  }

  /** Ottiene i prodotti con stato 'expired'. */
  static async getTrulyExpiredProducts(): Promise<ServiceResult<Product[]>> {
    const userResult = await this.getCurrentUserId();
    if (!userResult.success) return createErrorResult<Product[]>(userResult.error!);
    try {
      const { data, error } = await supabase.from('products').select('*').eq('user_id', userResult.data!).eq('status', 'expired');
      if (error) throw error;
      return createSuccessResult(data ? convertProductsToCamelCase(data) : []);
    } catch (error) {
      return createErrorResult(this.handleError('Errore nel recupero prodotti scaduti reali', error));
    }
  }

  /** Sposta più prodotti nello storico impostando lo stato a 'expired'. */
  static async moveProductsToHistory(productIds: string[]): Promise<ServiceResult<void>> {
    if (!productIds.length) return createSuccessResult(undefined);
    try {
      const { error } = await supabase.from('products').update({ status: 'expired' } as TablesUpdate<'products'>).in('id', productIds);
      if (error) throw error;
      LoggingService.info('ProductStorage', `${productIds.length} prodotti spostati nello storico`);
      return createSuccessResult(undefined);
    } catch (error) {
      return createErrorResult(this.handleError('Errore nello spostamento prodotti nello storico', error));
    }
  }

  /** Aggiorna l'URL dell'immagine del prodotto. */
  static async updateProductImage(productId: string, imageUrl: string): Promise<ServiceResult<void>> {
    const idError = this.validateId(productId, 'ID Prodotto');
    if (idError) return createErrorResult(idError);
    if (!imageUrl?.trim()) return createErrorResult(new Error('URL immagine richiesto'));
    try {
      const { error } = await supabase.from('products').update({ image_url: imageUrl } as TablesUpdate<'products'>).eq('id', productId);
      if (error) throw error;
      return createSuccessResult(undefined);
    } catch (error) {
      return createErrorResult(this.handleError('Errore nell\'aggiornamento immagine prodotto', error));
    }
  }

  /** Ottiene tutti i prodotti consumati ordinati per data di consumo (decrescente). */
  static async getHistory(): Promise<ServiceResult<Product[]>> {
    const userResult = await this.getCurrentUserId();
    if (!userResult.success) return createErrorResult<Product[]>(userResult.error!);
    try {
      const { data, error } = await supabase.from('products').select('*').eq('user_id', userResult.data!).eq('status', 'consumed').order('consumed_date', { ascending: false });
      if (error) throw error;
      return createSuccessResult(data ? convertProductsToCamelCase(data) : []);
    } catch (error) {
      return createErrorResult(this.handleError('Errore nel recupero storico', error));
    }
  }

  /** Ripristina un prodotto consumato allo stato attivo. */
  static async restoreConsumedProduct(productId: string): Promise<ServiceResult<void>> {
    const result = await this.updateProductStatus(productId, 'active');
    if (result.success) LoggingService.info('ProductStorage', `Prodotto ${productId} ripristinato con successo`);
    else LoggingService.error('ProductStorage', `Errore nel ripristino prodotto ${productId}`, result.error);
    return result;
  }
}
