// recentProductQueue.ts — recentProductQueue module.
//
// exports: RecentQueueItem | recentProductQueue
// used_by: app\(tabs)\add.tsx
//                   components\RecentsPicker.tsx
//                   hooks\useProductSave.ts
//                   app\manual-entry.tsx
// rules:   - Singleton in-memory queue, survives router.replace, dies on kill, no AsyncStorage, no URL.
//          - MAX 10 items enforced on push.

export interface RecentQueueItem {
  name: string;
  brand?: string;
  barcode?: string;
  imageUrl?: string | null;
  selectedCategory: string;
  notes?: string;
  isFrozen?: boolean;
}

const MAX_QUEUE_SIZE = 10;

class RecentProductQueue {
  private queue: RecentQueueItem[] = [];

  push(items: RecentQueueItem | RecentQueueItem[]): void {
    const arr = Array.isArray(items) ? items : [items];
    const remaining = MAX_QUEUE_SIZE - this.queue.length;
    if (remaining <= 0) return;
    this.queue.push(...arr.slice(0, remaining));
  }

  peekNext(): RecentQueueItem | null {
    return this.queue[0] ?? null;
  }

  advance(): void {
    this.queue.shift();
  }

  clear(): void {
    this.queue = [];
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  size(): number {
    return this.queue.length;
  }

  getAll(): RecentQueueItem[] {
    return [...this.queue];
  }
}

export const recentProductQueue = new RecentProductQueue();
