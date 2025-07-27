import { create } from 'zustand';
import { produce } from 'immer';
import { Plant, ChatMessage } from '../schemas';
import plantService from '../services/plantService';
import aiService from '../services/aiService';
import { gardenCacheService } from '../services/gardenCacheService';

interface PlantState {
  plants: Plant[];
  isLoading: boolean;
  error: string | null;
  selectedPlantId: string | null; // Keep UI state
}

interface PlantActions {
  // loadPlants: (userId: string) => Promise<void>; // Removed
  getPlantById: (plantId: string) => Plant | undefined;
  addPlant: (
    userId: string,
    plantData: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<string>;
  updatePlant: (plantId: string, updates: Partial<Plant>) => Promise<void>;
  deletePlant: (plantId: string) => Promise<void>;
  updatePlantHealthScore: (
    plantId: string,
    healthScore: number
  ) => Promise<void>;
  sendChatMessage: (
    plantId: string,
    userId: string,
    message: string
  ) => Promise<ChatMessage>;
  setSelectedPlantId: (plantId: string | null) => void;
  clearError: () => void;
}

type PlantStore = PlantState & PlantActions;

const usePlantStore = create<PlantStore>((set, get) => ({
  plants: [],
  isLoading: false,
  error: null,
  selectedPlantId: null,

  getPlantById: (plantId: string) => {
    const { plants } = get();
    return plants.find((plant) => plant.id === plantId);
  },

  addPlant: async (userId: string, plantData) => {
    set(
      produce((state) => {
        state.isLoading = true;
        state.error = null;
      })
    );

    try {
      // Create the plant in Firebase
      const newPlantId = await plantService.createPlant({
        ...plantData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Get the complete plant data
      const newPlant = await plantService.getPlantById(newPlantId);
      if (newPlant) {
        set(
          produce((state) => {
            state.plants.push(newPlant);
            state.isLoading = false;
          })
        );
      }

      return newPlantId;
    } catch (error: any) {
      set(
        produce((state) => {
          state.error = error.message || 'Failed to add plant';
          state.isLoading = false;
        })
      );
      throw error;
    }
  },

  updatePlant: async (plantId: string, updates: Partial<Plant>) => {
    set(
      produce((state) => {
        state.isLoading = true;
        state.error = null;
      })
    );

    try {
      await plantService.updatePlant(plantId, updates);

      set(
        produce((state) => {
          const index = state.plants.findIndex((plant) => plant.id === plantId);
          if (index !== -1) {
            state.plants[index] = { ...state.plants[index], ...updates };
          }
          state.isLoading = false;
        })
      );
    } catch (error: any) {
      set(
        produce((state) => {
          state.error = error.message || 'Failed to update plant';
          state.isLoading = false;
        })
      );
      throw error;
    }
  },

  deletePlant: async (plantId: string) => {
    set(
      produce((state) => {
        state.isLoading = true;
        state.error = null;
      })
    );

    try {
      await plantService.deletePlant(plantId);

      set(
        produce((state) => {
          state.plants = state.plants.filter((plant) => plant.id !== plantId);
          state.isLoading = false;
        })
      );
    } catch (error: any) {
      set(
        produce((state) => {
          state.error = error.message || 'Failed to delete plant';
          state.isLoading = false;
        })
      );
      throw error;
    }
  },

  updatePlantHealthScore: async (plantId: string, healthScore: number) => {
    try {
      await plantService.updatePlantHealthScore(plantId, healthScore);

      set(
        produce((state) => {
          const plant = state.plants.find((p) => p.id === plantId);
          if (plant) {
            plant.healthScore = healthScore;
          }
        })
      );
    } catch (error: any) {
      set(
        produce((state) => {
          state.error = error.message || 'Failed to update health score';
        })
      );
      throw error;
    }
  },

  sendChatMessage: async (
    plantId: string,
    userId: string,
    message: string
  ): Promise<ChatMessage> => {
    try {
      // Create user message
      const userMessage: Omit<ChatMessage, 'id'> = {
        plantId,
        userId,
        sender: 'user',
        content: message,
        createdAt: new Date(),
      };

      // Save user message
      await plantService.addChatMessage(plantId, userMessage);

      // Generate AI response using real AI service
      const plant = get().plants.find(p => p.id === plantId);
      if (!plant) {
        throw new Error('Plant not found for chat response');
      }

      const aiResponseResult = await aiService.generatePlantResponse(message, {
        species: plant.species,
        name: plant.name,
        healthScore: plant.healthScore,
        careProfile: plant.careProfile,
        personality: plant.personality
      });

      const aiResponse: Omit<ChatMessage, 'id'> = {
        plantId,
        userId,
        sender: 'plant',
        content: aiResponseResult.content,
        emotion: aiResponseResult.emotion || 'happy',
        createdAt: new Date(),
      };

      // Save AI response
      await plantService.addChatMessage(plantId, aiResponse);

      return aiResponse as ChatMessage;
    } catch (error: any) {
      set(
        produce((state) => {
          state.error = error.message || 'Failed to send chat message';
        })
      );
      throw error;
    }
  },

  setSelectedPlantId: (plantId: string | null) => {
    set(
      produce((state) => {
        state.selectedPlantId = plantId;
      })
    );
  },

  clearError: () => {
    set(
      produce((state) => {
        state.error = null;
      })
    );
  },
}));

export default usePlantStore;
export { usePlantStore }; 