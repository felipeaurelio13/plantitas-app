import { supabase } from '../lib/supabase';
import { Plant, PlantSummary } from '../schemas';

// Minimal PlantService stub to allow compilation
export class PlantService {
  async getUserPlantSummaries(userId: string): Promise<PlantSummary[]> {
    const { data: dbPlants, error } = await supabase
      .from('plants')
      .select(`
        id,
        name,
        nickname,
        species,
        location,
        plant_environment,
        light_requirements,
        health_score,
        last_watered,
        care_profile,
        plant_images ( * )
      `)
      .eq('user_id', userId)
      .eq('plant_images.is_profile_image', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const summaries: PlantSummary[] = dbPlants.map((plant: any) => ({
      id: plant.id,
      name: plant.name,
      nickname: plant.nickname || undefined,
      species: plant.species,
      location: plant.location,
      plantEnvironment: plant.plant_environment as 'interior' | 'exterior' | 'ambos' | undefined,
      lightRequirements: plant.light_requirements as 'poca_luz' | 'luz_indirecta' | 'luz_directa_parcial' | 'pleno_sol' | undefined,
      healthScore: plant.health_score || 85,
      profileImageUrl: plant.plant_images.length > 0 
        ? plant.plant_images[0].url ?? undefined
        : undefined,
      lastWatered: plant.last_watered ? new Date(plant.last_watered) : undefined,
      wateringFrequency: (plant.care_profile as any)?.wateringFrequency,
    }));

    return summaries;
  }

  // Placeholder methods - adding signatures to allow compilation
  async updatePlantInfo(_plantId: string, _userId: string, _updates: any): Promise<Plant> {
    throw new Error('Method not implemented in stub');
  }

  async addPlantFromAnalysis(_userId: string, _imageDataUrl: string, _location: string): Promise<Plant> {
    throw new Error('Method not implemented in stub');
  }

  async updatePlant(_plant: Plant, _userId: string): Promise<Plant> {
    throw new Error('Method not implemented in stub');
  }

  async deletePlant(_plantId: string, _userId: string): Promise<void> {
    throw new Error('Method not implemented in stub');
  }

  async sendChatMessageAndGetResponse(_plant: Plant, _userMessage: any, _userId: string): Promise<[any, any]> {
    throw new Error('Method not implemented in stub');
  }

  async addPlantImage(_plantId: string, _image: any, _userId: string): Promise<any> {
    throw new Error('Method not implemented in stub');
  }

  async getUserPlants(_userId: string): Promise<Plant[]> {
    throw new Error('Method not implemented in stub');
  }
}

// Export singleton
export const plantService = new PlantService(); 