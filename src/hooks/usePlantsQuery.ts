import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/useAuthStore';
import { plantService } from '../services/plantService';

export const usePlantsQuery = () => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['plants', user?.id],
    queryFn: () => {
      if (!user) {
        return Promise.resolve([]);
      }
      return plantService.getUserPlantSummaries(user.id);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // Reduced from 5 minutes to 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes cache time
    refetchOnWindowFocus: false, // Disabled for better performance
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}; 