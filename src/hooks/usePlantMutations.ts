import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/useAuthStore';
import { usePlantStore } from '../stores/usePlantStore';
import { Plant } from '../schemas';
import { useToast } from '../components/ui/Toast';

export const usePlantMutations = () => {
  const queryClient = useQueryClient();
  const { updatePlant, deletePlant, createPlantFromImage } = usePlantStore.getState();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const { addToast } = useToast();

  const createPlant = async (imageDataUrl: string) => {
    if (!userId) throw new Error('Usuario no autenticado');
    try {
      const newPlant = await createPlantFromImage(imageDataUrl, userId);
      queryClient.invalidateQueries({ queryKey: ['plants', userId] });
      addToast({
        type: 'success',
        title: '¡Planta creada con éxito!',
        message: `"${newPlant?.name}" ha sido agregada a tu jardín.`
      });
      return newPlant;
    } catch (error) {
      console.error('Failed to create plant:', error);
      throw error; // Re-throw to let the component handle it
    }
  };

  const isCreatingPlant = false; // We'll manage this state in the component

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
      addToast({
        type: 'error',
        title: 'Error al actualizar planta',
        message: 'No se pudo actualizar la planta. Se han restaurado los datos originales.'
      });
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
      addToast({
        type: 'error',
        title: 'Error al eliminar planta',
        message: 'No se pudo eliminar la planta. Se ha restaurado de la lista.'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['plants', userId] });
    },
  });

  return {
    createPlant,
    isCreatingPlant,
    updatePlant: updatePlantMutation.mutate,
    isUpdatingPlant: updatePlantMutation.isPending,
    deletePlant: deletePlantMutation.mutate,
    isDeletingPlant: deletePlantMutation.isPending,
  };
}; 