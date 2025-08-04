import { useState } from 'react';

export const useChat = (_plantId?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const sendMessage = async (_content: string) => {
    setIsLoading(true);
    // Stub implementation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return {
    plant: null,
    isLoading,
    sendMessage,
  };
};
