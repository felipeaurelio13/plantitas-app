import { PlantSummary } from '../schemas';

export class GardenCacheService {
  async cacheGardenData(data: any): Promise<void> {
    // Stub implementation
  }

  async getCachedGardenData(): Promise<any> {
    return null;
  }
}

export default new GardenCacheService();
