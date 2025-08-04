import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import plantService from '../services/plantService';
import { Plant, ChatMessage } from '../schemas';

interface PlantStore {
  plants: Plant[];
  selectedPlant: Plant | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPlants: (userId: string) => Promise<void>;
  loadPlantById: (plantId: string) => Promise<Plant | null>;
  createPlant: (plantData: Omit<Plant, 'id'>) => Promise<string>;
  updatePlant: (plantId: string, updates: Partial<Plant>) => Promise<void>;
  deletePlant: (plantId: string) => Promise<void>;
  setSelectedPlant: (plant: Plant | null) => void;
  sendChatMessage: (plantId: string, content: string, userId: string) => Promise<void>;
  clearError: () => void;
}

const usePlantStore = create<PlantStore>()(
  immer((set) => ({
    plants: [],
    selectedPlant: null,
    isLoading: false,
    error: null,

    loadPlants: async (userId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        console.log('[PLANT STORE] Loading plants for user:', userId);
        const plants = await plantService.getUserPlants(userId);
        
        set((state) => {
          state.plants = plants;
          state.isLoading = false;
        });
        
        console.log('[PLANT STORE] Loaded plants:', plants.length);
      } catch (error) {
        console.error('[PLANT STORE] Error loading plants:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to load plants';
          state.isLoading = false;
        });
      }
    },

    loadPlantById: async (plantId: string): Promise<Plant | null> => {
      try {
        console.log('[PLANT STORE] Loading plant by ID:', plantId);
        const plant = await plantService.getPlantById(plantId);
        
        if (plant) {
          set((state) => {
            state.selectedPlant = plant;
          });
        }
        
        return plant;
      } catch (error) {
        console.error('[PLANT STORE] Error loading plant by ID:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to load plant';
        });
        return null;
      }
    },

    createPlant: async (plantData: Omit<Plant, 'id'>): Promise<string> => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        console.log('[PLANT STORE] Creating new plant:', plantData.name);
        const newPlantId = await plantService.createPlant({
          ...plantData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Create the new plant object with ID
        const newPlant: Plant = {
          ...plantData,
          id: newPlantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => {
          state.plants.push(newPlant);
          state.isLoading = false;
        });

        console.log('[PLANT STORE] Plant created with ID:', newPlantId);
        return newPlantId;
      } catch (error) {
        console.error('[PLANT STORE] Error creating plant:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to create plant';
          state.isLoading = false;
        });
        throw error;
      }
    },

    updatePlant: async (plantId: string, updates: Partial<Plant>) => {
      try {
        console.log('[PLANT STORE] Updating plant:', plantId);
        await plantService.updatePlant(plantId, updates);

        set((state) => {
          const index = state.plants.findIndex((plant) => plant.id === plantId);
          if (index !== -1) {
            state.plants[index] = { ...state.plants[index], ...updates };
          }
          
          if (state.selectedPlant && state.selectedPlant.id === plantId) {
            state.selectedPlant = { ...state.selectedPlant, ...updates };
          }
        });

        console.log('[PLANT STORE] Plant updated successfully');
      } catch (error) {
        console.error('[PLANT STORE] Error updating plant:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update plant';
        });
        throw error;
      }
    },

    deletePlant: async (plantId: string) => {
      try {
        console.log('[PLANT STORE] Deleting plant:', plantId);
        await plantService.deletePlant(plantId);

        set((state) => {
          state.plants = state.plants.filter((plant) => plant.id !== plantId);
          
          if (state.selectedPlant && state.selectedPlant.id === plantId) {
            state.selectedPlant = null;
          }
        });

        console.log('[PLANT STORE] Plant deleted successfully');
      } catch (error) {
        console.error('[PLANT STORE] Error deleting plant:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to delete plant';
        });
        throw error;
      }
    },

    setSelectedPlant: (plant: Plant | null) => {
      set((state) => {
        state.selectedPlant = plant;
      });
    },

    sendChatMessage: async (plantId: string, content: string, userId: string) => {
      try {
        console.log('[PLANT STORE] Sending chat message to plant:', plantId);

        // Create user message
        const userMessage: Omit<ChatMessage, 'id'> = {
          plantId,
          userId,
          sender: 'user',
          content,
          timestamp: new Date(),
          createdAt: new Date(),
        };

        await plantService.addChatMessage(plantId, userMessage);

        // TODO: Generate AI response here
        // For now, just add a simple response
        const aiResponse: Omit<ChatMessage, 'id'> = {
          plantId,
          userId,
          sender: 'plant',
          content: `¡Gracias por tu mensaje! Como una planta, aprecio mucho tu atención. 🌱`,
          emotion: 'alegre',
          timestamp: new Date(),
          createdAt: new Date(),
        };

        await plantService.addChatMessage(plantId, aiResponse);

        // Update local state if this is the selected plant
        const updatedPlant = await plantService.getPlantById(plantId, true);
        if (updatedPlant) {
          set((state) => {
            if (state.selectedPlant && state.selectedPlant.id === plantId) {
              state.selectedPlant = updatedPlant;
            }
            
            const plantIndex = state.plants.findIndex((p) => p.id === plantId);
            if (plantIndex !== -1) {
              state.plants[plantIndex] = updatedPlant;
            }
          });
        }

        console.log('[PLANT STORE] Chat message sent successfully');
      } catch (error) {
        console.error('[PLANT STORE] Error sending chat message:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to send message';
        });
        throw error;
      }
    },

    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },
  }))
);

export default usePlantStore; 