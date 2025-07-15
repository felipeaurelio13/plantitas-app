import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/useAuthStore';
import { usePlantStore } from '../stores/usePlantStore';
import { Plant } from '../schemas';

export const usePlantMutations = () => {
  const queryClient = useQueryClient();
  const { addPlant, updatePlant, deletePlant } = usePlantStore.getState();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;

  const createPlantMutation = useMutation({
    mutationFn: (imageDataUrl: string) => {
      if (!userId) throw new Error('User not authenticated');
      // TODO: Get location from the UI instead of hardcoding
      const location = 'Interior';
      return addPlant(imageDataUrl, location, userId);
    },
    onSuccess: (_newPlant) => {
      queryClient.invalidateQueries({ queryKey: ['plants', userId] });
      // The toast notification will be handled in the component calling the mutation.
      // alert(`¡"${newPlant?.name}" ha sido creada con éxito!`);
    },
    onError: (error) => {
      console.error('Failed to create plant:', error);
      // The toast notification will be handled in the component calling the mutation.
      // alert('No se pudo crear la planta. Por favor, inténtalo de nuevo.');
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
      // alert('No se pudo actualizar la planta. Se han restaurado los datos originales.');
    },
    onSettled: (updatedPlant) => {
      queryClient.invalidateQueries({ queryKey: ['plants', userId] });
      if (updatedPlant) {
        // We could alert on success here, but optimistic updates make it feel instant,
        // so an alert might be more disruptive than helpful.
      }
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
      // alert('No se pudo eliminar la planta. Se ha restaurado de la lista.');
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
    deletePlant: deletePlantMutation.mutate,
    isDeletingPlant: deletePlantMutation.isPending,
  };
}; 