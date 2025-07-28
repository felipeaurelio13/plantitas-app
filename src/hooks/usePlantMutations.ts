import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../stores/useAuthStore';
import { usePlantStore } from '../stores/usePlantStore';
import { Plant } from '../schemas';
import { healthDiagnosisService } from '../services/healthDiagnosisService';
import { useToast } from '../components/ui/Toast';

export const usePlantMutations = () => {
  const queryClient = useQueryClient();
  const { addPlant, updatePlant, deletePlant } = usePlantStore.getState();
  const user = useAuthStore((state: any) => state.user);
  const userId = user?.id;
  const { addToast } = useToast();

  const createPlantMutation = useMutation({
    mutationFn: (variables: { imageDataUrl: string; location: string }) => {
      if (!userId) throw new Error('User not authenticated');
      const { imageDataUrl, location } = variables;
      return addPlant(imageDataUrl, location, userId);
    },
    onSuccess: (_newPlant) => {
      queryClient.invalidateQueries({ queryKey: ['plants', userId] });
      // The toast notification will be handled in the component calling the mutation.
    },
    onError: (error) => {
      console.error('Failed to create plant:', error);
      // The toast notification will be handled in the component calling the mutation.
    },
  });

  const updatePlantMutation = useMutation({
    mutationFn: (plant: Plant) => {
      if (!userId) throw new Error('User not authenticated');
      return updatePlant(plant, userId);
    },
    onMutate: async (updatedPlant: Plant) => {
      await queryClient.cancelQueries({ queryKey: ['plants', userId] });
      const previousPlants = queryClient.getQueryData<Plant[]>(['plants', userId]);
      if (previousPlants) {
        queryClient.setQueryData<Plant[]>(
          ['plants', userId],
          previousPlants.map((p) => (p.id === updatedPlant.id ? updatedPlant : p))
        );
      }
      return { previousPlants };
    },
    onError: (_err, _updatedPlant, context) => {
      if (context?.previousPlants) {
        queryClient.setQueryData(['plants', userId], context.previousPlants);
      }
      // The toast notification can be handled in the component.
    },
    onSettled: (updatedPlant) => {
      queryClient.invalidateQueries({ queryKey: ['plants', userId] });
      if (updatedPlant) {
        // Optimistic updates make it feel instant.
      }
    },
  });

  const updatePlantHealthMutation = useMutation({
    mutationFn: async ({ plant, userId }: { plant: Plant; userId: string }) => {
      console.log('🩺 [Mutation] Iniciando actualización de diagnóstico...');
      
      // 1. Obtener nuevo diagnóstico de IA
      const diagnosis = await healthDiagnosisService.updatePlantHealthDiagnosis(plant);
      
      // 2. Actualizar en la base de datos
      await healthDiagnosisService.updatePlantHealthScore(
        plant.id,
        userId,
        diagnosis.healthScore,
        diagnosis.healthAnalysis,
        diagnosis.updatedImage.id
      );
      
      console.log('✅ [Mutation] Diagnóstico actualizado exitosamente');
      return diagnosis;
    },
    onSuccess: (diagnosis, { plant }) => {
      // Invalidar queries para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['plants'] });
      queryClient.invalidateQueries({ queryKey: ['plant', plant.id] });
      
              addToast({
          type: 'success',
          title: 'Diagnóstico Actualizado',
          message: `Nuevo estado de salud: ${diagnosis.healthScore}%`
        });
    },
    onError: (error: Error) => {
      console.error('💥 [Mutation] Error actualizando diagnóstico:', error);
              addToast({
          type: 'error',
          title: 'Error en Diagnóstico',
          message: error.message
        });
    },
  });

  const deletePlantMutation = useMutation({
    mutationFn: (plantId: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deletePlant(plantId, userId);
    },
    onMutate: async (plantId: string) => {
      await queryClient.cancelQueries({ queryKey: ['plants', userId] });
      const previousPlants = queryClient.getQueryData<Plant[]>(['plants', userId]);
      if (previousPlants) {
        queryClient.setQueryData<Plant[]>(
          ['plants', userId],
          previousPlants.filter((p) => p.id !== plantId)
        );
      }
      return { previousPlants };
    },
    onError: (_err, _plantId, context) => {
      if (context?.previousPlants) {
        queryClient.setQueryData(['plants', userId], context.previousPlants);
      }
      // The toast notification can be handled in the component.
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['plants', userId] });
    },
  });

  return {
    createPlant: createPlantMutation.mutate,
    isCreatingPlant: createPlantMutation.isPending,
    updatePlant: updatePlantMutation.mutate,
    isUpdatingPlant: updatePlantMutation.isPending,
    updatePlantHealthMutation: updatePlantHealthMutation.mutate,
    isUpdatingPlantHealth: updatePlantHealthMutation.isPending,
    deletePlant: deletePlantMutation.mutate,
    isDeletingPlant: deletePlantMutation.isPending,
  };
}; 