// EventEmitter.test.ts — EventEmitter test module.
//
// exports: none
// used_by: none
// rules:   none

import { EventEmitter, eventEmitter } from '../EventEmitter';

describe('EventEmitter', () => {
  afterEach(() => {
    // Clean up all listeners after each test
    EventEmitter.removeAllEvents();
  });

  // ── on / emit ─────────────────────────────────────────────────────
  describe('on and emit', () => {
    it('should invoke listener when event is emitted', () => {
      const listener = jest.fn();
      EventEmitter.on('test:event', listener);

      EventEmitter.emit('test:event', { key: 'value' });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ key: 'value' });
    });

    it('should invoke multiple listeners for the same event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      EventEmitter.on('test:multi', listener1);
      EventEmitter.on('test:multi', listener2);

      EventEmitter.emit('test:multi');

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should not invoke listeners for different events', () => {
      const listener = jest.fn();
      EventEmitter.on('test:event1', listener);

      EventEmitter.emit('test:event2');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should pass undefined data when no data is provided', () => {
      const listener = jest.fn();
      EventEmitter.on('test:nodata', listener);

      EventEmitter.emit('test:nodata');

      expect(listener).toHaveBeenCalledWith(undefined);
    });

    it('should pass complex data types', () => {
      const listener = jest.fn();
      EventEmitter.on('test:complex', listener);

      const complexData = { nested: { array: [1, 2, 3] }, flag: true };
      EventEmitter.emit('test:complex', complexData);

      expect(listener).toHaveBeenCalledWith(complexData);
    });
  });

  // ── unsubscribe ───────────────────────────────────────────────────
  describe('unsubscribe', () => {
    it('should return an unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = EventEmitter.on('test:unsub', listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should remove listener after calling unsubscribe', () => {
      const listener = jest.fn();
      const unsubscribe = EventEmitter.on('test:unsub', listener);

      unsubscribe();
      EventEmitter.emit('test:unsub');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should not affect other listeners when one is unsubscribed', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const unsubscribe1 = EventEmitter.on('test:partial', listener1);
      EventEmitter.on('test:partial', listener2);

      unsubscribe1();
      EventEmitter.emit('test:partial');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  // ── removeAllListeners ────────────────────────────────────────────
  describe('removeAllListeners', () => {
    it('should remove all listeners for a specific event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      EventEmitter.on('test:remove', listener1);
      EventEmitter.on('test:remove', listener2);

      const result = EventEmitter.removeAllListeners('test:remove');
      EventEmitter.emit('test:remove');

      expect(result).toBe(true);
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should return false for non-existent event', () => {
      const result = EventEmitter.removeAllListeners('test:nonexistent');
      expect(result).toBe(false);
    });

    it('should not affect listeners for other events', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      EventEmitter.on('test:event1', listener1);
      EventEmitter.on('test:event2', listener2);

      EventEmitter.removeAllListeners('test:event1');
      EventEmitter.emit('test:event2');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  // ── removeAllEvents ───────────────────────────────────────────────
  describe('removeAllEvents', () => {
    it('should remove all listeners for all events', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      EventEmitter.on('test:event1', listener1);
      EventEmitter.on('test:event2', listener2);

      EventEmitter.removeAllEvents();
      EventEmitter.emit('test:event1');
      EventEmitter.emit('test:event2');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  // ── listenerCount ─────────────────────────────────────────────────
  describe('listenerCount', () => {
    it('should return 0 for event with no listeners', () => {
      expect(EventEmitter.listenerCount('test:empty')).toBe(0);
    });

    it('should return the number of listeners for an event', () => {
      EventEmitter.on('test:count', jest.fn());
      EventEmitter.on('test:count', jest.fn());

      expect(EventEmitter.listenerCount('test:count')).toBe(2);
    });

    it('should decrease count after unsubscribing', () => {
      const unsubscribe = EventEmitter.on('test:decrement', jest.fn());
      EventEmitter.on('test:decrement', jest.fn());

      expect(EventEmitter.listenerCount('test:decrement')).toBe(2);

      unsubscribe();

      expect(EventEmitter.listenerCount('test:decrement')).toBe(1);
    });

    it('should be 0 after removeAllListeners', () => {
      EventEmitter.on('test:cleared', jest.fn());
      EventEmitter.on('test:cleared', jest.fn());

      EventEmitter.removeAllListeners('test:cleared');

      expect(EventEmitter.listenerCount('test:cleared')).toBe(0);
    });
  });

  // ── legacy eventEmitter object ────────────────────────────────────
  describe('eventEmitter (legacy)', () => {
    it('should have the same methods as EventEmitter', () => {
      expect(typeof eventEmitter.on).toBe('function');
      expect(typeof eventEmitter.emit).toBe('function');
      expect(typeof eventEmitter.removeAllListeners).toBe('function');
      expect(typeof eventEmitter.removeAllEvents).toBe('function');
    });

    it('should work as a drop-in replacement', () => {
      const listener = jest.fn();
      eventEmitter.on('test:legacy', listener);
      eventEmitter.emit('test:legacy', 'data');

      expect(listener).toHaveBeenCalledWith('data');

      eventEmitter.removeAllListeners('test:legacy');
    });
  });
});
