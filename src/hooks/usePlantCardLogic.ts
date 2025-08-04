import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PlantSummary } from '../schemas';
import { navigation } from '../lib/navigation';

interface PlantCardLogicState {
  needsWatering: boolean;
  isFavorite: boolean;
  daysSinceWatered: number;
  healthStatus: {
    color: string;
    textColor: string;
    icon: React.ReactNode;
    status: string;
    priority: 'low' | 'medium' | 'high';
  };
}

interface PlantCardLogicActions {
  handleClick: () => void;
  handleMouseEnter: () => void;
  prefetchPlantData: () => void;
  navigateToPlant: () => void;
  navigateToChat: () => void;
}

export const usePlantCardLogic = (plant: PlantSummary, index: number) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Memoized state calculations
  const state = useMemo((): PlantCardLogicState => {
    // Calculate watering needs
    const needsWatering = plant.lastWatered && plant.wateringFrequency
      ? new Date().getTime() - new Date(plant.lastWatered).getTime() > plant.wateringFrequency * 24 * 60 * 60 * 1000
      : !plant.lastWatered;

    // Calculate days since watered
    const daysSinceWatered = plant.lastWatered 
      ? Math.floor((new Date().getTime() - new Date(plant.lastWatered).getTime()) / (24 * 60 * 60 * 1000))
      : 0;

    // Determine if favorite (high health score)
    const isFavorite = plant.healthScore >= 80;

    // Calculate health status with detailed information
    const healthStatus = calculateHealthStatus(plant.healthScore, needsWatering, daysSinceWatered);

    return {
      needsWatering,
      isFavorite,
      daysSinceWatered,
      healthStatus,
    };
  }, [plant.lastWatered, plant.wateringFrequency, plant.healthScore]);

  // Prefetch plant detail data
  const prefetchPlantData = useCallback(async () => {
    try {
      await queryClient.prefetchQuery({
        queryKey: ['plant', plant.id],
        queryFn: async () => {
          const { supabase } = await import('../lib/supabase');
          const { data, error } = await supabase
            .from('plants')
            .select(`
              *,
              plant_images(*)
            `)
            .eq('id', plant.id)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              throw new Error('Planta no encontrada.');
            }
            throw new Error('Error al cargar la información de la planta.');
          }

          return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    } catch (error) {
      console.warn('Failed to prefetch plant data:', error);
    }
  }, [plant.id, queryClient]);

  // Navigation actions
  const navigateToPlant = useCallback(() => {
    navigate(navigation.plantDetail(plant.id));
  }, [navigate, plant.id]);

  const navigateToChat = useCallback(() => {
    navigate(navigation.plantChat(plant.id));
  }, [navigate, plant.id]);

  // Event handlers
  const handleClick = useCallback(() => {
    navigateToPlant();
  }, [navigateToPlant]);

  const handleMouseEnter = useCallback(() => {
    // Prefetch on hover for instant navigation
    prefetchPlantData();
  }, [prefetchPlantData]);

  const actions: PlantCardLogicActions = {
    handleClick,
    handleMouseEnter,
    prefetchPlantData,
    navigateToPlant,
    navigateToChat,
  };

  return {
    state,
    actions,
    plant,
  };
};

// Helper function to calculate health status
function calculateHealthStatus(
  healthScore: number, 
  needsWatering: boolean, 
  daysSinceWatered: number
) {
  // Determine base status from health score
  let baseStatus;
  if (healthScore >= 80) {
    baseStatus = {
      color: 'bg-green-400',
      textColor: 'text-green-600 dark:text-green-400',
      status: 'Excelente',
      priority: 'low' as const,
    };
  } else if (healthScore >= 60) {
    baseStatus = {
      color: 'bg-yellow-300',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      status: 'Buena',
      priority: 'medium' as const,
    };
  } else {
    baseStatus = {
      color: 'bg-red-300',
      textColor: 'text-red-600 dark:text-red-400',
      status: 'Atención',
      priority: 'high' as const,
    };
  }

  // Adjust status based on watering needs
  if (needsWatering) {
    if (daysSinceWatered > 7) {
      return {
        ...baseStatus,
        color: 'bg-red-400',
        textColor: 'text-red-700 dark:text-red-300',
        status: 'Necesita agua urgente',
        priority: 'high' as const,
      };
    } else if (daysSinceWatered > 3) {
      return {
        ...baseStatus,
        color: 'bg-orange-400',
        textColor: 'text-orange-700 dark:text-orange-300',
        status: 'Necesita agua',
        priority: 'medium' as const,
      };
    }
  }

  return baseStatus;
}

// Utility functions that can be used by components
export const getPlantCardImageProps = (plant: PlantSummary) => {
  const primaryImage = plant.profileImageUrl || plant.images?.[0]?.url;
  
  return {
    src: primaryImage || '/placeholder-plant.jpg',
    alt: `${plant.name} - ${plant.species}`,
    className: 'w-full h-48 object-cover',
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  };
};

export const getPlantCardAnimationProps = (index: number) => {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { 
      duration: 0.3, 
      delay: Math.min(index * 0.1, 0.5) // Cap delay to prevent very long delays
    },
    whileHover: { 
      y: -4,
      transition: { duration: 0.2 }
    },
    whileTap: { 
      scale: 0.98,
      transition: { duration: 0.1 }
    },
  };
};