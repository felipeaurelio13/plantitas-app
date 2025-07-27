import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Plant } from '../schemas';

interface PlantCareDB extends DBSchema {
  plants: {
    key: string;
    value: Plant;
    indexes: { 'by-health': number; 'by-date': Date };
  };
  images: {
    key: string;
    value: { id: string; plantId: string; blob: Blob; timestamp: Date };
  };
  settings: {
    key: string;
    value: any;
  };
}

class StorageService {
  private db: IDBPDatabase<PlantCareDB> | null = null;

  async init() {
    if (this.db) return this.db;

    this.db = await openDB<PlantCareDB>('PlantCareDB', 1, {
      upgrade(db) {
        // Plants store
        const plantStore = db.createObjectStore('plants', { keyPath: 'id' });
        plantStore.createIndex('by-health', 'healthScore');
        plantStore.createIndex('by-date', 'dateAdded');

        // Images store for offline caching
        db.createObjectStore('images', { keyPath: 'id' });

        // Settings store
        db.createObjectStore('settings', { keyPath: 'key' });
      },
    });

    return this.db;
  }

  async savePlant(plant: Plant): Promise<void> {
    const db = await this.init();
    await db.put('plants', plant);
    
    // Also save to localStorage as backup
    const plants = await this.getAllPlants();
    localStorage.setItem('plants', JSON.stringify(plants));
  }

  async getPlant(id: string): Promise<Plant | undefined> {
    const db = await this.init();
    return await db.get('plants', id);
  }

  async getAllPlants(): Promise<Plant[]> {
    const db = await this.init();
    const plants = await db.getAll('plants');
    
    // Convert date strings back to Date objects
    return plants.map(plant => ({
      ...plant,
      dateAdded: new Date(plant.dateAdded),
      lastWatered: plant.lastWatered ? new Date(plant.lastWatered) : undefined,
      lastFertilized: plant.lastFertilized ? new Date(plant.lastFertilized) : undefined,
      images: plant.images.map(img => ({
        ...img,
        timestamp: new Date(img.timestamp),
      })),
      // Fix: usar chatMessages en lugar de chatHistory
      chatHistory: (plant as any).chatMessages?.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })) || [],
      notifications: plant.notifications.map(notif => ({
        ...notif,
        // Fix: las notificaciones no tienen scheduledFor en la interfaz actual
        createdAt: new Date(notif.createdAt),
      })),
    }));
  }

  async deletePlant(id: string): Promise<void> {
    const db = await this.init();
    await db.delete('plants', id);
    
    // Update localStorage backup
    const plants = await this.getAllPlants();
    localStorage.setItem('plants', JSON.stringify(plants));
  }

  async saveImageBlob(imageId: string, plantId: string, blob: Blob): Promise<void> {
    const db = await this.init();
    await db.put('images', {
      id: imageId,
      plantId,
      blob,
      timestamp: new Date(),
    });
  }

  async getImageBlob(imageId: string): Promise<Blob | undefined> {
    const db = await this.init();
    const result = await db.get('images', imageId);
    return result?.blob;
  }

  async saveSetting(key: string, value: any): Promise<void> {
    const db = await this.init();
    await db.put('settings', { key, value });
  }

  async getSetting(key: string): Promise<any> {
    const db = await this.init();
    const result = await db.get('settings', key);
    return result?.value;
  }

  async exportData(): Promise<string> {
    const plants = await this.getAllPlants();
    const settings = {
      theme: await this.getSetting('theme'),
      notifications: await this.getSetting('notifications'),
    };

    return JSON.stringify({
      plants,
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    }, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.plants) {
        for (const plant of data.plants) {
          await this.savePlant(plant);
        }
      }

      if (data.settings) {
        for (const [key, value] of Object.entries(data.settings)) {
          if (value !== undefined) {
            await this.saveSetting(key, value);
          }
        }
      }
    } catch (error) {
      throw new Error('Invalid data format');
    }
  }

  async clearAllData(): Promise<void> {
    const db = await this.init();
    await db.clear('plants');
    await db.clear('images');
    await db.clear('settings');
    localStorage.removeItem('plants');
  }
}

export const storageService = new StorageService();