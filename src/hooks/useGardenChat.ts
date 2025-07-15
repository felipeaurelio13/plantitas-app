import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '../stores';
import { gardenChatService } from '../services/gardenChatService';
import { gardenCacheService } from '../services/gardenCacheService';
import {
  GardenChatMessage,
  GardenAIResponse,
} from '../schemas';

interface UseGardenChatReturn {
  messages: GardenChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  gardenSummary: {
    totalPlants: number;
    averageHealth: number;
    urgentActions: number;
    healthyPlants: number;
  } | null;
  suggestedQuestions: string[];
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
  refreshGardenData: () => Promise<void>;
  cacheStats?: {
    totalEntries: number;
    userEntries: number;
    validEntries: number;
    expiredEntries: number;
  };
}

export const useGardenChat = (): UseGardenChatReturn => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<GardenChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gardenSummary, setGardenSummary] = useState<{
    totalPlants: number;
    averageHealth: number;
    urgentActions: number;
    healthyPlants: number;
  } | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');

  // Load initial data when user is available
  useEffect(() => {
    if (user?.id) {
      loadInitialData();
    }
  }, [user?.id]);

  const loadInitialData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Load garden summary and suggested questions in parallel
      const [summary, questions] = await Promise.all([
        gardenChatService.getGardenHealthSummary(user.id),
        gardenChatService.getSuggestedQuestions(user.id),
      ]);

      setGardenSummary(summary);
      setSuggestedQuestions(questions);

      // Add welcome message if this is the first time
      if (messages.length === 0 && summary.totalPlants > 0) {
        const welcomeMessage: GardenChatMessage = {
          id: `welcome-${Date.now()}`,
          sender: 'ai',
          content: `¡Hola! Soy tu asistente de jardín 🌱 

Veo que tienes ${summary.totalPlants} plantas en tu jardín con una salud promedio de ${summary.averageHealth}%. ${summary.urgentActions > 0 ? `Hay ${summary.urgentActions} acciones que podrían necesitar tu atención.` : '¡Todo parece estar en buen estado!'}

¿En qué puedo ayudarte hoy con tu jardín?`,
          timestamp: new Date(),
          context: {
            queryType: 'general',
          },
        };
        setMessages([welcomeMessage]);
      }
    } catch (err) {
      console.error('Error loading initial garden data:', err);
      setError('Error al cargar la información del jardín');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!user?.id || !content.trim() || isTyping) return;

    // First verify if the function is available
    const functionCheck = await gardenChatService.verifyFunctionAvailability();
    if (!functionCheck.available) {
      setError(`🚧 El chat de jardín no está disponible: ${functionCheck.error}`);
      return;
    }

    const userMessage: GardenChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setLastUserMessage(content.trim());
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);

    try {
      // Send message to AI with conversation history
      const aiResponse: GardenAIResponse = await gardenChatService.sendMessageToGardenAI(
        content.trim(),
        user.id,
        messages // Pass current messages as context
      );

      // Create AI response message
      const aiMessage: GardenChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        content: aiResponse.content,
        timestamp: new Date(),
        context: {
          plantsAnalyzed: extractPlantIdsFromResponse(aiResponse),
          queryType: inferQueryType(content),
        },
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update garden summary if significant time has passed or if AI mentioned changes
      if (aiResponse.suggestedActions && aiResponse.suggestedActions.length > 0) {
        const updatedSummary = await gardenChatService.getGardenHealthSummary(user.id);
        setGardenSummary(updatedSummary);
      }

    } catch (err) {
      console.error('Error sending message to garden AI:', err);
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Error al enviar el mensaje. Por favor intenta de nuevo.';
      
      if (err instanceof Error) {
        if (err.message.includes('función de chat de jardín no está disponible')) {
          errorMessage = '🚧 El chat de jardín está temporalmente no disponible. Estamos trabajando para solucionarlo.';
        } else if (err.message.includes('CORS')) {
          errorMessage = '🔧 Error de configuración. Por favor contacta al administrador.';
        } else if (err.message.includes('garden-ai-chat no existe')) {
          errorMessage = '⚠️ Servicio no configurado. El chat de jardín necesita configuración adicional.';
        }
      }
      
      setError(errorMessage);
      
      // Remove the user message that failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
    }
  }, [user?.id, messages, isTyping]);

  const retryLastMessage = useCallback(async () => {
    if (lastUserMessage) {
      await sendMessage(lastUserMessage);
    }
  }, [lastUserMessage, sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    if (user?.id) {
      loadInitialData(); // Reload welcome message
    }
  }, [user?.id]);

  const refreshGardenData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Force refresh garden data (bypasses cache)
      await gardenChatService.refreshGardenData(user.id);
      
      // Reload initial data with fresh cache
      await loadInitialData();
      
      console.log('[useGardenChat] Garden data refreshed successfully');
    } catch (err) {
      console.error('Error refreshing garden data:', err);
      setError('Error al actualizar los datos del jardín');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Memoized calculations
  const isLoadingState = useMemo(() => isLoading, [isLoading]);
  
  // Get cache stats for debugging (only in development)
  const cacheStats = useMemo(() => {
    if (process.env.NODE_ENV === 'development' && user?.id) {
      return gardenCacheService.getCacheStats(user.id);
    }
    return undefined;
  }, [user?.id, gardenSummary]); // Refresh stats when summary changes

  return {
    messages,
    isLoading: isLoadingState,
    isTyping,
    error,
    gardenSummary,
    suggestedQuestions,
    sendMessage,
    clearMessages,
    retryLastMessage,
    refreshGardenData,
    cacheStats,
  };
};

// Helper functions
function extractPlantIdsFromResponse(response: GardenAIResponse): string[] {
  const plantIds: string[] = [];
  
  // Extract from insights
  if (response.insights) {
    response.insights.forEach(insight => {
      if (insight.affectedPlants) {
        plantIds.push(...insight.affectedPlants);
      }
    });
  }

  // Extract from suggested actions
  if (response.suggestedActions) {
    response.suggestedActions.forEach(action => {
      if (action.plantIds) {
        plantIds.push(...action.plantIds);
      }
    });
  }

  // Return unique plant IDs
  return [...new Set(plantIds)];
}

function inferQueryType(userMessage: string): 'general' | 'health_analysis' | 'care_comparison' | 'disease_prevention' | 'growth_tracking' {
  const message = userMessage.toLowerCase();
  
  if (message.includes('salud') || message.includes('problema') || message.includes('enferm')) {
    return 'health_analysis';
  }
  if (message.includes('comparar') || message.includes('diferencia') || message.includes('mejor')) {
    return 'care_comparison';
  }
  if (message.includes('hongo') || message.includes('plaga') || message.includes('prevenir')) {
    return 'disease_prevention';
  }
  if (message.includes('crecimiento') || message.includes('progreso') || message.includes('tiempo')) {
    return 'growth_tracking';
  }
  
  return 'general';
} 