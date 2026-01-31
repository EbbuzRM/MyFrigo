/**
 * EventEmitter Service
 * 
 * Provides a simple event emitter pattern for decoupled communication
 * between components. Supports event subscription, emission, and cleanup.
 */

/** Type definition for event listener callbacks */
type EventListener = (data?: unknown) => void;

/** Storage for all registered event listeners */
const listeners: { [key: string]: EventListener[] } = {};

/**
 * EventEmitter class for pub/sub pattern
 * 
 * @example
 * ```typescript
 * const unsubscribe = EventEmitter.on('product:expired', (product) => {
 *   console.log('Product expired:', product);
 * });
 * 
 * EventEmitter.emit('product:expired', { id: 1, name: 'Milk' });
 * 
 * // Cleanup when done
 * unsubscribe();
 * ```
 */
export class EventEmitter {
  /**
   * Subscribe to an event
   * @param event - Event name to subscribe to
   * @param listener - Callback function to invoke when event is emitted
   * @returns Unsubscribe function to remove the listener
   */
  static on(event: string, listener: EventListener): () => void {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(listener);
    
    return () => {
      listeners[event] = listeners[event].filter(l => l !== listener);
    };
  }

  /**
   * Emit an event to all subscribed listeners
   * @param event - Event name to emit
   * @param data - Optional data to pass to listeners
   */
  static emit(event: string, data?: unknown): void {
    if (listeners[event]) {
      listeners[event].forEach(listener => listener(data));
    }
  }

  /**
   * Remove all listeners for a specific event
   * @param event - Event name to clear
   * @returns true if event existed and was cleared, false otherwise
   */
  static removeAllListeners(event: string): boolean {
    if (listeners[event]) {
      listeners[event] = [];
      return true;
    }
    return false;
  }

  /**
   * Remove all listeners for all events
   * Useful for cleanup when the app is shutting down or resetting state
   */
  static removeAllEvents(): void {
    Object.keys(listeners).forEach(event => {
      listeners[event] = [];
    });
  }

  /**
   * Get the number of listeners for a specific event
   * @param event - Event name to check
   * @returns Number of registered listeners
   */
  static listenerCount(event: string): number {
    return listeners[event]?.length || 0;
  }
}

/** 
 * Legacy eventEmitter object for backward compatibility
 * @deprecated Use EventEmitter class instead
 */
export const eventEmitter = {
  on: EventEmitter.on,
  emit: EventEmitter.emit,
  removeAllListeners: EventEmitter.removeAllListeners,
  removeAllEvents: EventEmitter.removeAllEvents,
};
