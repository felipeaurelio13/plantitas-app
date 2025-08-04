import { useMutation, useQueryClient } from '@tanstack/react-query';
import usePlantStore from '../stores/usePlantStore';
import useAuthStore from '../stores/useAuthStore';
import plantService from '../services/plantService';
import { Plant } from '../schemas';

export const usePlantMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const loadPlants = usePlantStore((state) => state.loadPlants);

  const addPlantMutation = useMutation({
    mutationFn: async ({
      imageDataUrl,
      location,
    }: {
      imageDataUrl: string;
      location: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Create basic plant data
      const plantData: Omit<Plant, 'id'> = {
        userId: user.id,
        name: 'Nueva Planta',
        species: 'Desconocida',
        location,
        healthScore: 85,
        careProfile: {
          wateringFrequency: 7,
          sunlightRequirement: 'medium',
          humidityPreference: 'medium',
          temperatureRange: { min: 15, max: 25 },
          fertilizingFrequency: 30,
          soilType: 'universal',
        },
        dateAdded: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return await plantService.createPlant(plantData);
    },
    onSuccess: () => {
      if (user?.id) {
        loadPlants(user.id);
        queryClient.invalidateQueries({ queryKey: ['plants'] });
      }
    },
  });

  const updatePlantMutation = useMutation({
    mutationFn: async ({
      plantId,
      updates,
    }: {
      plantId: string;
      updates: Partial<Plant>;
    }) => {
      return await plantService.updatePlant(plantId, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plant', variables.plantId] });
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
  });

  const deletePlantMutation = useMutation({
    mutationFn: async (plantId: string) => {
      return await plantService.deletePlant(plantId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
  });

  return {
    addPlant: addPlantMutation.mutateAsync,
    updatePlant: updatePlantMutation.mutateAsync,
    deletePlant: deletePlantMutation.mutateAsync,
    isAdding: addPlantMutation.isPending,
    isUpdating: updatePlantMutation.isPending,
    isDeleting: deletePlantMutation.isPending,
  };
}; 