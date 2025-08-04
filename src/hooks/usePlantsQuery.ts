import { useQuery } from '@tanstack/react-query';
import plantService from '../services/plantService';
import useAuthStore from '../stores/useAuthStore';

export const usePlantsQuery = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['plants', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      try {
        const result = await plantService.getUserPlants(user.id);
        console.log('[PLANTS QUERY] Fetched plants:', result.length);
        return result;
      } catch (error) {
        console.error('[PLANTS QUERY] Error:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}; 