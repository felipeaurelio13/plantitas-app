import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import useAuthStore from '../stores/useAuthStore';
import { Plant } from '../schemas';
import aiService from '../services/aiService'; // Use default import for aiService
import plantService from '../services/plantService';
import { usePlantDetail } from './usePlantDetail';

export const usePlantInfoCompletion = () => {
  const queryClient = useQueryClient();
  const { _user } = useAuthStore();
  const { plant: _selectedPlant } = usePlantDetail(undefined);

  const completePlantInfoMutation = useMutation({
    mutationFn: async ({ plant, userId }: { plant: Plant; userId: string }) => {
      if (!userId) {
        throw new Error('User not authenticated.');
      }
      if (!plant?.id) {
        throw new Error('Plant ID is required to complete info.');
      }
      if (!plant.description && !plant.funFacts && !plant.plantEnvironment && !plant.lightRequirements) {
        throw new Error('No missing plant information to complete.');
      }

      const completedInfo = await aiService.completePlantInfo(plant.id, userId, {
        description: !plant.description,
        funFacts: !plant.funFacts || plant.funFacts.length === 0,
        plantEnvironment: !plant.plantEnvironment,
        lightRequirements: !plant.lightRequirements,
      });

      if (completedInfo) {
        // Merge the completed info with the existing plant data
        const updatedPlant = {
          ...plant,
          description: completedInfo.description || plant.description,
          funFacts: completedInfo.funFacts || plant.funFacts,
          plantEnvironment: completedInfo.plantEnvironment || plant.plantEnvironment,
          lightRequirements: completedInfo.lightRequirements || plant.lightRequirements,
        };
        await plantService.updatePlant(plant.id, updatedPlant);
        return updatedPlant;
      } else {
        throw new Error('Failed to complete plant information.');
      }
    },
    onSuccess: (updatedPlant) => {
      toast.success('Información de la planta completada con éxito!');
      // Invalidate plant detail query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['plant', updatedPlant.id] });
      queryClient.invalidateQueries({ queryKey: ['plants'] }); // Invalidate list for potential summary changes
    },
    onError: (error) => {
      toast.error('Error al completar información de la planta', {
        description: error.message,
      });
      console.error('Error completing plant info:', error);
    },
  });

  return {
    completePlantInfoMutation,
    isCompletingPlantInfo: completePlantInfoMutation.isPending,
  };
}; 