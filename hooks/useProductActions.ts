import { useCallback } from 'react';
import { Alert } from 'react-native';
import { Product } from '@/types/Product';
import { ProductStorage } from '@/services/ProductStorage';
import { LoggingService } from '@/services/LoggingService';

/**
 * Callback type for refreshing products list
 */
type RefreshCallback = () => Promise<void>;

/**
 * Parameters for useProductActions hook
 */
export interface UseProductActionsParams {
  /** Callback to refresh products after actions */
  refreshProducts: RefreshCallback;
  /** Callback when consume modal should be shown */
  onShowConsumeModal: (product: Product) => void;
}

/**
 * Result interface for useProductActions hook
 */
export interface UseProductActionsResult {
  /** Handle direct consume for single quantity products */
  handleDirectConsume: (product: Product) => Promise<void>;
  /** Handle showing consume modal for multi-quantity products */
  handleShowConsumeModal: (product: Product) => void;
  /** Handle product deletion */
  handleDelete: (product: Product) => Promise<void>;
  /** Handle consume confirmation with quantity */
  handleConsumeConfirm: (product: Product, consumedQuantity: number) => Promise<void>;
}

/**
 * Custom hook for managing product actions (consume, delete)
 * Encapsulates ProductStorage service calls
 * 
 * @param params - Hook parameters
 * @returns Action handlers
 */
export function useProductActions({
  refreshProducts,
  onShowConsumeModal,
}: UseProductActionsParams): UseProductActionsResult {

  /**
   * Handles direct consumption of a single quantity product
   * Updates product status to 'consumed'
   */
  const handleDirectConsume = useCallback(async (product: Product): Promise<void> => {
    try {
      const result = await ProductStorage.updateProductStatus(product.id, 'consumed');
      if (!result.success) {
        throw result.error || new Error('Failed to update product status');
      }
      await refreshProducts();
      LoggingService.info('useProductActions', `Product ${product.name} marked as consumed directly.`);
    } catch (error) {
      LoggingService.error('useProductActions', 'Error consuming product directly', error);
      Alert.alert('Errore', 'Si è verificato un errore durante il consumo del prodotto.');
    }
  }, [refreshProducts]);

  /**
   * Shows consume modal for multi-quantity products
   */
  const handleShowConsumeModal = useCallback((product: Product): void => {
    LoggingService.info('useProductActions', `Showing consume modal for: ${product.name}`);
    onShowConsumeModal(product);
  }, [onShowConsumeModal]);

  /**
   * Handles product deletion
   */
  const handleDelete = useCallback(async (product: Product): Promise<void> => {
    LoggingService.info('useProductActions', `User initiated deletion for product: ${product.id}`);
    try {
      const result = await ProductStorage.deleteProduct(product.id);
      if (!result.success) {
        throw result.error || new Error('Failed to delete product');
      }
      await refreshProducts();
      LoggingService.info('useProductActions', `Product ${product.name} deleted successfully`);
    } catch (error) {
      LoggingService.error('useProductActions', `Error deleting product: ${error}`);
      Alert.alert('Errore', 'Si è verificato un errore durante l\'eliminazione del prodotto.');
    }
  }, [refreshProducts]);

  /**
   * Handles consume confirmation with specified quantity
   * Updates quantities or marks as consumed if all consumed
   */
  const handleConsumeConfirm = useCallback(async (
    product: Product, 
    consumedQuantity: number
  ): Promise<void> => {
    try {
      const currentTotalQuantity = product.quantities.reduce((sum, q) => sum + q.quantity, 0);
      const remainingQuantity = currentTotalQuantity - consumedQuantity;

      if (remainingQuantity > 0) {
        // Handle partial consumption - deduct from largest quantities first
        const newQuantities = [...product.quantities];
        let remainingToDeduct = consumedQuantity;

        // Sort by quantity descending to consume from largest first
        newQuantities.sort((a, b) => b.quantity - a.quantity);

        for (let i = 0; i < newQuantities.length && remainingToDeduct > 0; i++) {
          if (newQuantities[i].quantity >= remainingToDeduct) {
            newQuantities[i].quantity -= remainingToDeduct;
            remainingToDeduct = 0;
          } else {
            remainingToDeduct -= newQuantities[i].quantity;
            newQuantities[i].quantity = 0;
          }
        }

        // Remove zero quantities
        const filteredQuantities = newQuantities.filter(q => q.quantity > 0);

        // Update product with new quantities
        const productToUpdate = {
          ...product,
          quantities: filteredQuantities
        };

        const saveResult = await ProductStorage.saveProduct(productToUpdate);
        if (!saveResult.success) {
          throw saveResult.error || new Error('Failed to save product with updated quantities');
        }

        LoggingService.info('useProductActions', 
          `Updated quantity for ${product.name}. Remaining: ${remainingQuantity}`);
      } else {
        // All consumed - mark as consumed
        const statusResult = await ProductStorage.updateProductStatus(product.id, 'consumed');
        if (!statusResult.success) {
          throw statusResult.error || new Error('Failed to update product status to consumed');
        }
        LoggingService.info('useProductActions', `Product ${product.name} marked as consumed.`);
      }

      await refreshProducts();
    } catch (error) {
      LoggingService.error('useProductActions', 'Error consuming product', error);
      Alert.alert('Errore', 'Si è verificato un errore durante il consumo del prodotto.');
    }
  }, [refreshProducts]);

  return {
    handleDirectConsume,
    handleShowConsumeModal,
    handleDelete,
    handleConsumeConfirm,
  };
}
