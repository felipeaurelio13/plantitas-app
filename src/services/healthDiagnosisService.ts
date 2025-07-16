import { supabase } from '../lib/supabase';
import { Plant } from '../schemas';

/**
 * Servicio dedicado para actualizar diagnósticos de salud de plantas
 */
export class HealthDiagnosisService {
  
  /**
   * Actualiza el diagnóstico de salud de una planta usando su imagen más reciente
   */
  async updatePlantHealthDiagnosis(plant: Plant): Promise<{
    healthScore: number;
    healthAnalysis: any;
    updatedImage: any;
  }> {
    console.log('🩺 [Health] Iniciando actualización de diagnóstico para:', plant.name);
    
    // Verificar que la planta tenga imágenes
    if (!plant.images || plant.images.length === 0) {
      throw new Error('Esta planta no tiene imágenes para analizar. Toma una foto primero.');
    }

    // Obtener la imagen más reciente
    const mostRecentImage = plant.images
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    console.log('📸 [Health] Analizando imagen más reciente:', {
      imageId: mostRecentImage.id,
      timestamp: mostRecentImage.timestamp,
      imageUrl: mostRecentImage.url.substring(0, 100) + '...'
    });

    // Obtener el JWT token del usuario autenticado
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.access_token) {
      console.error('💥 [Health] User session not available:', authError);
      throw new Error('Usuario no autenticado. Por favor inicia sesión nuevamente.');
    }

    // Verificar que la imagen sea accesible
    try {
      const testResponse = await fetch(mostRecentImage.url, { method: 'HEAD' });
      if (!testResponse.ok) {
        throw new Error(`Imagen no accesible: ${testResponse.status}`);
      }
    } catch (imageError) {
      console.error('💥 [Health] Error verificando acceso a imagen:', imageError);
      throw new Error('La imagen de la planta no está disponible. Intenta tomar una nueva foto.');
    }

    // Llamar a la nueva función específica de diagnóstico de salud
    console.log('🔬 [Health] Llamando a update-health-diagnosis...');
    
    try {
      const { data, error } = await supabase.functions.invoke('update-health-diagnosis', {
        body: { 
          imageUrl: mostRecentImage.url,
          plantName: plant.name,
          species: plant.species
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('💥 [Health] Error en función update-health-diagnosis:', error);
        throw new Error(`Error en análisis: ${error.message}`);
      }

      if (!data || !data.overallHealth) {
        console.error('💥 [Health] Datos incompletos del análisis:', data);
        throw new Error('El análisis no devolvió información de salud válida.');
      }

      console.log('🎯 [Health] Análisis de salud completado exitosamente:', {
        overallHealth: data.overallHealth,
        confidence: data.confidence,
        issuesCount: data.issues?.length || 0,
        recommendationsCount: data.recommendations?.length || 0
      });

      // Convertir el análisis cualitativo a un score numérico
      const healthScoreMap = {
        'excellent': 95,
        'good': 80,
        'fair': 60,
        'poor': 30
      };
      
      const newHealthScore = healthScoreMap[data.overallHealth as keyof typeof healthScoreMap] || data.confidence || 60;

      console.log('📊 [Health] Nuevo score de salud calculado:', {
        overallHealth: data.overallHealth,
        numericScore: newHealthScore,
        confidence: data.confidence
      });

      return {
        healthScore: newHealthScore,
        healthAnalysis: data,
        updatedImage: {
          ...mostRecentImage,
          healthAnalysis: data
        }
      };

    } catch (primaryError) {
      console.error('💥 [Health] Error en diagnóstico primario:', primaryError);
      
      // Fallback: Usar análisis existente si está disponible
      console.log('🔄 [Health] Intentando análisis de fallback...');
      
      try {
        // Si la imagen ya tiene análisis de salud, usarlo
        if (mostRecentImage.healthAnalysis && mostRecentImage.healthAnalysis.overallHealth) {
          console.log('🎯 [Health] Usando análisis existente de la imagen');
          
          const existingAnalysis = mostRecentImage.healthAnalysis;
          const healthScoreMap = {
            'excellent': 95,
            'good': 80,
            'fair': 60,
            'poor': 30
          };
          
          const fallbackScore = healthScoreMap[existingAnalysis.overallHealth as keyof typeof healthScoreMap] || 60;
          
          return {
            healthScore: fallbackScore,
            healthAnalysis: existingAnalysis,
            updatedImage: mostRecentImage
          };
        }
      } catch (fallbackError) {
        console.error('💥 [Health] Error en fallback:', fallbackError);
      }
      
      // Error final - no hay forma de obtener diagnóstico
      throw new Error('No se pudo actualizar el diagnóstico de salud. Verifica tu conexión a internet e intenta nuevamente.');
    }
  }

  /**
   * Actualiza el score de salud de una planta en la base de datos
   */
  async updatePlantHealthScore(
    plantId: string,
    userId: string,
    healthScore: number,
    healthAnalysis?: any,
    imageId?: string
  ): Promise<void> {
    try {
      console.log('🏥 [DB] Actualizando health score en BD:', {
        plantId,
        healthScore,
        hasAnalysis: !!healthAnalysis
      });

      // Actualizar el health score de la planta
      const { error: plantError } = await supabase
        .from('plants')
        .update({ health_score: healthScore })
        .eq('id', plantId)
        .eq('user_id', userId);

      if (plantError) {
        console.error('💥 [DB] Error actualizando health score:', plantError);
        throw new Error(`Error updating plant health score: ${plantError.message}`);
      }

      // Si tenemos análisis de salud e ID de imagen, actualizar también la imagen
      if (healthAnalysis && imageId) {
        console.log('📸 [DB] Actualizando análisis de salud en imagen:', imageId);
        
        const { error: imageError } = await supabase
          .from('plant_images')
          .update({ health_analysis: healthAnalysis })
          .eq('id', imageId)
          .eq('user_id', userId);

        if (imageError) {
          console.warn('⚠️ [DB] Error actualizando análisis en imagen:', imageError);
          // No lanzamos error aquí porque el health score ya se actualizó exitosamente
        }
      }

      console.log('✅ [DB] Health score actualizado exitosamente');
    } catch (error) {
      console.error('💥 [DB] Error en updatePlantHealthScore:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const healthDiagnosisService = new HealthDiagnosisService(); 