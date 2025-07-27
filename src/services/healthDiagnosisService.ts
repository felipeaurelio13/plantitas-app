import { Plant } from '../schemas';
import aiService from './aiService';
import plantService from './plantService';

interface HealthAnalysisResponse {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  confidence: number;
  issues: string[];
  recommendations: string[];
  healthScore: number;
}

interface UpdateHealthDiagnosisResponse {
  success: boolean;
  plantId: string;
  healthScore: number;
  analysis: HealthAnalysisResponse;
  updatedAt: string;
}

const analyzeLatestPlantImage = async (
  plant: Plant,
  userId: string
): Promise<HealthAnalysisResponse> => {
  try {
    console.log('[HEALTH DIAGNOSIS] Analyzing latest image for plant:', plant.id);

    // Get the most recent image for this plant
    const plantData = await plantService.getPlantById(plant.id, true);
    
    if (!plantData || !plantData.images || plantData.images.length === 0) {
      throw new Error('No images available for health analysis');
    }

    // Get the most recent image
    const latestImage = plantData.images
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (!latestImage.url) {
      throw new Error('Latest image does not have a valid URL');
    }

    console.log('[HEALTH DIAGNOSIS] Using image:', latestImage.id, 'URL:', latestImage.url.substring(0, 50) + '...');

    // Use AI service to analyze the image
    const analysisResult = await aiService.updateHealthAnalysis(plant, latestImage.url);
    
    if (!analysisResult || !analysisResult.healthAnalysis) {
      throw new Error('Failed to get health analysis from AI service');
    }

    const { healthAnalysis } = analysisResult;

    // Map health status to numeric score
    const healthScoreMap = {
      'excellent': 95,
      'good': 80,
      'fair': 60,
      'poor': 30
    };

    const healthScore = healthAnalysis.healthScore || 
      healthScoreMap[healthAnalysis.overallHealth as keyof typeof healthScoreMap] || 60;

    const response: HealthAnalysisResponse = {
      overallHealth: healthAnalysis.overallHealth,
      confidence: healthAnalysis.confidence,
      issues: healthAnalysis.issues || [],
      recommendations: healthAnalysis.recommendations || [],
      healthScore
    };

    console.log('[HEALTH DIAGNOSIS] Analysis completed:', response);
    return response;

  } catch (error) {
    console.error('[HEALTH DIAGNOSIS] Error analyzing plant image:', error);
    throw error;
  }
};

const updatePlantHealthScore = async (
  plantId: string,
  userId: string,
  healthAnalysis?: any,
  imageId?: string
): Promise<UpdateHealthDiagnosisResponse> => {
  try {
    console.log('[HEALTH DIAGNOSIS] Updating health score for plant:', plantId);

    // Get current plant data
    const plant = await plantService.getPlantById(plantId, true);
    
    if (!plant) {
      throw new Error(`Plant with ID ${plantId} not found`);
    }

    if (plant.userId !== userId) {
      throw new Error('User not authorized to update this plant');
    }

    let analysis: HealthAnalysisResponse;

    if (healthAnalysis) {
      // Use provided health analysis
      analysis = healthAnalysis;
    } else {
      // Analyze the latest image
      analysis = await analyzeLatestPlantImage(plant, userId);
    }

    // Update the plant's health score in Firebase
    await plantService.updatePlantHealthScore(plantId, analysis.healthScore);

    // If we have an image ID, update the image's health analysis
    if (imageId && analysis) {
      await plantService.updatePlantImage(plantId, imageId, {
        healthAnalysis: {
          overallHealth: analysis.overallHealth,
          confidence: analysis.confidence,
          issues: analysis.issues,
          recommendations: analysis.recommendations,
          analyzedAt: new Date().toISOString(),
        }
      });
      console.log('[HEALTH DIAGNOSIS] Updated image health analysis for image:', imageId);
    }

    const response: UpdateHealthDiagnosisResponse = {
      success: true,
      plantId,
      healthScore: analysis.healthScore,
      analysis,
      updatedAt: new Date().toISOString(),
    };

    console.log('[HEALTH DIAGNOSIS] Health score updated successfully:', response);
    return response;

  } catch (error) {
    console.error('[HEALTH DIAGNOSIS] Error updating health score:', error);
    throw error;
  }
};

const getPlantHealthHistory = async (
  plantId: string,
  userId: string,
  limit: number = 10
): Promise<any[]> => {
  try {
    console.log('[HEALTH DIAGNOSIS] Getting health history for plant:', plantId);

    const plant = await plantService.getPlantById(plantId, true);
    
    if (!plant) {
      throw new Error(`Plant with ID ${plantId} not found`);
    }

    if (plant.userId !== userId) {
      throw new Error('User not authorized to access this plant');
    }

    // Get images with health analysis, sorted by date
    const imagesWithHealth = (plant.images || [])
      .filter(img => img.healthAnalysis && img.healthAnalysis.overallHealth)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map(img => ({
        id: img.id,
        url: img.url,
        createdAt: img.createdAt,
        healthAnalysis: img.healthAnalysis,
        healthScore: img.healthAnalysis.healthScore || 
          (img.healthAnalysis.overallHealth === 'excellent' ? 95 :
           img.healthAnalysis.overallHealth === 'good' ? 80 :
           img.healthAnalysis.overallHealth === 'fair' ? 60 : 30)
      }));

    console.log('[HEALTH DIAGNOSIS] Retrieved health history:', imagesWithHealth.length, 'entries');
    return imagesWithHealth;

  } catch (error) {
    console.error('[HEALTH DIAGNOSIS] Error getting health history:', error);
    throw error;
  }
};

const generateHealthRecommendations = async (
  plant: Plant,
  userId: string
): Promise<string[]> => {
  try {
    console.log('[HEALTH DIAGNOSIS] Generating health recommendations for plant:', plant.id);

    if (plant.userId !== userId) {
      throw new Error('User not authorized to access this plant');
    }

    // Get recent health analysis
    const analysis = await analyzeLatestPlantImage(plant, userId);
    
    // Combine AI recommendations with care profile suggestions
    const recommendations = [...analysis.recommendations];

    // Add care profile based recommendations
    if (plant.careProfile) {
      if (plant.careProfile.watering === 'diario' && analysis.overallHealth !== 'excellent') {
        recommendations.push('Considera reducir la frecuencia de riego si la tierra está húmeda');
      }
      
      if (plant.careProfile.sunlight === 'directo' && analysis.issues?.some(issue => 
        issue.toLowerCase().includes('quemadura') || issue.toLowerCase().includes('marchita'))) {
        recommendations.push('Mueve la planta a un lugar con luz indirecta para evitar quemaduras');
      }
    }

    // Remove duplicates
    const uniqueRecommendations = [...new Set(recommendations)];

    console.log('[HEALTH DIAGNOSIS] Generated recommendations:', uniqueRecommendations);
    return uniqueRecommendations;

  } catch (error) {
    console.error('[HEALTH DIAGNOSIS] Error generating recommendations:', error);
    throw error;
  }
};

export const healthDiagnosisService = {
  analyzeLatestPlantImage,
  updatePlantHealthScore,
  getPlantHealthHistory,
  generateHealthRecommendations,
};

export default healthDiagnosisService; 