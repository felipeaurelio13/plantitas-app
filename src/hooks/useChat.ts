import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlantStore, useAuthStore } from '../stores';

export const useChat = () => {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const plant = usePlantStore((state) => state.getPlantById(plantId || ''));
  const addChatMessage = usePlantStore((state) => state.addChatMessage);
  const isLoading = usePlantStore((state) => state.isLoading);

  if (import.meta.env.DEV) {
    console.log('--- DEBUG CHAT ---');
    console.log('ID de planta desde URL:', plantId);
    console.log('Planta encontrada en el store:', plant);
  }


  const isTyping = useMemo(() => {
    if (!plant || !plant.chatHistory || plant.chatHistory.length === 0) {
      return false;
    }
    const lastMessage = plant.chatHistory[plant.chatHistory.length - 1];
    return isLoading && lastMessage.sender === 'user';
  }, [plant, isLoading]);

  const handleSendMessage = async (content: string) => {
    if (!plantId || !user || !content.trim()) return;

    try {
      await addChatMessage(plantId, content.trim(), user.id);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };
  
  const handleGoBack = () => {
    navigate(`/plant/${plantId}`);
  };

  return {
    plant,
    isTyping,
    handleSendMessage,
    handleGoBack,
    currentUser: user,
  };
}; 