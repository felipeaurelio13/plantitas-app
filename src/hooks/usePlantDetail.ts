import { useState, useEffect } from 'react';
import { Plant } from '../schemas';
import plantService from '../services/plantService';

export const usePlantDetail = (plantId?: string) => {
  const [plant, setPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (plantId) {
      setIsLoading(true);
      plantService.getPlantById(plantId)
        .then(setPlant)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [plantId]);

  return { plant, isLoading };
};
