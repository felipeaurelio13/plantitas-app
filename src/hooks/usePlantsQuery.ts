import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../stores/useAuthStore';
import { plantService } from '../services/plantService';
import { PERFORMANCE_CONFIG } from '../lib/performance';

export const usePlantsQuery = () => {
  const user = useAuthStore((state: any) => state.user);

  return useQuery({
    queryKey: ['plants', user?.id],
    queryFn: async () => {
      if (!user) {
        return Promise.resolve([]);
      }
      // Agregar timing para debug en desarrollo
      if (import.meta.env.DEV) {
        const start = performance.now();
        const result = await plantService.getUserPlantSummaries(user.id);
        const end = performance.now();
        console.log(`[usePlantsQuery] Loaded ${result.length} plants in ${(end - start).toFixed(2)}ms`);
        return result;
      }
      return plantService.getUserPlantSummaries(user.id);
    },
    enabled: !!user,
    staleTime: PERFORMANCE_CONFIG.QUERY.STALE_TIME.MEDIUM,
    gcTime: PERFORMANCE_CONFIG.QUERY.GC_TIME.LONG,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    placeholderData: [],
  });
}; 