import { useQuery } from '@tanstack/react-query';
import { useMemo, useEffect } from 'react';
import { differenceInDays } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { Plant, PlantImage, CareProfile, HealthAnalysis, PlantPersonality, ChatMessage, PlantNotification } from '@/schemas';
import { Database } from '@/lib/database.types';
import { usePlantStore } from '@/stores';

type PlantData = Database['public']['Tables']['plants']['Row'] & {
  plant_images: any[];
};

const fetchPlantById = async (plantId: string): Promise<Plant> => {
  const { data, error } = await supabase
    .from('plants')
    .select(
      `
      *,
      plant_images(*)
    `
    )
    .eq('id', plantId)
    .single();

  if (error) {
    console.error(`Error fetching plant ${plantId}:`, error);
    if (error.code === 'PGRST116') {
      throw new Error('Planta no encontrada.');
    }
    throw new Error('Error al cargar la información de la planta.');
  }

  const plantData = data as PlantData;

  // Convert snake_case from DB to camelCase for the app's Plant type
  return {
    id: plantData.id,
    name: plantData.name,
    species: plantData.species,
    description: plantData.description ?? undefined,
    funFacts: (plantData.fun_facts as string[] | undefined) ?? undefined,
    variety: plantData.variety ?? undefined,
    nickname: plantData.nickname ?? undefined,
    location: plantData.location,
    // Nuevos campos para ambiente y luz
    plantEnvironment: plantData.plant_environment as 'interior' | 'exterior' | 'ambos' | undefined,
    lightRequirements: plantData.light_requirements as 'poca_luz' | 'luz_indirecta' | 'luz_directa_parcial' | 'pleno_sol' | undefined,
    dateAdded: new Date(plantData.date_added!),
    lastWatered: plantData.last_watered ? new Date(plantData.last_watered) : undefined,
    lastFertilized: plantData.last_fertilized ? new Date(plantData.last_fertilized) : undefined,
    healthScore: plantData.health_score ?? 0,
    
    careProfile: plantData.care_profile as CareProfile,
    personality: plantData.personality as PlantPersonality,
    
    images: plantData.plant_images.map((img: any) => ({
      id: img.id,
      url: img.url ?? '', 
      timestamp: new Date(img.created_at!),
      isProfileImage: img.is_profile_image ?? false,
      healthAnalysis: img.health_analysis as HealthAnalysis | undefined,
    })),
    
    // These are not fetched in this query for performance reasons
    chatHistory: [] as ChatMessage[],
    notifications: [] as PlantNotification[],
  };
};

export const usePlantDetail = (plantId: string | undefined) => {
  const { 
    data: plant, 
    isLoading, 
    error 
  } = useQuery<Plant, Error>({
    queryKey: ['plant', plantId],
    queryFn: async () => {
      if (import.meta.env.DEV) {
        const start = performance.now();
        const result = await fetchPlantById(plantId!);
        const end = performance.now();
        console.log(`[usePlantDetail] Loaded plant ${plantId} in ${(end - start).toFixed(2)}ms`);
        return result;
      }
      return fetchPlantById(plantId!);
    },
    enabled: !!plantId,
    staleTime: 1000 * 60 * 10, // 10 minutos de cache
    gcTime: 1000 * 60 * 30,    // 30 minutos en memoria
    refetchOnWindowFocus: false,
    refetchOnMount: false,     // No refetch si ya hay datos
    retry: 1,
  });

  const setPlant = usePlantStore((state) => state.setPlant);
  const selectPlant = usePlantStore((state) => state.selectPlant);

  useEffect(() => {
    if (plant) {
      setPlant(plant);
      selectPlant(plant.id);
    }
    // Clean up selected plant when leaving the detail page
    return () => {
      selectPlant(null);
    };
  }, [plant, setPlant, selectPlant]);

  const insights = useMemo(() => {
    if (!plant) return [];

    const insightsList: { type: 'warning' | 'tip' | 'info'; title: string; message: string }[] = [];
    if (!plant.images || plant.images.length === 0) return insightsList;
    
    const healthData = plant.images
      .map((img: PlantImage) => img.healthAnalysis?.confidence || null)
      .filter((score): score is number => score !== null);

    if (healthData.length >= 3) {
      const lastThree = healthData.slice(-3);
      if (lastThree[0] > lastThree[1] && lastThree[1] > lastThree[2]) {
        const drop = (lastThree[0] - lastThree[2]);
        insightsList.push({
          type: 'warning' as const,
          title: 'Tendencia de Salud a la Baja',
          message: `La salud de tu planta ha disminuido un ${drop.toFixed(0)}% en las últimas revisiones.`,
        });
      }
    }

    if (plant.lastWatered && plant.careProfile) {
      const daysSinceWatered = differenceInDays(new Date(), new Date(plant.lastWatered));
      const recommendedInterval = plant.careProfile.wateringFrequency;
      if (daysSinceWatered > recommendedInterval) {
        insightsList.push({
          type: 'tip' as const,
          title: 'Consejo de Riego',
          message: `Han pasado ${daysSinceWatered} días desde el último riego. El intervalo recomendado es de ${recommendedInterval} días.`,
        });
      }
    }

    return insightsList;
  }, [plant]);

  return {
    plant,
    insights,
    loading: isLoading,
    error: error?.message || null,
  };
}; 