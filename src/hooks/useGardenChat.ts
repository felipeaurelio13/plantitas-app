import { useState } from 'react';

export const useGardenChat = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (_message: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    return { content: 'Respuesta simulada del jardín AI' };
  };

  return {
    messages: [],
    isLoading,
    sendMessage,
    refreshData: async () => {},
  };
};
