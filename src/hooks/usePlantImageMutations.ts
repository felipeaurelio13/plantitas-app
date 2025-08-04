import { useMutation, useQueryClient } from '@tanstack/react-query';

export const usePlantImageMutations = () => {
  const queryClient = useQueryClient();

  const addPlantImageMutation = useMutation({
    mutationFn: async (_: { plantId: string; imageBase64: string; isProfileImage?: boolean }) => {
      // Stub implementation
      return 'new-image-id';
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
  });

  return {
    addPlantImageMutation,
    isAddingPlantImage: addPlantImageMutation.isPending,
    updatePlantHealthMutation: { mutate: () => {}, isPending: false },
    isUpdatingPlantHealth: false,
    setProfileImageMutation: { mutate: () => {}, isPending: false },
    isSettingProfileImage: false,
    deletePlantImageMutation: { mutate: () => {}, isPending: false },
    isDeletingImage: false,
  };
};
