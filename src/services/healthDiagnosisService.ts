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
    if (import.meta.env.DEV) console.log('🩺 [Health] Iniciando actualización de diagnóstico para:', plant.name);
    
    // Verificar que la planta tenga imágenes
    if (!plant.images || plant.images.length === 0) {
      throw new Error('Esta planta no tiene imágenes para analizar. Toma una foto primero.');
    }

    // Obtener la imagen más reciente
    const mostRecentImage = [...plant.images]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    if (import.meta.env.DEV) {
      console.log('📸 [Health] Analizando imagen más reciente:', {
        imageId: mostRecentImage.id,
        timestamp: mostRecentImage.timestamp,
        imageUrl: mostRecentImage.url.substring(0, 100) + '...'
      });
    }

    // Supabase-specific authentication and function invocation removed
    // const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    // if (authError || !session?.access_token) {
    //   console.error('💥 [Health] User session not available:', authError);
    //   throw new Error('Usuario no autenticado. Por favor inicia sesión nuevamente.');
    // }

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
      // const { data, error } = await supabase.functions.invoke('update-health-diagnosis', {
      //   body: { 
      //     imageUrl: mostRecentImage.url,
      //     plantName: plant.name,
      //     species: plant.species
      //   },
      //   headers: {
      //     'Authorization': `Bearer ${session.access_token}`,
      //   },
      // });

      // For now, return a mock response or throw an error until Firebase Cloud Functions are integrated.
      // TODO: Replace with actual Firebase Cloud Function invocation for update-health-diagnosis
      console.warn("Firebase Cloud Function invocation for updatePlantHealthDiagnosis is not yet implemented.");
      const mockData = {
        overallHealth: 'good',
        confidence: 80,
        issues: [],
        recommendations: [],
      };

      // if (error) {
      //   console.error('💥 [Health] Error en función update-health-diagnosis:', error);
      //   throw new Error(`Error en análisis: ${error.message}`);
      // }

      if (!mockData || !mockData.overallHealth) {
        console.error('💥 [Health] Datos incompletos del análisis:', mockData);
        throw new Error('El análisis no devolvió información de salud válida.');
      }

      console.log('🎯 [Health] Análisis de salud completado exitosamente:', {
        overallHealth: mockData.overallHealth,
        confidence: mockData.confidence,
        issuesCount: mockData.issues?.length || 0,
        recommendationsCount: mockData.recommendations?.length || 0
      });

      // Convertir el análisis cualitativo a un score numérico
      const healthScoreMap = {
        'excellent': 95,
        'good': 80,
        'fair': 60,
        'poor': 30
      };
      
      const newHealthScore = healthScoreMap[mockData.overallHealth as keyof typeof healthScoreMap] || mockData.confidence || 60;

      console.log('📊 [Health] Nuevo score de salud calculado:', {
        overallHealth: mockData.overallHealth,
        numericScore: newHealthScore,
        confidence: mockData.confidence
      });

      return {
        healthScore: newHealthScore,
        healthAnalysis: mockData,
        updatedImage: mostRecentImage // Devuelve la imagen para actualizar su estado
      };

    } catch (error) {
      console.error('💥 [Health] Error en updatePlantHealthDiagnosis:', error);
      throw error;
    }
  }

  async updatePlantHealthScore(
    plantId: string,
    userId: string,
    healthScore: number,
    healthAnalysis?: any,
    imageId?: string
  ): Promise<void> {
    // TODO: Implement Firebase Firestore update for plant health score
    console.warn("Firebase Firestore update for plant health score is not yet implemented.");
    console.log(`Mock: Updating plant ${plantId} with health score ${healthScore}`);
    // Example of how it might look with Firestore (requires 'db' instance from firebase.js):
    // import { doc, updateDoc } from 'firebase/firestore';
    // const plantRef = doc(db, 'plants', plantId);
    // await updateDoc(plantRef, { 
    //   health_score: healthScore, 
    //   health_analysis: healthAnalysis, 
    //   updated_image_id: imageId, 
    //   updated_at: new Date() 
    // });
  }
}

// Exportar instancia singleton
export const healthDiagnosisService = new HealthDiagnosisService(); 