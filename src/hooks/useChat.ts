import { useState } from 'react';

export const useChat = (plantId?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const sendMessage = async (content: string) => {
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
