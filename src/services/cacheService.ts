import { openDB, IDBPDatabase } from 'idb';
import { Plant, ChatMessage } from '../schemas';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
  lastModified: Date;
}

interface SyncQueue {
  id: string;
  operation: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

class CacheService {
  private db: IDBPDatabase | null = null;
  private readonly DB_NAME = 'plantitas-cache';
  private readonly DB_VERSION = 1;
  private readonly CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours
  private syncQueue: Map<string, SyncQueue> = new Map();

  async initialize(): Promise<void> {
    try {
      this.db = await openDB(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // Plants cache
          if (!db.objectStoreNames.contains('plants')) {
            const plantsStore = db.createObjectStore('plants', { keyPath: 'id' });
            plantsStore.createIndex('userId', 'userId');
            plantsStore.createIndex('syncStatus', 'syncStatus');
            plantsStore.createIndex('timestamp', 'timestamp');
          }

          // Chat messages cache
          if (!db.objectStoreNames.contains('chatMessages')) {
            const messagesStore = db.createObjectStore('chatMessages', { keyPath: 'id' });
            messagesStore.createIndex('plantId', 'plantId');
            messagesStore.createIndex('timestamp', 'timestamp');
          }

          // Sync queue
          if (!db.objectStoreNames.contains('syncQueue')) {
            const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
            syncStore.createIndex('timestamp', 'timestamp');
            syncStore.createIndex('operation', 'operation');
          }

          // Cache metadata
          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata', { keyPath: 'key' });
          }
        },
      });

