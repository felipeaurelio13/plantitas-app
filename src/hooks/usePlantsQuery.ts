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
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}; 