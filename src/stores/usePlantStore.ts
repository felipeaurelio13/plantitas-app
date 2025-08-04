import { create } from 'zustand';
import { produce } from 'immer';
import { Plant, ChatMessage } from '../schemas';
import { PlantService } from '../services/plantService';
import { gardenCacheService } from '../services/gardenCacheService';

// Instantiate services
const plantService = new PlantService();

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastOperation?: string;
}

interface OperationStates {
  add: LoadingState;
  update: LoadingState;
  delete: LoadingState;
  addImage: LoadingState;
  chat: LoadingState;
}

interface PlantState {
  plants: Plant[];
  operationStates: OperationStates;
  selectedPlantId: string | null;
}

interface PlantActions {
  getPlantById: (plantId: string) => Plant | undefined;
  addPlant: (
    imageDataUrl: string,
    location: string,
    userId: string
  ) => Promise<Plant | undefined>;
  updatePlant: (plant: Plant, userId: string) => Promise<void>;
  deletePlant: (plantId: string, userId: string) => Promise<void>;
  addChatMessage: (
    plantId: string,
    userMessage: string,
    userId: string
  ) => Promise<void>;
  addPlantImage: (
    plantId: string,
    imageDataUrl: string,
    userId: string
  ) => Promise<void>;
  selectPlant: (id: string | null) => void;
  setPlant: (plant: Plant) => void;
  clearError: (operation?: keyof OperationStates) => void;
  clearPlants: () => void;
  getOperationState: (operation: keyof OperationStates) => LoadingState;
}

type PlantStore = PlantState & PlantActions;

const initialLoadingState: LoadingState = {
  isLoading: false,
  error: null,
};

