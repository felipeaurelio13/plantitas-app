import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../stores/useAuthStore';
import plantService from '../services/plantService';
import { toast } from 'sonner';
import aiService from '../services/aiService'; // Use default import for aiService
import { Plant } from '../schemas';

export const usePlantImageMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const addPlantImageMutation = useMutation({
    mutationFn: async ({ plantId, imageBase64, isProfileImage }: {
      plantId: string;
      imageBase64: string;
      isProfileImage?: boolean;
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated.');
      }
      // Image size validation should be handled within plantService.addPlantImage if needed
      return await plantService.addPlantImage(plantId, user.id, imageBase64, isProfileImage);
    },
    onSuccess: (newImage) => {
      toast.success('Imagen de planta agregada con éxito!');
      queryClient.invalidateQueries({ queryKey: ['plant', newImage.plantId] });
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
    onError: (error) => {
      toast.error('Error al agregar imagen', {
        description: error.message,
      });
      console.error('Error adding plant image:', error);
    },
  });

  const analyzePlantImageMutation = useMutation({
    mutationFn: async ({ plant, imageId, imageBase64 }: {
      plant: Plant;
      imageId: string;
      imageBase64: string;
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated.');
      }
      if (!plant?.id) {
        throw new Error('Plant ID is required for analysis.');
      }

      // Pass imageBase64 to aiService.analyzeImage
      const analysisResult = await aiService.analyzeImage(imageBase64); // Use aiService.analyzeImage

      // Update plant health score and image health analysis in Firestore
      await plantService.updatePlantHealthScore(plant.id, imageId, analysisResult.overallHealthScore, analysisResult.healthAnalysis);
      return analysisResult;
    },
    onSuccess: (analysisResult, variables) => {
      toast.success('Análisis de salud completado!');
      queryClient.invalidateQueries({ queryKey: ['plant', variables.plant.id] });
      queryClient.invalidateQueries({ queryKey: ['plants'] }); // Invalidate list for potential health score changes
    },
    onError: (error) => {
      toast.error('Error al analizar imagen', {
        description: error.message,
      });
      console.error('Error analyzing plant image:', error);
    },
  });

  const setProfileImageMutation = useMutation({
    mutationFn: async ({ plantId, imageId }: { plantId: string; imageId: string }) => {
      if (!user?.id) {
        throw new Error('User not authenticated.');
      }
      await plantService.setProfileImage(plantId, imageId);
    },
    onSuccess: (data, variables) => {
      toast.success('Imagen de perfil actualizada!');
      queryClient.invalidateQueries({ queryKey: ['plant', variables.plantId] });
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
    onError: (error) => {
      toast.error('Error al establecer imagen de perfil', {
        description: error.message,
      });
      console.error('Error setting profile image:', error);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async ({ plantId, imageId }: { plantId: string; imageId: string }) => {
      if (!user?.id) {
        throw new Error('User not authenticated.');
      }
      await plantService.deleteImage(plantId, imageId);
    },
    onSuccess: (data, variables) => {
      toast.success('Imagen eliminada con éxito!');
      queryClient.invalidateQueries({ queryKey: ['plant', variables.plantId] });
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
    onError: (error) => {
      toast.error('Error al eliminar imagen', {
        description: error.message,
      });
      console.error('Error deleting image:', error);
    },
  });

  return {
    addPlantImageMutation,
    isAddingPlantImage: addPlantImageMutation.isPending,
    analyzePlantImageMutation,
    isAnalyzingPlantImage: analyzePlantImageMutation.isPending,
    setProfileImageMutation,
    isSettingProfileImage: setProfileImageMutation.isPending,
    deleteImageMutation,
    isDeletingImage: deleteImageMutation.isPending,
  };
}; 