      console.log('✅ Cache service initialized');
      await this.loadSyncQueue();
    } catch (error) {
      console.error('❌ Failed to initialize cache service:', error);
      throw error;
    }
  }

  private async loadSyncQueue(): Promise<void> {
    if (!this.db) return;

    try {
      const items = await this.db.getAll('syncQueue');
      this.syncQueue.clear();
      
      items.forEach(item => {
        this.syncQueue.set(item.id, item);
      });

      console.log(`📦 Loaded ${items.length} items from sync queue`);
    } catch (error) {
      console.error('❌ Failed to load sync queue:', error);
    }
  }

  async cachePlants(userId: string, plants: Plant[]): Promise<void> {
    if (!this.db) throw new Error('Cache not initialized');

    const tx = this.db.transaction('plants', 'readwrite');
    const store = tx.objectStore('plants');

    try {
      // Clear existing plants for user
      const index = store.index('userId');
      const existingKeys = await index.getAllKeys(userId);
      
      for (const key of existingKeys) {
        await store.delete(key);
      }

      // Cache new plants
      const timestamp = Date.now();
      for (const plant of plants) {
        const cacheEntry: CacheEntry<Plant> = {
          data: plant,
          timestamp,
          version: 1,
          syncStatus: 'synced',
          lastModified: new Date(),
        };
        
        await store.put({ ...cacheEntry, id: plant.id, userId });
      }

      await tx.done;
      console.log(`✅ Cached ${plants.length} plants for user ${userId}`);
    } catch (error) {
      console.error('❌ Failed to cache plants:', error);
      throw error;
    }
  }

  async getCachedPlants(userId: string): Promise<Plant[]> {
    if (!this.db) throw new Error('Cache not initialized');

    try {
      const index = this.db.transaction('plants').objectStore('plants').index('userId');
      const entries = await index.getAll(userId);
      
      const now = Date.now();
      const validEntries = entries.filter(entry => 
        (now - entry.timestamp) < this.CACHE_DURATION
      );

      const plants = validEntries.map(entry => entry.data);
      console.log(`📦 Retrieved ${plants.length} cached plants for user ${userId}`);
      
      return plants;
    } catch (error) {
      console.error('❌ Failed to get cached plants:', error);
      return [];
    }
  }

  async cachePlant(plant: Plant, syncStatus: 'synced' | 'pending' = 'synced'): Promise<void> {
    if (!this.db) throw new Error('Cache not initialized');

    try {
      const cacheEntry: CacheEntry<Plant> = {
        data: plant,
        timestamp: Date.now(),
        version: 1,
        syncStatus,
        lastModified: new Date(),
      };

      await this.db.put('plants', { ...cacheEntry, id: plant.id, userId: plant.userId });
      console.log(`✅ Cached plant ${plant.id} with status ${syncStatus}`);
    } catch (error) {
      console.error('❌ Failed to cache plant:', error);
      throw error;
    }
  }

  async addToSyncQueue(operation: SyncQueue['operation'], collection: string, data: any): Promise<void> {
    const queueItem: SyncQueue = {
      id: `${collection}_${data.id || Date.now()}_${operation}`,
      operation,
      collection,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.syncQueue.set(queueItem.id, queueItem);

    if (this.db) {
      try {
        await this.db.put('syncQueue', queueItem);
        console.log(`📤 Added ${operation} operation to sync queue for ${collection}`);
      } catch (error) {
        console.error('❌ Failed to persist sync queue item:', error);
      }
    }
  }

  async processSyncQueue(): Promise<{ success: number; failed: number }> {
    if (!this.db) throw new Error('Cache not initialized');

    let success = 0;
    let failed = 0;

    console.log(`🔄 Processing ${this.syncQueue.size} items in sync queue`);

    for (const [id, item] of this.syncQueue) {
      try {
        await this.processSyncItem(item);
        
        // Remove from queue on success
        this.syncQueue.delete(id);
        await this.db.delete('syncQueue', id);
        success++;
        
        console.log(`✅ Synced ${item.operation} for ${item.collection}`);
      } catch (error) {
        console.error(`❌ Failed to sync ${item.operation} for ${item.collection}:`, error);
        
        // Increment retry count
        item.retryCount++;
        if (item.retryCount >= 3) {
          // Remove from queue after 3 failed attempts
          this.syncQueue.delete(id);
          await this.db.delete('syncQueue', id);
          console.warn(`⚠️ Removed ${item.operation} for ${item.collection} after 3 failed attempts`);
        } else {
          // Update retry count in storage
          await this.db.put('syncQueue', item);
        }
        
        failed++;
      }
    }

    console.log(`🔄 Sync completed: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  private async processSyncItem(item: SyncQueue): Promise<void> {
    // This would integrate with your actual Firebase service
    const { operation, collection, data } = item;

    switch (collection) {
      case 'plants':
        await this.syncPlant(operation, data);
        break;
      case 'chatMessages':
        await this.syncChatMessage(operation, data);
        break;
      default:
        throw new Error(`Unknown collection: ${collection}`);
    }
  }

  private async syncPlant(operation: SyncQueue['operation'], data: Plant): Promise<void> {
    // Import the actual plant service dynamically to avoid circular dependencies
    const { default: plantService } = await import('./plantService');

    switch (operation) {
      case 'create':
        await plantService.createPlant(data);
        break;
      case 'update':
        await plantService.updatePlant(data.id, data);
        break;
      case 'delete':
        await plantService.deletePlant(data.id);
        break;
    }
  }

  private async syncChatMessage(operation: SyncQueue['operation'], data: ChatMessage): Promise<void> {
    const { default: plantService } = await import('./plantService');

    switch (operation) {
      case 'create':
        await plantService.addChatMessage(data.plantId, data);
        break;
      // Add other operations as needed
    }
  }

  async cacheChatMessages(plantId: string, messages: ChatMessage[]): Promise<void> {
    if (!this.db) throw new Error('Cache not initialized');

    const tx = this.db.transaction('chatMessages', 'readwrite');
    const store = tx.objectStore('chatMessages');

    try {
      // Clear existing messages for plant
      const index = store.index('plantId');
      const existingKeys = await index.getAllKeys(plantId);
      
      for (const key of existingKeys) {
        await store.delete(key);
      }

      // Cache new messages
      const timestamp = Date.now();
      for (const message of messages) {
        const cacheEntry: CacheEntry<ChatMessage> = {
          data: message,
          timestamp,
          version: 1,
          syncStatus: 'synced',
          lastModified: new Date(),
        };
        
        await store.put({ ...cacheEntry, id: message.id, plantId });
      }

      await tx.done;
      console.log(`✅ Cached ${messages.length} messages for plant ${plantId}`);
    } catch (error) {
      console.error('❌ Failed to cache messages:', error);
      throw error;
    }
  }

  async getCachedChatMessages(plantId: string): Promise<ChatMessage[]> {
    if (!this.db) throw new Error('Cache not initialized');

    try {
      const index = this.db.transaction('chatMessages').objectStore('chatMessages').index('plantId');
      const entries = await index.getAll(plantId);
      
      const messages = entries
        .map(entry => entry.data)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      console.log(`📦 Retrieved ${messages.length} cached messages for plant ${plantId}`);
      return messages;
    } catch (error) {
      console.error('❌ Failed to get cached messages:', error);
      return [];
    }
  }

  async clearCache(): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction(['plants', 'chatMessages', 'syncQueue'], 'readwrite');
      
      await Promise.all([
        tx.objectStore('plants').clear(),
        tx.objectStore('chatMessages').clear(),
        tx.objectStore('syncQueue').clear(),
      ]);

      await tx.done;
      this.syncQueue.clear();
      
      console.log('✅ Cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      throw error;
    }
  }

  async getCacheStats(): Promise<{
    plantsCount: number;
    messagesCount: number;
    queueCount: number;
    totalSize: number;
  }> {
    if (!this.db) {
      return { plantsCount: 0, messagesCount: 0, queueCount: 0, totalSize: 0 };
    }

    try {
      const [plantsCount, messagesCount, queueCount] = await Promise.all([
        this.db.count('plants'),
        this.db.count('chatMessages'),
        this.db.count('syncQueue'),
      ]);

      // Rough estimate of total size
      const totalSize = (plantsCount * 5000) + (messagesCount * 1000) + (queueCount * 2000);

      return { plantsCount, messagesCount, queueCount, totalSize };
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return { plantsCount: 0, messagesCount: 0, queueCount: 0, totalSize: 0 };
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

export default cacheService;
export { CacheService };