export const usePlantStore = create<PlantStore>((set, get) => ({
  plants: [],
  operationStates: {
    add: { ...initialLoadingState },
    update: { ...initialLoadingState },
    delete: { ...initialLoadingState },
    addImage: { ...initialLoadingState },
    chat: { ...initialLoadingState },
  },
  selectedPlantId: null,

  getOperationState: (operation) => get().operationStates[operation],

  getPlantById: (plantId) => {
    if (import.meta.env.DEV) {
      console.log('[usePlantStore] Solicitando planta con ID:', plantId);
      console.log('[usePlantStore] Estado actual de `plants`:', get().plants);
    }
    return get().plants.find((p) => p.id === plantId);
  },

  setPlant: (plant) => {
    set(
      produce((state: PlantState) => {
        const index = state.plants.findIndex((p) => p.id === plant.id);
        if (index !== -1) {
          // If plant exists, update it
          state.plants[index] = plant;
        } else {
          // If plant doesn't exist, add it
          state.plants.push(plant);
        }
      })
    );
  },

  addPlant: async (imageDataUrl, location, userId) => {
    set(produce((state: PlantState) => {
      state.operationStates.add.isLoading = true;
      state.operationStates.add.error = null;
      state.operationStates.add.lastOperation = 'addPlant';
    }));

    try {
      const newPlant = await plantService.addPlantFromAnalysis(
        userId,
        imageDataUrl,
        location
      );

      set(produce((state: PlantState) => {
        state.plants.unshift(newPlant);
        state.operationStates.add.isLoading = false;
      }));

      gardenCacheService.invalidateOnPlantChange(userId);
      return newPlant;
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Failed to add plant';
      set(produce((state: PlantState) => {
        state.operationStates.add.isLoading = false;
        state.operationStates.add.error = error;
      }));
      throw e;
    }
  },

  updatePlant: async (plantToUpdate, userId) => {
    set(produce((state: PlantState) => {
      state.operationStates.update.isLoading = true;
      state.operationStates.update.error = null;
      state.operationStates.update.lastOperation = `updatePlant-${plantToUpdate.id}`;
    }));

    try {
      const updatedPlant = await plantService.updatePlant(plantToUpdate, userId);
      set(produce((state: PlantState) => {
        const index = state.plants.findIndex((p) => p.id === updatedPlant.id);
        if (index !== -1) {
          state.plants[index] = updatedPlant;
        }
        state.operationStates.update.isLoading = false;
      }));

      gardenCacheService.invalidateOnPlantChange(userId);
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Failed to update plant';
      set(produce((state: PlantState) => {
        state.operationStates.update.isLoading = false;
        state.operationStates.update.error = error;
      }));
      throw e;
    }
  },

  deletePlant: async (plantId, userId) => {
    set(produce((state: PlantState) => {
      state.operationStates.delete.isLoading = true;
      state.operationStates.delete.error = null;
      state.operationStates.delete.lastOperation = `deletePlant-${plantId}`;
    }));

    try {
      await plantService.deletePlant(plantId, userId);
      set(produce((state: PlantState) => {
        state.plants = state.plants.filter((p) => p.id !== plantId);
        state.operationStates.delete.isLoading = false;
      }));

      gardenCacheService.invalidateOnPlantChange(userId);
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Failed to delete plant';
      set(produce((state: PlantState) => {
        state.operationStates.delete.isLoading = false;
        state.operationStates.delete.error = error;
      }));
      throw e;
    }
  },

  addChatMessage: async (plantId, userMessageContent, userId) => {
    set(produce((state: PlantState) => {
      state.operationStates.chat.isLoading = true;
      state.operationStates.chat.error = null;
      state.operationStates.chat.lastOperation = `addChatMessage-${plantId}`;
    }));

    const plant = get().getPlantById(plantId);
    if (!plant) {
      set(produce((state: PlantState) => {
        state.operationStates.chat.isLoading = false;
        state.operationStates.chat.error = 'Plant not found to add message';
      }));
      return;
    }

    const tempUserMessage: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      sender: 'user',
      content: userMessageContent,
      timestamp: new Date(),
      // No context para el usuario
    };

    // Optimistic update
    set(produce((state: PlantState) => {
      state.plants.find(p => p.id === plantId)?.chatHistory.push(tempUserMessage);
    }));

    try {
      const [savedUserMessage, savedPlantMessage] = await plantService.sendChatMessageAndGetResponse(
        plant,
        {
          sender: 'user',
          content: userMessageContent,
          timestamp: tempUserMessage.timestamp,
          // No context para el usuario
        },
        userId
      );

      // Replace optimistic update with real data
      set(produce((state: PlantState) => {
        const targetPlant = state.plants.find(p => p.id === plantId);
        if (targetPlant) {
          // Remove temp message and add persisted ones
          targetPlant.chatHistory = [
            ...targetPlant.chatHistory.filter(m => m.id !== tempUserMessage.id),
            savedUserMessage,
            savedPlantMessage
          ];
        }
        state.operationStates.chat.isLoading = false;
      }));
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Failed to send message';
      set(produce((state: PlantState) => {
        state.operationStates.chat.isLoading = false;
        state.operationStates.chat.error = error;
      }));
      // Optionally revert optimistic update or show error in chat
    }
  },
  
  addPlantImage: async (plantId, imageDataUrl, userId) => {
    set(produce((state: PlantState) => {
      state.operationStates.addImage.isLoading = true;
      state.operationStates.addImage.error = null;
      state.operationStates.addImage.lastOperation = `addImage-${plantId}`;
    }));

    try {
      const newImage = await plantService.addPlantImage(
        plantId,
        { url: imageDataUrl, timestamp: new Date(), isProfileImage: false },
        userId
      );
      set(produce((state: PlantState) => {
        const plant = state.plants.find(p => p.id === plantId);
        if(plant) {
          plant.images.push(newImage);
        }
        state.operationStates.addImage.isLoading = false;
      }));
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Failed to add image';
      set(produce((state: PlantState) => {
        state.operationStates.addImage.isLoading = false;
        state.operationStates.addImage.error = error;
      }));
      throw e;
    }
  },

  selectPlant: (id) => set({ selectedPlantId: id }),
  
  clearError: (operation) => {
    if (operation) {
      set(produce((state: PlantState) => {
        state.operationStates[operation].error = null;
      }));
    } else {
      // Clear all operation errors
      set(produce((state: PlantState) => {
        Object.keys(state.operationStates).forEach(key => {
          state.operationStates[key as keyof OperationStates].error = null;
        });
      }));
    }
  },

  clearPlants: () => set({ plants: [], selectedPlantId: null }),
})); 