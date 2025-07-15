import { create } from 'zustand';
import { produce } from 'immer';
import { Plant, ChatMessage } from '../schemas';
import { PlantService } from '../services/plantService';
import { analyzeImage } from '../services/aiService';
import { parseError, logError } from '../lib/errorHandling';

// Instantiate services
const plantService = new PlantService();

interface PlantState {
  plants: Plant[];
  isLoading: boolean;
  error: string | null;
  selectedPlantId: string | null; // Keep UI state
}

interface PlantActions {
  // loadPlants: (userId: string) => Promise<void>; // Removed
  getPlantById: (plantId: string) => Plant | undefined;
  createPlantFromImage: (
    imageDataUrl: string,
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
  clearError: () => void;
  clearPlants: () => void;
}

type PlantStore = PlantState & PlantActions;

export const usePlantStore = create<PlantStore>((set, get) => ({
  plants: [],
  isLoading: false,
  error: null,
  selectedPlantId: null,

  // loadPlants: async (userId) => { ... }, // Removed

  getPlantById: (plantId) => {
    console.log('[usePlantStore] Solicitando planta con ID:', plantId);
    console.log('[usePlantStore] Estado actual de `plants`:', get().plants);
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

  createPlantFromImage: async (imageDataUrl, userId) => {
    try {
      const analysis = await analyzeImage(imageDataUrl);

      // Create a new plant object from the analysis
      const newPlantData: Omit<Plant, 'id'> = {
        name: analysis.commonName || 'Nueva Planta',
        species: analysis.species,
        variety: analysis.variety ?? undefined,
        nickname: `Mi ${analysis.commonName || 'Planta'}`,
        location: 'Interior',
        dateAdded: new Date(),
        healthScore: analysis.health.confidence,
        careProfile: analysis.careProfile,
        personality: analysis.personality,
        images: [],
        chatHistory: [],
        notifications: [],
      };

      const createdPlant = await plantService.createPlant(newPlantData, userId);
      
      // Add image to the created plant
      const imageUrl = await plantService.addPlantImage(
        createdPlant.id,
        { url: imageDataUrl, timestamp: new Date(), isProfileImage: true },
        userId
      );
      createdPlant.images.push(imageUrl);

      set(
        produce((state: PlantState) => {
          state.plants.unshift(createdPlant);
        })
      );
      return createdPlant;
    } catch (e) {
      logError(e, 'createPlantFromImage');
      
      // Use the error handling utility to provide better error messages
      const errorInfo = parseError(e);
      throw new Error(errorInfo.userFriendlyMessage);
    }
  },

  updatePlant: async (plantToUpdate, userId) => {
    // set({ isLoading: true, error: null }); // Removed
    try {
      const updatedPlant = await plantService.updatePlant(plantToUpdate, userId);
      set(
        produce((state: PlantState) => {
          const index = state.plants.findIndex((p) => p.id === updatedPlant.id);
          if (index !== -1) {
            state.plants[index] = updatedPlant;
          }
          // state.isLoading = false; // Removed
        })
      );
    } catch (e) {
      // const error = e instanceof Error ? e.message : 'Failed to update plant';
      // set({ error, isLoading: false }); // Removed
      console.error(e);
      throw e;
    }
  },

  deletePlant: async (plantId, userId) => {
    // set({ isLoading: true, error: null }); // Removed
    try {
      await plantService.deletePlant(plantId, userId);
      set(
        produce((state: PlantState) => {
          state.plants = state.plants.filter((p) => p.id !== plantId);
          // state.isLoading = false; // Removed
        })
      );
    } catch (e) {
      // const error = e instanceof Error ? e.message : 'Failed to delete plant';
      // set({ error, isLoading: false }); // Removed
      console.error(e);
      throw e;
    }
  },

  addChatMessage: async (plantId, userMessageContent, userId) => {
    set({ isLoading: true, error: null });
    const plant = get().getPlantById(plantId);
    if (!plant) {
      set({ isLoading: false, error: 'Plant not found to add message' });
      return;
    }

    const tempUserMessage: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      sender: 'user',
      content: userMessageContent,
      timestamp: new Date(),
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
          timestamp: tempUserMessage.timestamp
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
        state.isLoading = false;
      }));
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Failed to send message';
      console.error(error);
      set({ isLoading: false, error });
      // Optionally revert optimistic update or show error in chat
    }
  },
  
  addPlantImage: async (plantId, imageDataUrl, userId) => {
    // set({ isLoading: true, error: null }); // Removed
    try {
      const newImage = await plantService.addPlantImage(
        plantId,
        { url: imageDataUrl, timestamp: new Date(), isProfileImage: false },
        userId
      );
      set(
        produce((state: PlantState) => {
          const plant = state.plants.find(p => p.id === plantId);
          if(plant) {
            plant.images.push(newImage);
          }
          // state.isLoading = false; // Removed
        })
      );
    } catch (e) {
      // const error = e instanceof Error ? e.message : 'Failed to add image';
      // set({ error, isLoading: false }); // Removed
      console.error(e);
      throw e;
    }
  },

  selectPlant: (id) => set({ selectedPlantId: id }),
  
  clearError: () => { /* This can be removed or do nothing */ },

  clearPlants: () => set({ plants: [], selectedPlantId: null }), // isLoading removed
})); 