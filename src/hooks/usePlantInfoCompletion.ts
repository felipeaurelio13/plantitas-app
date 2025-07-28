import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completePlantInfo } from '../services/aiService';
import { PlantService } from '../services/plantService';
import useAuthStore from '../stores/useAuthStore';
import { useToast } from '../components/ui/Toast';

const plantService = new PlantService();

export const usePlantInfoCompletion = () => {
  const [isCompleting, setIsCompleting] = useState(false);
  const queryClient = useQueryClient();
  const user = useAuthStore((state: any) => state.user);
  const { addToast } = useToast();

  const completePlantInfoMutation = useMutation({
    mutationFn: async ({ 
      plantId, 
      species, 
      commonName 
    }: { 
      plantId: string; 
      species: string; 
      commonName?: string; 
    }) => {
      if (!user) throw new Error('User not authenticated');

      setIsCompleting(true);
      
      // Console log del inicio del proceso
      if (import.meta.env.DEV) {
        console.log('🤖 [COMPLETAR IA] Iniciando completado automático de información...');
        console.log('📋 [COMPLETAR IA] Datos de entrada:', {
          plantId,
          species,
          commonName: commonName || 'No especificado'
        });
      }

      // Toast de inicio
      addToast({
        type: 'info',
        title: '🤖 Completando información',
        message: `Consultando IA para ${commonName || species}...`,
        duration: 3000
      });
      
      try {
        if (import.meta.env.DEV) console.log('🔄 [COMPLETAR IA] Consultando IA para generar información faltante...');
        
        // Llamar a la IA para obtener la información faltante
        const aiResult = await completePlantInfo(species, commonName);
        
        if (import.meta.env.DEV) console.log('✅ [COMPLETAR IA] IA respondió exitosamente:', {
          ambiente: aiResult.plantEnvironment,
          luz: aiResult.lightRequirements,
          tieneDescripcion: !!aiResult.description,
          cantidadDatosCuriosos: aiResult.funFacts?.length || 0
        });
        
        if (import.meta.env.DEV) console.log('💾 [COMPLETAR IA] Guardando información en base de datos...');
        
        // Actualizar la planta en la base de datos
        const updatedPlant = await plantService.updatePlantInfo(plantId, user.id, {
          plantEnvironment: aiResult.plantEnvironment,
          lightRequirements: aiResult.lightRequirements,
          description: aiResult.description,
          funFacts: aiResult.funFacts,
        });

        if (import.meta.env.DEV) {
          console.log('🎉 [COMPLETAR IA] ¡Proceso completado exitosamente!');
          console.log('📊 [COMPLETAR IA] Datos actualizados:', {
            plantId: updatedPlant.id,
            ambiente: updatedPlant.plantEnvironment,
            necesidadesLuz: updatedPlant.lightRequirements
          });
        }

        return updatedPlant;
      } catch (error) {
        console.error('❌ [COMPLETAR IA] Error durante el proceso:', error);
        throw error;
      } finally {
        setIsCompleting(false);
      }
    },
    onSuccess: (updatedPlant) => {
      console.log('🔄 [COMPLETAR IA] Refrescando datos en cache...');
      
      // Toast de éxito
      addToast({
        type: 'success',
        title: '✅ ¡Información completada!',
        message: `Se agregaron datos de ambiente y luz para ${updatedPlant.name}`,
        duration: 5000
      });
      
      // Invalidar queries para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['plant', updatedPlant.id] });
      queryClient.invalidateQueries({ queryKey: ['plants'] });
      
      console.log('✅ [COMPLETAR IA] Cache actualizado correctamente');
    },
    onError: (error) => {
      console.error('💥 [COMPLETAR IA] Error final en la operación:', error);
      
      // Toast de error
      addToast({
        type: 'error',
        title: '❌ Error al completar información',
        message: 'No se pudo obtener los datos de IA. Intenta de nuevo.',
        duration: 7000
      });
      
      setIsCompleting(false);
    },
  });

  const completeInfo = (plantId: string, species: string, commonName?: string) => {
    return completePlantInfoMutation.mutate({ plantId, species, commonName });
  };

  return {
    completeInfo,
    isCompleting: isCompleting || completePlantInfoMutation.isPending,
    error: completePlantInfoMutation.error,
    isSuccess: completePlantInfoMutation.isSuccess,
  };
}; 