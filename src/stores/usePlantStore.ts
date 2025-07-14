import { create } from 'zustand';
import { Plant, PlantSchema, type PlantImage, type ChatMessage } from '../schemas';
import { plantService } from '../services/plantService';
import { notificationService } from '../services/notificationService';

interface PlantState {
  plants: Plant[];
  selectedPlant: Plant | null;
  loading: boolean;
  error: string | null;
}

interface PlantActions {
  setPlants: (plants: Plant[]) => void;
  setSelectedPlant: (plant: Plant | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addPlant: (plant: Plant) => void;
  updatePlant: (plant: Plant) => void;
  deletePlant: (plantId: string) => void;
  addPlantImage: (plantId: string, image: PlantImage) => void;
  addChatMessage: (plantId: string, message: ChatMessage) => void;
  
  // Async actions
  loadPlants: (userId: string) => Promise<void>;
  createPlant: (plantData: Omit<Plant, 'id'>, userId: string) => Promise<void>;
  updatePlantAsync: (plant: Plant, userId: string) => Promise<void>;
  deletePlantAsync: (plantId: string, userId: string) => Promise<void>;
  addPlantImageAsync: (plantId: string, imageData: Omit<PlantImage, 'id'>, userId: string) => Promise<void>;
  addChatMessageAsync: (plantId: string, messageData: Omit<ChatMessage, 'id'>, userId: string) => Promise<void>;
  getPlantById: (id: string) => Plant | undefined;
  refreshPlants: (userId: string) => Promise<void>;
}

type PlantStore = PlantState & PlantActions;

// Helper function to validate plant data
const validatePlant = (plant: any): Plant => {
  try {
    return PlantSchema.parse(plant);
  } catch (error) {
    console.error('Plant validation error:', error);
    throw new Error('Invalid plant data');
  }
};

// Helper function to validate plant array
const validatePlants = (plants: any[]): Plant[] => {
  return plants.map(validatePlant);
};

export const usePlantStore = create<PlantStore>((set, get) => ({
  // Initial state
  plants: [],
  selectedPlant: null,
  loading: false,
  error: null,

  // Sync actions
  setPlants: (plants) => set({ plants }),
  setSelectedPlant: (plant) => set({ selectedPlant: plant }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  addPlant: (plant) => 
    set((state) => ({ 
      plants: [...state.plants, plant] 
    })),
  
  updatePlant: (updatedPlant) =>
    set((state) => ({
      plants: state.plants.map(plant =>
        plant.id === updatedPlant.id ? updatedPlant : plant
      ),
      selectedPlant: state.selectedPlant?.id === updatedPlant.id ? updatedPlant : state.selectedPlant,
    })),
  
  deletePlant: (plantId) =>
    set((state) => ({
      plants: state.plants.filter(plant => plant.id !== plantId),
      selectedPlant: state.selectedPlant?.id === plantId ? null : state.selectedPlant,
    })),
  
  addPlantImage: (plantId, image) =>
    set((state) => ({
      plants: state.plants.map(plant =>
        plant.id === plantId
          ? { ...plant, images: [...plant.images, image] }
          : plant
      ),
      selectedPlant: state.selectedPlant?.id === plantId
        ? { ...state.selectedPlant, images: [...state.selectedPlant.images, image] }
        : state.selectedPlant,
    })),
  
  addChatMessage: (plantId, message) =>
    set((state) => ({
      plants: state.plants.map(plant =>
        plant.id === plantId
          ? { ...plant, chatHistory: [...plant.chatHistory, message] }
          : plant
      ),
      selectedPlant: state.selectedPlant?.id === plantId
        ? { ...state.selectedPlant, chatHistory: [...state.selectedPlant.chatHistory, message] }
        : state.selectedPlant,
    })),

  // Async actions
  loadPlants: async (userId: string) => {
    set({ loading: true, error: null });
    
    try {
      const rawPlants = await plantService.getUserPlants(userId);
      const validatedPlants = validatePlants(rawPlants);
      set({ plants: validatedPlants, loading: false });
    } catch (error: any) {
      console.error('Error loading plants:', error);
      set({ 
        error: error.message || 'Error loading plants',
        loading: false 
      });
    }
  },

  createPlant: async (plantData: Omit<Plant, 'id'>, userId: string) => {
    set({ loading: true, error: null });
    
    try {
      const rawNewPlant = await plantService.createPlant(plantData, userId);
      const validatedPlant = validatePlant(rawNewPlant);
      get().addPlant(validatedPlant);
      
      // Schedule initial notifications
      try {
        await notificationService.init();
        await notificationService.scheduleWateringReminder(validatedPlant);
        await notificationService.scheduleHealthCheckReminder(validatedPlant);
      } catch (notifError) {
        console.warn('Could not schedule notifications:', notifError);
      }
      
      set({ loading: false });
    } catch (error: any) {
      console.error('Error adding plant:', error);
      set({ 
        error: error.message || 'Error adding plant',
        loading: false 
      });
      throw error;
    }
  },

  updatePlantAsync: async (plant: Plant, userId: string) => {
    try {
      // Validate input plant
      const validatedInput = validatePlant(plant);
      const rawUpdatedPlant = await plantService.updatePlant(validatedInput, userId);
      const validatedUpdatedPlant = validatePlant(rawUpdatedPlant);
      get().updatePlant(validatedUpdatedPlant);
    } catch (error: any) {
      console.error('Error updating plant:', error);
      set({ error: error.message || 'Error updating plant' });
      throw error;
    }
  },

  deletePlantAsync: async (plantId: string, userId: string) => {
    try {
      await plantService.deletePlant(plantId, userId);
      get().deletePlant(plantId);
    } catch (error: any) {
      console.error('Error deleting plant:', error);
      set({ error: error.message || 'Error deleting plant' });
      throw error;
    }
  },

  addPlantImageAsync: async (plantId: string, imageData: Omit<PlantImage, 'id'>, userId: string) => {
    try {
      const newImage = await plantService.addPlantImage(plantId, imageData, userId);
      get().addPlantImage(plantId, newImage);
    } catch (error: any) {
      console.error('Error adding plant image:', error);
      set({ error: error.message || 'Error adding image' });
      throw error;
    }
  },

  addChatMessageAsync: async (plantId: string, messageData: Omit<ChatMessage, 'id'>, userId: string) => {
    try {
      const newMessage = await plantService.addChatMessage(plantId, messageData, userId);
      get().addChatMessage(plantId, newMessage);
    } catch (error: any) {
      console.error('Error adding chat message:', error);
      set({ error: error.message || 'Error adding message' });
      throw error;
    }
  },

  getPlantById: (id: string) => {
    return get().plants.find(plant => plant.id === id);
  },

  refreshPlants: async (userId: string) => {
    await get().loadPlants(userId);
  },
})); 