import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/useAuthStore';
import { usePlantStore } from '../stores/usePlantStore';
import { plantService } from '../services/plantService';
import { uploadImage } from '../services/imageService';
import { analyzeImage } from '../services/aiService';
import { useToast } from '../components/ui/Toast';

export const usePlantImageMutations = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const { addToast } = useToast();

  const addPlantImageMutation = useMutation({
    mutationFn: async ({ 
      plantId, 
      imageDataUrl, 
      note 
    }: { 
      plantId: string; 
      imageDataUrl: string; 
      note?: string;
    }) => {
      if (!userId) throw new Error('User not authenticated');

      console.log('🖼️ [Image] Iniciando proceso de subida de imagen...');
      
      // Paso 1: Analizar la imagen con IA para obtener diagnóstico de salud
      console.log('🔬 [Image] Analizando imagen con IA...');
      const analysis = await analyzeImage(imageDataUrl);
      
      // Paso 2: Subir imagen a Supabase Storage
      console.log('☁️ [Image] Subiendo imagen a Storage...');
      const imageUrl = await uploadImage(
        imageDataUrl,
        'plant-images',
        `${userId}/${plantId}`
      );
      
      // Paso 3: Guardar registro de imagen en base de datos
      console.log('💾 [Image] Guardando registro en base de datos...');
      const savedImage = await plantService.addPlantImage(
        plantId,
        {
          url: imageUrl,
          timestamp: new Date(),
          isProfileImage: false, // Las nuevas imágenes no son de perfil por defecto
          healthAnalysis: analysis.health,
        },
        userId
      );
      
      // Paso 4: Actualizar el health score de la planta si es necesario
      if (analysis.health?.confidence) {
        console.log('🏥 [Image] Actualizando health score de la planta...');
        await plantService.updatePlantHealthScore(
          plantId,
          userId,
          analysis.health.confidence,
          analysis.health,
          savedImage.id
        );
      }
      
      console.log('✅ [Image] Proceso completado exitosamente');
      
      return {
        image: savedImage,
        analysis,
        note
      };
    },
    onSuccess: (result, variables) => {
      // Invalidar queries para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['plants'] });
      queryClient.invalidateQueries({ queryKey: ['plant', variables.plantId] });
      
      // Actualizar el store local
      const { setPlant } = usePlantStore.getState();
      const currentPlant = usePlantStore.getState().getPlantById(variables.plantId);
      
      if (currentPlant) {
        const updatedPlant = {
          ...currentPlant,
          images: [...currentPlant.images, result.image],
          healthScore: result.analysis.health?.confidence || currentPlant.healthScore
        };
        setPlant(updatedPlant);
      }

      addToast({
        type: 'success',
        title: 'Nueva imagen añadida',
        message: `Análisis completado. Salud actual: ${result.analysis.health?.confidence?.toFixed(0) || 'N/A'}%`
      });
    },
    onError: (error: Error) => {
      console.error('💥 [Image] Error en proceso de subida:', error);
      
      addToast({
        type: 'error',
        title: 'Error al agregar imagen',
        message: error.message
      });
    },
  });

  const setProfileImageMutation = useMutation({
    mutationFn: async ({ 
      plantId, 
      imageId 
    }: { 
      plantId: string; 
      imageId: string; 
    }) => {
      if (!userId) throw new Error('User not authenticated');
      
      console.log('🖼️ [Profile] Cambiando imagen de perfil...');
      
      await plantService.setProfileImage(plantId, imageId, userId);
      
      return { plantId, imageId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['plants'] });
      queryClient.invalidateQueries({ queryKey: ['plant', result.plantId] });
      
      addToast({
        type: 'success',
        title: 'Imagen de perfil actualizada',
        message: 'La imagen principal de la planta ha sido cambiada'
      });
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        title: 'Error al cambiar imagen de perfil',
        message: error.message
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async ({ 
      plantId, 
      imageId 
    }: { 
      plantId: string; 
      imageId: string; 
    }) => {
      if (!userId) throw new Error('User not authenticated');
      
      console.log('🗑️ [Image] Eliminando imagen...');
      
      await plantService.deleteImage(imageId, userId);
      
      return { plantId, imageId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['plants'] });
      queryClient.invalidateQueries({ queryKey: ['plant', result.plantId] });
      
      addToast({
        type: 'success',
        title: 'Imagen eliminada',
        message: 'La imagen ha sido eliminada de tu planta'
      });
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        title: 'Error al eliminar imagen',
        message: error.message
      });
    },
  });

  return {
    addPlantImage: addPlantImageMutation.mutate,
    isAddingImage: addPlantImageMutation.isPending,
    
    setProfileImage: setProfileImageMutation.mutate,
    isSettingProfileImage: setProfileImageMutation.isPending,
    
    deleteImage: deleteImageMutation.mutate,
    isDeletingImage: deleteImageMutation.isPending,
  };
}; 